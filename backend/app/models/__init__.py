"""HPEE Database Models Package

All 19 approved models are exposed here to register with Base.metadata.
"""

from backend.app.db.base import Base, TimestampMixin
from backend.app.models.user import User
from backend.app.models.geography import Village, WeatherObservation
from backend.app.models.sensor import SensorNode, SensorConfiguration, SensorReading
from backend.app.models.pollution_event import PollutionEvent, EventReading
from backend.app.models.industry import IndustrialSite, IndustrialActivity
from backend.app.models.evidence import (
    EventClassification,
    SourceAttribution,
    EvidenceRecord,
    EvidenceSnapshot,
)
from backend.app.models.complaint import Complaint, ComplaintDocument
from backend.app.models.ops import Notification, MaintenanceRecord, AuditLog

__all__ = [
    "Base",
    "TimestampMixin",
    "User",
    "Village",
    "WeatherObservation",
    "SensorNode",
    "SensorConfiguration",
    "SensorReading",
    "PollutionEvent",
    "EventReading",
    "IndustrialSite",
    "IndustrialActivity",
    "EventClassification",
    "SourceAttribution",
    "EvidenceRecord",
    "EvidenceSnapshot",
    "Complaint",
    "ComplaintDocument",
    "Notification",
    "MaintenanceRecord",
    "AuditLog",
]
