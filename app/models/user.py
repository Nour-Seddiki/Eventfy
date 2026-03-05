from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text, FLOAT
from app.db.base import Base
from datetime import datetime, timezone


class User(Base):
    __tablename__ = "users"
    id = Column(Integer ,primary_key=True , index=True )
    username = Column(String, unique=True)
    email = Column(String, unique=True)
    hashed_password = Column(String)
    role = Column(String , default='vistor')
    is_verified = Column(Boolean , default=False)
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
