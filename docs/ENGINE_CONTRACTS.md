# Engine Data Contracts

To ensure consistency across multiple AI agents and developers, the inputs and outputs for all intelligence engines are strictly defined here. All implementations must adhere to these exact field names and types.

## 1. Event Detection Engine

**Purpose:** Analyzes incoming sensor readings against a baseline to detect anomalies and flag pollution events.

### Input: `EventDetectionInput`
```json
{
  "node_id": "string",
  "timestamp": "ISO8601 string",
  "pm25": "float | null",
  "pm10": "float | null",
  "so2": "float | null",
  "no": "float | null",
  "no2": "float | null",
  "nox": "float | null",
  "co": "float | null"
}
```

### Output: `EventDetectionOutput`
```json
{
  "is_anomaly": "boolean",
  "anomaly_score": "float (0.0 to 1.0)",
  "baseline_pm25": "float | null",
  "baseline_so2": "float | null",
  "event_id": "UUID string | null (if a new event is created or an active one is updated)"
}
```

---

## 2. Classification Engine

**Purpose:** Classifies a detected pollution event into a source category based on multi-pollutant signatures and contextual data.

### Input: `ClassificationInput`
```json
{
  "event_id": "UUID string",
  "node_id": "string",
  "timestamp": "ISO8601 string",
  "peak_pm25": "float | null",
  "peak_pm10": "float | null",
  "peak_so2": "float | null",
  "peak_nox": "float | null",
  "peak_co": "float | null",
  "hour_of_day": "integer (0-23)"
}
```

### Output: `ClassificationOutput`
```json
{
  "classification_type": "string (industrial | vehicular | agricultural_burning | seasonal_inversion | unknown)",
  "confidence_score": "float (0.0 to 1.0)",
  "features_used": {
    "pm25_pm10_ratio": "float | null",
    "nox_so2_ratio": "float | null",
    "diurnal_context": "string"
  }
}
```

---

## 3. Evidence Fusion Engine

**Purpose:** Aggregates various evidence factors (anomaly strength, pollutant consistency, weather correlation) to calculate a unified evidence score for source attribution.

### Input: `EvidenceFusionInput`
```json
{
  "event_id": "UUID string",
  "node_id": "string",
  "timestamp": "ISO8601 string",
  "anomaly_score": "float",
  "pollutant_consistency_score": "float",
  "weather_data_quality_score": "float"
}
```

### Output: `EvidenceFusionOutput`
```json
{
  "overall_evidence_score": "float (0.0 to 1.0)",
  "factors_used": {
    "anomaly_strength": "float",
    "pollutant_consistency": "float",
    "weather_correlation": "float"
  }
}
```

---

## 4. Source Attribution Engine

**Purpose:** Ranks plausible industrial sources for a given pollution event based on geographic proximity, wind alignment, and evidence scores.

### Input: `SourceAttributionInput`
```json
{
  "event_id": "UUID string",
  "centroid_lat": "float",
  "centroid_lon": "float",
  "wind_direction": "float",
  "overall_evidence_score": "float",
  "search_radius_m": "integer"
}
```

### Output: `SourceAttributionOutput`
```json
{
  "candidates": [
    {
      "industry_id": "UUID string",
      "name": "string",
      "probability": "float (0.0 to 1.0)",
      "wind_alignment_score": "float (0.0 to 1.0)",
      "distance_km": "float",
      "explanation": "string"
    }
  ]
}
```
