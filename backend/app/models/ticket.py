from sqlalchemy import Column, Integer, LargeBinary, String, Boolean, ForeignKey, DateTime, FLOAT
from app.db.base import Base
from datetime import datetime, timezone
from sqlalchemy.dialects.postgresql import UUID
import uuid

class Ticket(Base):
    __tablename__= "tickets"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Integer , ForeignKey("users.id"))
    event_id = Column(Integer , ForeignKey("events.id"))
    qr_code = Column(String, unique=True)  
    qr_image = Column(LargeBinary)
    status = Column(String )
    purchased_at = Column(DateTime, default=datetime.now(timezone.utc))
