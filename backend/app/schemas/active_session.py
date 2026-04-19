from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ActiveSessionResponse(BaseModel):
    id: int
    device_name: Optional[str] = None
    device_type: Optional[str] = None
    ip_address: Optional[str] = None
    os: Optional[str] = None
    browser: Optional[str] = None
    is_active: bool
    is_current: bool = False
    last_activity: Optional[datetime] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
