from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, FLOAT
from app.db.base import Base
from datetime import datetime, timezone


class Event(Base):
    __tablename__ = "events"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, unique=True)
    description = Column(String)
    category = Column(String)
    location = Column(String)
    price = Column(FLOAT)
    currency = Column(String, default="DZD")
    available_tickets = Column(Integer)
    start_date = Column(DateTime)
    end_date = Column(DateTime, nullable=True)
    registration_deadline = Column(DateTime, nullable=True)
    image = Column(String)
    organizer_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
