# End-to-End Telemetry Ingestion Testing Guide

This guide explains how to test the complete telemetry data pipeline: from a physical Arduino, through the MQTT bridge, into the ingestion worker, and finally into the PostGIS database.

By utilizing Docker Compose, we can dramatically simplify the process of running the backend infrastructure.

## Prerequisites
- Arduino board connected via USB.
- Python virtual environment activated with `pyserial` and `paho-mqtt` installed.
- Docker Desktop running.

## Step 1: Start the Backend Infrastructure
Instead of manually opening multiple terminals for the database, API, MQTT broker, and ingestion worker, we can spin them all up simultaneously using Docker.

1. Open a terminal in the root folder of the project (`HPEE`).
2. Run the following command:
   ```powershell
   docker-compose up -d --build
   ```
This single command starts:
- **postgres**: The PostGIS database.
- **mosquitto**: The MQTT broker (listening on port 1884 on host).
- **api**: The FastAPI backend (listening on port 8100).
- **ingestion-worker**: The Python background task that listens to MQTT and POSTs to the API.

## Step 2: Prepare the Arduino
1. Open `hardware_tests/serial_node/serial_node.ino` in the Arduino IDE.
2. Compile and upload the code to your connected Arduino board.
3. Note which port the Arduino is using (e.g., `COM5` on Windows, or `/dev/ttyUSB0` on Mac/Linux).
4. **Important:** Close the Arduino IDE's Serial Monitor. If it is left open, the Python script will be blocked from reading the port.

## Step 3: Run the Serial-to-MQTT Bridge
This Python script reads the JSON data from your Arduino over USB and pushes it to the Dockerized Mosquitto broker.

1. Open a new terminal in VS Code and ensure your Python virtual environment is activated.
2. Navigate to the hardware tests folder:
   ```powershell
   cd hardware_tests
   ```
3. Run the bridge script (replace `COM5` with your actual Arduino port):
   ```powershell
   python mqtt_bridge.py --port COM5
   ```
*You should see logs appearing every 5 seconds indicating messages are being forwarded:*
`[FORWARDED] Topic: hpee/telemetry/test_node_01 | Payload: {...}`

## Step 4: Verify the Pipeline
To confirm the data is successfully navigating the entire pipeline and being saved to the database, you can monitor the live logs of your Docker containers.

Open a terminal in the project root and run:
```powershell
docker-compose logs -f api
```
If the pipeline is working correctly, you will see HTTP `201 Created` logs appearing every few seconds. This indicates the ingestion worker is successfully hitting the backend endpoint to save the Arduino's data:
`INFO:     172.x.x.x:xxxxx - "POST /api/v1/sensor/readings HTTP/1.1" 201 Created`

*(Press `Ctrl+C` to stop watching the logs).*

To check the ingestion worker logs specifically, run:
```powershell
docker-compose logs -f ingestion-worker
```

## Troubleshooting
- **Port 8100 conflict:** If `docker-compose up` fails because port 8100 is in use, make sure you don't have `uvicorn` running manually in another terminal.
- **Access Denied on COM Port:** If the `mqtt_bridge.py` script throws an access denied error, ensure the Arduino Serial Monitor is closed. Only one program can read a Serial port at a time.
