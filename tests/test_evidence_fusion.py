import pytest
from datetime import datetime, timezone, timedelta
from uuid import uuid4
from backend.app.engines.common.types import EventContext
from backend.app.engines.source_attribution.ranking import (
    calculate_angular_error,
    calculate_wind_alignment_score,
    calculate_distance_score,
    normalize_probabilities
)
from backend.app.engines.evidence_fusion.factors import (
    calculate_weather_data_quality,
    evaluate_pollutant_consistency,
    calculate_anomaly_strength
)

def test_angular_error():
    assert calculate_angular_error(0.0, 10.0) == 10.0
    assert calculate_angular_error(350.0, 10.0) == 20.0
    assert calculate_angular_error(10.0, 350.0) == 20.0
    assert calculate_angular_error(180.0, 180.0) == 0.0

def test_wind_alignment_score():
    assert calculate_wind_alignment_score(0.0) == 1.0 # Cos(0) = 1
    assert round(calculate_wind_alignment_score(60.0), 1) == 0.5 # Cos(60) = 0.5
    assert calculate_wind_alignment_score(90.0) == 0.0 # Cap at 0
    assert calculate_wind_alignment_score(180.0) == 0.0 # Cap at 0

def test_distance_score():
    assert calculate_distance_score(0.0, 3.0) == 1.0
    assert calculate_distance_score(1.5, 3.0) == 0.5
    assert calculate_distance_score(3.0, 3.0) == 0.0
    assert calculate_distance_score(4.0, 3.0) == 0.0

def test_normalize_probabilities():
    scores = [0.8, 0.2]
    probs = normalize_probabilities(scores)
    assert probs == [0.8, 0.2]
    
    scores = [1.0, 1.0, 2.0]
    probs = normalize_probabilities(scores)
    assert probs == [0.25, 0.25, 0.5]

def test_weather_data_quality():
    now = datetime.now(timezone.utc)
    # Fresh
    assert calculate_weather_data_quality(now, now) == 1.0
    
    # Half stale
    half_stale = now - timedelta(seconds=3600)
    assert calculate_weather_data_quality(half_stale, now, stale_threshold_sec=7200) == 0.75
    
    # Very stale
    stale = now - timedelta(seconds=8000)
    assert calculate_weather_data_quality(stale, now, stale_threshold_sec=7200) == 0.2

def test_pollutant_consistency():
    # Strong industrial
    assert evaluate_pollutant_consistency(pm25=120.0, so2=60.0) == 1.0
    # Missing SO2
    assert evaluate_pollutant_consistency(pm25=120.0, so2=None) == 0.6
    # Low PM
    assert evaluate_pollutant_consistency(pm25=50.0, so2=20.0) == 0.2

def test_anomaly_strength():
    assert calculate_anomaly_strength(peak_value=100.0, baseline=50.0, scale=10.0) == 1.0 # z=5 (cap)
    assert calculate_anomaly_strength(peak_value=75.0, baseline=50.0, scale=10.0) == 0.5  # z=2.5
