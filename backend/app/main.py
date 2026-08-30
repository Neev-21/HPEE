from fastapi import FastAPI
from contextlib import asynccontextmanager
import asyncio
from backend.app.api.v1.telemetry import router as telemetry_router
from backend.app.api.v1.gis import router as gis_router
from backend.app.api.v1.complaints import router as complaints_router
from backend.app.api.v1.notifications import router as notifications_router
from backend.app.api.v1.ws import router as ws_router
from backend.app.api.v1.events import router as events_router
from backend.app.core.websocket import manager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Setup websocket manager loop on startup
    loop = asyncio.get_running_loop()
    manager.set_loop(loop)
    yield
    # Cleanup on shutdown if needed

app = FastAPI(
    title="HPEE API",
    description="Hyperlocal Pollution Evidence Engine API — Environmental Monitoring & Legal Enforcement",
    version="0.2.0",
    lifespan=lifespan
)

app.include_router(telemetry_router, prefix="/api/v1/sensor", tags=["sensor"])
app.include_router(gis_router, prefix="/api/v1/gis", tags=["gis"])
app.include_router(complaints_router, prefix="/api/v1/complaints", tags=["complaints"])
app.include_router(notifications_router, prefix="/api/v1/notifications", tags=["notifications"])
app.include_router(ws_router, prefix="/api/v1/ws", tags=["websocket"])
app.include_router(events_router, prefix="/api/v1/events", tags=["events"])

@app.get("/health")
def health_check():
    return {"status": "ok"}


