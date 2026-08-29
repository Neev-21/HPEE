from sqlalchemy.orm import Session
from backend.app.models.pollution_event import PollutionEvent
from backend.app.models.evidence import EventClassification
from backend.app.engines.classification.features import calculate_pm_ratio, calculate_nox_so2_ratio

def classify_event(db: Session, event_id: str, peak_pm25: float, peak_pm10: float, peak_so2: float, peak_nox: float, peak_co: float, hour_of_day: int) -> None:
    """
    Classifies a pollution event and saves the classification to the DB.
    """
    pm_ratio = calculate_pm_ratio(peak_pm25, peak_pm10)
    nox_so2_ratio = calculate_nox_so2_ratio(peak_nox, peak_so2)
    
    classification_type = "unknown"
    confidence_score = 0.5
    diurnal_context = "daytime" if 6 <= hour_of_day <= 18 else "nighttime"

    # Rule-based logic
    if pm_ratio and pm_ratio > 0.6:
        if nox_so2_ratio and nox_so2_ratio < 2.0 and peak_so2 and peak_so2 > 40.0:
            classification_type = "industrial"
            confidence_score = 0.85
        elif diurnal_context == "nighttime" and peak_co and peak_co > 2.0:
            classification_type = "agricultural_burning"
            confidence_score = 0.70
    elif nox_so2_ratio and nox_so2_ratio > 5.0 and diurnal_context == "daytime":
        classification_type = "vehicular"
        confidence_score = 0.80

    classification = EventClassification(
        event_id=event_id,
        classification_type=classification_type,
        confidence_score=confidence_score,
        model_version="rule-based-classifier-0.1.0",
        features_used={
            "pm25_pm10_ratio": pm_ratio,
            "nox_so2_ratio": nox_so2_ratio,
            "diurnal_context": diurnal_context,
            "hour_of_day": hour_of_day
        }
    )
    
    db.add(classification)
    db.commit()
