import math
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from typing import List, Optional

from backend.app.models.industry import IndustrialSite, IndustrialActivity
from backend.app.engines.common.config import config
from backend.app.engines.common.types import EventContext, AttributionCandidate
from backend.app.engines.source_attribution.ranking import (
    calculate_angular_error,
    calculate_wind_alignment_score,
    calculate_distance_score,
    normalize_probabilities,
)
from backend.app.engines.source_attribution.pollutant_match import (
    calculate_pollutant_match_score,
    build_pollutant_explanation,
)


def generate_candidates(
    db: Session,
    context: EventContext,
    wind_direction: float,
    data_quality: float,
    detected_pollutants: Optional[dict] = None,
) -> List[AttributionCandidate]:
    """
    Finds industrial candidate sources within the search radius, scores them
    using wind alignment, distance, activity schedule, and pollutant profile
    matching, then normalises scores to probabilities.

    Args:
        db: SQLAlchemy session
        context: EventContext with centroid lat/lon and event time window
        wind_direction: prevailing wind direction in degrees (from Data-B or sensor)
        data_quality: 0-1 quality score of the weather data used
        detected_pollutants: dict with keys so2, nox, pm25, co, no2 (raw µg/m³ or ppb)
                             Used for cosine-similarity pollutant match scoring.
                             If None, falls back to neutral score 0.5.
    """
    # PostGIS point for the event centroid
    # ST_MakePoint takes (longitude, latitude)
    point_wkt = (
        f"ST_SetSRID(ST_MakePoint({context.centroid_lon}, {context.centroid_lat}), 4326)"
    )

    # Query industries within configured radius using PostGIS ST_DWithin + ST_Distance
    query = (
        db.query(
            IndustrialSite,
            func.ST_Distance(IndustrialSite.location, text(point_wkt)).label("distance_m"),
            func.ST_Azimuth(text(point_wkt), IndustrialSite.location).label("azimuth_rad"),
        )
        .filter(
            func.ST_DWithin(
                IndustrialSite.location,
                text(point_wkt),
                config.CANDIDATE_SEARCH_RADIUS_M,
            )
        )
        .filter(IndustrialSite.is_active == True)
    )

    results = query.all()

    candidates: List[AttributionCandidate] = []
    raw_scores: List[float] = []

    for industry, distance_m, azimuth_rad in results:
        distance_km = (distance_m or 0) / 1000.0

        # Convert PostGIS azimuth (radians, N=0 clockwise) to compass degrees
        source_bearing = math.degrees(azimuth_rad) if azimuth_rad is not None else 0.0

        # ----------------------------------------------------------------
        # Wind alignment score: Gaussian-cosine decay on angular error
        # ----------------------------------------------------------------
        angular_error   = calculate_angular_error(source_bearing, wind_direction)
        wind_score      = calculate_wind_alignment_score(angular_error)

        # ----------------------------------------------------------------
        # Distance score: linear decay to max radius
        # ----------------------------------------------------------------
        max_radius_km   = config.CANDIDATE_SEARCH_RADIUS_M / 1000.0
        dist_score      = calculate_distance_score(distance_km, max_radius_km)

        # ----------------------------------------------------------------
        # Activity score: check if any shift overlaps the event window
        # ----------------------------------------------------------------
        activity_overlap = (
            db.query(IndustrialActivity)
            .filter(
                IndustrialActivity.industry_id == industry.industry_id,
                IndustrialActivity.start_time  <= (context.end_time or context.start_time),
                (IndustrialActivity.end_time == None)
                | (IndustrialActivity.end_time >= context.start_time),
            )
            .first()
        )
        activity_score = 1.0 if activity_overlap else 0.2

        # ----------------------------------------------------------------
        # Pollutant match score: cosine similarity vs emission profile
        # ----------------------------------------------------------------
        emission_profile = getattr(industry, "emission_profile", None)
        pollutant_score = calculate_pollutant_match_score(
            detected_reading=detected_pollutants or {},
            industry_emission_profile=emission_profile,
        )

        # ----------------------------------------------------------------
        # Composite weighted score
        # ----------------------------------------------------------------
        raw_score = (
            wind_score      * config.WEIGHT_WIND_ALIGNMENT +
            dist_score      * config.WEIGHT_DISTANCE +
            activity_score  * config.WEIGHT_ACTIVITY_MATCH +
            pollutant_score * config.WEIGHT_POLLUTANT_MATCH +
            data_quality    * config.WEIGHT_DATA_QUALITY
        )
        raw_scores.append(raw_score)

        # ----------------------------------------------------------------
        # Build explanation string
        # ----------------------------------------------------------------
        explanation = (
            f"Source lies {angular_error:.1f} deg from prevailing wind. "
            f"Distance: {distance_km:.2f} km. "
        )
        if activity_overlap:
            explanation += f"Active shift: {activity_overlap.shift_name}. "
        else:
            explanation += "No active shift on record. "

        pollutant_note = build_pollutant_explanation(
            score=pollutant_score,
            detected_reading=detected_pollutants or {},
            industry_name=industry.name,
        )
        explanation += pollutant_note

        candidates.append(
            AttributionCandidate(
                industry_id=industry.industry_id,
                name=industry.name,
                probability=0.0,  # Filled after normalisation
                wind_alignment_score=wind_score,
                distance_km=distance_km,
                activity_score=activity_score,
                pollutant_match_score=pollutant_score,
                data_quality_score=data_quality,
                explanation=explanation,
            )
        )

    # ----------------------------------------------------------------
    # Normalise raw scores → probabilities; sort descending
    # ----------------------------------------------------------------
    probs = normalize_probabilities(raw_scores)
    for i, c in enumerate(candidates):
        c.probability = probs[i]

    candidates.sort(key=lambda x: x.probability, reverse=True)
    return candidates
