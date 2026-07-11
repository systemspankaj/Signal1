from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.auth import get_current_user
from app.database import get_db
from app.models import (
    Conversation,
    ConversationMember,
    ConversationType,
    MemberRole,
    Message,
    User,
)
from app.schemas import (
    ConversationCreateDirectRequest,
    ConversationCreateGroupRequest,
    ConversationMemberResponse,
    ConversationResponse,
    GroupMemberUpdateRequest,
)
from app.services import build_conversation_response, get_direct_conversation, user_to_response

router = APIRouter(prefix="/conversations", tags=["conversations"])


def _ensure_member(db: Session, conversation_id: int, user_id: int) -> ConversationMember:
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


@router.get("", response_model=list[ConversationResponse])
def list_conversations(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    memberships = (
        db.query(ConversationMember)
        .filter(ConversationMember.user_id == user.id)
        .all()
    )
    conv_ids = [m.conversation_id for m in memberships]
    conversations = (
        db.query(Conversation)
        .filter(Conversation.id.in_(conv_ids))
        .order_by(Conversation.updated_at.desc())
        .all()
    )
    return [build_conversation_response(db, c, user.id) for c in conversations]


@router.get("/search")
def search_conversations(q: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from app.services import search_users_and_conversations

    users, conversations = search_users_and_conversations(db, user.id, q)
    return {
        "users": [user_to_response(u) for u in users],
        "conversations": conversations,
    }


@router.get("/{conversation_id}", response_model=ConversationResponse)
def get_conversation(
    conversation_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _ensure_member(db, conversation_id, user.id)
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return build_conversation_response(db, conv, user.id)


@router.post("/direct", response_model=ConversationResponse, status_code=201)
def create_direct_conversation(
    data: ConversationCreateDirectRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    other = db.query(User).filter(User.id == data.user_id).first()
    if not other:
        raise HTTPException(status_code=404, detail="User not found")
    if other.id == user.id:
        raise HTTPException(status_code=400, detail="Cannot create conversation with yourself")

    existing = get_direct_conversation(db, user.id, other.id)
    if existing:
        return build_conversation_response(db, existing, user.id)

    conv = Conversation(type=ConversationType.DIRECT)
    db.add(conv)
    db.flush()

    db.add(ConversationMember(conversation_id=conv.id, user_id=user.id))
    db.add(ConversationMember(conversation_id=conv.id, user_id=other.id))
    db.commit()
    db.refresh(conv)

    return build_conversation_response(db, conv, user.id)


@router.post("/group", response_model=ConversationResponse, status_code=201)
def create_group_conversation(
    data: ConversationCreateGroupRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    member_ids = set(data.member_ids)
    member_ids.add(user.id)

    users = db.query(User).filter(User.id.in_(member_ids)).all()
    if len(users) != len(member_ids):
        raise HTTPException(status_code=404, detail="One or more users not found")

    conv = Conversation(
        type=ConversationType.GROUP,
        name=data.name,
        avatar_url=data.avatar_url,
    )
    db.add(conv)
    db.flush()

    for uid in member_ids:
        role = MemberRole.ADMIN if uid == user.id else MemberRole.MEMBER
        db.add(ConversationMember(conversation_id=conv.id, user_id=uid, role=role))

    db.commit()
    db.refresh(conv)
    return build_conversation_response(db, conv, user.id)


@router.get("/{conversation_id}/members", response_model=list[ConversationMemberResponse])
def get_members(
    conversation_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _ensure_member(db, conversation_id, user.id)
    members = (
        db.query(ConversationMember)
        .options(joinedload(ConversationMember.user))
        .filter(ConversationMember.conversation_id == conversation_id)
        .all()
    )
    return [
        ConversationMemberResponse(
            id=m.id,
            user=user_to_response(m.user),
            role=m.role,
            joined_at=m.joined_at,
        )
        for m in members
    ]


@router.post("/{conversation_id}/members", response_model=ConversationResponse)
def add_member(
    conversation_id: int,
    data: GroupMemberUpdateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    member = _ensure_member(db, conversation_id, user.id)
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if conv.type != ConversationType.GROUP:
        raise HTTPException(status_code=400, detail="Not a group conversation")
    if member.role != MemberRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can add members")

    target = db.query(User).filter(User.id == data.user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    existing = (
        db.query(ConversationMember)
        .filter(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == data.user_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="User already in group")

    db.add(ConversationMember(conversation_id=conversation_id, user_id=data.user_id))
    db.commit()
    return build_conversation_response(db, conv, user.id)


@router.delete("/{conversation_id}/members/{member_user_id}", response_model=ConversationResponse)
def remove_member(
    conversation_id: int,
    member_user_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    member = _ensure_member(db, conversation_id, user.id)
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if conv.type != ConversationType.GROUP:
        raise HTTPException(status_code=400, detail="Not a group conversation")

    is_self_leave = member_user_id == user.id
    if not is_self_leave and member.role != MemberRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can remove members")

    target = (
        db.query(ConversationMember)
        .filter(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == member_user_id,
        )
        .first()
    )
    if not target:
        raise HTTPException(status_code=404, detail="Member not found")

    db.delete(target)
    db.commit()
    return build_conversation_response(db, conv, user.id)
