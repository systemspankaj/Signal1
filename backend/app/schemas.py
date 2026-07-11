from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models import ConversationType, MemberRole, MessageStatus


# Auth
class RegisterRequest(BaseModel):
    phone: Optional[str] = None
    username: Optional[str] = None
    display_name: str = Field(min_length=1, max_length=100)
    password: str = Field(min_length=4)
    avatar_url: Optional[str] = None


class LoginRequest(BaseModel):
    identifier: str  # phone or username
    password: str


class OTPVerifyRequest(BaseModel):
    phone: str
    otp: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


# Users
class UserResponse(BaseModel):
    id: int
    phone: Optional[str] = None
    username: Optional[str] = None
    display_name: str
    avatar_url: Optional[str] = None
    is_online: bool = False
    last_seen: Optional[datetime] = None

    model_config = {"from_attributes": True}


class UserUpdateRequest(BaseModel):
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None


# Contacts
class ContactCreateRequest(BaseModel):
    identifier: str  # phone or username


class ContactResponse(BaseModel):
    id: int
    user: UserResponse
    created_at: datetime

    model_config = {"from_attributes": True}


# Conversations
class ConversationCreateDirectRequest(BaseModel):
    user_id: int


class ConversationCreateGroupRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    member_ids: list[int] = Field(min_length=1)
    avatar_url: Optional[str] = None


class ConversationMemberResponse(BaseModel):
    id: int
    user: UserResponse
    role: MemberRole
    joined_at: datetime

    model_config = {"from_attributes": True}


class LastMessagePreview(BaseModel):
    id: int
    content: str
    sender_id: int
    sender_name: str
    status: MessageStatus
    created_at: datetime


class ConversationResponse(BaseModel):
    id: int
    type: ConversationType
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    members: list[ConversationMemberResponse] = []
    last_message: Optional[LastMessagePreview] = None
    unread_count: int = 0
    updated_at: datetime

    model_config = {"from_attributes": True}


class GroupMemberUpdateRequest(BaseModel):
    user_id: int


# Messages
class MessageCreateRequest(BaseModel):
    content: str = Field(min_length=1)
    reply_to_id: Optional[int] = None


class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    sender: UserResponse
    content: str
    status: MessageStatus
    reply_to_id: Optional[int] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class MessageStatusUpdateRequest(BaseModel):
    status: MessageStatus


# WebSocket events
class WSEvent(BaseModel):
    type: str
    payload: dict
