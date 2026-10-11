from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import torch
from pytorch_forecasting import TemporalFusionTransformer, TimeSeriesDataSet
from pytorch_forecasting.data.encoders import NaNLabelEncoder
from pytorch_forecasting.metrics import CrossEntropy


PROJECT_DIR = Path(__file__).resolve().parents[1]
TFT_DIR = PROJECT_DIR / "Training" / "tft"
DATASET_PATH = TFT_DIR / "neonatal_dataset_onset_based_varied_vitals.csv"
STATE_DICT_PATH = TFT_DIR / "tft_eos_model_state_dict.pt"
TIMEPOINTS = [0, 4, 8, 12, 16, 20]
VITALS = [
    "temperature_c",
    "heart_rate_bpm",
    "oxygen_saturation_pct",
    "respiratory_rate_bpm",
    "systolic_bp_mmhg",
    "diastolic_bp_mmhg",
]
STATIC_CATEGORICALS = [
    "sex",
    "preterm",
    "low_birth_weight",
    "very_low_birth_weight",
    "delivery_mode",
    "place_of_birth",
    "resuscitation_at_birth",
    "prom_over_18h",
    "maternal_fever",
    "maternal_uti",
    "unclean_cord_care",
    "maternal_hiv",
    "multiple_birth",
    "anc_4plus",
]
STATIC_REALS = [
    "gestational_age_weeks",
    "birth_weight_g",
    "maternal_age_years",
    "apgar_1min",
    "apgar_5min",
    "crp_mg_l",
    "wbc_count",
    "platelet_count",
]


def to_float(value, default=np.nan):
    if value is None or value == "":
        return default
    if isinstance(value, str) and "/" in value:
        value = value.split("/", 1)[0]
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def to_binary(value, default=0):
    text = str(value or "").strip().lower()
    if text in {"1", "yes", "true", "on", "male", "positive"}:
        return 1
    if text in {"0", "no", "false", "off", "female", "negative"}:
        return 0
    return default


def normalize_sex(value):
    text = str(value or "").strip().lower()
    if text in {"f", "female"}:
        return "F"
    return "M"


def normalize_delivery(value):
    text = str(value or "").strip().lower().replace("-", "_").replace(" ", "_")
    if text in {"cesarean", "caesarean", "cesarean_section", "caesarean_section"}:
        return "caesarean_section"
    if text == "assisted_vaginal":
        return "assisted_vaginal"
    return "spontaneous_vaginal"


def payload_to_patient(payload):
    gestational_age = to_float(payload.get("gestational_age_weeks"), 38)
    birth_weight = to_float(payload.get("birth_weight_g"), 3000)
    apgar_5min = to_float(payload.get("apgar_5min"), 8)
    apgar_1min = to_float(payload.get("apgar_1min"), max(apgar_5min - 1, 0))
    row = {
        "id": str(payload.get("patient_id") or payload.get("id") or "inference_patient"),
        "eos_label": 0,
        "sex": normalize_sex(payload.get("sex")),
        "preterm": int(gestational_age < 37),
        "birth_weight_g": birth_weight,
        "low_birth_weight": int(birth_weight < 2500),
        "very_low_birth_weight": int(birth_weight < 1500),
        "delivery_mode": normalize_delivery(payload.get("delivery_mode")),
        "place_of_birth": str(payload.get("place_of_birth") or "this_facility"),
        "maternal_age_years": to_float(payload.get("maternal_age_years"), 28),
        "gestational_age_weeks": gestational_age,
        "apgar_1min": apgar_1min,
        "apgar_5min": apgar_5min,
        "resuscitation_at_birth": to_binary(payload.get("resuscitation_at_birth")),
        "prom_over_18h": to_binary(payload.get("prom_over_18h")),
        "maternal_fever": to_binary(payload.get("maternal_fever")),
        "maternal_uti": to_binary(payload.get("maternal_uti")),
        "unclean_cord_care": to_binary(payload.get("unclean_cord_care")),
        "maternal_hiv": to_binary(payload.get("maternal_hiv")),
        "multiple_birth": to_binary(payload.get("multiple_birth")),
        "anc_4plus": to_binary(payload.get("anc_4plus"), 1),
        "crp_mg_l": to_float(payload.get("crp_mg_l"), -1),
        "wbc_count": to_float(payload.get("wbc_count"), -1),
        "platelet_count": to_float(payload.get("platelet_count"), -1),
    }
    for vital in VITALS:
        base = to_float(payload.get(vital), np.nan)
        if np.isnan(base):
            defaults = {
                "temperature_c": 37,
                "heart_rate_bpm": 140,
                "oxygen_saturation_pct": 95,
                "respiratory_rate_bpm": 45,
                "systolic_bp_mmhg": 60,
                "diastolic_bp_mmhg": 35,
            }
            base = defaults[vital]
        for hour in TIMEPOINTS:
            row[f"{vital}_{hour}h"] = to_float(payload.get(f"{vital}_{hour}h"), base)
    return row


def make_long(df):
    rows = []
    for _, source in df.iterrows():
        for idx, hour in enumerate(TIMEPOINTS):
            row = {col: source[col] for col in STATIC_CATEGORICALS + STATIC_REALS if col in source.index}
            row["id"] = str(source["id"])
            row["time_idx"] = idx
            row["hour"] = hour
            row["eos_label"] = int(source.get("eos_label", source.get("EOS", 0)))
            for vital in VITALS:
                row[vital] = source.get(f"{vital}_{hour}h", source.get(vital, np.nan))
            rows.append(row)
    long_df = pd.DataFrame(rows)
    for col in STATIC_CATEGORICALS:
        if col not in long_df.columns:
            long_df[col] = "unknown"
        long_df[col] = long_df[col].fillna("unknown").astype(str)
    numeric_cols = STATIC_REALS + ["time_idx", "hour"] + VITALS
    for col in numeric_cols:
        if col not in long_df.columns:
            long_df[col] = np.nan
        long_df[col] = pd.to_numeric(long_df[col], errors="coerce")
        long_df[col] = long_df[col].fillna(long_df[col].median() if long_df[col].notna().any() else 0)
    long_df["id"] = long_df["id"].astype(str)
    long_df["eos_label"] = long_df["eos_label"].astype(int)
    return long_df


def main():
    payload = json.loads(sys.stdin.read() or "{}")
    base_df = pd.read_csv(DATASET_PATH)
    base_df["eos_label"] = (base_df["onset_type"] == "early_onset").astype(int)
    training_long = make_long(base_df)
    categorical_encoders = {column: NaNLabelEncoder(add_nan=True) for column in STATIC_CATEGORICALS}

    training_dataset = TimeSeriesDataSet(
        training_long,
        time_idx="time_idx",
        target="eos_label",
        group_ids=["id"],
        max_encoder_length=5,
        max_prediction_length=1,
        static_categoricals=STATIC_CATEGORICALS,
        static_reals=STATIC_REALS,
        time_varying_known_reals=["time_idx", "hour"],
        time_varying_unknown_reals=VITALS,
        categorical_encoders=categorical_encoders,
        add_encoder_length=True,
        add_relative_time_idx=True,
        add_target_scales=False,
        allow_missing_timesteps=False,
    )

    patient_long = make_long(pd.DataFrame([payload_to_patient(payload)]))
    inference_dataset = TimeSeriesDataSet.from_dataset(training_dataset, patient_long, predict=True, stop_randomization=True)
    loader = inference_dataset.to_dataloader(train=False, batch_size=1, num_workers=0)
    model = TemporalFusionTransformer.from_dataset(
        training_dataset,
        learning_rate=0.001,
        hidden_size=32,
        attention_head_size=4,
        dropout=0.20,
        hidden_continuous_size=16,
        output_size=2,
        loss=CrossEntropy(),
    )
    state_dict = torch.load(STATE_DICT_PATH, map_location="cpu")
    model.load_state_dict(state_dict, strict=False)
    model.eval()
    raw = model.predict(loader, mode="raw", return_x=False)
    prediction = raw.output.prediction if hasattr(raw, "output") else raw["prediction"]
    logits = prediction.detach().cpu()
    probability = torch.softmax(logits.reshape(-1, 2)[-1], dim=0)[1].item()
    print(json.dumps({"tft_eos_probability": probability, "source": "live_tft"}))


if __name__ == "__main__":
    main()
