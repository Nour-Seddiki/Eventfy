from fastapi import APIRouter, Path, BackgroundTasks, Request, Header, Query
from starlette import status
from app.db.session import db_dependency
from app.services.auth_service import user_dependency
from app.services.payment_service import PaymentService
from app.schemas.payment import PaymentMethodEnum

router = APIRouter(prefix="/payment", tags=["payment"])


@router.post("/checkout/{event_id}", status_code=status.HTTP_201_CREATED)
async def create_checkout(
    user: user_dependency,
    db: db_dependency,
    event_id: int = Path(gt=0),
    payment_method: PaymentMethodEnum = Query(default=PaymentMethodEnum.edahabia),
):
    """Create a Chargily checkout for a paid event (EDAHABIA or CIB)."""
    return PaymentService.create_checkout_session(user, db, event_id, payment_method.value)


@router.get("/my_payments", status_code=status.HTTP_200_OK)
async def get_my_payments(user: user_dependency, db: db_dependency):
    return PaymentService.get_user_payments(user, db)


@router.post("/refund/{payment_id}", status_code=status.HTTP_200_OK)
async def refund_payment(user: user_dependency, db: db_dependency, payment_id: str):
    """Mark payment as refunded and cancel the linked ticket."""
    return PaymentService.refund_payment(user, db, payment_id)


@router.post("/webhook", status_code=status.HTTP_200_OK)
async def chargily_webhook(
    request: Request,
    db: db_dependency,
    background_tasks: BackgroundTasks,
    signature: str = Header(alias="signature"),
):
    """Chargily calls this endpoint after payment events."""
    payload = (await request.body()).decode("utf-8")
    return PaymentService.handle_webhook(db, payload, signature, background_tasks)
