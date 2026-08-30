/**
 * HPEE Serial-to-MQTT Test Node
 * 
 * This sketch simulates an HPEE sensor node without requiring Wi-Fi.
 * It sends mock sensor telemetry over the Serial port in the format:
 * topic:payload
 */

unsigned long lastMsg = 0;
const int PUBLISH_INTERVAL_MS = 5000;

// --- Sensor Pin Definitions (Matching docs/CONNECTION.md) ---
#define PIN_WIND_SPEED 2       // D2 (Interrupt 0)
#define PIN_PMS_RX 4           // D4 (SoftwareSerial RX)
#define PIN_PMS_TX 5           // D5 (SoftwareSerial TX)
#define PIN_SO2_ANALOG A0      // A0
#define PIN_WIND_DIR A1        // A1
#define PIN_BATTERY A2         // A2
// A4 and A5 are reserved for I2C (BME280)

// --- Placeholder Sensor Reading Functions ---
// Replace these with actual library calls (e.g., Adafruit_BME280) when hardware is wired.

float readPM25() { return random(100, 1500) / 10.0; } // 10.0 to 150.0
float readPM10() { return readPM25() + random(50, 500) / 10.0; }
float readSO2() { return random(100, 800) / 10.0; } // 10.0 to 80.0
float readTemperature() { return 25.0 + (random(-50, 50) / 10.0); }
float readHumidity() { return 60.0 + (random(-100, 100) / 10.0); }
float readWindSpeed() { return random(0, 150) / 10.0; }
int readWindDirection() { return random(0, 360); }
float readBatteryPercent() { return random(75, 100); }

void setup() {
  // Initialize Serial port
  Serial.begin(9600);
  
  // Set up pins
  pinMode(PIN_WIND_SPEED, INPUT_PULLUP);
  pinMode(PIN_SO2_ANALOG, INPUT);
  pinMode(PIN_WIND_DIR, INPUT);
  pinMode(PIN_BATTERY, INPUT);
  
  // Wait a moment for serial connection to stabilize
  delay(1000);
  
  // Send a startup message
  Serial.println("hpee/test/status:Node online and ready!");
}

void loop() {
  unsigned long now = millis();
  
  // Publish telemetry every few seconds
  if (now - lastMsg > PUBLISH_INTERVAL_MS) {
    lastMsg = now;
    
    // Read all sensors
    float pm25 = readPM25();
    float pm10 = readPM10();
    float so2 = readSO2();
    float temp = readTemperature();
    float hum = readHumidity();
    float w_speed = readWindSpeed();
    int w_dir = readWindDirection();
    float batt = readBatteryPercent();
    
    // Construct the payload JSON exactly matching API_CONTRACT.md
    String payload = "{";
    payload += "\"node_id\": \"HPEE-TEST-001\",";
    payload += "\"location\": {\"latitude\": 21.6335, \"longitude\": 73.0162},";
    payload += "\"measurements\": {";
    payload += "\"pm25\": " + String(pm25, 1) + ",";
    payload += "\"pm10\": " + String(pm10, 1) + ",";
    payload += "\"so2\": " + String(so2, 1) + ",";
    payload += "\"temperature\": " + String(temp, 1) + ",";
    payload += "\"humidity\": " + String(hum, 1) + ",";
    payload += "\"wind_speed\": " + String(w_speed, 1) + ",";
    payload += "\"wind_direction\": " + String(w_dir);
    payload += "},";
    payload += "\"node_health\": {";
    payload += "\"battery_percent\": " + String(batt, 1);
    payload += "}";
    payload += "}";
    
    // Construct topic
    String topic = "hpee/telemetry/test_node_01";
    
    // Send over serial in format -> topic:payload
    Serial.print(topic);
    Serial.print(":");
    Serial.println(payload);
  }
}
