from fastapi import HTTPException, status
from datetime import datetime, timezone
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError

from app.models.event import Event
from app.models.ticket import Ticket


def _event_to_dict(event):
    """Standard event serializer with id and organizer_id."""
    return {
        "id": event.id,
        "title": event.title,
        "description": event.description,
        "category": event.category,
        "location": event.location,
        "price": event.price,
        "date": event.date.isoformat() if event.date else None,
        "available_tickets": event.available_tickets,
        "image": event.image,
        "organizer_id": event.organizer_id,
    }


class EventService:

    def create_event(self, user, db, event_data):
        if user is None:
            raise HTTPException(status_code=401, detail="Authentication failed")

        if user.get("user_role") != "organizer":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only organizers can create events",
            )

        existing_title = db.query(Event).filter(Event.title == event_data.title).first()
        if existing_title:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Event title already exists",
            )

        event = Event(
            title=event_data.title,
            description=event_data.description,
            category=event_data.category,
            location=event_data.location,
            price=event_data.price,
            available_tickets=event_data.available_tickets,
            date=event_data.date,
            image=event_data.image,
            organizer_id=user.get("user_id"),
        )

        db.add(event)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Event title already exists",
            )
        db.refresh(event)

        return _event_to_dict(event)

    def update_event(self, user, db, updated_event, event_id: int):
        if user is None:
            raise HTTPException(status_code=401, detail="Authentication failed")

        if user.get("user_role") != "organizer":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only organizers can update events",
            )

        event_model = db.query(Event).filter(Event.id == event_id).first()
        if event_model is None:
            raise HTTPException(status_code=404, detail="Event not found")

        updates = updated_event.model_dump(exclude_unset=True)
        # Prevent duplicate title collisions
        if "title" in updates and updates["title"] != event_model.title:
            existing_title = (
                db.query(Event)
                .filter(Event.title == updates["title"], Event.id != event_id)
                .first()
            )
            if existing_title:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Event title already exists",
                )

        for field, value in updates.items():
            setattr(event_model, field, value)

        db.add(event_model)
        db.commit()
        db.refresh(event_model)
        return {"message": "Event has been updated"}

    def delete_event(self, user, db, event_id):
        if user is None:
            raise HTTPException(status_code=401, detail="Authentication failed")

        if user.get("user_role") != "organizer":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only organizers can delete events",
            )

        event_model = db.query(Event).filter(Event.id == event_id).first()
        if event_model is None:
            raise HTTPException(status_code=404, detail="Event not found")

        db.delete(event_model)
        db.commit()
        return {"message": "Event has been deleted successfully"}

    def get_event_by_id(self, user, db, event_id):
        if user is None:
            raise HTTPException(status_code=401, detail="Authentication failed")

        event_model = db.query(Event).filter(Event.id == event_id).first()
        if event_model is None:
            raise HTTPException(status_code=404, detail="Event not found")
        return _event_to_dict(event_model)

    def list_events(self, user, db):
        if user is None:
            raise HTTPException(status_code=401, detail="Authentication failed")

        event_models = db.query(Event).all()
        if not event_models:
            return []

        return [_event_to_dict(e) for e in event_models]

    def search_events_by_title(self, user, db, keyword):
        if user is None:
            raise HTTPException(status_code=401, detail="Authentication failed")

        event_models = db.query(Event).filter(Event.title.ilike(f"%{keyword}%")).all()
        if not event_models:
            return []
        return [_event_to_dict(e) for e in event_models]

    def search_events_by_location(self, user, db, keyword):
        if user is None:
            raise HTTPException(status_code=401, detail="Authentication failed")

        event_models = db.query(Event).filter(Event.location.ilike(f"%{keyword}%")).all()
        if not event_models:
            return []
        return [_event_to_dict(e) for e in event_models]

    def search_events_by_category(self, user, db, keyword):
        if user is None:
            raise HTTPException(status_code=401, detail="Authentication failed")

        event_models = db.query(Event).filter(Event.category.ilike(f"%{keyword}%")).all()
        if not event_models:
            return []
        return [_event_to_dict(e) for e in event_models]

    def trending_events(self, user, db, limit: int = 5):
        if user is None:
            raise HTTPException(status_code=401, detail="Authentication failed")

        current_time = datetime.now(timezone.utc)
        safe_limit = max(1, min(limit, 50))

        trending_rows = (
            db.query(
                Event,
                func.count(Ticket.id).label("tickets_sold"),
            )
            .outerjoin(
                Ticket,
                (Ticket.event_id == Event.id) & (Ticket.status != "cancelled"),
            )
            .filter(Event.date >= current_time, Event.available_tickets > 0)
            .group_by(Event.id)
            .order_by(func.count(Ticket.id).desc(), Event.date.asc())
            .limit(safe_limit)
            .all()
        )

        if not trending_rows:
            return []

        return [
            {
                **_event_to_dict(event),
                "tickets_sold": tickets_sold,
            }
            for event, tickets_sold in trending_rows
        ]

    def similar_events(self, user, db, event_id: int, limit: int = 5):
        if user is None:
            raise HTTPException(status_code=401, detail="Authentication failed")

        base_event = db.query(Event).filter(Event.id == event_id).first()
        if base_event is None:
            raise HTTPException(status_code=404, detail="Event not found")

        if not base_event.category:
            return []

        safe_limit = max(1, min(limit, 50))
        similar_event_models = (
            db.query(Event)
            .filter(Event.category == base_event.category, Event.id != base_event.id)
            .order_by(Event.date.asc())
            .limit(safe_limit)
            .all()
        )

        if not similar_event_models:
            return []

        return [_event_to_dict(e) for e in similar_event_models]

    def upload_event_image(self, user, db, event_id: int, image_path: str):
        if user is None:
            raise HTTPException(status_code=401, detail="Authentication failed")

        if user.get("user_role") != "organizer":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only organizers can update events",
            )

        event_model = db.query(Event).filter(Event.id == event_id).first()
        if event_model is None:
            raise HTTPException(status_code=404, detail="Event not found")

        event_model.image = image_path
        db.add(event_model)
        db.commit()
        db.refresh(event_model)
        return {"message": "Event image has been updated", "image": image_path}
