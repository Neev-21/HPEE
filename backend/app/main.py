from fastapi import FastAPI
from backend.app.api.v1.telemetry import router as telemetry_router
from backend.app.api.v1.gis import router as gis_router
from backend.app.api.v1.complaints import router as complaints_router
from backend.app.api.v1.notifications import router as notifications_router

app = FastAPI(
    title="HPEE API",
    description="Hyperlocal Pollution Evidence Engine API — Environmental Monitoring & Legal Enforcement",
    version="0.2.0"
)

app.include_router(telemetry_router, prefix="/api/v1/sensor", tags=["sensor"])
app.include_router(gis_router, prefix="/api/v1/gis", tags=["gis"])
app.include_router(complaints_router, prefix="/api/v1/complaints", tags=["complaints"])
app.include_router(notifications_router, prefix="/api/v1/notifications", tags=["notifications"])

@app.get("/health")
def health_check():
    return {"status": "ok"}


