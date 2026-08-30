from unittest.mock import patch
import pytest

def test_create_complaint_success(client):
    with patch("backend.app.api.v1.complaints.generate_complaint_for_event") as mock_generate, \
         patch("backend.app.api.v1.complaints.get_complaint_details") as mock_get_details:
        
        # Setup mocks
        class MockComplaint:
            complaint_id = "test-complaint-id"
        mock_generate.return_value = MockComplaint()
        mock_get_details.return_value = {"status": "generated", "id": "test-complaint-id"}
        
        payload = {
            "event_id": "test-event-id",
            "filed_by_user_id": "test-user-id"
        }
        
        response = client.post("/api/v1/complaints/generate", json=payload)
        
        assert response.status_code == 201
        assert response.json() == {"status": "generated", "id": "test-complaint-id"}
        mock_generate.assert_called_once()
        mock_get_details.assert_called_once()

def test_create_complaint_validation_error(client):
    with patch("backend.app.api.v1.complaints.generate_complaint_for_event") as mock_generate:
        mock_generate.side_effect = ValueError("Event not found")
        
        payload = {
            "event_id": "missing-event-id"
        }
        
        response = client.post("/api/v1/complaints/generate", json=payload)
        
        assert response.status_code == 400
        assert response.json()["detail"] == "Event not found"

def test_submit_complaint(client):
    with patch("backend.app.api.v1.complaints.submit_complaint_to_gspcb") as mock_submit, \
         patch("backend.app.api.v1.complaints.get_complaint_details") as mock_get_details:
         
        class MockComplaint:
            complaint_id = "test-complaint-id"
        mock_submit.return_value = MockComplaint()
        mock_get_details.return_value = {"status": "submitted"}
        
        payload = {
            "submission_reference": "GSPCB-REF-123"
        }
        
        response = client.post("/api/v1/complaints/test-complaint-id/submit", json=payload)
        
        assert response.status_code == 200
        assert response.json() == {"status": "submitted"}
        mock_submit.assert_called_once()
        mock_get_details.assert_called_once()

def test_get_complaint(client):
    with patch("backend.app.api.v1.complaints.get_complaint_details") as mock_get_details:
        mock_get_details.return_value = {"status": "generated", "complaint_number": "GSPCB-123"}
        
        response = client.get("/api/v1/complaints/test-complaint-id")
        
        assert response.status_code == 200
        assert response.json() == {"status": "generated", "complaint_number": "GSPCB-123"}

def test_get_complaint_not_found(client):
    with patch("backend.app.api.v1.complaints.get_complaint_details") as mock_get_details:
        mock_get_details.return_value = None
        
        response = client.get("/api/v1/complaints/missing-id")
        
        assert response.status_code == 404

def test_download_complaint_pdf(client):
    with patch("backend.app.api.v1.complaints.get_complaint_details") as mock_get_details, \
         patch("backend.app.api.v1.complaints.os.path.exists") as mock_exists, \
         patch("backend.app.api.v1.complaints.FileResponse") as mock_file_response:
         
        mock_get_details.return_value = {"status": "generated", "complaint_number": "GSPCB-123"}
        mock_exists.return_value = True
        mock_file_response.return_value = {"file": "pdf"}
        
        response = client.get("/api/v1/complaints/test-complaint-id/pdf")
        
        assert response.status_code == 200
