from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime
from enum import Enum


class NotificationType(str, Enum):
    EVENT_REMINDER = "event_reminder"
    BOOKING_CONFIRMED = "booking_confirmed"
    BOOKING_CANCELLED = "booking_cancelled"
    PAYMENT_REFUNDED = "payment_refunded"
    REVIEW_POSTED = "review_posted"
    EVENT_UPDATED = "event_updated"
    EVENT_CANCELLED = "event_cancelled"


class CreateNotification(BaseModel):
    user_id: int
    type: NotificationType
    title: str = Field(min_length=1, max_length=200)
    message: str = Field(min_length=1, max_length=1000)
    related_object_id: Optional[str] = None
    related_object_type: Optional[str] = None


class UpdateNotification(BaseModel):
    read: bool


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    user_id: int
    type: str
    title: str
    message: str
    read: bool
    related_object_id: Optional[str]
    related_object_type: Optional[str]
    created_at: datetime
    updated_at: datetime


class NotificationListResponse(BaseModel):
    total: int
    unread_count: int
    notifications: list[NotificationResponse]
