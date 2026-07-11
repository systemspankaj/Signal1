# Signal Clone

A functional clone of the Signal messaging application built as a fullstack assignment project.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| Backend | Python, FastAPI |
| Database | SQLite (SQLAlchemy ORM) |
| Real-time | WebSockets |

## Project Structure

```
Signal/
├── frontend/          # Next.js app (Signal-like UI)
├── backend/           # FastAPI REST + WebSocket API
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+

### Backend Setup

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
python seed.py          # Seed sample data
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:3000

### Demo Accounts

All seeded users share password: `password123`

| Username | Phone | Display Name |
|----------|-------|--------------|
| alice | +15550010001 | Alice Johnson |
| bob | +15550010002 | Bob Smith |
| carol | +15550010003 | Carol Williams |
| dave | +15550010004 | Dave Brown |
| eve | +15550010005 | Eve Davis |
| frank | +15550010006 | Frank Miller |

Mock OTP for registration: `123456`

## Architecture Overview

```
┌─────────────────┐     REST API      ┌──────────────────┐
│   Next.js App   │◄─────────────────►│   FastAPI Server │
│   (Port 3000)   │                   │   (Port 8000)    │
└────────┬────────┘                   └────────┬─────────┘
         │                                     │
         │         WebSocket (/ws)             │
         └─────────────────────────────────────┘
                                               │
                                    ┌──────────▼──────────┐
                                    │   SQLite Database   │
                                    └─────────────────────┘
```

### Real-time Flow

1. Client connects to `/ws?token=<JWT>`
2. Messages sent via WebSocket `send_message` event
3. Server persists to DB and broadcasts `new_message` to all conversation members
4. Typing indicators via `typing` events
5. Read receipts via `viewing` / `mark_read` events

## Database Schema

```
users
├── id (PK)
├── phone (unique, nullable)
├── username (unique, nullable)
├── display_name
├── avatar_url
├── password_hash
├── is_online
├── last_seen
└── created_at

contacts
├── id (PK)
├── owner_id (FK → users)
├── contact_user_id (FK → users)
└── created_at

conversations
├── id (PK)
├── type (direct | group)
├── name (nullable, for groups)
├── avatar_url
├── created_at
└── updated_at

conversation_members
├── id (PK)
├── conversation_id (FK → conversations)
├── user_id (FK → users)
├── role (member | admin)
├── last_read_at
└── joined_at

messages
├── id (PK)
├── conversation_id (FK → conversations)
├── sender_id (FK → users)
├── content
├── status (sending | sent | delivered | read)
├── reply_to_id (FK → messages, nullable)
└── created_at

message_read_receipts
├── id (PK)
├── message_id (FK → messages)
├── user_id (FK → users)
└── read_at
```

## API Overview

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/verify-otp` | Verify mock OTP |
| GET | `/api/auth/me` | Get current user |
| PATCH | `/api/auth/me` | Update profile |
| POST | `/api/auth/logout` | Logout |

### Contacts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/contacts` | List contacts |
| POST | `/api/contacts` | Add contact |
| DELETE | `/api/contacts/{id}` | Remove contact |
| GET | `/api/contacts/search?q=` | Search users |

### Conversations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/conversations` | List conversations |
| POST | `/api/conversations/direct` | Create 1:1 chat |
| POST | `/api/conversations/group` | Create group |
| GET | `/api/conversations/{id}/members` | List members |
| POST | `/api/conversations/{id}/members` | Add member (admin) |
| DELETE | `/api/conversations/{id}/members/{uid}` | Remove member |

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/conversations/{id}/messages` | Get messages |
| POST | `/api/conversations/{id}/messages` | Send message |
| POST | `/api/conversations/{id}/read` | Mark as read |

### WebSocket Events
| Event | Direction | Description |
|-------|-----------|-------------|
| `send_message` | Client → Server | Send a message |
| `typing` | Client → Server | Typing indicator |
| `viewing` | Client → Server | User viewing conversation |
| `new_message` | Server → Client | New message received |
| `message_status` | Server → Client | Status update |
| `user_online` / `user_offline` | Server → Client | Presence update |

## Features Implemented

- ✅ Mock authentication (register, login, OTP verification)
- ✅ Profile with display name and avatar
- ✅ Session persistence (JWT in localStorage)
- ✅ Conversation list with search, unread badges, last message preview
- ✅ Online/offline indicators
- ✅ Real-time 1:1 messaging
- ✅ Real-time group messaging
- ✅ Message timestamps and delivery/read receipts
- ✅ Typing indicators
- ✅ Group creation, member management (admin controls)
- ✅ Signal-inspired dark UI
- ✅ Settings placeholders (privacy, notifications, linked devices, etc.)
- ✅ Seeded sample data

## Assumptions

- End-to-end encryption is **simulated** (not implemented)
- Phone verification uses a fixed OTP: `123456`
- Voice/video calls, stories, and linked devices are placeholder UI
- Password minimum length is 4 characters for demo convenience
- SQLite is used for simplicity; schema is portable to PostgreSQL
- JWT tokens expire after 7 days

## Deployment

### Backend (e.g. Railway / Render)
```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Set environment variables:
- `SECRET_KEY` — production secret
- `CORS_ORIGINS` — frontend URL

### Frontend (e.g. Vercel)
Set environment variables:
- `NEXT_PUBLIC_API_URL` — backend API URL
- `NEXT_PUBLIC_WS_URL` — backend WebSocket URL

## License

Built for educational/assignment purposes.
