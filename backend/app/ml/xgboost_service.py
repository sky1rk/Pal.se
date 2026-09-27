"""XGBoost static-branch inference (lazy singleton over the joblib artifact)."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import joblib
import numpy as np

from ..config import MODEL_DIR
from .features import build_feature_row

XGB_ARTIFACT_PATH = Path(MODEL_DIR) / "eos_xgboost_pipeline.joblib"

_xgb_artifact: dict[str, Any] | None = None


def load_xgb_artifact() -> dict[str, Any]:
    global _xgb_artifact
    if _xgb_artifact is None:
        if not XGB_ARTIFACT_PATH.exists():
            raise FileNotFoundError(f"XGBoost artifact not found: {XGB_ARTIFACT_PATH}")
        _xgb_artifact = joblib.load(XGB_ARTIFACT_PATH)
    return _xgb_artifact


def predict_xgb(payload: dict[str, Any]) -> float:
    artifact = load_xgb_artifact()
    features = build_feature_row(payload, artifact["selected_features"])
    numeric = artifact["num_imputer"].transform(features[artifact["numeric_cols"]])
    categorical = artifact["cat_imputer"].transform(features[artifact["categorical_cols"]])
    encoded = artifact["onehot_encoder"].transform(categorical)
    prepared = np.hstack([numeric, encoded])
    return float(artifact["calibrated_model"].predict_proba(prepared)[:, 1][0])
