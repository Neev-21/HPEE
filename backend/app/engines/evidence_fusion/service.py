from sqlalchemy.orm import Session
from datetime import datetime
import json

from backend.app.models.evidence import SourceAttribution, EvidenceRecord
from backend.app.engines.common.config import config
from backend.app.engines.common.types import EventContext
from backend.app.engines.source_attribution.service import generate_candidates
from backend.app.engines.evidence_fusion.factors import (
    calculate_weather_data_quality,
    evaluate_pollutant_consistency
)

def run_evidence_fusion_and_attribution(
    db: Session, 
    context: EventContext,
    wind_direction: float,
    weather_observation_time: datetime,
    peak_pm25: float = None,
    peak_so2: float = None,
    detected_pollutants: dict = None,
) -> None:
    """
    Main entrypoint for the Data Fusion & Intelligence layer.
    Runs attribution, creates evidence records, and persists results.

    Args:
        detected_pollutants: dict with keys so2, nox, pm25, co, no2 (raw readings)
                             Passed to source attribution for cosine similarity matching.
                             If None, attribution uses a neutral score of 0.5.
    """
    try:
        # 1. Calculate base evidence factors
        data_quality = calculate_weather_data_quality(
            observation_time=weather_observation_time, 
            stale_threshold_sec=config.STALE_WEATHER_SECONDS
        )
        pollutant_score = evaluate_pollutant_consistency(pm25=peak_pm25, so2=peak_so2)
        
        # 2. Run Source Attribution
        candidates = generate_candidates(
            db=db, 
            context=context, 
            wind_direction=wind_direction, 
            data_quality=data_quality,
            detected_pollutants=detected_pollutants,
        )
        
        # 3. Create Evidence Records
        # Weather data quality evidence
        ev_weather = EvidenceRecord(
            event_id=context.event_id,
            evidence_type="weather_correlation",
            data_payload={"observation_time": weather_observation_time.isoformat(), "wind_direction": wind_direction},
            confidence_weight=data_quality
        )
        db.add(ev_weather)
        
        # Pollutant signature evidence
        ev_pollutant = EvidenceRecord(
            event_id=context.event_id,
            evidence_type="pollutant_pattern",
            data_payload={"peak_pm25": peak_pm25, "peak_so2": peak_so2},
            confidence_weight=pollutant_score
        )
        db.add(ev_pollutant)
        
        # 4. Save Source Attributions for top 5 candidates
        top_candidates = candidates[:5]
        
        if not top_candidates:
            # Create a null attribution meaning "Insufficient Evidence"
            pass # Or handle specific UI rules
        
        for rank, candidate in enumerate(top_candidates, start=1):
            attr = SourceAttribution(
                event_id=context.event_id,
                industry_id=candidate.industry_id,
                rank=rank,
                probability_score=candidate.probability,
                plume_model_params={
                    "wind_alignment_score": candidate.wind_alignment_score,
                    "distance_km": candidate.distance_km,
                    "activity_score": candidate.activity_score,
                    "pollutant_match_score": candidate.pollutant_match_score,
                    "data_quality_score": candidate.data_quality_score,
                    "explanation": candidate.explanation,
                    "scoring_version": config.SCORING_VERSION,
                    "model_version": config.MODEL_VERSION
                }
            )
            db.add(attr)
            
            # Create a specific evidence record for the top candidates' wind alignment
            ev_candidate = EvidenceRecord(
                event_id=context.event_id,
                evidence_type="wind_vector_alignment",
                data_payload={"industry_id": str(candidate.industry_id), "explanation": candidate.explanation},
                confidence_weight=candidate.wind_alignment_score
            )
            db.add(ev_candidate)

        # 5. Commit transaction
        db.commit()
        
    except Exception as e:
        db.rollback()
        # In a production app, we would log this gracefully
        raise e
