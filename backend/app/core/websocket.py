import asyncio
import logging
from typing import List, Dict, Any
from fastapi import WebSocket

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.loop = None

    def set_loop(self, loop: asyncio.AbstractEventLoop):
        self.loop = loop

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket connected. Active connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket disconnected. Active connections: {len(self.active_connections)}")

    async def broadcast(self, message: Dict[str, Any]):
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error broadcasting message: {e}")
                disconnected.append(connection)
        
        for connection in disconnected:
            self.disconnect(connection)

    def broadcast_sync(self, message: Dict[str, Any]):
        """
        Thread-safe broadcast for use in synchronous tasks (like FastAPI BackgroundTasks).
        """
        if not self.loop:
            logger.warning("ConnectionManager loop not set. Cannot broadcast_sync.")
            return

        try:
            asyncio.run_coroutine_threadsafe(self.broadcast(message), self.loop)
        except Exception as e:
            logger.error(f"Error in broadcast_sync: {e}")

manager = ConnectionManager()
