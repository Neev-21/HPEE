import pandas as pd
from typing import List, Dict

def load_dataset(file_path: str) -> pd.DataFrame:
    """
    Loads the CPCB Excel dataset and standardizes columns.
    """
    df = pd.read_excel(file_path, skiprows=16) # Skip metadata header rows based on previous analysis
    # Assuming columns: From_Date, To_Date, PM2.5, PM10, NO, NO2, NOx, SO2, CO
    df = df.rename(columns={
        "From Date": "timestamp",
        "PM2.5": "pm25",
        "PM10": "pm10",
        "SO2": "so2",
        "NOx": "nox",
        "NO": "no",
        "NO2": "no2",
        "CO": "co"
    })
    
    # Clean 'None' strings to actual None/NaN
    df = df.replace('None', None)
    
    # Parse timestamps
    df['timestamp'] = pd.to_datetime(df['timestamp'], format="%d-%m-%Y %H:%M")
    
    return df

def extract_scenario(df: pd.DataFrame, mode: str) -> List[Dict]:
    """
    Extracts a time slice based on the mode.
    modes: 'normal', 'industrial_surge'
    """
    if mode == "industrial_surge":
        # Find a period with high PM2.5 and SO2
        surge_idx = df[(df['pm25'] > 80) & (df['so2'].notna())].index.min()
        if pd.isna(surge_idx):
            surge_idx = 0
    else:
        surge_idx = 0
        
    slice_df = df.iloc[surge_idx:surge_idx+20] # Take 20 rows
    
    payloads = []
    for _, row in slice_df.iterrows():
        payloads.append({
            "timestamp": row["timestamp"].isoformat() + "Z",
            "pm25": row["pm25"] if pd.notna(row["pm25"]) else None,
            "pm10": row["pm10"] if pd.notna(row["pm10"]) else None,
            "so2": row["so2"] if pd.notna(row["so2"]) else None,
            "nox": row["nox"] if pd.notna(row["nox"]) else None,
            "no": row["no"] if pd.notna(row["no"]) else None,
            "no2": row["no2"] if pd.notna(row["no2"]) else None,
            "co": row["co"] if pd.notna(row["co"]) else None,
        })
    return payloads
