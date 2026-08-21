# PAL.SE Flask Backend and Residual Ensemble Integration

## Purpose
This folder contains the Flask-backed PAL.SE user interface for early-onset neonatal sepsis risk prediction. The dashboard accepts clinician-entered patient, maternal, laboratory, clinical sign, treatment, and vital-sign details, sends them to Flask, runs the EOS model stack, then updates the dashboard result, prediction history, patients list, and generated reports from backend state.

The backend is the canonical source of truth. The UI no longer depends on CSV upload for prediction.

## Architecture
- `app.py` serves the Flask application, page routes, SQLite database, and prediction APIs.
- `templates/` contains the dashboard, patients, reports, monitor, edit-record, login, signup, and profile pages.
- `static/js/dashboard.js` collects dashboard form fields and posts them to `/api/predictions`.
- `static/js/system-state.js` refreshes dashboard history, patients, and reports from the API and broadcasts updates across already-open tabs.
- `tft_inference.py` reconstructs a live TFT inference request from dashboard-entered hourly/vital fields.
- `data/palse.sqlite3` is created automatically on first run.

## Dependencies
Use the XGBoost environment for model compatibility:

```powershell
.\Training\xgboost\Scripts\python.exe .\System\app.py
```

The backend expects these Python packages:
- Flask
- joblib
- numpy
- pandas
- scikit-learn compatible with the saved XGBoost pipeline
- xgboost compatible with the saved pipeline

The TFT helper uses:
- torch
- pytorch-forecasting
- lightning/pytorch-lightning dependencies from the TFT environment

## Step-by-Step Run Instructions
Follow these steps from PowerShell.

### 1. Open the project folder

```powershell
cd C:\Users\espon\Documents\thesis
```

### 2. Confirm the required files exist

```powershell
Test-Path .\System\app.py
Test-Path .\Training\xgb\models\eos_xgboost_phase1_pipeline.joblib
Test-Path ".\Training\residual ensemble\residual_ensemble_model.joblib"
Test-Path .\Training\tft\tft_eos_model_state_dict.pt
```

Each command should print `True`.

### 3. Start the Flask backend
Run the app with the XGBoost Python environment because it matches the saved XGBoost model artifact.

```powershell
.\Training\xgboost\Scripts\python.exe .\System\app.py
```

Keep this terminal open while using the system. Flask should start on:

```text
http://127.0.0.1:5000
```

### 4. Open the system in your browser
Use these URLs:

```text
Dashboard: http://127.0.0.1:5000/dashboard
Patients:  http://127.0.0.1:5000/patients
Reports:   http://127.0.0.1:5000/reports
Login:     http://127.0.0.1:5000/login
```

### 5. Generate an EOS prediction
On the dashboard:

1. Enter the patient ID and clinical details.
2. Fill in the maternal, neonatal, lab, vital-sign, and treatment fields available in the form.
3. Click `CALCULATE RISK SCORE`.
4. Wait for the result card to update.

After a successful prediction:
- The dashboard probability, risk label, interpretation, and recommended actions update.
- The prediction history updates immediately.
- The Patients page shows the new or updated patient.
- The Reports page shows the newly generated report.

### 6. Check that the APIs are working
Open these URLs in the browser while Flask is running:

```text
http://127.0.0.1:5000/api/predictions
http://127.0.0.1:5000/api/patients
http://127.0.0.1:5000/api/reports
```

Each URL should return JSON.

### 7. Stop the server
Go back to the PowerShell window running Flask and press:

```text
Ctrl + C
```

### 8. If port 5000 is already busy
Find and stop the process using port `5000`, or change the port at the bottom of `System/app.py`:

```python
app.run(host="127.0.0.1", port=5001, debug=False, use_reloader=False)
```

Then open:

```text
http://127.0.0.1:5001/dashboard
```

## Model Artifacts
The Flask backend loads these artifacts:

```text
Training/xgb/models/eos_xgboost_phase1_pipeline.joblib
Training/tft/tft_eos_model_state_dict.pt
Training/residual ensemble/residual_ensemble_model.joblib
```

Prediction flow:

1. XGBoost static inference maps dashboard fields into the saved pipeline features.
2. TFT live inference receives vitals and time-varying clinical fields through `System/tft_inference.py`.
3. Residual ensemble receives:
   - `xgb_eos_probability`
   - `tft_eos_probability`
   - `tft_minus_xgb`
   - `mean_probability`
   - `absolute_disagreement`
4. Final EOS probability is calculated as `xgb_eos_probability + predicted_residual`, clipped to `[0, 1]`.

If the full TFT runtime is unavailable, Flask falls back to a temporal vital-sign heuristic and marks the response as `tft_source: temporal_vitals_fallback`.

## Dashboard Input Mapping
The dashboard sends JSON to Flask. Core fields include:

```json
{
  "patient_id": "NEO-2024-001",
  "sex": "male",
  "gestational_age_weeks": 38,
  "birth_weight_g": 3200,
  "delivery_mode": "vaginal",
  "maternal_age_years": 29,
  "anc_4plus": 1,
  "prom_over_18h": 1,
  "maternal_fever": 0,
  "multiple_birth": 0,
  "age_at_onset_hours": 8,
  "apgar_5min": 8,
  "poor_feeding": 1,
  "lethargy": 0,
  "convulsions": 0,
  "respiratory_distress": 1,
  "jaundice": 0,
  "bulging_fontanelle": 0,
  "crp_mg_l": 18,
  "wbc_count": 14500,
  "platelet_count": 210000,
  "heart_rate_bpm": 168,
  "temperature_c": 38.1,
  "blood_pressure": "70/42",
  "oxygen_saturation_pct": 93,
  "respiratory_rate_bpm": 64,
  "central_venous_line": 0,
  "inotrope": 0,
  "intubate": 0,
  "duration_days": 1,
  "oxygen_therapy": 1
}
```

Missing optional fields are imputed or defaulted by the backend to match the saved model artifacts.

## SQLite Schema
`app.py` initializes three tables:

```sql
patients(patient_id, sex, gestational_age_weeks, birth_weight_g,
         age_at_onset_hours, status, latest_risk_label,
         latest_probability, latest_prediction_id, payload_json,
         created_at, updated_at)

predictions(id, patient_id, probability, risk_label, result_title,
            predicted_eos, threshold, xgb_eos_probability,
            tft_eos_probability, tft_source, interpretation,
            actions_json, payload_json, created_at)

reports(id, prediction_id, patient_id, title, summary,
        risk_label, probability, created_at)
```

The `/api/predictions` endpoint creates or updates the patient, inserts a prediction history entry, and inserts a report in the same request.

## Routes
Page routes:

```text
GET /dashboard
GET /dashboard.html
GET /patients
GET /patients.html
GET /reports
GET /reports.html
GET /monitor
GET /edit-record
GET /login
GET /signup
GET /profile
```

API routes:

```text
POST /api/predictions
GET  /api/predictions
GET  /api/patients
GET  /api/reports
```

## Prediction API Contract
`POST /api/predictions` accepts dashboard JSON and returns:

```json
{
  "id": 1,
  "patient_id": "NEO-2024-001",
  "probability": 0.78,
  "probability_percent": 78.0,
  "risk_label": "HIGH RISK",
  "result_title": "Sepsis Risk Detected",
  "predicted_eos": true,
  "threshold": 0.5,
  "xgb_eos_probability": 0.61,
  "tft_eos_probability": 0.52,
  "tft_source": "live_tft",
  "interpretation": "Clinical interpretation text",
  "recommended_actions": ["Action 1", "Action 2", "Action 3"],
  "patient": {},
  "report": {}
}
```

## UI Synchronization Rules
When the dashboard `CALCULATE RISK SCORE` button is clicked:

1. `dashboard.js` sends dashboard form JSON to `POST /api/predictions`.
2. Flask runs XGBoost, TFT, and residual ensemble fusion.
3. Flask saves the patient, prediction history, and report.
4. The dashboard result card, probability donut, clinical interpretation, recommended actions, and history refresh immediately.
5. `system-state.js` broadcasts `prediction-created`.
6. Already-open Patients and Reports tabs refresh through `BroadcastChannel`; browsers without it use the `localStorage` storage event.
7. Patients and Reports pages always reload their lists from `GET /api/patients` and `GET /api/reports`.

## Testing Checklist
Backend:
- All page routes return `200`.
- `POST /api/predictions` creates or updates one patient.
- The same request appends one prediction history row.
- The same request creates one report row.
- Response contains residual probability, risk label, interpretation, actions, patient summary, and report summary.

Frontend:
- Dashboard no longer shows or requires CSV upload.
- Clicking `CALCULATE RISK SCORE` updates result card and history without refreshing the page.
- Patients page shows the newly added or updated patient.
- Reports page shows the newly generated report.
- Open Patients and Reports tabs refresh after a dashboard prediction.

Model:
- XGBoost preprocessing accepts dashboard-entered fields.
- TFT helper accepts live vital-sign inputs.
- Residual ensemble receives XGB probability, TFT probability, and derived residual features.

## Troubleshooting
- If Flask cannot import, run through `Training\xgboost\Scripts\python.exe` to match the saved XGBoost pipeline.
- If the TFT helper fails, verify `Training\tft\Scripts\python.exe`, `Training/tft/tft_eos_model_state_dict.pt`, and `Training/tft/neonatal_dataset_onset_based_varied_vitals.csv`.
- If Patients or Reports do not update, check that `static/js/system-state.js` is loaded on the page and that `/api/patients` or `/api/reports` returns JSON.
- If stale test data appears, stop Flask and delete `System/data/palse.sqlite3`; it will be recreated on the next run.
