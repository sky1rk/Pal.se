import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/palse_auth.sqlite3")
JWT_SECRET = os.getenv("JWT_SECRET", "dev-only-secret-change-me")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))
REMEMBER_ME_EXPIRE_DAYS = int(os.getenv("REMEMBER_ME_EXPIRE_DAYS", "30"))
COOKIE_NAME = "access_token"
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() == "true"
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")

# Directory holding the EOS model artifacts (eos_xgboost_pipeline.joblib,
# eos_residual_ensemble.joblib, eos_tft_state_dict.pt). Overridable for
# Docker/local layouts; defaults to backend/models next to this package.
MODEL_DIR = os.getenv(
    "MODEL_DIR",
    os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models"),
)
# Optional training CSV used to rebuild TFT TimeSeriesDataSet encoders for
# live inference. When unset/missing, predict_tft() uses the vital-sign
# heuristic fallback and reports tft_source="temporal_vitals_fallback".
TFT_DATASET_PATH = os.getenv("TFT_DATASET_PATH", "")
