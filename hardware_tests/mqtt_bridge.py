"""
HPEE Serial-to-MQTT Bridge

Reads data from an Arduino connected via USB (Serial) and forwards it to the 
local Mosquitto MQTT broker.
"""

import sys
import serial
import time
import argparse
import paho.mqtt.client as mqtt
from serial.serialutil import SerialException

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("[MQTT] Successfully connected to broker!")
    else:
        print(f"[MQTT] Failed to connect, return code: {rc}")

def main():
    parser = argparse.ArgumentParser(description="HPEE Serial-to-MQTT Bridge")
    parser.add_argument("--port", type=str, default="COM3", help="Serial port (e.g., COM3, /dev/ttyUSB0)")
    parser.add_argument("--baud", type=int, default=9600, help="Baud rate")
    parser.add_argument("--broker", type=str, default="127.0.0.1", help="MQTT Broker IP")
    parser.add_argument("--mqtt-port", type=int, default=1884, help="MQTT Broker Port")
    args = parser.parse_args()

    # 1. Initialize MQTT Client
    mqtt_client = mqtt.Client(client_id="HPEE_Serial_Bridge")
    mqtt_client.on_connect = on_connect

    print(f"Connecting to MQTT Broker at {args.broker}:{args.mqtt_port}...")
    try:
        mqtt_client.connect(args.broker, args.mqtt_port, 60)
    except Exception as e:
        print(f"[Error] Failed to connect to MQTT broker: {e}")
        sys.exit(1)

    # Run the MQTT loop in the background
    mqtt_client.loop_start()

    # 2. Initialize Serial Connection
    print(f"Connecting to Arduino on {args.port} at {args.baud} baud...")
    try:
        ser = serial.Serial(args.port, args.baud, timeout=1)
        time.sleep(2) # Give Arduino time to reset on connection
        print("Serial connection established! Listening for data...")
    except SerialException as e:
        print(f"[Error] Failed to open serial port {args.port}: {e}")
        print("Please check the port name and ensure the Arduino is plugged in.")
        sys.exit(1)

    # 3. Listen and Forward
    try:
        while True:
            if ser.in_waiting > 0:
                line = ser.readline().decode('utf-8', errors='ignore').strip()
                
                if not line:
                    continue
                
                # We expect the format "topic:payload"
                if ":" in line:
                    try:
                        topic, payload = line.split(":", 1)
                        mqtt_client.publish(topic, payload)
                        print(f"[FORWARDED] Topic: {topic} | Payload: {payload}")
                    except ValueError:
                        print(f"[WARN] Malformed string from serial: {line}")
                else:
                    # If it's just a regular log message from the Arduino
                    print(f"[ARDUINO LOG]: {line}")
            
            time.sleep(0.01) # Small delay to prevent high CPU usage

    except KeyboardInterrupt:
        print("\nStopping bridge...")
    finally:
        if 'ser' in locals() and ser.is_open:
            ser.close()
        mqtt_client.loop_stop()
        mqtt_client.disconnect()

if __name__ == "__main__":
    main()
