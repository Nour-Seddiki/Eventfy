from datetime import datetime, timezone

from fastapi import HTTPException
from app.models.event import Event
from app.models.ticket import Ticket
from app.schemas.user import update_password, UpdateUser
from app.models.user import User
from app.services.auth_service import verifying_password, hashing_password


class userServices:
    @staticmethod
    def _get_active_user(user, db) -> User:
        if user is None:
            raise HTTPException(status_code=401, detail="Authentication failed")

        user_model = (
            db.query(User)
            .filter(User.id == user.get("user_id"), User.is_deleted.is_(False))
            .first()
        )
        if user_model is None:
            raise HTTPException(status_code=404, detail="user not found")
        return user_model

    @staticmethod
    def change_password(user, db, data: update_password):
        user_model = userServices._get_active_user(user, db)

        if not verifying_password(data.current_password, user_model.hashed_password):
            raise HTTPException(status_code=401, detail="invalid password")
        user_model.hashed_password = hashing_password(data.new_password)

        db.add(user_model)
        db.commit()
        db.refresh(user_model)
        return {"message": "the password has been changed successfully"}

    @staticmethod
    def update_user(user, db, data: UpdateUser):
        user_model = userServices._get_active_user(user, db)

        user_model.username = data.user_name
        user_model.email = data.email
        user_model.role = data.role

        db.add(user_model)
        db.commit()
        db.refresh(user_model)
        return {"message": "the user has been updated successfully"}


    def get_my_profile(self ,user,db):
        user_model = self._get_active_user(user, db)
        return {
            "username": user_model.username,
            "email": user_model.email,
            "role": user_model.role,
            "is_verified": user_model.is_verified,
            "created_at": user_model.created_at,
        }
    


    def delete_my_account(self,user,db):
        user_model = self._get_active_user(user, db)

        if user_model.is_deleted:
            return {"message": "user account already deleted"}

        # Soft delete keeps historical data for tickets/events.
        user_model.is_deleted = True
        user_model.deleted_at = datetime.now(timezone.utc)
        user_model.is_verified = False
        db.add(user_model)
        db.commit()
        return {"message": "user has been soft deleted successfully"}

    def get_my_activity(self ,user,db):
        user_model = self._get_active_user(user, db)

        tickets = db.query(Ticket).filter(Ticket.user_id == user_model.id).all()
        events = []
        if user_model.role == "organizer":
            events = db.query(Event).filter(Event.organizer_id == user_model.id).all()

        return {
            "user": {
                "id": user_model.id,
                "username": user_model.username,
                "email": user_model.email,
                "role": user_model.role,
            },
            "tickets": [
                {
                    "ticket_id": str(ticket.id),
                    "event_id": ticket.event_id,
                    "status": ticket.status,
                    "purchased_at": ticket.purchased_at,
                }
                for ticket in tickets
            ],
            "organized_events": [
                {
                    "event_id": event.id,
                    "title": event.title,
                    "date": event.date,
                    "available_tickets": event.available_tickets,
                }
                for event in events
            ],
        }

         
