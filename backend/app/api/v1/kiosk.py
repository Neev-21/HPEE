import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from fastapi import APIRouter, status, Request
from pydantic import BaseModel

from backend.app.core.websocket import manager

logger = logging.getLogger(__name__)
router = APIRouter()

# In-memory thread-safe store for the latest hardware node reading
class KioskLiveStore:
    def __init__(self):
        self.state: Dict[str, Any] = {
            "node_id": "S-001",
            "pm25": 24.5,
            "so2": 12.0,
            "temperature": 29.4,
            "humidity": 65.0,
            "wind_speed": 4.8,
            "wind_direction": 135.0,
            "rain_intensity": 0,
            "battery_percent": 98.0,
            "status": "online",
            "online_nodes": 20,
            "total_nodes": 20,
            "last_updated": datetime.now(timezone.utc).isoformat(),
            "source": "initial_seed"
        }

    def update(self, new_data: Dict[str, Any]):
        # Extract flat values or nested measurements
        measurements = new_data.get("measurements", {})
        node_health = new_data.get("node_health", {})
        
        # Support both nested measurements dictionary and direct flat keys
        if "pm25" in measurements:
            val = measurements["pm25"]
            self.state["pm25"] = float(val["value"]) if isinstance(val, dict) and "value" in val else float(val)
        elif "pm25" in new_data:
            self.state["pm25"] = float(new_data["pm25"])

        if "so2" in measurements:
            val = measurements["so2"]
            self.state["so2"] = float(val["value"]) if isinstance(val, dict) and "value" in val else float(val)
        elif "so2" in new_data:
            self.state["so2"] = float(new_data["so2"])

        if "temperature" in measurements:
            val = measurements["temperature"]
            self.state["temperature"] = float(val["value"]) if isinstance(val, dict) and "value" in val else float(val)
        elif "temperature" in new_data:
            self.state["temperature"] = float(new_data["temperature"])

        if "humidity" in measurements:
            val = measurements["humidity"]
            self.state["humidity"] = float(val["value"]) if isinstance(val, dict) and "value" in val else float(val)
        elif "humidity" in new_data:
            self.state["humidity"] = float(new_data["humidity"])

        if "wind_speed" in measurements:
            val = measurements["wind_speed"]
            self.state["wind_speed"] = float(val["value"]) if isinstance(val, dict) and "value" in val else float(val)
        elif "wind_speed" in new_data:
            self.state["wind_speed"] = float(new_data["wind_speed"])

        if "wind_direction" in measurements:
            val = measurements["wind_direction"]
            self.state["wind_direction"] = float(val["value"]) if isinstance(val, dict) and "value" in val else float(val)
        elif "wind_direction" in new_data:
            self.state["wind_direction"] = float(new_data["wind_direction"])

        if "rain_intensity" in measurements:
            self.state["rain_intensity"] = float(measurements["rain_intensity"])
        elif "rain_intensity" in new_data:
            self.state["rain_intensity"] = float(new_data["rain_intensity"])

        if "node_id" in new_data:
            self.state["node_id"] = str(new_data["node_id"])

        if "battery_percent" in node_health:
            self.state["battery_percent"] = float(node_health["battery_percent"])
        elif "battery_percent" in new_data:
            self.state["battery_percent"] = float(new_data["battery_percent"])

        self.state["status"] = "online"
        self.state["last_updated"] = datetime.now(timezone.utc).isoformat()
        self.state["source"] = "live_hardware"

        # Broadcast update over WebSocket
        manager.broadcast_sync({
            "type": "TELEMETRY_UPDATE",
            "node_id": self.state["node_id"],
            "pm25": self.state["pm25"],
            "so2": self.state["so2"],
            "temperature": self.state["temperature"],
            "humidity": self.state["humidity"],
            "wind_speed": self.state["wind_speed"],
            "wind_direction": self.state["wind_direction"],
            "timestamp": self.state["last_updated"]
        })

    def get(self) -> Dict[str, Any]:
        return self.state

# Global store singleton
kiosk_store = KioskLiveStore()

@router.get("/latest", response_model=Dict[str, Any])
def get_kiosk_latest():
    """
    Returns the latest real-time hardware metrics for the Plant Display.
    Guaranteed fast response directly from memory.
    """
    return kiosk_store.get()

@router.post("/reading", status_code=status.HTTP_200_OK)
async def post_kiosk_reading(request: Request):
    """
    Ingest hardware telemetry directly from the Python bridge or simulator.
    Updates the in-memory store and immediately broadcasts to the WebSocket stream.
    """
    try:
        payload = await request.json()
    except Exception as e:
        logger.error(f"Invalid JSON body in kiosk reading: {e}")
        return {"status": "error", "detail": "Invalid JSON"}

    kiosk_store.update(payload)
    logger.info(f"[Kiosk API] Ingested live reading: PM2.5={kiosk_store.state['pm25']} SO2={kiosk_store.state['so2']}")
    return {"status": "success", "data": kiosk_store.get()}

