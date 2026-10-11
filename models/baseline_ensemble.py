import xgboost as xgb
import pytorch_forecasting as pf

BASELINE_XGB_MODEL_PATH = './baseline_xgb_model.json'
BASELINE_TFT_MODEL_PATH = './baseline_tft_model.ckpt'


class _ClinicalEnsemblePredictor:
    def __init__(self, tft_model, xgb_model, weight_tft=0.4):
        self.tft = tft_model
        self.xgb = xgb_model
        self.weight_tft = weight_tft
        self.weight_xgb = 1.0 - weight_tft

    def predict(self, val_dataloader, static_features_df):
        raw_preds = self.tft.predict(val_dataloader, mode="prediction")
        tft_preds = raw_preds.cpu().numpy().flatten()
        xgb_preds = self.xgb.predict_proba(static_features_df).flatten()
        blended_preds = (self.weight_tft * tft_preds) + (self.weight_xgb * xgb_preds)
        
        return {
            'blended': blended_preds,
            'tft_only': tft_preds,
            'xgb_only': xgb_preds
        }


def _load_models():
	xgb_model = xgb.XGBClassifier()
	xgb_model.load_model(BASELINE_XGB_MODEL_PATH)

	tft_model = pf.models.TemporalFusionTransformer.load_from_checkpoint(BASELINE_TFT_MODEL_PATH)
	tft_model.eval()

	return xgb_model, tft_model


class EnsemblePredictor:
	def __init__(self, weight_tft=0.4):
		xgb_model, tft_model = _load_models()
		self.predictor = _ClinicalEnsemblePredictor(tft_model, xgb_model, weight_tft=weight_tft)

	def predict(self, val_dataloader, static_features_df):
		return self.predictor.predict(val_dataloader, static_features_df)
