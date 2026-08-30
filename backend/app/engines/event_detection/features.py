from typing import Optional, List


def calculate_robust_z_score(value: Optional[float], median: float, mad: float) -> float:
    """
    Robust z-score: (value - median) / MAD.
    Returns 0.0 if value is None or MAD is zero.
    """
    if value is None or mad <= 0:
        return 0.0
    return (value - median) / mad


def check_anomaly_persistence(
    z_scores: List[float],
    threshold: float = 3.0,
    required_consecutive: int = 3
) -> bool:
    """
    Returns True only if the last N consecutive z-scores all exceed threshold.
    Prevents single-reading spikes from triggering false events.
    """
    if len(z_scores) < required_consecutive:
        return False
    recent = z_scores[-required_consecutive:]
    return all(z >= threshold for z in recent)


def check_multi_pollutant_anomaly(
    z_pm25: float,
    z_so2: float,
    pm25_threshold: float = 3.0,
    so2_threshold: float = 2.5,
    combined_threshold: float = 2.0,
) -> tuple[bool, float]:
    """
    Multi-pollutant anomaly check using OR-gate and AND-gate logic:

    OR-gate (high confidence single pollutant):
      - PM2.5 z-score > pm25_threshold
      - SO2   z-score > so2_threshold

    AND-gate (moderate combined signal — catches co-elevation):
      - Both PM2.5 and SO2 z-scores > combined_threshold

    Returns: (is_anomaly, composite_score 0-1)
    """
    pm25_anomaly = z_pm25 >= pm25_threshold
    so2_anomaly  = z_so2  >= so2_threshold
    both_moderate = (z_pm25 >= combined_threshold and z_so2 >= combined_threshold)

    is_anomaly = pm25_anomaly or so2_anomaly or both_moderate

    # Composite score: weighted average of normalized z-scores, capped at 1.0
    composite = min(
        (0.65 * min(z_pm25 / 5.0, 1.0) + 0.35 * min(z_so2 / 4.0, 1.0)),
        1.0
    )
    composite = max(composite, 0.0)

    return is_anomaly, composite
