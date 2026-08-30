# HPEE: Local Setup & Execution Guide

This guide provides step-by-step instructions to start both the HPEE Backend (FastAPI) and Frontend (Next.js) from scratch in a local development environment.

## 1. Prerequisites

Before starting, ensure you have the following installed on your machine:
- **Python 3.12+**
- **Node.js 20+** and `npm`
- **Docker & Docker Compose** (for running the PostgreSQL + PostGIS database)
- **Git**

---

## 2. Backend Setup (FastAPI & Database)

The backend handles telemetry ingestion, the intelligence pipeline, and real-time WebSocket broadcasting.

### 2.1. Start the Database
The project uses a Docker container for PostgreSQL 17 + PostGIS 3.5.

1. Open a terminal in the root of the `HPEE` workspace.
2. Spin up the database and message broker using Docker Compose:
   ```bash
   docker-compose up -d postgres mosquitto
   ```
   *(This starts PostGIS mapped to port 5433 and the Mosquitto MQTT broker mapped to port 1884).*

### 2.2. Setup the Python Environment
1. Create and activate a virtual environment:
   - **Windows:**
     ```powershell
     python -m venv .venv
     .venv\Scripts\activate
     ```
   - **macOS/Linux:**
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```
2. Install the required Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### 2.3. Initialize the Database & Seed Data
1. Run Alembic migrations to create all database tables and schemas:
   ```bash
   alembic upgrade head
   ```
2. Run the deterministic seed script to populate the database with initial sensors, industries, and historical events:
   ```bash
   python -m database.seed.seed_data
   ```

### 2.4. Start the Backend Server
Run the FastAPI application using `uvicorn`:
```bash
uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8100
```
- The API will be available at: `http://localhost:8100`
- API Documentation (Swagger UI) is automatically available at: `http://localhost:8100/docs`

---

## 3. Frontend Setup (Next.js)

The frontend provides the interactive GIS dashboard and incident dossier panel.

### 3.1. Install Node Dependencies
1. Open a **new terminal** and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install the dependencies using npm:
   ```bash
   npm install
   ```

### 3.2. Start the Development Server
Run the Next.js development server:
```bash
npm run dev
```
- The frontend will be available at: `http://localhost:3100`

---

## 4. Verifying the Full Stack

With both servers running, you can test the end-to-end integration (including the real-time WebSockets):

1. **Open the Dashboard:** Navigate to `http://localhost:3100` in your web browser. You should see the map with sensor nodes and industrial sites loaded from the backend.
2. **Test Real-Time Telemetry:**
   You can push fake telemetry to the backend to see the map update instantly. Open another terminal and run a curl command (or use Postman):
   ```bash
   curl -X POST http://localhost:8100/api/v1/sensor/readings \
   -H "Content-Type: application/json" \
   -d '{
     "node_id": "HPEE-ANK-001",
     "timestamp": "2026-08-30T10:00:00Z",
     "location": {"latitude": 21.6335, "longitude": 73.0162},
     "measurements": {
       "pm25": {"value": 150.5, "unit": "ug/m3", "quality": "valid"},
       "so2": {"value": 90.2, "unit": "ug/m3", "quality": "valid"}
     },
     "node_health": {"battery_percent": 85.0, "signal_strength": -55, "status": "online"}
   }'
   ```
   *Watch the frontend dashboard — the sensor values for `HPEE-ANK-001` should update instantly without a page refresh via the WebSocket connection, and if the values are anomalously high, it will trigger the pollution alert dossier panel!*

---

## 5. Helpful Commands

- **Reset Database completely:** 
  ```bash
  ./database/scripts/reset_db.sh
  ```
- **Run Backend Tests:**
  ```bash
  pytest -v tests/
  ```
- **Run Engine Simulator (for continuous test data):**
  ```bash
  python simulator/run.py
  ```
