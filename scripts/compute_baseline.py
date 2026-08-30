"""
compute_baseline.py
-------------------
Reads datasets/TS-PS9-2.csv (actually an xlsx file) and computes empirical
diurnal baselines (per-hour median + MAD) for PM2.5 and SO2.

Output: backend/app/engines/event_detection/baseline_data.json

Run once:
    python scripts/compute_baseline.py
"""

import json
import sys
import os
import pandas as pd
import numpy as np

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
DATASET_PATH = os.path.join(os.path.dirname(__file__), "..", "datasets", "TS-PS9-2.csv")
OUTPUT_PATH  = os.path.join(
    os.path.dirname(__file__), "..",
    "backend", "app", "engines", "event_detection", "baseline_data.json"
)

# ---------------------------------------------------------------------------
# Column name candidates (dataset may use various spellings)
# ---------------------------------------------------------------------------
PM25_CANDIDATES = ["PM2.5", "pm2.5", "PM25", "pm25", "PM_2_5", "PM2_5"]
SO2_CANDIDATES  = ["SO2",  "so2",  "SO_2"]
TIME_CANDIDATES = ["From Date", "Timestamp", "DateTime", "Date", "timestamp", "datetime", "date_time"]


def find_col(df, candidates):
    for c in candidates:
        if c in df.columns:
            return c
    for c in candidates:
        matches = [col for col in df.columns if c.lower() in col.lower()]
        if matches:
            return matches[0]
    return None


def median_absolute_deviation(series):
    """Robust scale estimator: MAD = median(|xi - median(x)|)."""
    med = series.median()
    return (series - med).abs().median()


def main():
    print("Loading dataset:", DATASET_PATH)

    with open(DATASET_PATH, "rb") as f:
        magic = f.read(4)

    if magic[:2] == b"PK":
        print("  Detected xlsx format - data header at row 16, reading with openpyxl")
        # Row 16 (0-indexed) contains: From Date, To Date, PM2.5, PM10, NO, NO2, NOx, SO2, CO
        df = pd.read_excel(DATASET_PATH, engine="openpyxl", skiprows=16)
    else:
        print("  Detected CSV format")
        df = pd.read_csv(DATASET_PATH, encoding="latin-1", low_memory=False)

    print("  Rows:", len(df), "| Columns:", list(df.columns))

    time_col = find_col(df, TIME_CANDIDATES)
    pm25_col = find_col(df, PM25_CANDIDATES)
    so2_col  = find_col(df, SO2_CANDIDATES)

    print("  time col:", time_col, "| pm25 col:", pm25_col, "| so2 col:", so2_col)

    if not time_col:
        print("ERROR: Could not find a timestamp column.")
        sys.exit(1)

    df["_dt"] = pd.to_datetime(df[time_col], errors="coerce", dayfirst=True)
    df = df.dropna(subset=["_dt"])
    df["_hour"] = df["_dt"].dt.hour
    print("  Valid rows after timestamp parse:", len(df))

    baseline = {}

    for hour in range(24):
        subset = df[df["_hour"] == hour]
        n = len(subset)

        if pm25_col and pm25_col in df.columns:
            pm25_vals = pd.to_numeric(subset[pm25_col], errors="coerce").dropna()
            med_pm25 = float(pm25_vals.median()) if len(pm25_vals) > 10 else 55.0
            mad_pm25 = float(median_absolute_deviation(pm25_vals)) if len(pm25_vals) > 10 else 15.0
        else:
            med_pm25, mad_pm25 = 55.0, 15.0

        if so2_col and so2_col in df.columns:
            so2_vals = pd.to_numeric(subset[so2_col], errors="coerce").dropna()
            med_so2 = float(so2_vals.median()) if len(so2_vals) > 10 else 10.0
            mad_so2 = float(median_absolute_deviation(so2_vals)) if len(so2_vals) > 10 else 5.0
        else:
            med_so2, mad_so2 = 10.0, 5.0

        mad_pm25 = max(mad_pm25, 1.0)
        mad_so2  = max(mad_so2,  0.5)

        baseline[str(hour)] = {
            "median_pm25": round(med_pm25, 2),
            "mad_pm25":    round(mad_pm25, 2),
            "median_so2":  round(med_so2, 2),
            "mad_so2":     round(mad_so2, 2),
            "sample_count": int(n),
        }
        print("  Hour %02d: PM2.5 med=%.1f MAD=%.1f | SO2 med=%.1f MAD=%.1f (n=%d)" % (
            hour, med_pm25, mad_pm25, med_so2, mad_so2, n))

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w") as f:
        json.dump(baseline, f, indent=2)

    print("\nBaseline written to:", OUTPUT_PATH)


if __name__ == "__main__":
    main()
