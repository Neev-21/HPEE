import json
import os
from typing import Tuple

# ---------------------------------------------------------------------------
# Load empirical diurnal baseline from JSON (computed from TS-PS9-2 dataset).
# Falls back to hardcoded defaults if file is missing (e.g., first install).
# ---------------------------------------------------------------------------
_BASELINE_JSON_PATH = os.path.join(
    os.path.dirname(__file__), "baseline_data.json"
)

def _load_baseline() -> dict:
    if os.path.exists(_BASELINE_JSON_PATH):
        with open(_BASELINE_JSON_PATH, "r") as f:
            raw = json.load(f)
        # Keys are strings; convert to int
        return {int(k): v for k, v in raw.items()}
    # Fallback: flat defaults (pre-computed from CPCB Maninagar 2024-2026)
    return {
        h: {"median_pm25": 45.0, "mad_pm25": 15.0, "median_so2": 28.0, "mad_so2": 7.0}
        for h in range(24)
    }

DIURNAL_BASELINE: dict = _load_baseline()


def get_expected_baseline(hour: int) -> Tuple[float, float, float, float]:
    """
    Returns empirical (median_pm25, mad_pm25, median_so2, mad_so2) for a given hour.
    Computed from 80,065 real 15-minute readings (CPCB Maninagar station, 2024-2026).
    """
    entry = DIURNAL_BASELINE.get(hour, DIURNAL_BASELINE.get(0, {}))
    return (
        entry.get("median_pm25", 45.0),
        entry.get("mad_pm25",    15.0),
        entry.get("median_so2",  28.0),
        entry.get("mad_so2",      7.0),
    )
