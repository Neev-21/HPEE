from datetime import datetime, timezone
from typing import Optional

def calculate_anomaly_strength(peak_value: float, baseline: float, scale: float) -> float:
    """
    Computes a 0-1 score representing anomaly strength based on z-score or robust scale.
    """
    if scale <= 0:
        return 1.0 if peak_value > baseline else 0.0
    
    z_score = (peak_value - baseline) / scale
    # Cap at z=5 for 1.0 score
    return min(max(z_score / 5.0, 0.0), 1.0)

def calculate_weather_data_quality(observation_time: datetime, current_time: Optional[datetime] = None, stale_threshold_sec: int = 7200) -> float:
    """
    Returns 1.0 for fresh data, degrading to a lower value (e.g. 0.2) if data crosses stale threshold.
    """
    if not current_time:
        current_time = datetime.now(timezone.utc)
        
    delta_seconds = (current_time - observation_time).total_seconds()
    
    if delta_seconds < 0:
        return 1.0 # Future timestamp anomaly
    if delta_seconds > stale_threshold_sec:
        # Data is stale. We don't abort, but penalize heavily.
        return 0.2
        
    # Linear degradation from 1.0 to 0.5 until threshold
    degradation = (delta_seconds / stale_threshold_sec) * 0.5
    return 1.0 - degradation

def evaluate_pollutant_consistency(pm25: Optional[float], so2: Optional[float]) -> float:
    """
    Check if pollutant mix looks like an industrial event. 
    If SO2 is missing, we return a neutral/degraded score rather than failing.
    """
    if pm25 is not None and pm25 > 100.0:
        if so2 is not None and so2 > 50.0:
            return 1.0  # Strong multi-pollutant signature
        elif so2 is None:
            return 0.6  # Missing SO2, neutral guess
        else:
            return 0.4  # High PM but low SO2 (might be agricultural dust)
    return 0.2
