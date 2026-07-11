from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.auth import get_current_user
from app.database import get_db
from app.models import ConversationMember, Message, MessageStatus, User
from app.schemas import MessageCreateRequest, MessageResponse, MessageStatusUpdateRequest
from app.services import (
    create_message,
    get_conversation_member_ids,
    mark_messages_read,
    message_to_response,
)
from app.websocket_manager import manager

router = APIRouter(tags=["messages"])


def _ensure_member(db: Session, conversation_id: int, user_id: int):
    member = (
        db.query(ConversationMember)
        .filter(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == user_id,
        )
        .first()
    )
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this conversation")
    return member


@router.get("/conversations/{conversation_id}/messages", response_model=list[MessageResponse])
def list_messages(
    conversation_id: int,
    limit: int = 50,
    before_id: int | None = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _ensure_member(db, conversation_id, user.id)

    query = (
        db.query(Message)
        .options(joinedload(Message.sender))
        .filter(Message.conversation_id == conversation_id)
    )
    if before_id:
        query = query.filter(Message.id < before_id)

    messages = query.order_by(Message.created_at.desc()).limit(limit).all()
    messages.reverse()

    mark_messages_read(db, conversation_id, user.id)

    return [message_to_response(m) for m in messages]


@router.post("/conversations/{conversation_id}/messages", response_model=MessageResponse, status_code=201)
async def send_message(
    conversation_id: int,
    data: MessageCreateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _ensure_member(db, conversation_id, user.id)
    msg = create_message(db, conversation_id, user.id, data.content, data.reply_to_id)

    member_ids = get_conversation_member_ids(db, conversation_id)
    response = message_to_response(msg)

    # Mark delivered for online recipients
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

    return response


@router.patch("/messages/{message_id}/status", response_model=MessageResponse)
async def update_message_status(
    message_id: int,
    data: MessageStatusUpdateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    msg = (
        db.query(Message)
        .options(joinedload(Message.sender))
        .filter(Message.id == message_id)
        .first()
    )
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    _ensure_member(db, msg.conversation_id, user.id)
    msg.status = data.status
    db.commit()
    db.refresh(msg)

    member_ids = get_conversation_member_ids(db, msg.conversation_id)
    response = message_to_response(msg)
    await manager.broadcast_to_users(
        member_ids,
        {"type": "message_status", "payload": {"message_id": msg.id, "status": msg.status.value}},
    )
    return response


@router.post("/conversations/{conversation_id}/read")
async def mark_read(
    conversation_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _ensure_member(db, conversation_id, user.id)
    updated_ids = mark_messages_read(db, conversation_id, user.id)

    member_ids = get_conversation_member_ids(db, conversation_id)
    for msg_id in updated_ids:
        await manager.broadcast_to_users(
            member_ids,
            {"type": "message_status", "payload": {"message_id": msg_id, "status": "read"}},
        )

    return {"read_count": len(updated_ids)}
