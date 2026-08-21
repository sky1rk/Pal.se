from __future__ import annotations

import json
import sqlite3
import subprocess
import sys
import warnings
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


try:
    from flask import Flask, jsonify, redirect, render_template, request, send_from_directory, url_for
except ModuleNotFoundError:
    sys.path.append(
        str(Path.home() / "AppData" / "Local" / "Programs" / "Python" / "Python311" / "Lib" / "site-packages")
    )
    from flask import Flask, jsonify, redirect, render_template, request, send_from_directory, url_for


warnings.filterwarnings("ignore", category=UserWarning, module="sklearn")

import joblib
import numpy as np
import pandas as pd


BASE_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BASE_DIR.parent
TRAINING_DIR = PROJECT_DIR / "Training"
DATA_DIR = BASE_DIR / "data"
DB_PATH = DATA_DIR / "palse.sqlite3"

XGB_ARTIFACT_PATH = TRAINING_DIR / "xgb" / "models" / "eos_xgboost_phase1_pipeline.joblib"
RESIDUAL_ARTIFACT_PATH = TRAINING_DIR / "residual ensemble" / "residual_ensemble_model.joblib"
TFT_PYTHON = TRAINING_DIR / "tft" / "Scripts" / "python.exe"
TFT_INFERENCE_SCRIPT = BASE_DIR / "tft_inference.py"


app = Flask(__name__, static_folder="static", template_folder="templates")

_xgb_artifact: dict[str, Any] | None = None
_residual_artifact: dict[str, Any] | None = None


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def db() -> sqlite3.Connection:
    DATA_DIR.mkdir(exist_ok=True)
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_db() -> None:
    with db() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS patients (
                patient_id TEXT PRIMARY KEY,
                sex TEXT,
                gestational_age_weeks REAL,
                birth_weight_g REAL,
                age_at_onset_hours REAL,
                status TEXT NOT NULL DEFAULT 'Active',
                latest_risk_label TEXT,
                latest_probability REAL,
                latest_prediction_id INTEGER,
                payload_json TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS predictions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id TEXT NOT NULL,
                probability REAL NOT NULL,
                risk_label TEXT NOT NULL,
                result_title TEXT NOT NULL,
                predicted_eos INTEGER NOT NULL,
                threshold REAL NOT NULL,
                xgb_eos_probability REAL NOT NULL,
                tft_eos_probability REAL NOT NULL,
                tft_source TEXT NOT NULL,
                interpretation TEXT NOT NULL,
                actions_json TEXT NOT NULL,
                payload_json TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY(patient_id) REFERENCES patients(patient_id)
            );

            CREATE TABLE IF NOT EXISTS reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                prediction_id INTEGER NOT NULL,
                patient_id TEXT NOT NULL,
                title TEXT NOT NULL,
                summary TEXT NOT NULL,
                risk_label TEXT NOT NULL,
                probability REAL NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY(prediction_id) REFERENCES predictions(id)
            );
            """
        )


def load_xgb_artifact() -> dict[str, Any]:
    global _xgb_artifact
    if _xgb_artifact is None:
        _xgb_artifact = joblib.load(XGB_ARTIFACT_PATH)
    return _xgb_artifact


def load_residual_artifact() -> dict[str, Any]:
    global _residual_artifact
    if _residual_artifact is None:
        _residual_artifact = joblib.load(RESIDUAL_ARTIFACT_PATH)
    return _residual_artifact


def to_float(value: Any, default: float | None = np.nan) -> float | None:
    if value is None:
        return default
    if isinstance(value, str):
        value = value.strip()
        if not value:
            return default
        if "/" in value:
            value = value.split("/", 1)[0].strip()
        if "=" in value:
            value = value.split("=", 1)[0].strip()
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def to_binary(value: Any, default: int = 0) -> int:
    if value is None:
        return default
    if isinstance(value, bool):
        return int(value)
    text = str(value).strip().lower()
    if text in {"1", "yes", "true", "on", "y", "1 = yes", "positive"}:
        return 1
    if text in {"0", "no", "false", "off", "n", "0 = no", "negative"}:
        return 0
    numeric = to_float(text, default=None)
    return int(numeric) if numeric is not None else default


def normalize_choice(value: Any, mapping: dict[str, str], default: str) -> str:
    if value is None or str(value).strip() == "":
        return default
    text = str(value).strip().lower().replace("-", "_").replace(" ", "_")
    return mapping.get(text, default)


def payload_from_request() -> dict[str, Any]:
    return dict(request.get_json(silent=True) or request.form)


def patient_id_from_payload(payload: dict[str, Any]) -> str:
    raw = str(payload.get("patient_id") or payload.get("id") or "").strip()
    if raw:
        return raw
    return f"NEO-{datetime.now().strftime('%Y%m%d%H%M%S')}"


def feature_row(payload: dict[str, Any]) -> pd.DataFrame:
    sex = normalize_choice(payload.get("sex"), {"male": "M", "m": "M", "female": "F", "f": "F"}, "M")
    delivery_mode = normalize_choice(
        payload.get("delivery_mode"),
        {
            "vaginal": "spontaneous_vaginal",
            "spontaneous_vaginal": "spontaneous_vaginal",
            "assisted_vaginal": "assisted_vaginal",
            "cesarean": "caesarean_section",
            "caesarean": "caesarean_section",
            "cesarean_section": "caesarean_section",
            "caesarean_section": "caesarean_section",
        },
        "spontaneous_vaginal",
    )
    place_of_birth = normalize_choice(
        payload.get("place_of_birth"),
        {
            "home": "home",
            "in_transit": "in_transit",
            "other_facility": "other_facility",
            "this_facility": "this_facility",
        },
        "this_facility",
    )

    apgar_5min = to_float(payload.get("apgar_5min"), np.nan)
    apgar_1min = to_float(payload.get("apgar_1min"), np.nan)
    if pd.isna(apgar_1min) and not pd.isna(apgar_5min):
        apgar_1min = max(float(apgar_5min) - 1, 0)

    crp = to_float(payload.get("crp_mg_l"), -1)
    wbc = to_float(payload.get("wbc_count"), -1)
    platelet = to_float(payload.get("platelet_count"), -1)
    gestational_age = to_float(payload.get("gestational_age_weeks"), np.nan)
    birth_weight = to_float(payload.get("birth_weight_g"), np.nan)

    row = {
        "sex": sex,
        "gestational_age_weeks": gestational_age,
        "birth_weight_g": birth_weight,
        "delivery_mode": delivery_mode,
        "place_of_birth": place_of_birth,
        "maternal_age_years": to_float(payload.get("maternal_age_years"), np.nan),
        "apgar_1min": apgar_1min,
        "apgar_5min": apgar_5min,
        "resuscitation_at_birth": to_binary(payload.get("resuscitation_at_birth")),
        "prom_over_18h": to_binary(payload.get("prom_over_18h")),
        "maternal_fever": to_binary(payload.get("maternal_fever")),
        "maternal_uti": to_binary(payload.get("maternal_uti")),
        "unclean_cord_care": to_binary(payload.get("unclean_cord_care")),
        "maternal_hiv": to_binary(payload.get("maternal_hiv")),
        "multiple_birth": to_binary(payload.get("multiple_birth")),
        "anc_4plus": to_binary(payload.get("anc_4plus"), default=1),
        "temperature_c": to_float(payload.get("temperature_c"), np.nan),
        "poor_feeding": to_binary(payload.get("poor_feeding")),
        "lethargy": to_binary(payload.get("lethargy")),
        "respiratory_distress": to_binary(payload.get("respiratory_distress")),
        "convulsions": to_binary(payload.get("convulsions")),
        "abdominal_distension": to_binary(payload.get("abdominal_distension")),
        "jaundice": to_binary(payload.get("jaundice")),
        "umbilical_redness": to_binary(payload.get("umbilical_redness")),
        "skin_pustules": to_binary(payload.get("skin_pustules")),
        "bulging_fontanelle": to_binary(payload.get("bulging_fontanelle")),
        "crp_mg_l": crp,
        "wbc_count": wbc,
        "platelet_count": platelet,
    }

    for col in ["crp_mg_l", "wbc_count", "platelet_count"]:
        lab_value = to_float(row[col], np.nan)
        row[f"{col}_ordered"] = int(not pd.isna(lab_value) and lab_value != -1)

    if gestational_age and not pd.isna(gestational_age) and gestational_age != 0:
        row["weight_to_gestational_age_ratio"] = birth_weight / gestational_age
    else:
        row["weight_to_gestational_age_ratio"] = np.nan
    row["apgar_delta"] = row["apgar_5min"] - row["apgar_1min"] if not pd.isna(row["apgar_5min"]) else np.nan

    artifact = load_xgb_artifact()
    for feature in artifact["selected_features"]:
        row.setdefault(feature, np.nan)
    return pd.DataFrame([row], columns=artifact["selected_features"])


def predict_xgb(payload: dict[str, Any]) -> float:
    artifact = load_xgb_artifact()
    features = feature_row(payload)
    numeric = artifact["num_imputer"].transform(features[artifact["numeric_cols"]])
    categorical = artifact["cat_imputer"].transform(features[artifact["categorical_cols"]])
    encoded = artifact["onehot_encoder"].transform(categorical)
    prepared = np.hstack([numeric, encoded])
    return float(artifact["calibrated_model"].predict_proba(prepared)[:, 1][0])


def temporal_heuristic(payload: dict[str, Any]) -> float:
    temp = to_float(payload.get("temperature_c"), 37.0) or 37.0
    heart = to_float(payload.get("heart_rate_bpm"), 140.0) or 140.0
    oxygen = to_float(payload.get("oxygen_saturation_pct"), 95.0) or 95.0
    resp = to_float(payload.get("respiratory_rate_bpm"), 45.0) or 45.0
    score = 0.0
    score += max(0.0, temp - 37.5) * 0.75
    score += max(0.0, heart - 160.0) / 80.0
    score += max(0.0, 94.0 - oxygen) / 20.0
    score += max(0.0, resp - 60.0) / 60.0
    return float(1.0 / (1.0 + np.exp(-(score - 1.2))))


def predict_tft(payload: dict[str, Any]) -> tuple[float, str]:
    if TFT_PYTHON.exists() and TFT_INFERENCE_SCRIPT.exists():
        try:
            completed = subprocess.run(
                [str(TFT_PYTHON), str(TFT_INFERENCE_SCRIPT)],
                input=json.dumps(payload),
                capture_output=True,
                text=True,
                timeout=45,
                cwd=str(PROJECT_DIR),
                check=True,
            )
            result = json.loads(completed.stdout)
            probability = float(result["tft_eos_probability"])
            return probability, result.get("source", "live_tft")
        except Exception:
            pass
    return temporal_heuristic(payload), "temporal_vitals_fallback"


def residual_features(xgb_probability: float, tft_probability: float) -> pd.DataFrame:
    artifact = load_residual_artifact()
    row = {
        "xgb_eos_probability": xgb_probability,
        "tft_eos_probability": tft_probability,
        "tft_minus_xgb": tft_probability - xgb_probability,
        "mean_probability": (xgb_probability + tft_probability) / 2,
        "absolute_disagreement": abs(tft_probability - xgb_probability),
    }
    return pd.DataFrame([row], columns=artifact["residual_features"])


def risk_level(probability: float, threshold: float) -> tuple[str, str]:
    if probability >= threshold:
        return "HIGH RISK", "Sepsis Risk Detected"
    if probability >= 0.30:
        return "MODERATE RISK", "Monitor Closely"
    return "LOW RISK", "Low EOS Risk"


def clinical_text(risk_label: str, probability: float) -> tuple[str, list[str]]:
    percent = round(probability * 100, 1)
    if risk_label == "HIGH RISK":
        return (
            f"Alert: residual ensemble estimates {percent}% EOS risk. Review maternal, laboratory, and vital-sign findings promptly.",
            ["Initiate physician review immediately.", "Consider empirical IV antibiotics per protocol.", "Repeat CRP/CBC and maintain continuous monitoring."],
        )
    if risk_label == "MODERATE RISK":
        return (
            f"Residual ensemble estimates {percent}% EOS risk. Continue close observation and reassess if symptoms progress.",
            ["Increase vital-sign observation frequency.", "Repeat laboratory work if clinically indicated.", "Escalate if respiratory or feeding status worsens."],
        )
    return (
        f"Residual ensemble estimates {percent}% EOS risk. Current entries do not cross the model decision threshold.",
        ["Continue routine monitoring.", "Reassess if new EOS signs appear.", "Document clinical judgment alongside model output."],
    )


def build_prediction(payload: dict[str, Any]) -> dict[str, Any]:
    artifact = load_residual_artifact()
    threshold = float(artifact["residual_threshold"])
    xgb_probability = predict_xgb(payload)
    tft_probability, tft_source = predict_tft(payload)
    predicted_residual = float(artifact["residual_model"].predict(residual_features(xgb_probability, tft_probability))[0])
    probability = float(np.clip(xgb_probability + predicted_residual, 0, 1))
    risk_label, result_title = risk_level(probability, threshold)
    interpretation, actions = clinical_text(risk_label, probability)
    return {
        "probability": probability,
        "probability_percent": round(probability * 100, 1),
        "risk_label": risk_label,
        "result_title": result_title,
        "predicted_eos": probability >= threshold,
        "threshold": threshold,
        "xgb_eos_probability": xgb_probability,
        "tft_eos_probability": tft_probability,
        "tft_source": tft_source,
        "interpretation": interpretation,
        "recommended_actions": actions,
    }


def save_prediction(payload: dict[str, Any], prediction: dict[str, Any]) -> dict[str, Any]:
    patient_id = patient_id_from_payload(payload)
    now = utc_now()
    sex = normalize_choice(payload.get("sex"), {"male": "M", "m": "M", "female": "F", "f": "F"}, "")
    with db() as conn:
        existing = conn.execute("SELECT created_at FROM patients WHERE patient_id = ?", (patient_id,)).fetchone()
        created_at = existing["created_at"] if existing else now
        conn.execute(
            """
            INSERT INTO patients (
                patient_id, sex, gestational_age_weeks, birth_weight_g, age_at_onset_hours,
                status, latest_risk_label, latest_probability, payload_json, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, 'Active', ?, ?, ?, ?, ?)
            ON CONFLICT(patient_id) DO UPDATE SET
                sex = excluded.sex,
                gestational_age_weeks = excluded.gestational_age_weeks,
                birth_weight_g = excluded.birth_weight_g,
                age_at_onset_hours = excluded.age_at_onset_hours,
                latest_risk_label = excluded.latest_risk_label,
                latest_probability = excluded.latest_probability,
                payload_json = excluded.payload_json,
                updated_at = excluded.updated_at
            """,
            (
                patient_id,
                sex,
                to_float(payload.get("gestational_age_weeks"), None),
                to_float(payload.get("birth_weight_g"), None),
                to_float(payload.get("age_at_onset_hours"), None),
                prediction["risk_label"],
                prediction["probability"],
                json.dumps(payload),
                created_at,
                now,
            ),
        )
        cursor = conn.execute(
            """
            INSERT INTO predictions (
                patient_id, probability, risk_label, result_title, predicted_eos, threshold,
                xgb_eos_probability, tft_eos_probability, tft_source, interpretation,
                actions_json, payload_json, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                patient_id,
                prediction["probability"],
                prediction["risk_label"],
                prediction["result_title"],
                int(prediction["predicted_eos"]),
                prediction["threshold"],
                prediction["xgb_eos_probability"],
                prediction["tft_eos_probability"],
                prediction["tft_source"],
                prediction["interpretation"],
                json.dumps(prediction["recommended_actions"]),
                json.dumps(payload),
                now,
            ),
        )
        prediction_id = int(cursor.lastrowid)
        conn.execute(
            "UPDATE patients SET latest_prediction_id = ? WHERE patient_id = ?",
            (prediction_id, patient_id),
        )
        report_title = f"EOS Risk Report - {patient_id}"
        report_summary = f"{prediction['risk_label']} at {prediction['probability_percent']}% probability."
        report_cursor = conn.execute(
            """
            INSERT INTO reports (prediction_id, patient_id, title, summary, risk_label, probability, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                prediction_id,
                patient_id,
                report_title,
                report_summary,
                prediction["risk_label"],
                prediction["probability"],
                now,
            ),
        )
        report_id = int(report_cursor.lastrowid)

    return {
        **prediction,
        "id": prediction_id,
        "patient_id": patient_id,
        "created_at": now,
        "patient": patient_record(patient_id),
        "report": {
            "id": report_id,
            "prediction_id": prediction_id,
            "patient_id": patient_id,
            "title": report_title,
            "summary": report_summary,
            "risk_label": prediction["risk_label"],
            "probability": prediction["probability"],
            "probability_percent": prediction["probability_percent"],
            "created_at": now,
        },
    }


def patient_record(patient_id: str) -> dict[str, Any]:
    with db() as conn:
        row = conn.execute("SELECT * FROM patients WHERE patient_id = ?", (patient_id,)).fetchone()
    return dict(row) if row else {}


def prediction_rows(limit: int = 20) -> list[dict[str, Any]]:
    with db() as conn:
        rows = conn.execute(
            "SELECT * FROM predictions ORDER BY datetime(created_at) DESC, id DESC LIMIT ?",
            (limit,),
        ).fetchall()
    return [format_prediction(dict(row)) for row in rows]


def format_prediction(row: dict[str, Any]) -> dict[str, Any]:
    row["probability_percent"] = round(float(row["probability"]) * 100, 1)
    row["recommended_actions"] = json.loads(row.pop("actions_json", "[]"))
    row["predicted_eos"] = bool(row["predicted_eos"])
    return row


def patient_rows() -> list[dict[str, Any]]:
    with db() as conn:
        rows = conn.execute(
            """
            SELECT patient_id, sex, gestational_age_weeks, birth_weight_g, age_at_onset_hours,
                   status, latest_risk_label, latest_probability, created_at, updated_at
            FROM patients
            ORDER BY datetime(updated_at) DESC
            """
        ).fetchall()
    output = []
    for row in rows:
        item = dict(row)
        item["latest_probability_percent"] = round(float(item["latest_probability"] or 0) * 100, 1)
        output.append(item)
    return output


def report_rows() -> list[dict[str, Any]]:
    with db() as conn:
        rows = conn.execute("SELECT * FROM reports ORDER BY datetime(created_at) DESC, id DESC").fetchall()
    output = []
    for row in rows:
        item = dict(row)
        item["probability_percent"] = round(float(item["probability"]) * 100, 1)
        output.append(item)
    return output


@app.context_processor
def inject_routes():
    return {"page_url": lambda page_name: url_for("page", page_name=page_name.replace(".html", ""))}


@app.route("/")
def index():
    return redirect(url_for("page", page_name="login"))


@app.route("/<page_name>.html")
@app.route("/<page_name>")
def page(page_name: str):
    page_name = page_name.replace(".html", "")
    template_name = f"{page_name}.html"
    if not (BASE_DIR / "templates" / template_name).exists():
        return redirect(url_for("page", page_name="dashboard"))
    return render_template(template_name)


@app.route("/statics/<path:filename>")
def legacy_statics(filename: str):
    return send_from_directory(app.static_folder, filename)


@app.route("/images/<path:filename>")
def legacy_images(filename: str):
    return send_from_directory(BASE_DIR / "static" / "images", filename)


@app.route("/img/<path:filename>")
def legacy_img(filename: str):
    return "", 204


@app.route("/api/predictions", methods=["POST"])
def api_predictions():
    try:
        payload = payload_from_request()
        prediction = build_prediction(payload)
        saved = save_prediction(payload, prediction)
        return jsonify(saved)
    except Exception as exc:
        return jsonify({"error": str(exc)}), 400


@app.route("/api/predictions", methods=["GET"])
def api_prediction_history():
    return jsonify({"predictions": prediction_rows()})


@app.route("/api/patients")
def api_patients():
    return jsonify({"patients": patient_rows()})


@app.route("/api/reports")
def api_reports():
    return jsonify({"reports": report_rows()})


init_db()


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False, use_reloader=False)
