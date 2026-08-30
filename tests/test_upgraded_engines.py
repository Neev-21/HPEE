import pytest
import os
import json
from backend.app.engines.event_detection.baseline import get_expected_baseline
from backend.app.engines.event_detection.features import check_multi_pollutant_anomaly
from backend.app.engines.classification.service import classify_event
from backend.app.engines.source_attribution.pollutant_match import (
    calculate_pollutant_match_score,
    build_pollutant_explanation,
)
from backend.app.engines.weather.service import fetch_weather


def test_baseline_json_integrity():
    """Verify that computed diurnal baseline data covers all 24 hours for both PM2.5 and SO2."""
    for hour in range(24):
        pm25_med, pm25_mad, so2_med, so2_mad = get_expected_baseline(hour)

        assert pm25_med > 0, f"PM2.5 median for hour {hour} must be positive"
        assert pm25_mad > 0, f"PM2.5 MAD for hour {hour} must be positive"
        assert so2_med > 0, f"SO2 median for hour {hour} must be positive"
        assert so2_mad > 0, f"SO2 MAD for hour {hour} must be positive"


def test_multi_pollutant_anomaly_detection():
    """Test multi-pollutant anomaly detection: normal, single spike, and severe dual spike."""
    # Normal daytime z-scores (e.g. z_pm25=0.5, z_so2=0.2)
    is_anomaly, score = check_multi_pollutant_anomaly(0.5, 0.2)
    assert not is_anomaly, f"Normal z-scores should not trigger anomaly: score={score}"

    # Industrial SO2 surge (z_pm25=1.0, z_so2=3.5)
    is_anomaly, score = check_multi_pollutant_anomaly(1.0, 3.5)
    assert is_anomaly, "High SO2 z-score should trigger anomaly"
    assert score > 0.3

    # Severe dual spike (z_pm25=4.5, z_so2=4.0)
    is_anomaly, score = check_multi_pollutant_anomaly(4.5, 4.0)
    assert is_anomaly, "Dual spike must trigger anomaly"
    assert score >= 0.8


def test_pollutant_match_cosine_similarity():
    """Verify cosine similarity calculation between plume readings and factory profiles."""
    chemical_factory = {"so2": 0.9, "nox": 0.5, "pm25": 0.3, "co": 0.1, "no2": 0.2}
    cement_factory = {"so2": 0.2, "nox": 0.3, "pm25": 0.95, "co": 0.2, "no2": 0.1}

    # Reading with dominant SO2 (matches chemical factory)
    detected_chemical = {"so2": 150.0, "nox": 45.0, "pm25": 30.0, "co": 0.5, "no2": 15.0}
    score_chem = calculate_pollutant_match_score(detected_chemical, chemical_factory)
    score_cement = calculate_pollutant_match_score(detected_chemical, cement_factory)

    assert score_chem > score_cement, "Chemical surge should match chemical factory higher than cement factory"
    assert score_chem > 0.8, f"Expected high cosine match, got {score_chem}"

    explanation = build_pollutant_explanation(score_chem, detected_chemical, "Gujarat Alkalies")
    assert "Strong pollutant match" in explanation


def test_xgboost_classifier_inference():
    """Test XGBoost model loading and inference with pickle."""
    from backend.app.engines.classification.features import extract_feature_vector
    import pickle
    import numpy as np

    model_path = os.path.join(os.path.dirname(__file__), "..", "ml", "models", "classifier_v1.pkl")
    encoder_path = os.path.join(os.path.dirname(__file__), "..", "ml", "models", "label_encoder_v1.pkl")
    assert os.path.exists(model_path), "Trained XGBoost model file must exist"
    assert os.path.exists(encoder_path), "Trained label encoder file must exist"

    # Chemical surge features
    vec = extract_feature_vector(
        hour_of_day=2,
        month=8,
        day_of_week=2,
        is_weekend=False,
        pm25=180.0,
        pm10=220.0,
        so2=160.0,
        nox=50.0,
        no2=25.0,
        co=0.8,
        wind_speed=2.5,
        temperature=28.0,
        humidity=75.0,
    )
    assert len(vec) == 15

    with open(model_path, "rb") as f:
        model = pickle.load(f)
    with open(encoder_path, "rb") as f:
        label_enc = pickle.load(f)

    X = np.array([vec])
    probs = model.predict_proba(X)[0]
    pred_idx = int(probs.argmax())
    pred_label = label_enc.inverse_transform([pred_idx])[0]

    assert pred_label == "industrial", f"Expected 'industrial' classification, got '{pred_label}'"
    assert probs[pred_idx] > 0.7, f"Expected high confidence, got {probs[pred_idx]}"



def test_weather_engine_fallback():
    """Verify Weather Engine gracefully falls back to sensor observations when offline/invalid."""
    result = fetch_weather(
        lat=21.6320,
        lon=73.0150,
        sensor_wind_speed=3.2,
        sensor_wind_direction=140.0,
        sensor_temperature=29.5,
        sensor_humidity=70.0,
    )
    assert result.wind_speed_ms is not None
    assert result.wind_direction_deg is not None
    assert result.quality_score >= 0.4
