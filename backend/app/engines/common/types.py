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
