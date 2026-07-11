import json
from datetime import datetime, timezone

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from jose import JWTError, jwt
from sqlalchemy.orm import Session, joinedload

from app.config import settings
from app.database import SessionLocal
from app.models import ConversationMember, Message, MessageStatus, User
from app.services import create_message, get_conversation_member_ids, mark_messages_read, message_to_response
from app.websocket_manager import manager

router = APIRouter()


def get_user_from_token(token: str, db: Session) -> User | None:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_id = int(payload.get("sub"))
        return db.query(User).filter(User.id == user_id).first()
    except (JWTError, TypeError, ValueError):
        return None


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    db = SessionLocal()
    user = None
    try:
        token = websocket.query_params.get("token")
        if not token:
            await websocket.close(code=4001)
            return

        user = get_user_from_token(token, db)
        if not user:
            await websocket.close(code=4001)
            return

        await manager.connect(websocket, user.id)
        user.is_online = True
        db.commit()

        # Notify contacts about online status
        member_convs = db.query(ConversationMember).filter(ConversationMember.user_id == user.id).all()
        notified = set()
        for m in member_convs:
            others = get_conversation_member_ids(db, m.conversation_id)
            for uid in others:
                if uid not in notified:
                    await manager.send_to_user(uid, {"type": "user_online", "payload": {"user_id": user.id}})
                    notified.add(uid)

        await websocket.send_json({"type": "connected", "payload": {"user_id": user.id}})

        while True:
            data = await websocket.receive_json()
            event_type = data.get("type")
            payload = data.get("payload", {})

            if event_type == "send_message":
                conv_id = payload.get("conversation_id")
                content = payload.get("content", "").strip()
                if not conv_id or not content:
                    continue

                member = (
                    db.query(ConversationMember)
                    .filter(
                        ConversationMember.conversation_id == conv_id,
                        ConversationMember.user_id == user.id,
                    )
                    .first()
                )
                if not member:
                    continue

                msg = create_message(db, conv_id, user.id, content, payload.get("reply_to_id"))
                member_ids = get_conversation_member_ids(db, conv_id)
                response = message_to_response(msg)

                for uid in member_ids:
                    if uid != user.id and manager.is_online(uid):
                        msg.status = MessageStatus.DELIVERED
                        db.commit()
                        response.status = MessageStatus.DELIVERED
                        break

                await manager.broadcast_to_users(
                    member_ids,
                    {"type": "new_message", "payload": response.model_dump(mode="json")},
                )

            elif event_type == "typing":
                conv_id = payload.get("conversation_id")
                is_typing = payload.get("is_typing", False)
                if conv_id:
                    manager.set_typing(conv_id, user.id, is_typing)
                    member_ids = get_conversation_member_ids(db, conv_id)
                    for uid in member_ids:
                        if uid != user.id:
                            await manager.send_to_user(
                                uid,
                                {
                                    "type": "typing",
                                    "payload": {
                                        "conversation_id": conv_id,
                                        "user_id": user.id,
                                        "user_name": user.display_name,
                                        "is_typing": is_typing,
                                    },
                                },
                            )

            elif event_type == "viewing":
                conv_id = payload.get("conversation_id")
                is_viewing = payload.get("is_viewing", False)
                if conv_id:
                    manager.set_viewing(conv_id, user.id, is_viewing)
                    if is_viewing:
                        updated = mark_messages_read(db, conv_id, user.id)
                        member_ids = get_conversation_member_ids(db, conv_id)
                        for msg_id in updated:
                            await manager.broadcast_to_users(
                                member_ids,
                                {"type": "message_status", "payload": {"message_id": msg_id, "status": "read"}},
                            )

            elif event_type == "mark_read":
                conv_id = payload.get("conversation_id")
                if conv_id:
                    updated = mark_messages_read(db, conv_id, user.id)
                    member_ids = get_conversation_member_ids(db, conv_id)
                    for msg_id in updated:
                        await manager.broadcast_to_users(
                            member_ids,
                            {"type": "message_status", "payload": {"message_id": msg_id, "status": "read"}},
                        )

    except WebSocketDisconnect:
        pass
    finally:
        if user:
            manager.disconnect(websocket, user.id)
            user.is_online = manager.is_online(user.id)
            user.last_seen = datetime.now(timezone.utc)
            db.commit()

            member_convs = db.query(ConversationMember).filter(ConversationMember.user_id == user.id).all()
            notified = set()
            for m in member_convs:
                others = get_conversation_member_ids(db, m.conversation_id)
                for uid in others:
                    if uid not in notified:
                        await manager.send_to_user(
                            uid,
                            {
                                "type": "user_offline",
                                "payload": {"user_id": user.id, "last_seen": user.last_seen.isoformat()},
                            },
                        )
                        notified.add(uid)
        db.close()
