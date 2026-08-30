# Hardware Connection Guide (Arduino Uno)

This document details the wiring and pinouts for connecting the full suite of HPEE environmental sensors to a standard Arduino Uno. 

> **Important Note:** When transitioning to the final **ESP32** hardware (Phase 5), the pinouts will change due to the ESP32's different architecture and 3.3V logic level.

## Pin Mapping Summary

| Sensor / Component | Data Protocol | Arduino Uno Pin | Power (VCC) | Ground (GND) | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **PMS5003 (PM2.5 / PM10)** | UART (Serial) | **D4** (RX), **D5** (TX) | 5V | GND | Uses `SoftwareSerial`. Logic is 3.3V, so add a voltage divider on the Arduino TX (D5) -> PMS RX line. |
| **Anemometer (Wind Speed)** | Digital Pulse / Interrupt | **D2** (INT0) | 5V / 3.3V | GND | Requires an interrupt pin. D2 is hardware interrupt 0 on the Uno. |
| **BME280 (Temp / Humidity)** | I2C | **A4** (SDA), **A5** (SCL) | 3.3V | GND | Ensure your BME280 breakout board supports 5V logic, otherwise use a level shifter. |
| **SO2 Sensor (Electrochemical)**| Analog Voltage | **A0** | 5V | GND | Connect the analog output of the amplifier board to A0. |
| **Wind Vane (Direction)** | Analog Voltage | **A1** | 5V | GND | Uses an internal resistor network to output varying voltage based on direction. |
| **Battery Monitor** | Analog Voltage | **A2** | N/A | GND | **Requires a Voltage Divider** (e.g., 10k/10k) to step down the battery voltage below the Arduino's 5V limit. |

---

## Detailed Wiring Instructions

### 1. PMS5003 (Particulate Matter)
The Arduino Uno only has one hardware serial port (D0/D1), which is currently being used by the USB cable to talk to the Python Bridge. Therefore, we use **SoftwareSerial** on pins D4 and D5.
*   **VCC** -> 5V
*   **GND** -> GND
*   **TX (Pin 5 on PMS)** -> Arduino **D4**
*   **RX (Pin 4 on PMS)** -> Arduino **D5** *(Use a 10k/20k voltage divider to step the 5V signal down to 3.3V)*

### 2. BME280 (Temperature & Humidity)
Uses the standard I2C bus.
*   **VIN** -> 3.3V
*   **GND** -> GND
*   **SDA** -> Arduino **A4**
*   **SCL** -> Arduino **A5**

### 3. Electrochemical SO2 Sensor
Usually comes with an analog amplifier board (like the SPEC sensors or MQ series).
*   **VCC** -> 5V
*   **GND** -> GND
*   **AOUT** -> Arduino **A0**

### 4. Weather Station (Wind Speed & Direction)
*   **Anemometer:** Connect one wire to **D2** and the other to GND. Enable `INPUT_PULLUP` in code.
*   **Wind Vane:** Connect one side to 5V, the other to GND, and the signal wire to **A1**.

### 5. Battery Monitoring (LiFePO4)
A fully charged LiFePO4 cell is around 3.6V, but a solar panel or 2-cell pack might exceed 5V. 
*   Connect the positive terminal to a voltage divider.
*   Connect the middle of the voltage divider to Arduino **A2**.
*   Connect the negative terminal to Arduino GND.
