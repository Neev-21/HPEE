// Pin Definitions
#define MQ2_PIN A0
#define RAIN_ANALOG_PIN A1
#define DUST_ANALOG_PIN A2
#define POT_PIN A3
#define DHT11_PIN 2
#define DUST_LED_PIN 3
#define RAIN_DIGITAL_PIN 4

const int samplingTime = 280;
const int deltaTime = 40;
const int sleepTime = 9680;

// Helper to average analog readings to filter noise
int getAveragedAnalog(int pin, int samples = 10) {
  long sum = 0;
  for(int i = 0; i < samples; i++) {
    sum += analogRead(pin);
    delay(2);
  }
  return sum / samples;
}

// DHT11 Bit-Bang Driver
bool readDHT11(byte &temperature, byte &humidity) {
  byte data[5] = {0, 0, 0, 0, 0};
  
  pinMode(DHT11_PIN, OUTPUT);
  digitalWrite(DHT11_PIN, LOW);
  delay(18);
  digitalWrite(DHT11_PIN, HIGH);
  delayMicroseconds(40);
  pinMode(DHT11_PIN, INPUT);

  unsigned long timeout = micros();
  while(digitalRead(DHT11_PIN) == HIGH) { if(micros() - timeout > 100) return false; }
  timeout = micros();
  while(digitalRead(DHT11_PIN) == LOW)  { if(micros() - timeout > 100) return false; }
  timeout = micros();
  while(digitalRead(DHT11_PIN) == HIGH) { if(micros() - timeout > 100) return false; }

  for (int i = 0; i < 40; i++) {
    timeout = micros();
    while(digitalRead(DHT11_PIN) == LOW) { if(micros() - timeout > 100) return false; }
    
    unsigned long t = micros();
    timeout = micros();
    while(digitalRead(DHT11_PIN) == HIGH) { if(micros() - timeout > 100) return false; }
    
    if ((micros() - t) > 40) {
      data[i / 8] |= (1 << (7 - (i % 8)));
    }
  }

  if (data[4] == ((data[0] + data[1] + data[2] + data[3]) & 0xFF)) {
    humidity = data[0];
    temperature = data[2];
    return true;
  }
  return false;
}

void setup() {
  Serial.begin(9600);
  pinMode(DUST_LED_PIN, OUTPUT);
  digitalWrite(DUST_LED_PIN, HIGH);
  pinMode(RAIN_DIGITAL_PIN, INPUT);

  Serial.println("[INFO] Warming up sensors... Ready in 2 seconds.");
  delay(2000); 
}

void loop() {
  // 1. Potentiometer (mapped to wind speed / direction dial for live testing)
  int potValue = getAveragedAnalog(POT_PIN);
  float windSpeed = (potValue / 1023.0) * 25.0; // 0 - 25 m/s
  float windDir = (potValue / 1023.0) * 359.0;   // 0 - 359 deg (strictly < 360)

  // 2. MQ-2 Smoke/Gas Sensor (Higher value = More Gas/Smoke, mapped to SO2 range)
  // 2. MQ-2 Smoke/Gas Sensor (Higher value = More Gas/Smoke, mapped to Smoke & SO2 range)
  int mq2Raw = getAveragedAnalog(MQ2_PIN);
  float so2 = (mq2Raw / 1023.0) * 150.0; // 0 - 150 ug/m3
  float smoke = (mq2Raw / 1023.0) * 100.0; // 0 - 100% Smoke Sensor Reading (ppm / level)
  float so2 = (mq2Raw / 1023.0) * 150.0;   // 0 - 150 ug/m3

  // 3. Rain Sensor (Lower ADC value = More Rain)
  int rainRaw = getAveragedAnalog(RAIN_ANALOG_PIN);
  int rainPercent = map(rainRaw, 1023, 200, 0, 100);
  rainPercent = constrain(rainPercent, 0, 100);

  // 4. Optical Dust Sensor Pulse (sampling LED pulse)
  digitalWrite(DUST_LED_PIN, LOW);
  delayMicroseconds(samplingTime);
  int dustRaw = analogRead(DUST_ANALOG_PIN);
  delayMicroseconds(deltaTime);
  digitalWrite(DUST_LED_PIN, HIGH);
  delayMicroseconds(sleepTime);

  // Map dust ADC reading to PM2.5 (0 - 500 ug/m3)
  float pm25 = (dustRaw / 1023.0) * 500.0;

  // 5. DHT11 Temperature & Humidity=
  // 5. DHT11 Temperature & Humidity
  byte temperature = 0, humidity = 0;
  bool dhtSuccess = readDHT11(temperature, humidity);

  // 6. Emit single-line message in standard format expected by mqtt_bridge.py:
  // Format: <topic>:<json_payload>
  // Topic "hpee/telemetry/S-001" forwards to Mosquitto and is consumed by worker.py
  Serial.print("hpee/telemetry/S-001:{\"node_id\":\"S-001\",");
  Serial.print("\"location\":{\"latitude\":21.6335,\"longitude\":73.0162,\"altitude\":42.5},");
  Serial.print("\"measurements\":{");
  Serial.print("\"pm25\":"); Serial.print(pm25, 1);
  Serial.print(",\"smoke\":"); Serial.print(smoke, 1);
  Serial.print(",\"so2\":"); Serial.print(so2, 1);
  if (dhtSuccess) {
    Serial.print(",\"temperature\":"); Serial.print((int)temperature);
    Serial.print(",\"humidity\":"); Serial.print((int)humidity);
  } else {
    Serial.print(",\"temperature\":28.5,\"humidity\":65.0");
  }
  Serial.print(",\"wind_speed\":"); Serial.print(windSpeed, 1);
  Serial.print(",\"wind_direction\":"); Serial.print(windDir, 1);
  Serial.print(",\"rain_intensity\":"); Serial.print(rainPercent);
  Serial.println("},\"node_health\":{\"battery_percent\":98.0,\"signal_strength\":-55,\"status\":\"online\"}}");

  delay(2000);
}