from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field


class SignupIn(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)
    remember_me: bool = False


class UserOut(BaseModel):
    id: str
    first_name: str
    last_name: str
    email: EmailStr


class AuthResponse(BaseModel):
    user: UserOut


class MeResponse(BaseModel):
    user: UserOut | None = None


# --- EOS prediction -------------------------------------------------------

from datetime import datetime
from typing import Any


class PredictionIn(BaseModel):
    """Dashboard form payload. Every clinical field is optional — the ML
    layer imputes/defaults missing values to match the saved artifacts."""

    model_config = {"extra": "allow"}

    patient_id: str | None = None
    sex: str | None = None
    gestational_age_weeks: float | str | None = None
    birth_weight_g: float | str | None = None
    delivery_mode: str | None = None
    place_of_birth: str | None = None
    maternal_age_years: float | str | None = None
    apgar_1min: float | str | None = None
    apgar_5min: float | str | None = None
    resuscitation_at_birth: int | str | bool | None = None
    prom_over_18h: int | str | bool | None = None
    maternal_fever: int | str | bool | None = None
    maternal_uti: int | str | bool | None = None
    unclean_cord_care: int | str | bool | None = None
    maternal_hiv: int | str | bool | None = None
    multiple_birth: int | str | bool | None = None
    anc_4plus: int | str | bool | None = None
    temperature_c: float | str | None = None
    poor_feeding: int | str | bool | None = None
    lethargy: int | str | bool | None = None
    respiratory_distress: int | str | bool | None = None
    convulsions: int | str | bool | None = None
    abdominal_distension: int | str | bool | None = None
    jaundice: int | str | bool | None = None
    umbilical_redness: int | str | bool | None = None
    skin_pustules: int | str | bool | None = None
    bulging_fontanelle: int | str | bool | None = None
    crp_mg_l: float | str | None = None
    wbc_count: float | str | None = None
    platelet_count: float | str | None = None
    # Vital-sign / treatment fields (TFT branch + heuristic fallback).
    heart_rate_bpm: float | str | None = None
    blood_pressure: str | None = None
    oxygen_saturation_pct: float | str | None = None
    respiratory_rate_bpm: float | str | None = None
    age_at_onset_hours: float | str | None = None
    central_venous_line: int | str | bool | None = None
    inotrope: int | str | bool | None = None
    intubate: int | str | bool | None = None
    duration_days: float | str | None = None
    oxygen_therapy: int | str | bool | None = None


class PatientOut(BaseModel):
    patient_id: str
    sex: str | None = None
    gestational_age_weeks: float | None = None
    birth_weight_g: float | None = None
    age_at_onset_hours: float | None = None
    status: str = "Active"
    latest_risk_label: str | None = None
    latest_probability: float | None = None
    latest_probability_percent: float | None = None
    latest_prediction_id: int | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class PredictionReportOut(BaseModel):
    id: int
    prediction_id: int
    patient_id: str
    title: str
    summary: str
    risk_label: str
    probability: float
    probability_percent: float
    created_at: datetime | None = None


class PredictionOut(BaseModel):
    id: int
    patient_id: str
    probability: float
    probability_percent: float
    risk_label: str
    result_title: str
    predicted_eos: bool
    threshold: float
    xgb_eos_probability: float
    tft_eos_probability: float
    tft_source: str
    interpretation: str
    recommended_actions: list[str]
    created_at: datetime | None = None
    patient: PatientOut | dict[str, Any] | None = None
    report: PredictionReportOut | dict[str, Any] | None = None


class PredictionHistoryOut(BaseModel):
    id: int
    patient_id: str
    probability: float
    probability_percent: float
    risk_label: str
    result_title: str
    predicted_eos: bool
    threshold: float
    xgb_eos_probability: float
    tft_eos_probability: float
    tft_source: str
    interpretation: str
    recommended_actions: list[str]
    created_at: datetime | None = None


class ReportOut(BaseModel):
    id: int
    prediction_id: int
    patient_id: str
    title: str
    summary: str
    risk_label: str
    probability: float
    probability_percent: float
    created_at: datetime | None = None
