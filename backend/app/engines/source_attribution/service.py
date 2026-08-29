import math
from sqlalchemy.orm import Session
from sqlalchemy import text, func
from typing import List

from backend.app.models.industry import IndustrialSite, IndustrialActivity
from backend.app.engines.common.config import config
from backend.app.engines.common.types import EventContext, AttributionCandidate
from backend.app.engines.source_attribution.ranking import (
    calculate_angular_error,
    calculate_wind_alignment_score,
    calculate_distance_score,
    normalize_probabilities
)

def generate_candidates(db: Session, context: EventContext, wind_direction: float, data_quality: float) -> List[AttributionCandidate]:
    """
    Finds candidates within radius, computes alignment and distances, 
    and ranks them probabilistically.
    """
    # 1. PostGIS ST_DWithin query to find candidates
    # ST_MakePoint takes (longitude, latitude)
    point_wkt = f"ST_SetSRID(ST_MakePoint({context.centroid_lon}, {context.centroid_lat}), 4326)"
    
    # We query industries within the configured radius
    query = db.query(
        IndustrialSite,
        func.ST_Distance(IndustrialSite.location, text(point_wkt)).label("distance_m"),
        func.ST_Azimuth(text(point_wkt), IndustrialSite.location).label("azimuth_rad")
    ).filter(
        func.ST_DWithin(IndustrialSite.location, text(point_wkt), config.CANDIDATE_SEARCH_RADIUS_M)
    ).filter(IndustrialSite.is_active == True)

    results = query.all()
    
    candidates = []
    raw_scores = []
    
    for industry, distance_m, azimuth_rad in results:
        distance_km = distance_m / 1000.0
        # Convert azimuth to degrees
        source_bearing = math.degrees(azimuth_rad) if azimuth_rad is not None else 0.0
        
        # Calculate angular error and wind score
        angular_error = calculate_angular_error(source_bearing, wind_direction)
        wind_score = calculate_wind_alignment_score(angular_error)
        
        # Calculate distance score
        dist_score = calculate_distance_score(distance_km, config.CANDIDATE_SEARCH_RADIUS_M / 1000.0)
        
        # Activity match: Query if there's any active shift overlapping event time
        # This is a simplified check
        activity_overlap = db.query(IndustrialActivity).filter(
            IndustrialActivity.industry_id == industry.industry_id,
            IndustrialActivity.start_time <= (context.end_time or context.start_time),
            (IndustrialActivity.end_time == None) | (IndustrialActivity.end_time >= context.start_time)
        ).first()
        
        activity_score = 1.0 if activity_overlap else 0.2 # Base penalty if no known overlap
        pollutant_match_score = 0.8 # Placeholder for rule-based mapping (e.g. Dyes -> SO2)
        
        # Weighted raw score
        raw_score = (
            wind_score * config.WEIGHT_WIND_ALIGNMENT +
            dist_score * config.WEIGHT_DISTANCE +
            activity_score * config.WEIGHT_ACTIVITY_MATCH +
            pollutant_match_score * config.WEIGHT_POLLUTANT_MATCH +
            data_quality * config.WEIGHT_DATA_QUALITY
        )
        raw_scores.append(raw_score)
        
        explanation = f"Source lies {angular_error:.1f}° from prevailing wind. Distance: {distance_km:.2f}km."
        if activity_overlap:
            explanation += f" Active shift: {activity_overlap.shift_name}."
            
        candidates.append(AttributionCandidate(
            industry_id=industry.industry_id,
            name=industry.name,
            probability=0.0, # Filled later
            wind_alignment_score=wind_score,
            distance_km=distance_km,
            activity_score=activity_score,
            pollutant_match_score=pollutant_match_score,
            data_quality_score=data_quality,
            explanation=explanation
        ))

    # Normalize scores into probabilities
    probs = normalize_probabilities(raw_scores)
    for i, c in enumerate(candidates):
        c.probability = probs[i]
        
    # Sort descending by probability
    candidates.sort(key=lambda x: x.probability, reverse=True)
    return candidates
