from pathlib import Path
from dotenv import load_dotenv
from app.db.session import engine, ensure_user_soft_delete_columns
from app.db.base import Base
import app.models
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.routes import auth, tickets, events, users, recommendations, admin ,review

load_dotenv(dotenv_path=Path(__file__).resolve().parents[1] / ".env")

app = FastAPI()

Base.metadata.create_all(bind=engine)
ensure_user_soft_delete_columns()

uploads_dir = Path(__file__).resolve().parents[1] / "uploads"
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")


app.include_router(auth.router)
app.include_router(events.router)
app.include_router(events.public_router)
app.include_router(tickets.router)
app.include_router(users.router)
app.include_router(recommendations.router)
app.include_router(admin.router)
app.include_router(review.router)
