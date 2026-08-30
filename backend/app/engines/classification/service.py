"""
Pollution Classification Engine — service.py

Classifies a detected pollution event into one of 5 types:
    industrial | agricultural_burning | vehicular | seasonal_inversion | unknown

Strategy:
  1. Try to load the trained XGBoost model (ml/models/classifier_v1.pkl).
  2. If the model file exists → use XGBoost for inference.
  3. If not found (cold start / first run before training) → fallback to
     the original rule-based heuristic classifier. This ensures the system
     always works, even without a trained model.
"""

import os
import pickle
import logging
from typing import Optional
from sqlalchemy.orm import Session
from datetime import datetime

from backend.app.models.pollution_event import PollutionEvent
from backend.app.models.evidence import EventClassification
from backend.app.engines.classification.features import (
    calculate_pm_ratio,
    calculate_nox_so2_ratio,
    extract_feature_vector,
)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Model paths
# ---------------------------------------------------------------------------
_BASE_DIR     = os.path.dirname(os.path.abspath(__file__))
_ML_DIR       = os.path.join(_BASE_DIR, "..", "..", "..", "..", "..", "ml", "models")
_MODEL_PATH   = os.path.abspath(os.path.join(_ML_DIR, "classifier_v1.pkl"))
_ENCODER_PATH = os.path.abspath(os.path.join(_ML_DIR, "label_encoder_v1.pkl"))

# ---------------------------------------------------------------------------
# Load model lazily (once at first call)
# ---------------------------------------------------------------------------
_model   = None
_encoder = None
_model_loaded = False


def _try_load_model():
    global _model, _encoder, _model_loaded
    if _model_loaded:
        return
    _model_loaded = True  # Only attempt once even if it fails

    if os.path.exists(_MODEL_PATH) and os.path.exists(_ENCODER_PATH):
        try:
            with open(_MODEL_PATH, "rb") as f:
                _model = pickle.load(f)
            with open(_ENCODER_PATH, "rb") as f:
                _encoder = pickle.load(f)
            logger.info("XGBoost classifier loaded from %s", _MODEL_PATH)
        except Exception as e:
            logger.warning("Failed to load XGBoost model: %s — using rule-based fallback", e)
            _model, _encoder = None, None
    else:
        logger.info(
            "XGBoost model not found at %s — using rule-based classifier. "
            "Run `python ml/train_classifier.py` to train.", _MODEL_PATH
        )


# ---------------------------------------------------------------------------
# XGBoost inference
# ---------------------------------------------------------------------------
def _classify_xgboost(feature_vector: list) -> tuple[str, float, str]:
    """
    Returns (classification_type, confidence_score, model_version)
    """
    import numpy as np
    X = np.array([feature_vector])
    proba = _model.predict_proba(X)[0]
    pred_idx = int(proba.argmax())
    label = _encoder.inverse_transform([pred_idx])[0]
    confidence = float(proba[pred_idx])
    return label, confidence, "xgboost-classifier-1.0.0"


# ---------------------------------------------------------------------------
# Rule-based fallback classifier
# ---------------------------------------------------------------------------
def _classify_rules(
    pm_ratio: Optional[float],
    nox_so2_ratio: Optional[float],
    peak_so2: Optional[float],
    peak_co: Optional[float],
    wind_speed: Optional[float],
    hour_of_day: int,
) -> tuple[str, float, str]:
    """
    Original heuristic classifier — runs when the ML model is unavailable.
    Extended with seasonal_inversion class.
    """
    diurnal = "daytime" if 6 <= hour_of_day <= 18 else "nighttime"

    # Seasonal inversion: very low wind, morning hours, moderate PM
    if wind_speed is not None and wind_speed < 1.5 and 5 <= hour_of_day <= 10:
        return "seasonal_inversion", 0.65, "rule-based-classifier-0.2.0"

    if pm_ratio and pm_ratio > 0.6:
        if nox_so2_ratio and nox_so2_ratio < 2.0 and peak_so2 and peak_so2 > 40.0:
            return "industrial", 0.85, "rule-based-classifier-0.2.0"
        elif diurnal == "nighttime" and peak_co and peak_co > 2.0:
            return "agricultural_burning", 0.70, "rule-based-classifier-0.2.0"

    if nox_so2_ratio and nox_so2_ratio > 5.0 and diurnal == "daytime":
        return "vehicular", 0.80, "rule-based-classifier-0.2.0"

    return "unknown", 0.50, "rule-based-classifier-0.2.0"


# ---------------------------------------------------------------------------
# Public entrypoint
# ---------------------------------------------------------------------------
def classify_event(
    db: Session,
    event_id: str,
    peak_pm25: float,
    peak_pm10: float,
    peak_so2: float,
    peak_nox: float,
    peak_co: float,
    hour_of_day: int,
    # Extended params (optional for backward compat)
    peak_no2: Optional[float] = None,
    wind_speed: Optional[float] = None,
    temperature: Optional[float] = None,
    humidity: Optional[float] = None,
    month: int = 1,
    day_of_week: int = 0,
    is_weekend: bool = False,
) -> None:
    """
    Classifies a pollution event and persists the result.

    Tries XGBoost model first; falls back to rule-based if model unavailable.
    """
    _try_load_model()

    pm_ratio      = calculate_pm_ratio(peak_pm25, peak_pm10)
    nox_so2_ratio = calculate_nox_so2_ratio(peak_nox, peak_so2)

    if _model is not None and _encoder is not None:
        # XGBoost path
        feature_vector = extract_feature_vector(
            pm25=peak_pm25, pm10=peak_pm10, so2=peak_so2,
            nox=peak_nox, no2=peak_no2, co=peak_co,
            wind_speed=wind_speed, temperature=temperature, humidity=humidity,
            hour_of_day=hour_of_day, month=month,
            day_of_week=day_of_week, is_weekend=is_weekend,
        )
        classification_type, confidence_score, model_version = _classify_xgboost(feature_vector)
    else:
        # Rule-based fallback
        classification_type, confidence_score, model_version = _classify_rules(
            pm_ratio=pm_ratio, nox_so2_ratio=nox_so2_ratio,
            peak_so2=peak_so2, peak_co=peak_co,
            wind_speed=wind_speed, hour_of_day=hour_of_day,
        )

    classification = EventClassification(
        event_id=event_id,
        classification_type=classification_type,
        confidence_score=confidence_score,
        model_version=model_version,
        features_used={
            "pm25_pm10_ratio":    pm_ratio,
            "nox_so2_ratio":      nox_so2_ratio,
            "hour_of_day":        hour_of_day,
            "month":              month,
            "wind_speed":         wind_speed,
            "peak_so2":           peak_so2,
            "peak_nox":           peak_nox,
            "peak_co":            peak_co,
            "diurnal_context":    "daytime" if 6 <= hour_of_day <= 18 else "nighttime",
        },
    )
    db.add(classification)
    db.commit()
