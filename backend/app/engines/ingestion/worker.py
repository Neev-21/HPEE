import os
import time
import json
import logging
from datetime import datetime, timezone
import requests
import paho.mqtt.client as mqtt

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# Configuration via Environment Variables
MQTT_BROKER = os.getenv("MQTT_BROKER", "localhost")
MQTT_PORT = int(os.getenv("MQTT_PORT", "1883"))
API_URL = os.getenv("API_URL", "http://localhost:8000/api/v1/sensor/readings")
MQTT_TOPIC = os.getenv("MQTT_TOPIC", "hpee/telemetry/#")

# Mapping hardware values to API schema expectations
UNIT_MAP = {
    "pm25": "ug/m3",
    "pm10": "ug/m3",
    "so2": "ug/m3",
    "temperature": "celsius",
    "humidity": "percent",
    "wind_speed": "m/s",
    "wind_direction": "degrees"
}

def on_connect(client, userdata, flags, reason_code, properties=None):
    if reason_code == 0:
        logger.info(f"Connected to MQTT Broker at {MQTT_BROKER}:{MQTT_PORT}")
        client.subscribe(MQTT_TOPIC)
        logger.info(f"Subscribed to topic: {MQTT_TOPIC}")
    else:
        logger.error(f"Failed to connect, reason code: {reason_code}")

def on_disconnect(client, userdata, flags, reason_code, properties=None):
    logger.warning(f"Disconnected from MQTT Broker with reason code: {reason_code}")

def transform_payload(raw_payload: dict) -> dict:
    """Transforms the flat Arduino payload to the nested API schema."""
    transformed = {
        "node_id": raw_payload.get("node_id", "UNKNOWN_NODE"),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "location": raw_payload.get("location"),
        "measurements": {},
        "node_health": raw_payload.get("node_health", {})
    }
    
    # Transform flat measurements to nested values with units
    raw_measurements = raw_payload.get("measurements", {})
    for key, val in raw_measurements.items():
        if key in UNIT_MAP:
            transformed["measurements"][key] = {
                "value": float(val),
                "unit": UNIT_MAP[key],
                "quality": "valid"
            }
            
    # Set default status if missing from node_health
    if "status" not in transformed["node_health"]:
        transformed["node_health"]["status"] = "online"
        
    return transformed

def on_message(client, userdata, msg):
    try:
        # Decode and parse MQTT message
        raw_data = json.loads(msg.payload.decode('utf-8'))
        logger.info(f"Received MQTT message on {msg.topic}")
        
        # Transform data to match FastAPI schema
        api_payload = transform_payload(raw_data)
        
        # Forward to API
        response = requests.post(API_URL, json=api_payload, timeout=5)
        
        if response.status_code in (200, 201):
            logger.info(f"Successfully ingested telemetry: {response.json()}")
        else:
            logger.error(f"API rejected payload. Status: {response.status_code}, Response: {response.text}")
            
    except json.JSONDecodeError:
        logger.error(f"Invalid JSON payload on topic {msg.topic}: {msg.payload}")
    except requests.RequestException as e:
        logger.error(f"Failed to forward to API (is the backend running?): {e}")
    except Exception as e:
        logger.exception(f"Unexpected error processing message: {e}")

def main():
    logger.info("Starting HPEE Ingestion Worker...")
    
    # Initialize MQTT Client (using v2 callbacks for paho-mqtt >= 2.0.0)
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, "hpee_ingestion_worker")
    client.on_connect = on_connect
    client.on_disconnect = on_disconnect
    client.on_message = on_message
    
    while True:
        try:
            logger.info(f"Connecting to {MQTT_BROKER}:{MQTT_PORT}...")
            client.connect(MQTT_BROKER, MQTT_PORT, 60)
            client.loop_forever()
        except Exception as e:
            logger.error(f"Connection error: {e}. Retrying in 5 seconds...")
            time.sleep(5)

if __name__ == "__main__":
    main()
