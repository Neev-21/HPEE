"""GIS Spatial Layers API endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.engines.gis.service import (
    get_nodes_geojson,
    get_industries_geojson,
    get_event_gis_layers,
    calculate_upwind_dispersion_cone,
)

router = APIRouter()


@router.get("/nodes", summary="Get all sensor nodes as GeoJSON")
def list_nodes_geojson(db: Session = Depends(get_db)):
    return get_nodes_geojson(db)


@router.get("/industries", summary="Get all registered industries as GeoJSON")
def list_industries_geojson(db: Session = Depends(get_db)):
    return get_industries_geojson(db)


@router.get("/event/{event_id}/layers", summary="Get multi-layer GIS dossier for a pollution event")
def get_event_layers(event_id: str, db: Session = Depends(get_db)):
    result = get_event_gis_layers(db, event_id)
    if "error" in result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=result["error"])
    return result


@router.get("/plume-cone", summary="Calculate hypothetical plume cone polygon")
def compute_plume_cone(
    lat: float = 21.6320,
    lon: float = 73.0150,
    wind_direction: float = 135.0,
    reach_km: float = 4.5,
    spread_deg: float = 30.0,
):
    return calculate_upwind_dispersion_cone(
        centroid_lat=lat,
        centroid_lon=lon,
        wind_direction_deg=wind_direction,
        length_km=reach_km,
        angular_spread_deg=spread_deg,
    )
