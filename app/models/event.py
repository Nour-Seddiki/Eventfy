from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, FLOAT
from app.db.base import Base
from datetime import datetime, timezone 


class Event(Base):
    __tablename__ = "events"
    id = Column(Integer ,primary_key=True , index=True )
    title = Column(String , unique =True)
    description = Column(String)
    category = Column(String)
    location = Column(String)
    price = Column(FLOAT)
    available_tickets = Column(Integer)
    date = Column(DateTime)
    organizer_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
