from unittest.mock import patch
import pytest

def test_send_alert(client):
    with patch("backend.app.api.v1.notifications.dispatch_pollution_alert") as mock_dispatch:
        class MockNotification:
            notification_id = "test-notification-id"
            recipient_contact = "+919876543210"
            title = "Test Alert"
            status = "sent"
            
        mock_dispatch.return_value = [MockNotification()]
        
        payload = {
            "event_id": "test-event-id",
            "channel": "whatsapp",
            "lang": "gu"
        }
        
        response = client.post("/api/v1/notifications/send-alert", json=payload)
        
        assert response.status_code == 201
        data = response.json()
        assert data["status"] == "success"
        assert data["dispatched_count"] == 1
        assert data["notifications"][0]["notification_id"] == "test-notification-id"

def test_send_alert_validation_error(client):
    with patch("backend.app.api.v1.notifications.dispatch_pollution_alert") as mock_dispatch:
        mock_dispatch.side_effect = ValueError("Event not found")
        
        payload = {
            "event_id": "missing-event-id",
            "channel": "sms",
            "lang": "en"
        }
        
        response = client.post("/api/v1/notifications/send-alert", json=payload)
        
        assert response.status_code == 400
        assert response.json()["detail"] == "Event not found"

def test_list_event_alerts(client):
    with patch("backend.app.api.v1.notifications.get_event_notifications") as mock_get:
        mock_get.return_value = []
        
        response = client.get("/api/v1/notifications/event/test-event-id")
        
        assert response.status_code == 200
        assert response.json() == []
