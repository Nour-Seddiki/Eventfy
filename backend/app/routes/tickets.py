from fastapi import APIRouter, Path, BackgroundTasks, HTTPException, status as fastapi_status
from app.db.session import db_dependency 
from starlette import status 
from app.services.auth_service import user_dependency
from app.services.ticket_service import TickectService
from app.schemas.ticket import TicketQRInput
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix='/ticket', tags=['ticket'])


@router.get("/test-email", status_code=status.HTTP_200_OK)
def test_email_sending(user: user_dependency):
    """Temporary diagnostic: test if SMTP works on this server."""
    if user is None:
        raise HTTPException(status_code=401, detail="Auth required")
    
    from app.config import settings
    import smtplib
    from email.mime.text import MIMEText
    
    result = {
        "smtp_host": settings.smtp_host,
        "smtp_port": settings.smtp_port,
        "smtp_user": settings.smtp_user or "NOT SET",
        "smtp_password_set": bool(settings.smtp_password),
        "smtp_from": settings.smtp_from or "NOT SET",
        "smtp_use_tls": settings.smtp_use_tls,
    }
    
    if not settings.smtp_user or not settings.smtp_password:
        result["error"] = "SMTP credentials missing"
        return result
    
    try:
        msg = MIMEText("SMTP test from Render")
        msg["Subject"] = "Eventfy SMTP Diagnostic"
        msg["From"] = settings.smtp_from or settings.smtp_user
        msg["To"] = settings.smtp_user
        
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as server:
            result["step"] = "connected"
            if settings.smtp_use_tls:
                server.starttls()
                result["step"] = "tls_ok"
            server.login(settings.smtp_user, settings.smtp_password)
            result["step"] = "login_ok"
            server.send_message(msg)
            result["step"] = "sent_ok"
            result["success"] = True
    except Exception as e:
        result["error"] = f"{type(e).__name__}: {str(e)}"
        result["success"] = False
    
    return result


@router.post("/purchase_ticket/{event_id}",status_code=status.HTTP_201_CREATED)
def purchase_ticket(
    user: user_dependency,
    db: db_dependency,
    background_tasks: BackgroundTasks,
    event_id: int = Path(gt=0),
):
    return TickectService().purchase_ticket(user, db, event_id, background_tasks)

@router.put("/cancell_ticket/{event_id}",status_code=status.HTTP_201_CREATED)
def cancell_ticket(user:user_dependency,db:db_dependency,event_id:int=Path(gt=0)):
    return TickectService().cancel_ticket(user,db,event_id)

@router.post("/validate_ticket",status_code=status.HTTP_201_CREATED)
def validate_ticket(user:user_dependency,db:db_dependency,qr_input: TicketQRInput):
    qr_value = qr_input.qr_input or qr_input.qr_code
    if not qr_value:
        raise HTTPException(
            status_code=fastapi_status.HTTP_400_BAD_REQUEST,
            detail='Provide "qr_input" or "qr_code" in request body',
        )
    return TickectService().validate_ticket(user,db,qr_value)

@router.get("/get_user_tickets",status_code=status.HTTP_200_OK)
def get_user_ticket(user:user_dependency , db:db_dependency):
    return TickectService().get_user_tickets(user,db)
    
