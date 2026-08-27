from typing import Optional

def calculate_robust_z_score(value: Optional[float], median: float, mad: float) -> float:
    """
    Calculates robust z-score: (value - median) / MAD
    Returns 0.0 if value is None or MAD is 0.
    """
    if value is None or mad <= 0:
        return 0.0
    return (value - median) / mad

def check_anomaly_persistence(z_scores: list[float], threshold: float = 3.0, required_consecutive: int = 3) -> bool:
    """
    Returns True if the required number of consecutive recent readings exceed the threshold.
    """
    if len(z_scores) < required_consecutive:
        return False
        
    recent = z_scores[-required_consecutive:]
    return all(z > threshold for z in recent)
