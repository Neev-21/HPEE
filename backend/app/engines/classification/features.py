from typing import Optional

def calculate_pm_ratio(pm25: Optional[float], pm10: Optional[float]) -> Optional[float]:
    """
    Returns PM2.5 / PM10 ratio.
    High (>0.6) = combustion / fine particulates.
    Low (<0.4) = mechanical dust / construction.
    """
    if pm25 is None or pm10 is None or pm10 <= 0:
        return None
    return pm25 / pm10

def calculate_nox_so2_ratio(nox: Optional[float], so2: Optional[float]) -> Optional[float]:
    """
    Returns NOx / SO2 ratio.
    High NOx, Low SO2 -> Vehicular.
    High SO2 -> Chemical / Industrial boiler.
    """
    if nox is None or so2 is None or so2 <= 0:
        return None
    return nox / so2
