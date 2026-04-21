from fastapi import APIRouter, Path, BackgroundTasks, HTTPException, status as fastapi_status, Query
from app.db.session import db_dependency 
from starlette import status 
from app.services.auth_service import user_dependency
from app.services.ticket_service import TickectService
from app.schemas.ticket import TicketQRInput
from app.schemas.payment import PaymentMethodEnum

router = APIRouter(prefix='/ticket', tags=['ticket'])


@router.post("/purchase_ticket/{event_id}", status_code=status.HTTP_201_CREATED)
async def purchase_ticket(
    user: user_dependency,
    db: db_dependency,
    background_tasks: BackgroundTasks,
    event_id: int = Path(gt=0),
    payment_method: PaymentMethodEnum = Query(default=PaymentMethodEnum.edahabia),
):
    """
    Book a ticket for an event.
    - Free event  → ticket is issued immediately.
    - Paid event  → returns a Chargily checkout URL; ticket is issued after payment is confirmed.
    """
    return TickectService().purchase_ticket(user, db, event_id, background_tasks, payment_method.value)

@router.put("/cancell_ticket/{event_id}",status_code=status.HTTP_201_CREATED)
async def cancell_ticket(user:user_dependency,db:db_dependency,event_id:int=Path(gt=0)):
    return TickectService().cancel_ticket(user,db,event_id)

@router.post("/validate_ticket",status_code=status.HTTP_201_CREATED)
async def validate_ticket(user:user_dependency,db:db_dependency,qr_input: TicketQRInput):
    qr_value = qr_input.qr_input or qr_input.qr_code
    if not qr_value:
        raise HTTPException(
            status_code=fastapi_status.HTTP_400_BAD_REQUEST,
            detail='Provide "qr_input" or "qr_code" in request body',
        )
    return TickectService().validate_ticket(user,db,qr_value)

@router.get("/get_user_tickets",status_code=status.HTTP_200_OK)
async def get_user_ticket(user:user_dependency , db:db_dependency):
    return TickectService().get_user_tickets(user,db)
    
