"""Notifications and Citizen Alerts API endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional
from sqlalchemy.orm import Session

from backend.app.db.session import get_db
from backend.app.engines.notification.service import (
    dispatch_pollution_alert,
    get_event_notifications,
)

router = APIRouter()


class SendAlertRequest(BaseModel):
    event_id: str = Field(..., description="UUID of the pollution event")
    channel: str = Field("whatsapp", description="Dispatch channel: whatsapp or sms")
    lang: str = Field("gu", description="Alert language: gu (Gujarati), hi (Hindi), en (English)")


@router.post("/send-alert", status_code=status.HTTP_201_CREATED, summary="Dispatch multilingual pollution alert to Sarpanch and citizens")
def send_alert(payload: SendAlertRequest, db: Session = Depends(get_db)):
    try:
        notifications = dispatch_pollution_alert(
            db=db,
            event_id=payload.event_id,
            channel=payload.channel,
            lang=payload.lang,
        )
        return {
            "status": "success",
            "dispatched_count": len(notifications),
            "channel": payload.channel,
            "language": payload.lang,
            "notifications": [
                {
                    "notification_id": str(n.notification_id),
                    "recipient_contact": n.recipient_contact,
                    "title": n.title,
                    "status": n.status,
                }
                for n in notifications
            ],
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Alert dispatch error: {e}")


@router.get("/event/{event_id}", summary="Get all alert notifications dispatched for an event")
def list_event_alerts(event_id: str, db: Session = Depends(get_db)):
    return get_event_notifications(db, event_id)
