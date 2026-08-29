import argparse
import requests
import time
from simulator.loader import load_dataset, extract_scenario

def run_simulator(file_path: str, mode: str, node_id: str, api_url: str):
    print(f"Loading dataset from {file_path}...")
    df = load_dataset(file_path)
    
    print(f"Extracting scenario: {mode}...")
    payloads = extract_scenario(df, mode)
    
    print(f"Starting replay of {len(payloads)} readings to {api_url} for node {node_id}...")
    
    for payload in payloads:
        # Wrap in the TelemetryIngest format expected by the API
        body = {
            "node_id": node_id,
            "timestamp": payload["timestamp"],
            "node_health": {
                "battery_percent": 95,
                "signal_strength": -65,
                "status": "active"
            },
            "measurements": {
                "pm25": {"value": payload["pm25"], "unit": "ug/m3"} if payload["pm25"] is not None else None,
                "so2": {"value": payload["so2"], "unit": "ppb"} if payload["so2"] is not None else None
            },
            "status": "active"
        }
        
        try:
            resp = requests.post(f"{api_url}/api/v1/sensor/readings", json=body)
            if resp.status_code == 201:
                print(f"[{payload['timestamp']}] Successfully ingested. PM2.5: {payload['pm25']}")
            else:
                print(f"[{payload['timestamp']}] Failed: {resp.status_code} {resp.text}")
        except Exception as e:
            print(f"Error connecting to API: {e}")
            
        time.sleep(1.0) # 1 second per reading

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="HPEE Telemetry Simulator")
    parser.add_argument("--file", default="datasets/TS-PS9-2.csv", help="Path to TS-PS9-2 dataset")
    parser.add_argument("--mode", default="normal", choices=["normal", "industrial_surge"], help="Scenario to replay")
    parser.add_argument("--node", default="HPEE-ANK-001", help="Target Node ID")
    parser.add_argument("--url", default="http://localhost:8000", help="API Base URL")
    
    args = parser.parse_args()
    
    run_simulator(args.file, args.mode, args.node, args.url)
