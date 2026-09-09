import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from backend.app.core.websocket import manager

logger = logging.getLogger(__name__)
router = APIRouter()

@router.websocket("/live")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(None)):
    # Simple token check as planned
    # In a production app, we would validate a real JWT or API key.
    # We will just allow any connection or require a specific simple token.
    if token and token != "hpee-live-token":
        await websocket.close(code=1008)
        return

    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            logger.debug(f"Received WS message: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
