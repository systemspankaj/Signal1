import json
from typing import Dict, Set

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        # user_id -> set of websockets
        self.active_connections: Dict[int, Set[WebSocket]] = {}
        # conversation_id -> set of user_ids currently viewing
        self.typing_users: Dict[int, Set[int]] = {}
        self.conversation_viewers: Dict[int, Set[int]] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)

    def disconnect(self, websocket: WebSocket, user_id: int):
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        for conv_id, users in list(self.typing_users.items()):
            users.discard(user_id)
        for conv_id, users in list(self.conversation_viewers.items()):
            users.discard(user_id)

    def is_online(self, user_id: int) -> bool:
        return user_id in self.active_connections and len(self.active_connections[user_id]) > 0

    async def send_to_user(self, user_id: int, event: dict):
        if user_id not in self.active_connections:
            return
        dead = set()
        for ws in self.active_connections[user_id]:
            try:
                await ws.send_json(event)
            except Exception:
                dead.add(ws)
        for ws in dead:
            self.active_connections[user_id].discard(ws)

    async def broadcast_to_users(self, user_ids: list[int], event: dict):
        for uid in user_ids:
            await self.send_to_user(uid, event)

    def set_typing(self, conversation_id: int, user_id: int, is_typing: bool):
        if conversation_id not in self.typing_users:
            self.typing_users[conversation_id] = set()
        if is_typing:
            self.typing_users[conversation_id].add(user_id)
        else:
            self.typing_users[conversation_id].discard(user_id)

    def get_typing_users(self, conversation_id: int, exclude_user_id: int = None) -> list[int]:
        users = self.typing_users.get(conversation_id, set()).copy()
        if exclude_user_id:
            users.discard(exclude_user_id)
        return list(users)

    def set_viewing(self, conversation_id: int, user_id: int, is_viewing: bool):
        if conversation_id not in self.conversation_viewers:
            self.conversation_viewers[conversation_id] = set()
        if is_viewing:
            self.conversation_viewers[conversation_id].add(user_id)
        else:
            self.conversation_viewers[conversation_id].discard(user_id)

    def get_viewers(self, conversation_id: int) -> list[int]:
        return list(self.conversation_viewers.get(conversation_id, set()))


manager = ConnectionManager()
