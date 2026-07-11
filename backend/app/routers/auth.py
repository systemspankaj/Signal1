from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import create_access_token, get_current_user, get_user_by_identifier, hash_password, verify_password
from app.config import settings
from app.database import get_db
from app.models import User
from app.schemas import (
    LoginRequest,
    OTPVerifyRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
    UserUpdateRequest,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    if not data.phone and not data.username:
        raise HTTPException(status_code=400, detail="Phone or username is required")

    if data.phone:
        existing = db.query(User).filter(User.phone == data.phone).first()
        if existing:
            raise HTTPException(status_code=400, detail="Phone already registered")

    if data.username:
        existing = db.query(User).filter(User.username == data.username).first()
        if existing:
            raise HTTPException(status_code=400, detail="Username already taken")

    user = User(
        phone=data.phone,
        username=data.username,
        display_name=data.display_name,
        avatar_url=data.avatar_url,
        password_hash=hash_password(data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.post("/verify-otp", response_model=dict)
def verify_otp(data: OTPVerifyRequest):
    if data.otp != settings.mock_otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    return {"verified": True, "message": "OTP verified successfully"}


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = get_user_by_identifier(db, data.identifier)
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(user.id)
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.get("/me", response_model=UserResponse)
def get_me(user: User = Depends(get_current_user)):
    return UserResponse.model_validate(user)


@router.patch("/me", response_model=UserResponse)
def update_me(data: UserUpdateRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if data.display_name is not None:
        user.display_name = data.display_name
    if data.avatar_url is not None:
        user.avatar_url = data.avatar_url
    db.commit()
    db.refresh(user)
    return UserResponse.model_validate(user)


@router.post("/logout")
def logout(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from datetime import datetime, timezone

    user.is_online = False
    user.last_seen = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Logged out successfully"}
