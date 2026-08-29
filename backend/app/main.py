from fastapi import FastAPI
from backend.app.api.v1.telemetry import router as telemetry_router

app = FastAPI(
    title="HPEE API",
    description="Hyperlocal Pollution Evidence Engine API",
    version="0.1.0"
)

app.include_router(telemetry_router, prefix="/api/v1/sensor", tags=["sensor"])

@app.get("/health")
def health_check():
    return {"status": "ok"}
