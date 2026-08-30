from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime

class EventContext(BaseModel):
    event_id: UUID
    start_time: datetime
    end_time: Optional[datetime] = None
    node_ids: List[str]
    centroid_lat: float
    centroid_lon: float

class AttributionCandidate(BaseModel):
    industry_id: UUID
    name: str
    probability: float
    wind_alignment_score: float
    distance_km: float
    activity_score: float
    pollutant_match_score: float
    data_quality_score: float
    explanation: str

class EvidenceFactor(BaseModel):
    evidence_type: str
    score: float
    description: str
    payload: dict

class ClassificationInput(BaseModel):
    event_id: str
    node_id: str
    timestamp: datetime
    peak_pm25: Optional[float] = None
    peak_pm10: Optional[float] = None
    peak_so2: Optional[float] = None
    peak_nox: Optional[float] = None
    peak_co: Optional[float] = None
    hour_of_day: int
    
    # Extended features for XGBoost model
    peak_no2: Optional[float] = None
    wind_speed: Optional[float] = None
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    month: Optional[int] = 1
    day_of_week: Optional[int] = 0
    is_weekend: Optional[bool] = False

class ClassificationOutput(BaseModel):
    classification_type: str
    confidence_score: float
    features_used: dict
