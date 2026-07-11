"""Seed the database with sample users, contacts, conversations, and messages."""

import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.auth import hash_password
from app.database import Base, SessionLocal, engine
from app.models import (
    Contact,
    Conversation,
    ConversationMember,
    ConversationType,
    MemberRole,
    Message,
    MessageStatus,
    User,
)

AVATARS = [
    "https://api.dicebear.com/7.x/avataaars/svg?seed=alice",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=bob",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=carol",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=dave",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=eve",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=frank",
]


def seed_if_empty():
    """Seed demo data only when the database has no users (safe for production deploy)."""
    db = SessionLocal()
    try:
        if db.query(User).count() > 0:
            return
    finally:
        db.close()
    seed(reset=False)


def seed(reset: bool = True):
    if reset:
        Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    users_data = [
        {"phone": "+15550010001", "username": "alice", "display_name": "Alice Johnson", "password": "password123"},
        {"phone": "+15550010002", "username": "bob", "display_name": "Bob Smith", "password": "password123"},
        {"phone": "+15550010003", "username": "carol", "display_name": "Carol Williams", "password": "password123"},
        {"phone": "+15550010004", "username": "dave", "display_name": "Dave Brown", "password": "password123"},
        {"phone": "+15550010005", "username": "eve", "display_name": "Eve Davis", "password": "password123"},
        {"phone": "+15550010006", "username": "frank", "display_name": "Frank Miller", "password": "password123"},
    ]

    users = []
    for i, u in enumerate(users_data):
        user = User(
            phone=u["phone"],
            username=u["username"],
            display_name=u["display_name"],
            password_hash=hash_password(u["password"]),
            avatar_url=AVATARS[i],
            is_online=i < 3,
        )
        db.add(user)
        users.append(user)
    db.commit()

    # Contacts for Alice
    for other in users[1:4]:
        db.add(Contact(owner_id=users[0].id, contact_user_id=other.id))
        db.add(Contact(owner_id=other.id, contact_user_id=users[0].id))
    db.commit()

    now = datetime.now(timezone.utc)

    def create_direct(u1, u2, messages_data):
        conv = Conversation(type=ConversationType.DIRECT, updated_at=now)
        db.add(conv)
        db.flush()
        db.add(ConversationMember(conversation_id=conv.id, user_id=u1.id))
        db.add(ConversationMember(conversation_id=conv.id, user_id=u2.id))
        for i, (sender, content, status) in enumerate(messages_data):
            msg_time = now - timedelta(hours=len(messages_data) - i)
            msg = Message(
                conversation_id=conv.id,
                sender_id=sender.id,
                content=content,
                status=status,
                created_at=msg_time,
            )
            db.add(msg)
        conv.updated_at = now - timedelta(minutes=5)
        return conv

    # Alice <-> Bob conversation
    create_direct(users[0], users[1], [
        (users[1], "Hey Alice! How are you?", MessageStatus.READ),
        (users[0], "Hi Bob! I'm doing great, thanks!", MessageStatus.READ),
        (users[1], "Want to grab coffee later?", MessageStatus.READ),
        (users[0], "Sure! How about 3pm?", MessageStatus.READ),
        (users[1], "Perfect, see you then ☕", MessageStatus.DELIVERED),
    ])

    # Alice <-> Carol conversation
    create_direct(users[0], users[2], [
        (users[2], "Did you see the new project requirements?", MessageStatus.READ),
        (users[0], "Yes! Looks exciting.", MessageStatus.READ),
        (users[2], "Let's discuss in the team meeting tomorrow.", MessageStatus.READ),
        (users[0], "Sounds good 👍", MessageStatus.SENT),
    ])

    # Bob <-> Dave conversation
    create_direct(users[1], users[3], [
        (users[3], "Game night this Friday?", MessageStatus.READ),
        (users[1], "Count me in!", MessageStatus.READ),
        (users[3], "I'll bring snacks", MessageStatus.READ),
    ])

    # Group: Project Team
    group = Conversation(
        type=ConversationType.GROUP,
        name="Project Team",
        avatar_url="https://api.dicebear.com/7.x/identicon/svg?seed=project-team",
        updated_at=now - timedelta(minutes=2),
    )
    db.add(group)
    db.flush()

    group_members = [users[0], users[1], users[2], users[4]]
    for i, u in enumerate(group_members):
        role = MemberRole.ADMIN if i == 0 else MemberRole.MEMBER
        db.add(ConversationMember(conversation_id=group.id, user_id=u.id, role=role))

    group_messages = [
        (users[0], "Welcome to the project team group!", MessageStatus.READ),
        (users[1], "Thanks for setting this up Alice", MessageStatus.READ),
        (users[2], "What's our first milestone?", MessageStatus.READ),
        (users[0], "MVP by end of month. Let's sync tomorrow.", MessageStatus.READ),
        (users[4], "I'll prepare the design mockups", MessageStatus.DELIVERED),
        (users[1], "I can handle the backend API", MessageStatus.SENT),
    ]
    for i, (sender, content, status) in enumerate(group_messages):
        db.add(Message(
            conversation_id=group.id,
            sender_id=sender.id,
            content=content,
            status=status,
            created_at=now - timedelta(hours=6 - i),
        ))

    # Group: Weekend Plans
    group2 = Conversation(
        type=ConversationType.GROUP,
        name="Weekend Plans",
        avatar_url="https://api.dicebear.com/7.x/identicon/svg?seed=weekend",
        updated_at=now - timedelta(hours=12),
    )
    db.add(group2)
    db.flush()

    weekend_members = [
        (users[1], MemberRole.ADMIN),
        (users[3], MemberRole.MEMBER),
        (users[5], MemberRole.MEMBER),
    ]
    for u, role in weekend_members:
        db.add(ConversationMember(conversation_id=group2.id, user_id=u.id, role=role))

    db.add(Message(
        conversation_id=group2.id,
        sender_id=users[3].id,
        content="Hiking on Saturday anyone?",
        status=MessageStatus.READ,
        created_at=now - timedelta(hours=12),
    ))

    db.commit()
    db.close()
    print("Database seeded successfully!")
    print("\nDemo accounts (password: password123):")
    for u in users_data:
        print(f"  - {u['username']} ({u['phone']}) - {u['display_name']}")
    print("\nMock OTP: 123456")


if __name__ == "__main__":
    seed()
