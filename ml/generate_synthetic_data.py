"""
generate_synthetic_data.py
--------------------------
Generates a synthetic labeled dataset for training the HPEE pollution
classification model (XGBoost).

Output: datasets/pollution_classification_synthetic.csv (~10,000 rows)

Each row represents a 15-minute sensor measurement window with:
  - Environmental features (PM2.5, PM10, SO2, NOx, CO, wind_speed, etc.)
  - Temporal features (hour, month, day_of_week, is_weekend)
  - Derived features (pm_ratio, nox_so2_ratio)
  - Target label (industrial / agricultural_burning / vehicular / seasonal_inversion / unknown)

Reproduc reproducible: uses fixed random seed = 42
"""

import os
import numpy as np
import pandas as pd

SEED  = 42
N_PER_CLASS = 2000  # 5 classes x 2000 = 10,000 rows
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "datasets", "pollution_classification_synthetic.csv")

rng = np.random.default_rng(SEED)


def noise(size, sigma):
    """Gaussian noise with given std dev."""
    return rng.normal(0, sigma, size)


def uniform(size, low, high):
    return rng.uniform(low, high, size)


def randint(size, low, high):
    return rng.integers(low, high, size)


# ---------------------------------------------------------------------------
# 1. INDUSTRIAL
#    High SO2, elevated PM2.5, night/early morning, low-moderate wind
# ---------------------------------------------------------------------------
def gen_industrial(n):
    hour = rng.choice(list(range(22, 24)) + list(range(0, 7)), size=n)
    month = rng.integers(1, 13, size=n)
    dow   = rng.integers(0, 7, size=n)
    pm25  = rng.normal(160, 30, n).clip(80, 400) + noise(n, 15)
    pm10  = pm25 * rng.uniform(1.1, 1.5, n) + noise(n, 20)
    so2   = rng.normal(75, 20, n).clip(40, 200)  + noise(n, 10)
    nox   = rng.normal(35, 12, n).clip(10, 100)  + noise(n, 8)
    no2   = nox * rng.uniform(0.5, 0.8, n) + noise(n, 3)
    co    = rng.normal(0.8, 0.3, n).clip(0.1, 3.0) + noise(n, 0.1)
    wind  = rng.uniform(0.5, 4.0, n)
    temp  = rng.normal(28, 5, n)
    humid = rng.normal(65, 15, n).clip(20, 100)
    return hour, month, dow, pm25, pm10, so2, nox, no2, co, wind, temp, humid


# ---------------------------------------------------------------------------
# 2. AGRICULTURAL BURNING
#    Very high PM10 + PM2.5, low SO2, harvest months (Oct-Dec, Mar-Apr), daytime
# ---------------------------------------------------------------------------
def gen_agricultural(n):
    hour  = rng.choice(list(range(9, 19)), size=n)
    month = rng.choice([10, 11, 12, 3, 4], size=n)
    dow   = rng.integers(0, 7, size=n)
    pm10  = rng.normal(280, 60, n).clip(150, 600) + noise(n, 30)
    pm25  = pm10 * rng.uniform(0.4, 0.7, n) + noise(n, 15)
    so2   = rng.normal(8, 4, n).clip(1, 20) + noise(n, 2)
    nox   = rng.normal(20, 8, n).clip(5, 60) + noise(n, 5)
    no2   = nox * rng.uniform(0.4, 0.7, n) + noise(n, 2)
    co    = rng.normal(1.8, 0.6, n).clip(0.5, 5.0) + noise(n, 0.2)
    wind  = rng.uniform(1.0, 5.0, n)
    temp  = rng.normal(32, 5, n)
    humid = rng.normal(45, 15, n).clip(15, 85)
    return hour, month, dow, pm25, pm10, so2, nox, no2, co, wind, temp, humid


# ---------------------------------------------------------------------------
# 3. VEHICULAR
#    High NOx + CO, moderate PM, rush hours (7-10 AM, 5-8 PM), low SO2
# ---------------------------------------------------------------------------
def gen_vehicular(n):
    hour  = rng.choice(list(range(7, 11)) + list(range(17, 21)), size=n)
    month = rng.integers(1, 13, size=n)
    dow   = rng.choice([0, 1, 2, 3, 4], size=n)  # mostly weekdays
    pm25  = rng.normal(75, 20, n).clip(30, 160) + noise(n, 10)
    pm10  = pm25 * rng.uniform(1.3, 2.0, n) + noise(n, 15)
    so2   = rng.normal(6, 3, n).clip(0.5, 15) + noise(n, 1)
    nox   = rng.normal(90, 25, n).clip(50, 200) + noise(n, 10)
    no2   = nox * rng.uniform(0.5, 0.75, n) + noise(n, 5)
    co    = rng.normal(2.5, 0.8, n).clip(1.0, 6.0) + noise(n, 0.2)
    wind  = rng.uniform(0.5, 3.0, n)
    temp  = rng.normal(30, 5, n)
    humid = rng.normal(55, 15, n).clip(20, 90)
    return hour, month, dow, pm25, pm10, so2, nox, no2, co, wind, temp, humid


# ---------------------------------------------------------------------------
# 4. SEASONAL INVERSION
#    Broad PM rise, very low wind, morning hours (5-10), low SO2 + NOx
# ---------------------------------------------------------------------------
def gen_inversion(n):
    hour  = rng.choice(list(range(5, 11)), size=n)
    month = rng.choice([11, 12, 1, 2], size=n)  # winter months
    dow   = rng.integers(0, 7, size=n)
    pm25  = rng.normal(95, 25, n).clip(50, 200) + noise(n, 10)
    pm10  = pm25 * rng.uniform(1.2, 1.6, n) + noise(n, 15)
    so2   = rng.normal(12, 5, n).clip(3, 30) + noise(n, 3)
    nox   = rng.normal(28, 10, n).clip(5, 60) + noise(n, 5)
    no2   = nox * rng.uniform(0.5, 0.8, n) + noise(n, 3)
    co    = rng.normal(0.9, 0.3, n).clip(0.2, 2.5) + noise(n, 0.1)
    wind  = rng.uniform(0.0, 1.5, n)  # very low wind — key indicator
    temp  = rng.normal(18, 5, n)
    humid = rng.normal(75, 12, n).clip(40, 98)
    return hour, month, dow, pm25, pm10, so2, nox, no2, co, wind, temp, humid


# ---------------------------------------------------------------------------
# 5. UNKNOWN / BACKGROUND
#    Low, ambiguous signal — doesn't fit any category clearly
# ---------------------------------------------------------------------------
def gen_unknown(n):
    hour  = rng.integers(0, 24, size=n)
    month = rng.integers(1, 13, size=n)
    dow   = rng.integers(0, 7, size=n)
    pm25  = rng.normal(40, 15, n).clip(5, 90) + noise(n, 8)
    pm10  = pm25 * rng.uniform(1.0, 1.8, n) + noise(n, 10)
    so2   = rng.normal(8, 4, n).clip(0.5, 25) + noise(n, 2)
    nox   = rng.normal(20, 10, n).clip(2, 55) + noise(n, 5)
    no2   = nox * rng.uniform(0.4, 0.8, n) + noise(n, 2)
    co    = rng.normal(0.5, 0.2, n).clip(0.05, 1.5) + noise(n, 0.05)
    wind  = rng.uniform(1.0, 8.0, n)
    temp  = rng.normal(29, 7, n)
    humid = rng.normal(60, 18, n).clip(15, 98)
    return hour, month, dow, pm25, pm10, so2, nox, no2, co, wind, temp, humid


# ---------------------------------------------------------------------------
# Build DataFrame
# ---------------------------------------------------------------------------
def build_df(gen_func, label, n):
    hour, month, dow, pm25, pm10, so2, nox, no2, co, wind, temp, humid = gen_func(n)
    pm_ratio    = np.where(pm10 > 0, pm25 / pm10, 0.5)
    nox_so2     = np.where(so2 > 0, nox / so2, 5.0)
    is_weekend  = (dow >= 5).astype(int)
    return pd.DataFrame({
        "hour":          hour.astype(int),
        "month":         month.astype(int),
        "day_of_week":   dow.astype(int),
        "is_weekend":    is_weekend,
        "pm25":          pm25.round(2),
        "pm10":          pm10.round(2),
        "so2":           so2.round(2),
        "nox":           nox.round(2),
        "no2":           no2.round(2),
        "co":            co.round(3),
        "wind_speed":    wind.round(2),
        "temperature":   temp.round(1),
        "humidity":      humid.round(1),
        "pm_ratio":      pm_ratio.round(3),
        "nox_so2_ratio": nox_so2.round(3),
        "label":         label,
    })


def main():
    print("Generating synthetic pollution classification dataset...")
    frames = [
        build_df(gen_industrial,  "industrial",           N_PER_CLASS),
        build_df(gen_agricultural,"agricultural_burning", N_PER_CLASS),
        build_df(gen_vehicular,   "vehicular",            N_PER_CLASS),
        build_df(gen_inversion,   "seasonal_inversion",   N_PER_CLASS),
        build_df(gen_unknown,     "unknown",              N_PER_CLASS),
    ]

    df = pd.concat(frames, ignore_index=True)
    # Shuffle
    df = df.sample(frac=1, random_state=SEED).reset_index(drop=True)

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    df.to_csv(OUTPUT_PATH, index=False)

    print("Total rows:", len(df))
    print("Label distribution:")
    print(df["label"].value_counts().to_string())
    print("\nSample (industrial):")
    print(df[df["label"] == "industrial"].head(3).to_string())
    print("\nDataset saved to:", OUTPUT_PATH)


if __name__ == "__main__":
    main()
