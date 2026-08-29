import math
from typing import List

def calculate_angular_error(source_bearing: float, wind_dir: float) -> float:
    """Calculates the absolute shortest angular difference between two bearings."""
    diff = abs(source_bearing - wind_dir)
    return min(diff, 360.0 - diff)

def calculate_wind_alignment_score(angular_error: float) -> float:
    """
    Converts angular error into a 0-1 score using cosine.
    0 error = 1.0 (perfect alignment).
    90+ error = 0.0 (crosswind or upwind).
    """
    if angular_error >= 90.0:
        return 0.0
    return max(0.0, math.cos(math.radians(angular_error)))

def calculate_distance_score(distance_km: float, max_radius_km: float) -> float:
    """
    Converts distance to a 0-1 score, where 0km = 1.0 and max_radius_km = 0.0.
    Using a linear decay for simplicity and explainability.
    """
    if distance_km >= max_radius_km:
        return 0.0
    return max(0.0, 1.0 - (distance_km / max_radius_km))

def normalize_probabilities(scores: List[float]) -> List[float]:
    """Softmax or linear normalization to convert raw scores into probabilities summing to 1."""
    total = sum(scores)
    if total == 0:
        return [1.0 / len(scores) if len(scores) > 0 else 0.0 for _ in scores]
    return [score / total for score in scores]
