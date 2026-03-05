from fastapi import Depends
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from typing import Annotated
from app.config import settings

SQLALCHEMY_DATABASE_URL = settings.database_url
is_sqlite = SQLALCHEMY_DATABASE_URL.startswith("sqlite")

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False} if is_sqlite else {},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

db_dependency = Annotated[Session,Depends(get_db)]


def ensure_user_soft_delete_columns():
    """SQLite-safe schema patch for existing databases without migrations."""
    with engine.begin() as connection:
        columns = {
            row[1] for row in connection.execute(text("PRAGMA table_info(users)")).fetchall()
        }

        if "is_deleted" not in columns:
            connection.execute(
                text("ALTER TABLE users ADD COLUMN is_deleted BOOLEAN DEFAULT 0")
            )
        if "deleted_at" not in columns:
            connection.execute(
                text("ALTER TABLE users ADD COLUMN deleted_at DATETIME")
            )
