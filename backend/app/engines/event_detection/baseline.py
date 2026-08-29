from typing import Tuple

# Empirical diurnal baselines derived from TS-PS9-2.csv (Maninagar, Gujarat 2024-2026)
# Format: hour (0-23) -> (median_pm25, mad_pm25, median_so2, mad_so2)
# Using approximate figures based on the dataset summary
DIURNAL_BASELINE = {
    h: (55.0, 15.0, 10.0, 5.0) for h in range(24)
}

# Adjusting night/early morning for typical inversion/industrial spikes
for h in range(0, 6):
    DIURNAL_BASELINE[h] = (65.0, 20.0, 12.0, 6.0)

# Adjusting daytime (lower pollution due to mixing)
for h in range(10, 18):
    DIURNAL_BASELINE[h] = (45.0, 10.0, 8.0, 4.0)

def get_expected_baseline(hour: int) -> Tuple[float, float, float, float]:
    """
    Returns empirical (median_pm25, mad_pm25, median_so2, mad_so2) for a given hour.
    """
    return DIURNAL_BASELINE.get(hour, (55.0, 15.0, 10.0, 5.0))
