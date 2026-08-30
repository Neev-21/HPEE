from typing import Optional


def calculate_pm_ratio(pm25: Optional[float], pm10: Optional[float]) -> Optional[float]:
    """
    PM2.5 / PM10 ratio.
    High (>0.6) = combustion / fine particulates.
    Low (<0.4)  = mechanical dust / construction.
    """
    if pm25 is None or pm10 is None or pm10 <= 0:
        return None
    return pm25 / pm10


def calculate_nox_so2_ratio(nox: Optional[float], so2: Optional[float]) -> Optional[float]:
    """
    NOx / SO2 ratio.
    High NOx, Low SO2  -> Vehicular.
    High SO2           -> Chemical / Industrial boiler.
    """
    if nox is None or so2 is None or so2 <= 0:
        return None
    return nox / so2


def extract_feature_vector(
    pm25: Optional[float],
    pm10: Optional[float],
    so2:  Optional[float],
    nox:  Optional[float],
    no2:  Optional[float],
    co:   Optional[float],
    wind_speed: Optional[float],
    temperature: Optional[float],
    humidity: Optional[float],
    hour_of_day: int,
    month: int,
    day_of_week: int,
    is_weekend: bool,
) -> list:
    """
    Builds the feature vector used by the XGBoost classifier.
    Must match the exact column order in pollution_classification_synthetic.csv:

        hour, month, day_of_week, is_weekend,
        pm25, pm10, so2, nox, no2, co,
        wind_speed, temperature, humidity,
        pm_ratio, nox_so2_ratio

    Missing values are filled with safe defaults.
    """
    _pm25  = pm25  or 40.0
    _pm10  = pm10  or 60.0
    _so2   = so2   or 10.0
    _nox   = nox   or 20.0
    _no2   = no2   or 15.0
    _co    = co    or 0.5
    _wind  = wind_speed  or 3.0
    _temp  = temperature or 28.0
    _humid = humidity    or 65.0

    _pm_ratio    = (_pm25 / _pm10) if _pm10 > 0 else 0.5
    _nox_so2     = (_nox  / _so2)  if _so2  > 0 else 2.0
    _is_weekend  = int(is_weekend)

    return [
        hour_of_day, month, day_of_week, _is_weekend,
        _pm25, _pm10, _so2, _nox, _no2, _co,
        _wind, _temp, _humid,
        _pm_ratio, _nox_so2,
    ]
