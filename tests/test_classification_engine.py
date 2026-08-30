import pytest
import uuid
from datetime import datetime, timezone
from backend.app.engines.common.types import ClassificationInput
from backend.app.engines.classification.service import classify_event, _classify_rules
from backend.app.db.session import SessionLocal
from backend.app.models.evidence import EventClassification


def test_classify_rules_seasonal_inversion():
    label, conf, version = _classify_rules(
        pm_ratio=0.8, nox_so2_ratio=1.0, peak_so2=20.0, peak_co=0.5,
        wind_speed=1.0, hour_of_day=8
    )
    assert label == "seasonal_inversion"
    assert conf == 0.65


def test_classify_rules_industrial():
    label, conf, version = _classify_rules(
        pm_ratio=0.7, nox_so2_ratio=1.5, peak_so2=50.0, peak_co=0.5,
        wind_speed=3.0, hour_of_day=14
    )
    assert label == "industrial"
    assert conf == 0.85


def test_classify_rules_agricultural_burning():
    label, conf, version = _classify_rules(
        pm_ratio=0.75, nox_so2_ratio=1.5, peak_so2=10.0, peak_co=3.0,
        wind_speed=2.0, hour_of_day=22
    )
    assert label == "agricultural_burning"
    assert conf == 0.70


def test_classify_rules_vehicular():
    label, conf, version = _classify_rules(
        pm_ratio=0.5, nox_so2_ratio=6.0, peak_so2=5.0, peak_co=1.0,
        wind_speed=2.5, hour_of_day=10
    )
    assert label == "vehicular"
    assert conf == 0.80


def test_classify_rules_unknown():
    label, conf, version = _classify_rules(
        pm_ratio=0.3, nox_so2_ratio=2.5, peak_so2=15.0, peak_co=0.2,
        wind_speed=5.0, hour_of_day=14
    )
    assert label == "unknown"
    assert conf == 0.50


def test_classify_event_integration():
    db = SessionLocal()
    try:
        from backend.app.models.pollution_event import PollutionEvent
        event_id = uuid.uuid4()
        
        # Create PollutionEvent first to satisfy FK
        event = PollutionEvent(
            event_id=event_id,
            detected_at=datetime.now(timezone.utc),
            started_at=datetime.now(timezone.utc),
            status="active",
            severity="severe",
            peak_pm25=120.0,
            peak_so2=80.0
        )
        db.add(event)
        db.commit()
        
        input_data = ClassificationInput(
            event_id=str(event_id),
            node_id="TEST-NODE",
            timestamp=datetime.now(timezone.utc),
            peak_pm25=120.0,
            peak_pm10=150.0,
            peak_so2=80.0,
            peak_nox=40.0,
            peak_co=0.5,
            hour_of_day=14,
            wind_speed=2.5
        )

        output = classify_event(db, input_data)
        
        # Verify output
        assert output.classification_type in ["industrial", "unknown", "vehicular", "agricultural_burning", "seasonal_inversion"]
        assert output.confidence_score > 0
        
        # Verify DB persistence
        db_record = db.query(EventClassification).filter(EventClassification.event_id == event_id).first()
        assert db_record is not None
        assert db_record.classification_type == output.classification_type
        assert db_record.confidence_score == output.confidence_score
    finally:
        db.close()
