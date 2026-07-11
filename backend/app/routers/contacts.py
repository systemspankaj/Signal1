from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.auth import get_current_user, get_user_by_identifier
from app.database import get_db
from app.models import Contact, User
from app.schemas import ContactCreateRequest, ContactResponse, UserResponse
from app.services import user_to_response

router = APIRouter(prefix="/contacts", tags=["contacts"])


@router.get("", response_model=list[ContactResponse])
def list_contacts(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    contacts = (
        db.query(Contact)
        .options(joinedload(Contact.contact_user))
        .filter(Contact.owner_id == user.id)
        .order_by(Contact.created_at.desc())
        .all()
    )
    return [
        ContactResponse(
            id=c.id,
            user=user_to_response(c.contact_user),
            created_at=c.created_at,
        )
        for c in contacts
    ]


@router.post("", response_model=ContactResponse, status_code=201)
def add_contact(data: ContactCreateRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    contact_user = get_user_by_identifier(db, data.identifier)
    if not contact_user:
        raise HTTPException(status_code=404, detail="User not found")
    if contact_user.id == user.id:
        raise HTTPException(status_code=400, detail="Cannot add yourself as a contact")

    existing = (
        db.query(Contact)
        .filter(Contact.owner_id == user.id, Contact.contact_user_id == contact_user.id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Contact already exists")

    contact = Contact(owner_id=user.id, contact_user_id=contact_user.id)
    db.add(contact)
    db.commit()
    db.refresh(contact)

    return ContactResponse(
        id=contact.id,
        user=user_to_response(contact_user),
        created_at=contact.created_at,
    )


@router.delete("/{contact_id}")
def remove_contact(contact_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    contact = db.query(Contact).filter(Contact.id == contact_id, Contact.owner_id == user.id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    db.delete(contact)
    db.commit()
    return {"message": "Contact removed"}


@router.get("/search", response_model=list[UserResponse])
def search_users(q: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from sqlalchemy import func, or_

    query = q.strip()
    if not query:
        return []

    users = (
        db.query(User)
        .filter(
            User.id != user.id,
            or_(
                func.lower(User.display_name).contains(query.lower()),
                func.lower(User.username).contains(query.lower()),
                func.lower(User.phone).contains(query.lower()),
            ),
        )
        .limit(20)
        .all()
    )
    return [UserResponse.model_validate(u) for u in users]
