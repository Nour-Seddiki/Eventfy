from fastapi import APIRouter, Path, BackgroundTasks, Request, Header, Query
from starlette import status
from app.db.session import db_dependency
from app.services.auth_service import user_dependency
from app.services.payment_service import PaymentService

router = APIRouter(prefix="/payment", tags=["payment"])


# ── Stripe Checkout (primary) ────────────────────────
@router.post("/checkout/{event_id}", status_code=status.HTTP_201_CREATED)
def create_stripe_checkout(
    user: user_dependency,
    db: db_dependency,
    event_id: int = Path(gt=0),
):
    """Create a Stripe Checkout Session for a paid event."""
    return PaymentService.create_stripe_checkout(user, db, event_id)


# ── Stripe Webhook ───────────────────────────────────
@router.post("/stripe-webhook", status_code=status.HTTP_200_OK)
async def stripe_webhook(
    request: Request,
    db: db_dependency,
    background_tasks: BackgroundTasks,
):
    """Stripe calls this endpoint after payment events."""
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")
    return PaymentService.handle_stripe_webhook(db, payload, sig_header, background_tasks)


# ── Verify Stripe Session (frontend success page calls this) ──
@router.post("/verify/{session_id}", status_code=status.HTTP_200_OK)
def verify_stripe_session(
    user: user_dependency,
    db: db_dependency,
    background_tasks: BackgroundTasks,
    session_id: str = Path(),
):
    """Verify a Stripe checkout session and fulfill the order (ticket + notification)."""
    return PaymentService.verify_stripe_session(user, db, session_id, background_tasks)


# ── My Payments ──────────────────────────────────────
@router.get("/my_payments", status_code=status.HTTP_200_OK)
def get_my_payments(user: user_dependency, db: db_dependency):
    return PaymentService.get_user_payments(user, db)


# ── Refund ───────────────────────────────────────────
@router.post("/refund/{payment_id}", status_code=status.HTTP_200_OK)
def refund_payment(user: user_dependency, db: db_dependency, payment_id: str):
    """Refund a payment and cancel the linked ticket."""
    return PaymentService.refund_payment(user, db, payment_id)


# ── Legacy Chargily Webhook (kept for backward compat) ──
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
