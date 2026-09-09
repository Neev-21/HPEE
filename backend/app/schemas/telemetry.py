from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional


class LocationSchema(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    altitude: Optional[float] = None


class BaseMeasurementSchema(BaseModel):
    value: float
    unit: str
    quality: str = "valid"

class PM25Schema(BaseMeasurementSchema):
    value: float = Field(..., ge=0)

class PM10Schema(BaseMeasurementSchema):
    value: float = Field(..., ge=0)

class SO2Schema(BaseMeasurementSchema):
    value: float = Field(..., ge=0)

class NOXSchema(BaseMeasurementSchema):
    value: float = Field(..., ge=0)

class NO2Schema(BaseMeasurementSchema):
    value: float = Field(..., ge=0)

class COSchema(BaseMeasurementSchema):
    value: float = Field(..., ge=0)

class CO2Schema(BaseMeasurementSchema):
    value: float = Field(..., ge=0)

class WindSpeedSchema(BaseMeasurementSchema):
    value: float = Field(..., ge=0)

class HumiditySchema(BaseMeasurementSchema):
    value: float = Field(..., ge=0, le=100)

class WindDirectionSchema(BaseMeasurementSchema):
    value: float = Field(..., ge=0, lt=360)
    cardinal: Optional[str] = None

class MeasurementsBlockSchema(BaseModel):
    pm25: Optional[PM25Schema] = None
    pm10: Optional[PM10Schema] = None
    so2: Optional[SO2Schema] = None
    nox: Optional[NOXSchema] = None
    no2: Optional[NO2Schema] = None
    co: Optional[COSchema] = None
    co2: Optional[CO2Schema] = None
    temperature: Optional[BaseMeasurementSchema] = None
    humidity: Optional[HumiditySchema] = None
    wind_speed: Optional[WindSpeedSchema] = None
    wind_direction: Optional[WindDirectionSchema] = None


class NodeHealthSchema(BaseModel):
    battery_voltage: Optional[float] = None
    battery_percent: float = Field(..., ge=0, le=100)
    signal_strength: Optional[int] = None
    status: str = "online"


class TelemetryIngestRequest(BaseModel):
    node_id: str
    timestamp: datetime
    location: Optional[LocationSchema] = None
    measurements: MeasurementsBlockSchema
    node_health: NodeHealthSchema


class TelemetryIngestResponse(BaseModel):
    status: str
    reading_id: int
    node_id: str
    received_at: datetime
