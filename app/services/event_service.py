from fastapi import HTTPException, status
from datetime import datetime, timezone
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError

from app.models.event import Event
from app.models.ticket import Ticket





class EventService:

    def create_event(self, user, db, event_data):
        if user is None:
         raise HTTPException(status_code=401 , detail="Authentification failed")
       
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
            category = event_data.category,
            location = event_data.location,
            price = event_data.price,
            available_tickets = event_data.available_tickets,
            date = event_data.date,
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

        return event
    

    def update_event(self,user ,db,updated_event , event_id:int ,):
        if user is None:
         raise HTTPException(status_code=401 , detail="Authentification failed")

        if user.get("user_role") != "organizer":
            raise Exception("Only organizers can create events")
        
        event_model = db.query(Event).filter(Event.id == event_id).first()
        if event_model is None : 
            raise HTTPException(status_code=404 , detail="event not found")
        
        # Prevent duplicate title collisions
        if updated_event.title != event_model.title:
            existing_title = (
                db.query(Event)
                .filter(Event.title == updated_event.title, Event.id != event_id)
                .first()
            )
            if existing_title:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Event title already exists",
                )
        event_model.title = updated_event.title
        event_model.description = updated_event.description
        event_model.category = updated_event.category
        event_model.location = updated_event.location
        event_model.price = updated_event.price
        event_model.available_tickets = updated_event.available_tickets
        event_model.date = updated_event.date
        
        db.add(event_model)
        db.commit()
        db.refresh(event_model)
        return {"mesage":"event has been updated"}
    


    def delete_event(self,user,db,event_id):
        if user is None:
         raise HTTPException(status_code=401 , detail="Authentification failed")
    
        if user.get("user_role") != "organizer":
            raise Exception("Only organizers can create events")
         
        event_model = db.query(Event).filter(Event.id == event_id).first()
        if event_model is None : 
            raise HTTPException(status_code=404 , detail="event not found")

        db.delete(event_model)
        db.commit()
        return {"mesage":"event has been deleted successfelly"}

    def get_event_by_id(self,user,db,event_id):
        if user is None:
         raise HTTPException(status_code=401 , detail="Authentification failed")  
        
        event_model = db.query(Event).filter(Event.id == event_id).first()
        if event_model is None:
           raise HTTPException(status_code=404 , detail="event not found")
        event_for_user = [
        {
            "title": event_model.title,
            "description":event_model.description,
            "category":event_model.category,
            "location":event_model.location,
            "price":event_model.price,
            "date":event_model.date,
            "available_tickets":event_model.available_tickets,
        }
    ]
        return event_for_user
    
    def list_events(self,user,db):
        if user is None:
         raise HTTPException(status_code=401 , detail="Authentification failed")  
        
        event_models = db.query(Event).all()
        if not event_models:
           raise HTTPException(status_code=404 , detail="event not found")
        
        event_for_user = [
            {
                "title": event_model.title,
                "description": event_model.description,
                "category": event_model.category,
                "location": event_model.location,
                "price": event_model.price,
                "date":event_model.date,
                "available_tickets": event_model.available_tickets,
            }
            for event_model in event_models
        ]
        return event_for_user
    
    def search_events_by_title(self ,user,db,keyword):
       if user is None:
        raise HTTPException(status_code=401 , detail="Authentification failed")
       
       event_models = db.query(Event).filter(Event.title.ilike(f"%{keyword}%")).all()
       if not event_models:
        raise HTTPException(status_code=404 , detail="event not found")
       event_for_user = [
        {
            "title": event_model.title,
            "description": event_model.description,
            "category": event_model.category,
            "location": event_model.location,
            "price": event_model.price,
            "date":event_model.date,
            "available_tickets": event_model.available_tickets,
        }
        for event_model in event_models
       ]
       return event_for_user
       
    def search_events_by_location(self ,user,db,keyword):
       if user is None:
        raise HTTPException(status_code=401 , detail="Authentification failed")
       
       event_models = db.query(Event).filter(Event.location.ilike(f"%{keyword}%")).all()
       if not event_models:
        raise HTTPException(status_code=404 , detail="event not found")
       event_for_user = [
        {
            "title": event_model.title,
            "description": event_model.description,
            "category": event_model.category,
            "location": event_model.location,
            "price": event_model.price,
            "date":event_model.date,
            "available_tickets": event_model.available_tickets,
        }
        for event_model in event_models
       ]
       return event_for_user 
    

    def search_events_by_category(self ,user,db,keyword):
       if user is None:
        raise HTTPException(status_code=401 , detail="Authentification failed")
       
       event_models = db.query(Event).filter(Event.category.ilike(f"%{keyword}%")).all()
       if not event_models:
        raise HTTPException(status_code=404 , detail="event not found")
       event_for_user = [
        {
            "title": event_model.title,
            "description": event_model.description,
            "category": event_model.category,
            "location": event_model.location,
            "price": event_model.price,
            "date":event_model.date,
            "available_tickets": event_model.available_tickets,
        }
        for event_model in event_models
       ]
       return event_for_user

    def trending_events(self, user, db, limit: int = 5):
       if user is None:
        raise HTTPException(status_code=401 , detail="Authentification failed")

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
        raise HTTPException(status_code=404 , detail="event not found")

       return [
        {
            "title": event.title,
            "description": event.description,
            "category": event.category,
            "location": event.location,
            "price": event.price,
            "date": event.date,
            "available_tickets": event.available_tickets,
            "tickets_sold": tickets_sold,
        }
        for event, tickets_sold in trending_rows
       ]

    def similar_events(self, user, db, event_id: int, limit: int = 5):
       if user is None:
        raise HTTPException(status_code=401 , detail="Authentification failed")

       base_event = db.query(Event).filter(Event.id == event_id).first()
       if base_event is None:
        raise HTTPException(status_code=404 , detail="event not found")

       if not base_event.category:
        raise HTTPException(status_code=404 , detail="event category not found")

       safe_limit = max(1, min(limit, 50))
       similar_event_models = (
        db.query(Event)
        .filter(Event.category == base_event.category, Event.id != base_event.id)
        .order_by(Event.date.asc())
        .limit(safe_limit)
        .all()
       )

       if not similar_event_models:
        raise HTTPException(status_code=404 , detail="similar events not found")

       return [
        {
            "title": event_model.title,
            "description": event_model.description,
            "category": event_model.category,
            "location": event_model.location,
            "price": event_model.price,
            "date": event_model.date,
            "available_tickets": event_model.available_tickets,
        }
        for event_model in similar_event_models
       ]


       
        
         


        


