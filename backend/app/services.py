from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import and_, func, or_
from sqlalchemy.orm import Session, joinedload

from app.models import (
    Contact,
    Conversation,
    ConversationMember,
    ConversationType,
    MemberRole,
    Message,
    MessageReadReceipt,
    MessageStatus,
    User,
)
from app.schemas import ConversationResponse, LastMessagePreview, MessageResponse, UserResponse


def user_to_response(user: User) -> UserResponse:
    return UserResponse.model_validate(user)


def get_direct_conversation(db: Session, user_a: int, user_b: int) -> Optional[Conversation]:
    conv_ids_a = (
        db.query(ConversationMember.conversation_id)
        .filter(ConversationMember.user_id == user_a)
    )
    conv_ids_b = (
        db.query(ConversationMember.conversation_id)
        .filter(ConversationMember.user_id == user_b)
    )
    return (
        db.query(Conversation)
        .filter(Conversation.type == ConversationType.DIRECT)
        .filter(Conversation.id.in_(conv_ids_a))
        .filter(Conversation.id.in_(conv_ids_b))
        .first()
    )


def build_conversation_response(db: Session, conv: Conversation, current_user_id: int) -> ConversationResponse:
    members = (
        db.query(ConversationMember)
        .options(joinedload(ConversationMember.user))
        .filter(ConversationMember.conversation_id == conv.id)
        .all()
    )

    last_msg = (
        db.query(Message)
        .options(joinedload(Message.sender))
        .filter(Message.conversation_id == conv.id)
        .order_by(Message.created_at.desc())
        .first()
    )

    membership = next((m for m in members if m.user_id == current_user_id), None)
    last_read = membership.last_read_at if membership else None

    unread_count = 0
    if last_read:
        unread_count = (
            db.query(Message)
            .filter(
                Message.conversation_id == conv.id,
                Message.sender_id != current_user_id,
                Message.created_at > last_read,
            )
            .count()
        )
    elif last_msg and last_msg.sender_id != current_user_id:
        unread_count = (
            db.query(Message)
            .filter(Message.conversation_id == conv.id, Message.sender_id != current_user_id)
            .count()
        )

    last_message = None
    if last_msg:
        last_message = LastMessagePreview(
            id=last_msg.id,
            content=last_msg.content,
            sender_id=last_msg.sender_id,
            sender_name=last_msg.sender.display_name,
            status=last_msg.status,
            created_at=last_msg.created_at,
        )

    display_name = conv.name
    avatar_url = conv.avatar_url
    if conv.type == ConversationType.DIRECT:
        other = next((m.user for m in members if m.user_id != current_user_id), None)
        if other:
            display_name = other.display_name
            avatar_url = other.avatar_url

    from app.schemas import ConversationMemberResponse

    return ConversationResponse(
        id=conv.id,
        type=conv.type,
        name=display_name,
        avatar_url=avatar_url,
        members=[
            ConversationMemberResponse(
                id=m.id,
                user=user_to_response(m.user),
                role=m.role,
                joined_at=m.joined_at,
            )
            for m in members
        ],
        last_message=last_message,
        unread_count=unread_count,
        updated_at=conv.updated_at or conv.created_at,
    )


def message_to_response(msg: Message) -> MessageResponse:
    return MessageResponse(
        id=msg.id,
        conversation_id=msg.conversation_id,
        sender_id=msg.sender_id,
        sender=user_to_response(msg.sender),
        content=msg.content,
        status=msg.status,
        reply_to_id=msg.reply_to_id,
        created_at=msg.created_at,
    )


def mark_messages_read(db: Session, conversation_id: int, user_id: int):
    membership = (
        db.query(ConversationMember)
        .filter(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == user_id,
        )
        .first()
    )
    if not membership:
        return []

    now = datetime.now(timezone.utc)
    membership.last_read_at = now

    unread_messages = (
        db.query(Message)
        .filter(
            Message.conversation_id == conversation_id,
            Message.sender_id != user_id,
            Message.status != MessageStatus.READ,
        )
        .all()
    )

    updated_ids = []
    for msg in unread_messages:
        existing = (
            db.query(MessageReadReceipt)
            .filter(MessageReadReceipt.message_id == msg.id, MessageReadReceipt.user_id == user_id)
            .first()
        )
        if not existing:
            db.add(MessageReadReceipt(message_id=msg.id, user_id=user_id, read_at=now))
        msg.status = MessageStatus.READ
        updated_ids.append(msg.id)

    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if conv:
        conv.updated_at = now

    db.commit()
    return updated_ids


def create_message(
    db: Session,
    conversation_id: int,
    sender_id: int,
    content: str,
    reply_to_id: Optional[int] = None,
) -> Message:
    msg = Message(
        conversation_id=conversation_id,
        sender_id=sender_id,
        content=content,
        status=MessageStatus.SENT,
        reply_to_id=reply_to_id,
    )
    db.add(msg)

    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if conv:
        conv.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(msg)
    msg = (
        db.query(Message)
        .options(joinedload(Message.sender))
        .filter(Message.id == msg.id)
        .first()
    )
    return msg


def get_conversation_member_ids(db: Session, conversation_id: int) -> list[int]:
    members = (
        db.query(ConversationMember.user_id)
        .filter(ConversationMember.conversation_id == conversation_id)
        .all()
    )
    return [m[0] for m in members]


def search_users_and_conversations(db: Session, user_id: int, query: str):
    query = query.strip().lower()
    if not query:
        return [], []

    users = (
        db.query(User)
        .filter(
            User.id != user_id,
            or_(
                func.lower(User.display_name).contains(query),
                func.lower(User.username).contains(query),
                func.lower(User.phone).contains(query),
            ),
        )
        .limit(20)
        .all()
    )

    conversations = (
        db.query(Conversation)
        .join(ConversationMember)
        .filter(ConversationMember.user_id == user_id)
        .all()
    )

    matched_conversations = []
    for conv in conversations:
        resp = build_conversation_response(db, conv, user_id)
        if resp.name and query in resp.name.lower():
            matched_conversations.append(resp)
        elif resp.last_message and query in resp.last_message.content.lower():
            matched_conversations.append(resp)

    return users, matched_conversations
