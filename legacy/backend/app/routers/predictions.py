"""EOS prediction endpoints (FastAPI port of legacy Flask ``/api/*`` routes)."""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_current_user
from ..ml.ensemble import build_prediction
from ..ml.features import normalize_sex, to_float
from ..models import Patient, Prediction, Report, User
from ..schemas import (
    PatientDetailOut,
    PatientOut,
    PatientUpdateIn,
    PredictionHistoryOut,
    PredictionIn,
    PredictionOut,
    PredictionReportOut,
    ReportOut,
    VitalReadingIn,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["predictions"])

# TFT temporal timepoints (hours since birth) — mirror backend ml/tft_inference.py.
TFT_VITAL_TIMEPOINTS = {0, 4, 8, 12, 16, 20}

# Static (non-temporal) fields a user may correct after a patient is created.
# Mirrors the editable sections in the frontend patientForm module. Temporal
# {vital}_{h}h keys and patient_id are intentionally excluded.
STATIC_EDITABLE_FIELDS = {
    "sex",
    "gestational_age_weeks",
    "birth_weight_g",
    "delivery_mode",
    "place_of_birth",
    "multiple_birth",
    "age_at_onset_hours",
    "apgar_1min",
    "apgar_5min",
    "resuscitation_at_birth",
    "maternal_age_years",
    "anc_4plus",
    "prom_over_18h",
    "maternal_fever",
    "maternal_uti",
    "maternal_hiv",
    "unclean_cord_care",
    "poor_feeding",
    "lethargy",
    "convulsions",
    "respiratory_distress",
    "jaundice",
    "bulging_fontanelle",
    "abdominal_distension",
    "umbilical_redness",
    "skin_pustules",
    "crp_mg_l",
    "wbc_count",
    "platelet_count",
    "central_venous_line",
    "inotrope",
    "intubate",
    "duration_days",
    "oxygen_therapy",
}


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _load_payload(row: Patient) -> dict:
    try:
        data = json.loads(row.payload_json or "{}")
    except (TypeError, ValueError):
        return {}
    return data if isinstance(data, dict) else {}


def _patient_id_from_payload(payload: dict) -> str:
    raw = str(payload.get("patient_id") or payload.get("id") or "").strip()
    if raw:
        return raw
    return f"NEO-{datetime.now().strftime('%Y%m%d%H%M%S')}"


def _patient_to_out(row: Patient) -> PatientOut:
    prob = float(row.latest_probability) if row.latest_probability is not None else None
    return PatientOut(
        patient_id=row.patient_id,
        sex=row.sex,
        gestational_age_weeks=row.gestational_age_weeks,
        birth_weight_g=row.birth_weight_g,
        age_at_onset_hours=row.age_at_onset_hours,
        status=row.status or "Active",
        latest_risk_label=row.latest_risk_label,
        latest_probability=prob,
        latest_probability_percent=round(prob * 100, 1) if prob is not None else None,
        latest_prediction_id=row.latest_prediction_id,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


def _patient_detail(row: Patient) -> PatientDetailOut:
    return PatientDetailOut(**_patient_to_out(row).model_dump(), payload=_load_payload(row))


def _prediction_to_history(row: Prediction) -> PredictionHistoryOut:
    try:
        actions = json.loads(row.actions_json or "[]")
    except (TypeError, ValueError):
        actions = []
    return PredictionHistoryOut(
        id=row.id,
        patient_id=row.patient_id,
        probability=row.probability,
        probability_percent=round(float(row.probability) * 100, 1),
        risk_label=row.risk_label,
        result_title=row.result_title,
        predicted_eos=bool(row.predicted_eos),
        threshold=row.threshold,
        xgb_eos_probability=row.xgb_eos_probability,
        tft_eos_probability=row.tft_eos_probability,
        tft_source=row.tft_source,
        interpretation=row.interpretation,
        recommended_actions=actions,
        created_at=row.created_at,
    )


def _report_to_out(row: Report) -> ReportOut:
    return ReportOut(
        id=row.id,
        prediction_id=row.prediction_id,
        patient_id=row.patient_id,
        title=row.title,
        summary=row.summary,
        risk_label=row.risk_label,
        probability=row.probability,
        probability_percent=round(float(row.probability) * 100, 1),
        created_at=row.created_at,
    )


def _record_prediction(
    db: Session,
    user: User,
    patient: Patient,
    payload: dict,
    prediction: dict,
    now: datetime,
) -> tuple[Prediction, Report, str, str]:
    """Persist a prediction + its report and point the patient at the latest."""
    row = Prediction(
        patient_id=patient.patient_id,
        user_id=user.id,
        probability=prediction["probability"],
        risk_label=prediction["risk_label"],
        result_title=prediction["result_title"],
        predicted_eos=bool(prediction["predicted_eos"]),
        threshold=prediction["threshold"],
        xgb_eos_probability=prediction["xgb_eos_probability"],
        tft_eos_probability=prediction["tft_eos_probability"],
        tft_source=prediction["tft_source"],
        interpretation=prediction["interpretation"],
        actions_json=json.dumps(prediction["recommended_actions"]),
        payload_json=json.dumps(payload, default=str),
        created_at=now,
    )
    db.add(row)
    db.flush()  # assign row.id before creating the report

    report_title = f"EOS Risk Report - {patient.patient_id}"
    report_summary = (
        f"{prediction['risk_label']} at {prediction['probability_percent']}% probability."
    )
    report = Report(
        prediction_id=row.id,
        user_id=user.id,
        patient_id=patient.patient_id,
        title=report_title,
        summary=report_summary,
        risk_label=prediction["risk_label"],
        probability=prediction["probability"],
        created_at=now,
    )
    db.add(report)
    db.flush()

    patient.latest_prediction_id = row.id
    return row, report, report_title, report_summary


@router.post("/predictions", response_model=PredictionOut, status_code=status.HTTP_201_CREATED)
def create_prediction(
    payload_in: PredictionIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> PredictionOut:
    payload = payload_in.model_dump(exclude_none=False)
    try:
        prediction = build_prediction(payload)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc))
    except Exception as exc:  # noqa: BLE001 - surface model errors as 400 like legacy Flask
        logger.exception("prediction failed")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    patient_id = _patient_id_from_payload(payload)
    now = _utcnow()
    sex = normalize_sex(payload.get("sex"), default="")

    patient = db.get(Patient, (patient_id, user.id))
    if patient is None:
        patient = Patient(
            patient_id=patient_id,
            user_id=user.id,
            sex=sex,
            gestational_age_weeks=to_float(payload.get("gestational_age_weeks"), None),
            birth_weight_g=to_float(payload.get("birth_weight_g"), None),
            age_at_onset_hours=to_float(payload.get("age_at_onset_hours"), None),
            status="Active",
            latest_risk_label=prediction["risk_label"],
            latest_probability=prediction["probability"],
            payload_json=json.dumps(payload, default=str),
            created_at=now,
            updated_at=now,
        )
        db.add(patient)
    else:
        patient.sex = sex
        patient.gestational_age_weeks = to_float(payload.get("gestational_age_weeks"), None)
        patient.birth_weight_g = to_float(payload.get("birth_weight_g"), None)
        patient.age_at_onset_hours = to_float(payload.get("age_at_onset_hours"), None)
        patient.latest_risk_label = prediction["risk_label"]
        patient.latest_probability = prediction["probability"]
        patient.payload_json = json.dumps(payload, default=str)
        patient.updated_at = now

    row, report, report_title, report_summary = _record_prediction(
        db, user, patient, payload, prediction, now
    )
    db.commit()
    db.refresh(row)
    db.refresh(report)

    return PredictionOut(
        id=row.id,
        patient_id=patient_id,
        created_at=row.created_at,
        patient=_patient_to_out(patient),
        report=PredictionReportOut(
            id=report.id,
            prediction_id=row.id,
            patient_id=patient_id,
            title=report_title,
            summary=report_summary,
            risk_label=prediction["risk_label"],
            probability=prediction["probability"],
            probability_percent=prediction["probability_percent"],
            created_at=report.created_at,
        ),
        **prediction,
    )


@router.get("/predictions")
def list_predictions(
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict[str, list[PredictionHistoryOut]]:
    rows = (
        db.query(Prediction)
        .filter(Prediction.user_id == user.id)
        .order_by(desc(Prediction.created_at), desc(Prediction.id))
        .limit(limit)
        .all()
    )
    return {"predictions": [_prediction_to_history(r) for r in rows]}


@router.get("/patients")
def list_patients(
    include_archived: bool = Query(default=False),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict[str, list[PatientOut]]:
    query = db.query(Patient).filter(Patient.user_id == user.id)
    if not include_archived:
        query = query.filter(Patient.status != "Archived")
    rows = query.order_by(desc(Patient.updated_at)).all()
    return {"patients": [_patient_to_out(r) for r in rows]}


@router.get("/patients/{patient_id}", response_model=PatientDetailOut)
def get_patient(
    patient_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> PatientDetailOut:
    row = db.get(Patient, (patient_id, user.id))
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    return _patient_detail(row)


@router.patch("/patients/{patient_id}", response_model=PredictionOut)
def update_patient(
    patient_id: str,
    payload_in: PatientUpdateIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> PredictionOut:
    """Correct a patient's static variables and recompute the EOS risk score."""
    patient = db.get(Patient, (patient_id, user.id))
    if patient is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    updates = payload_in.model_dump(exclude_unset=True)
    payload = _load_payload(patient)
    for key, value in updates.items():
        if key in STATIC_EDITABLE_FIELDS:
            payload[key] = value
    payload["patient_id"] = patient_id

    try:
        prediction = build_prediction(payload)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc))
    except Exception as exc:  # noqa: BLE001 - surface model errors as 400 like legacy Flask
        logger.exception("prediction failed")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    now = _utcnow()
    patient.sex = normalize_sex(payload.get("sex"), default="")
    patient.gestational_age_weeks = to_float(payload.get("gestational_age_weeks"), None)
    patient.birth_weight_g = to_float(payload.get("birth_weight_g"), None)
    patient.age_at_onset_hours = to_float(payload.get("age_at_onset_hours"), None)
    patient.latest_risk_label = prediction["risk_label"]
    patient.latest_probability = prediction["probability"]
    patient.payload_json = json.dumps(payload, default=str)
    patient.updated_at = now

    row, report, report_title, report_summary = _record_prediction(
        db, user, patient, payload, prediction, now
    )
    db.commit()
    db.refresh(row)
    db.refresh(report)

    return PredictionOut(
        id=row.id,
        patient_id=patient_id,
        created_at=row.created_at,
        patient=_patient_to_out(patient),
        report=PredictionReportOut(
            id=report.id,
            prediction_id=row.id,
            patient_id=patient_id,
            title=report_title,
            summary=report_summary,
            risk_label=prediction["risk_label"],
            probability=prediction["probability"],
            probability_percent=prediction["probability_percent"],
            created_at=report.created_at,
        ),
        **prediction,
    )


@router.post("/patients/{patient_id}/readings", response_model=PatientDetailOut)
def add_vital_reading(
    patient_id: str,
    reading: VitalReadingIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> PatientDetailOut:
    """Append a temporal vital-sign reading to the patient's stored payload."""
    patient = db.get(Patient, (patient_id, user.id))
    if patient is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    if reading.hour not in TFT_VITAL_TIMEPOINTS:
        allowed = ", ".join(str(h) for h in sorted(TFT_VITAL_TIMEPOINTS))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"hour must be one of: {allowed}",
        )

    payload = _load_payload(patient)
    payload["patient_id"] = patient_id
    hour = reading.hour

    def put(key: str, value: object) -> None:
        if value is None:
            return
        text = str(value).strip()
        if text:
            payload[f"{key}_{hour}h"] = text

    put("temperature_c", reading.temperature_c)
    put("heart_rate_bpm", reading.heart_rate_bpm)
    put("oxygen_saturation_pct", reading.oxygen_saturation_pct)
    put("respiratory_rate_bpm", reading.respiratory_rate_bpm)
    if reading.blood_pressure:
        systolic, _, diastolic = reading.blood_pressure.partition("/")
        if systolic.strip():
            payload[f"systolic_bp_mmhg_{hour}h"] = systolic.strip()
        if diastolic.strip():
            payload[f"diastolic_bp_mmhg_{hour}h"] = diastolic.strip()

    patient.payload_json = json.dumps(payload, default=str)
    patient.updated_at = _utcnow()
    db.commit()
    db.refresh(patient)
    return _patient_detail(patient)


@router.post("/patients/{patient_id}/archive", response_model=PatientDetailOut)
def archive_patient(
    patient_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> PatientDetailOut:
    patient = db.get(Patient, (patient_id, user.id))
    if patient is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    patient.status = "Archived"
    patient.updated_at = _utcnow()
    db.commit()
    db.refresh(patient)
    return _patient_detail(patient)


@router.post("/patients/{patient_id}/restore", response_model=PatientDetailOut)
def restore_patient(
    patient_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> PatientDetailOut:
    patient = db.get(Patient, (patient_id, user.id))
    if patient is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    patient.status = "Active"
    patient.updated_at = _utcnow()
    db.commit()
    db.refresh(patient)
    return _patient_detail(patient)


@router.get("/reports")
def list_reports(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict[str, list[ReportOut]]:
    rows = (
        db.query(Report)
        .filter(Report.user_id == user.id)
        .order_by(desc(Report.created_at), desc(Report.id))
        .all()
    )
    return {"reports": [_report_to_out(r) for r in rows]}
