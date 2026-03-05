from datetime import datetime , timezone
from io import BytesIO
from sqlalchemy import and_
from app.models.ticket import Ticket
from app.models.event import Event
from app.models.user import User
from fastapi import HTTPException, status, BackgroundTasks
import uuid
import qrcode
from app.utils.email_sender import send_ticket_email
from app.utils.qr_generator import generate_qr_code


def _ticket_to_dict(ticket: Ticket) -> dict:
    return {
        "id": str(ticket.id),
        "user_id": ticket.user_id,
        "event_id": ticket.event_id,
        "qr_code": ticket.qr_code,
        "status": ticket.status,
        "purchased_at": ticket.purchased_at,
    }




class TickectService:
    
   def purchase_ticket(self, user, db, event_id ,background_tasks: BackgroundTasks):

    #  Authenticate user
    if user is None:
        raise HTTPException(status_code=401, detail="Authentication failed")
    user_model = db.query(User).filter(User.id == user.get("user_id")).first()
    if user_model is None:
        raise HTTPException(status_code=401, detail="Authentication failed")

    #  Check if event exists
    event_model = db.query(Event).filter(Event.id == event_id).first()
    if event_model is None:
        raise HTTPException(status_code=404, detail="Event not found")

    #  Validate event date
    current_time = datetime.now(timezone.utc)
    if event_model.date is None:
        raise HTTPException(status_code=400, detail="Event date is missing")
    event_time = event_model.date
    if event_time.tzinfo is None:
        event_time = event_time.replace(tzinfo=timezone.utc)
    if event_time < current_time:
        raise HTTPException(status_code=400, detail="The event time is over")

    # Check ticket availability
    if event_model.available_tickets <= 0:
        raise HTTPException(status_code=400, detail="The event tickets have been sold out")

    #  Prevent duplicate purchase
    existing_ticket = db.query(Ticket).filter(
        and_(
            Ticket.user_id == user_model.id,
            Ticket.event_id == event_id,
            Ticket.status == "active"
        )
    ).first()

    if existing_ticket:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User has already purchased a ticket for this event."
        )

    unique_id, qr_bytes = generate_qr_code()
    #  Create ticket record with QR image
    new_ticket = Ticket(
        user_id=user_model.id,
        event_id=event_id,
        qr_code=unique_id,
        qr_image=qr_bytes,   
        status="active",
        purchased_at=current_time
    )

    #  Update event available tickets
    db.add(new_ticket)
    event_model.available_tickets -= 1

    
    db.commit()
    db.refresh(new_ticket)
    
    background_tasks.add_task(
        send_ticket_email,
        user_email=user_model.email,
        event_name=event_model.title,
        event_date=str(event_model.date),
        qr_image=new_ticket.qr_image
    )

    return _ticket_to_dict(new_ticket)

  
   def cancel_ticket(self, user, db, event_id):

    #  Authentication
    if user is None:
        raise HTTPException(status_code=401, detail="Authentication failed")

    #  Check event exists
    event_model = db.query(Event).filter(Event.id == event_id).first()
    if event_model is None:
        raise HTTPException(status_code=404, detail="Event not found")

    #  Prevent cancelling after event started
    current_time = datetime.now(timezone.utc)
    if event_model.date is None:
        raise HTTPException(status_code=400, detail="Event date is missing")
    event_time = event_model.date
    if event_time.tzinfo is None:
        event_time = event_time.replace(tzinfo=timezone.utc)
    if event_time < current_time:
        raise HTTPException(status_code=400, detail="The event time is over")

    #  Find user's active ticket
    ticket_model = db.query(Ticket).filter(
        and_(
            Ticket.user_id == user.get("user_id"),
            Ticket.event_id == event_id,
            Ticket.status == "active"
        )
    ).first()

    if ticket_model is None:
        raise HTTPException(
            status_code=404,
            detail="Active ticket not found for this user"
        )

    #  Cancel ticket
    ticket_model.status = "cancelled"

    #  Increase available tickets
    event_model.available_tickets += 1

    #  Commit changes
    db.commit()

    return {"message": "Ticket successfully cancelled"}
   

   def validate_ticket(self,user,db,qr_input):
      if user is None:
        raise HTTPException(status_code=401 ,detail="Authentication failed")
      
      ticket_model = db.query(Ticket).filter(Ticket.qr_code == qr_input).first()
      if ticket_model is None:
         raise HTTPException(status_code=404 , detail="invalid ticket ")
      
      if ticket_model.status == "cancelled":
         raise HTTPException(status_code=404 , detail="invalid ticket")
      if ticket_model.status == "used":
         raise HTTPException(status_code=404 , detail="invalid ticket")
      if ticket_model.status != "active":
         raise HTTPException(status_code=404 , detail="invalid ticket")
      
      event = db.query(Event).filter(Event.id == ticket_model.event_id).first()
      if event is None:
         raise HTTPException(status_code=404 , detail="event not found")
      current_time = datetime.now(timezone.utc)
      if event.date is None:
         raise HTTPException(status_code=400 , detail="Event date is missing")
      event_time = event.date
      if event_time.tzinfo is None:
         event_time = event_time.replace(tzinfo=timezone.utc)
      if event_time < current_time:
         raise HTTPException(status_code=400 , detail="this event has already finished")
      
      if event_time.date() != current_time.date():
        raise HTTPException(
            status_code=400,
            detail="Ticket not valid for today"
        )

        # Mark as used
      ticket_model.status = "used"

      db.commit()

      return {"message": "Entry allowed"}
   
   def get_user_tickets(self,user,db):
      if user is None:
         raise HTTPException(status_code=401 , detail="Authentication failed")
      
      ticket_model = db.query(Ticket).filter(Ticket.user_id == user.get("user_id")).all()
      if not ticket_model :
         raise HTTPException(status_code=404 , detail= "the user ticket lis is empty ")
      
      return [_ticket_to_dict(t) for t in ticket_model]
      
      

      
      
       
        
