import os
from pydantic import BaseModel
from pydantic_settings import BaseSettings

class EngineConfig(BaseSettings):
    SCORING_VERSION: str = "source-score-0.1.0"
    MODEL_VERSION: str = "rule-based-fusion-0.1.0"
    
    # Radius in meters for candidate searching (default 3000 = 3km)
    CANDIDATE_SEARCH_RADIUS_M: int = int(os.environ.get("CANDIDATE_SEARCH_RADIUS_M", 3000))
    
    # Weight settings
    WEIGHT_WIND_ALIGNMENT: float = 0.35
    WEIGHT_ACTIVITY_MATCH: float = 0.25
    WEIGHT_DISTANCE: float = 0.20
    WEIGHT_POLLUTANT_MATCH: float = 0.10
    WEIGHT_DATA_QUALITY: float = 0.10
    
    # STALE THRESHOLD in seconds (2 hours)
    STALE_WEATHER_SECONDS: int = 7200
    
    class Config:
        env_file = ".env"

config = EngineConfig()
