"""
pollutant_match.py
------------------
Calculates how well the detected pollutant mix matches an industry's
emission profile using cosine similarity.

Emission profiles are stored per IndustrialSite as JSON:
    {"so2": 0.9, "nox": 0.4, "pm25": 0.7, "co": 0.2, "no2": 0.3}

Each value is a 0-1 relative intensity (1.0 = primary emitter of that gas).
"""

import math
from typing import Optional


# Canonical pollutant order — used as vector dimensions
POLLUTANT_KEYS = ["so2", "nox", "pm25", "co", "no2"]

# Normalisation thresholds: readings above these are considered "high" (maps to ~1.0)
# Based on Indian NAAQS / GSPCB standards
_NORM_THRESHOLDS = {
    "so2":  100.0,   # µg/m³ 24h standard = 80; spike threshold ~100
    "nox":  120.0,   # combined NOx
    "pm25": 150.0,   # NAAQS 24h = 60; spike ~150
    "co":   4.0,     # ppm; 8h standard = 2ppm; spike ~4
    "no2":  80.0,    # µg/m³ annual = 40; spike ~80
}


def _normalise_reading(reading: dict) -> list[float]:
    """
    Converts a raw reading dict into a normalised 0-1 vector.
    Keys: so2, nox, pm25, co, no2  (all optional; missing → 0.0)
    """
    vec = []
    for key in POLLUTANT_KEYS:
        raw = reading.get(key) or 0.0
        threshold = _NORM_THRESHOLDS[key]
        vec.append(min(raw / threshold, 1.0))
    return vec


def _normalise_profile(profile: dict) -> list[float]:
    """
    Converts an emission profile dict into a 0-1 vector.
    Profile values are already 0-1 intensities — just extract in canonical order.
    """
    return [float(profile.get(key, 0.0)) for key in POLLUTANT_KEYS]


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    """Standard cosine similarity between two vectors."""
    dot = sum(x * y for x, y in zip(a, b))
    mag_a = math.sqrt(sum(x * x for x in a))
    mag_b = math.sqrt(sum(y * y for y in b))
    if mag_a == 0 or mag_b == 0:
        return 0.0
    return dot / (mag_a * mag_b)


def calculate_pollutant_match_score(
    detected_reading: dict,
    industry_emission_profile: Optional[dict],
) -> float:
    """
    Calculates how well the detected air quality readings match an
    industry's known emission profile.

    Args:
        detected_reading: dict with keys so2, nox, pm25, co, no2 (raw sensor values)
        industry_emission_profile: dict with keys so2, nox, pm25, co, no2 (0-1 intensity)

    Returns:
        float: 0.0 (no match) to 1.0 (perfect match)
        Falls back to 0.5 (neutral) if no profile is available.
    """
    if not industry_emission_profile:
        return 0.5  # Neutral — no profile data available

    detected_vec = _normalise_reading(detected_reading)
    profile_vec  = _normalise_profile(industry_emission_profile)

    score = _cosine_similarity(detected_vec, profile_vec)

    # Clamp to [0, 1] (cosine is already [-1, 1] but our vectors are all ≥ 0)
    return max(0.0, min(score, 1.0))


def build_pollutant_explanation(
    score: float,
    detected_reading: dict,
    industry_name: str,
) -> str:
    """
    Returns a human-readable explanation of the pollutant match.
    """
    if score >= 0.8:
        quality = "Strong"
    elif score >= 0.6:
        quality = "Moderate"
    elif score >= 0.4:
        quality = "Weak"
    else:
        quality = "Poor"

    so2_val  = detected_reading.get("so2",  None)
    pm25_val = detected_reading.get("pm25", None)
    nox_val  = detected_reading.get("nox",  None)

    parts = []
    if so2_val:
        parts.append("SO2=%.1f ppb" % so2_val)
    if pm25_val:
        parts.append("PM2.5=%.1f ug/m3" % pm25_val)
    if nox_val:
        parts.append("NOx=%.1f ppb" % nox_val)

    detected_str = ", ".join(parts) if parts else "no pollutant data"
    return "%s pollutant match (%.0f%%) with %s. Detected: %s." % (
        quality, score * 100, industry_name, detected_str
    )
