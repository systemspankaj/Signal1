from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.config import settings
from app.database import Base, engine, get_db
from app.models import User
from seed import seed_if_empty
from app.routers import auth, contacts, conversations, messages, websocket

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    seed_if_empty()
    yield


app = FastAPI(
    title="Signal Clone API",
    description="Backend API for Signal Clone messaging platform",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(contacts.router, prefix="/api")
app.include_router(conversations.router, prefix="/api")
app.include_router(messages.router, prefix="/api")
app.include_router(websocket.router)


@app.get("/api/health")
def health(db: Session = Depends(get_db)):
    user_count = db.query(User).count()
    return {"status": "ok", "users": user_count}


@app.post("/api/setup")
def setup_demo_data(db: Session = Depends(get_db)):
    """Seed demo data if database is empty (safe for first deploy)."""
    if db.query(User).count() > 0:
        return {"message": "Already seeded", "users": db.query(User).count()}
    seed_if_empty()
    return {"message": "Demo data seeded", "users": db.query(User).count()}