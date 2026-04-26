import stripe
import json
import hmac
import hashlib
import logging

from fastapi import HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.models.payment import Payment
from app.models.event import Event
from app.models.user import User
from app.schemas.payment import PaymentStatus
from app.services.ticket_service import TickectService
from app.config import settings

logger = logging.getLogger(__name__)

# ── Stripe setup ──────────────────────────────────────
STRIPE_AVAILABLE = False

if settings.stripe_secret_key and not settings.stripe_secret_key.startswith("sk_test_REPLACE"):
    stripe.api_key = settings.stripe_secret_key
    STRIPE_AVAILABLE = True
    logger.info("Stripe SDK configured successfully")
else:
    logger.warning("Stripe secret key not configured — payment endpoints will return 501")

# ── Chargily setup (legacy, kept as fallback) ─────────
try:
    from chargily_pay import ChargilyClient
    from chargily_pay.entity import Checkout

    chargily_client = ChargilyClient(
        key=settings.chargily_key or "",
        secret=settings.chargily_secret or "",
        url=settings.chargily_url,
    )
    CHARGILY_AVAILABLE = True
except (ImportError, Exception):
    chargily_client = None
    CHARGILY_AVAILABLE = False


def _payment_to_dict(p: Payment) -> dict:
    return {
        "id": str(p.id),
        "user_id": p.user_id,
        "event_id": p.event_id,
        "ticket_id": str(p.ticket_id) if p.ticket_id else None,
        "amount": p.amount,
        "currency": p.currency,
        "payment_method": p.payment_method,
        "payment_intent_id": p.payment_intent_id,
        "status": p.status,
        "created_at": p.created_at,
    }


class PaymentService:

    # ─────────────────────────────────────────────
    #  STRIPE CHECKOUT
    # ─────────────────────────────────────────────
    @staticmethod
    def create_stripe_checkout(user: dict, db: Session, event_id: int) -> dict:
        """Create a Stripe Checkout Session for a paid event."""
        if not STRIPE_AVAILABLE:
            raise HTTPException(status_code=501, detail="Stripe is not configured. Add STRIPE_SECRET_KEY to .env")

        if user is None:
            raise HTTPException(status_code=401, detail="Authentication failed")

        user_model = db.query(User).filter(User.id == user.get("user_id")).first()
        if not user_model:
            raise HTTPException(status_code=401, detail="Authentication failed")

        event = db.query(Event).filter(Event.id == event_id).first()
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")

        if event.available_tickets <= 0:
            raise HTTPException(status_code=400, detail="Sold out")

        if not event.price or event.price <= 0:
            raise HTTPException(status_code=400, detail="This is a free event. Use /ticket/purchase_ticket instead")

        # Use the event's currency (lowercase for Stripe). Defaults to "dzd" if not set.
        checkout_currency = (event.currency or "DZD").lower()

        # Convert price to smallest currency unit (cents/centimes).
        # Event price is stored as a float (e.g. 25.00)
        amount_cents = int(round(event.price * 100))

        try:
            checkout_session = stripe.checkout.Session.create(
                payment_method_types=["card"],
                line_items=[{
                    "price_data": {
                        "currency": checkout_currency,
                        "product_data": {
                            "name": f"Ticket: {event.title}",
                            "description": event.description[:200] if event.description else f"Event ticket for {event.title}",
                        },
                        "unit_amount": amount_cents,
                    },
                    "quantity": 1,
                }],
                mode="payment",
                success_url=f"{settings.frontend_url}/payment/success.html?session_id={{CHECKOUT_SESSION_ID}}",
                cancel_url=f"{settings.frontend_url}/payment/cancel.html?event_id={event.id}",
                metadata={
                    "user_id": str(user_model.id),
                    "event_id": str(event.id),
                },
                customer_email=user_model.email,
            )
        except stripe.StripeError as e:
            logger.error(f"Stripe error: {e}")
            raise HTTPException(status_code=400, detail=str(e))

        # Create pending payment record
        payment = Payment(
            user_id=user_model.id,
            event_id=event.id,
            amount=event.price,
            currency=checkout_currency,
            payment_method="stripe",
            payment_intent_id=checkout_session.id,
            status=PaymentStatus.pending,
        )
        db.add(payment)
        db.commit()
        db.refresh(payment)

        return {
            "checkout_url": checkout_session.url,
            "session_id": checkout_session.id,
            "payment_id": str(payment.id),
        }

    # ─────────────────────────────────────────────
    #  STRIPE WEBHOOK
    # ─────────────────────────────────────────────
    @staticmethod
    def handle_stripe_webhook(db: Session, payload: bytes, sig_header: str, background_tasks: BackgroundTasks) -> dict:
        """Verify and process Stripe webhook events."""
        if not STRIPE_AVAILABLE:
            raise HTTPException(status_code=501, detail="Stripe not configured")

        webhook_secret = settings.stripe_webhook_secret
        event = None

        try:
            if webhook_secret and not webhook_secret.startswith("whsec_REPLACE"):
                event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
            else:
                # In dev mode without webhook secret, parse directly (less secure)
                data = json.loads(payload)
                event = stripe.Event.construct_from(data, stripe.api_key)
        except (ValueError, stripe.SignatureVerificationError) as e:
            logger.error(f"Webhook verification failed: {e}")
            raise HTTPException(status_code=400, detail="Invalid webhook signature")

        event_type = event.type

        if event_type == "checkout.session.completed":
            session = event.data.object
            session_id = session.id
            metadata = session.metadata or {}

            payment = db.query(Payment).filter(
                Payment.payment_intent_id == session_id
            ).first()

            if not payment:
                logger.warning(f"Payment not found for session {session_id}")
                return {"status": "ignored"}

            # Mark as paid
            payment.status = PaymentStatus.paid

            # Create the ticket via existing ticket service
            user_dict = {"user_id": payment.user_id}
            try:
                ticket_result = TickectService().purchase_ticket(
                    user_dict, db, payment.event_id, background_tasks
                )
                payment.ticket_id = ticket_result["id"]
            except HTTPException as e:
                logger.error(f"Ticket creation failed after payment: {e.detail}")
                # Payment succeeded but ticket failed — mark for manual resolution
                payment.status = "paid_ticket_error"

            db.commit()
            db.refresh(payment)
            logger.info(f"Payment {payment.id} completed for event {payment.event_id}")

        elif event_type == "checkout.session.expired":
            session = event.data.object
            payment = db.query(Payment).filter(
                Payment.payment_intent_id == session.id
            ).first()
            if payment:
                payment.status = PaymentStatus.expired
                db.commit()

        return {"status": "ok"}

    # ─────────────────────────────────────────────
    #  LEGACY CHARGILY CHECKOUT (kept for backward compat)
    # ─────────────────────────────────────────────
    @staticmethod
    def create_checkout_session(user: dict, db: Session, event_id: int, payment_method: str = "edahabia") -> dict:
        """Create a Chargily checkout and a pending Payment record."""
        if not CHARGILY_AVAILABLE:
            raise HTTPException(status_code=501, detail="Chargily payment gateway not configured")

        if user is None:
            raise HTTPException(status_code=401, detail="Authentication failed")

        user_model = db.query(User).filter(User.id == user.get("user_id")).first()
        if not user_model:
            raise HTTPException(status_code=401, detail="Authentication failed")

        event = db.query(Event).filter(Event.id == event_id).first()
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")

        if event.available_tickets <= 0:
            raise HTTPException(status_code=400, detail="Sold out")

        if not event.price or event.price <= 0:
            raise HTTPException(status_code=400, detail="This is a free event. Use /ticket/purchase_ticket instead")

        try:
            from chargily_pay.entity import Checkout
            checkout = Checkout(
                amount=int(event.price),
                currency="dzd",
                success_url="http://localhost:3000/payment/success",
                failure_url="http://localhost:3000/payment/failure",
                payment_method=payment_method,
                description=f"Ticket for {event.title}",
                metadata=[
                    {"user_id": str(user_model.id)},
                    {"event_id": str(event.id)},
                ],
            )
            response = chargily_client.create_checkout(checkout)
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

        checkout_id = response["id"]
        checkout_url = response["checkout_url"]

        payment = Payment(
            user_id=user_model.id,
            event_id=event.id,
            amount=event.price,
            currency="dzd",
            payment_method=payment_method,
            payment_intent_id=checkout_id,
            status=PaymentStatus.pending,
        )
        db.add(payment)
        db.commit()
        db.refresh(payment)

        return {
            "checkout_url": checkout_url,
            "checkout_id": checkout_id,
            "payment_id": str(payment.id),
        }

    # ─────────────────────────────────────────────
    #  SHARED METHODS
    # ─────────────────────────────────────────────
    @staticmethod
    def get_user_payments(user: dict, db: Session) -> list[dict]:
        if user is None:
            raise HTTPException(status_code=401, detail="Authentication failed")
        payments = db.query(Payment).filter(
            Payment.user_id == user.get("user_id")
        ).all()
        return [_payment_to_dict(p) for p in payments]

    @staticmethod
    def refund_payment(user: dict, db: Session, payment_id: str) -> dict:
        """Refund a Stripe payment and cancel the linked ticket."""
        if user is None:
            raise HTTPException(status_code=401, detail="Authentication failed")
        payment = db.query(Payment).filter(
            Payment.id == payment_id,
            Payment.user_id == user.get("user_id"),
        ).first()
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
        if payment.status != PaymentStatus.paid:
            raise HTTPException(status_code=400, detail="Only paid payments can be refunded")

        # Attempt Stripe refund if it was a Stripe payment
        if payment.payment_method == "stripe" and STRIPE_AVAILABLE:
            try:
                # Get the payment intent from the checkout session
                session = stripe.checkout.Session.retrieve(payment.payment_intent_id)
                if session.payment_intent:
                    stripe.Refund.create(payment_intent=session.payment_intent)
            except stripe.StripeError as e:
                logger.error(f"Stripe refund failed: {e}")
                raise HTTPException(status_code=400, detail=f"Refund failed: {str(e)}")

        payment.status = PaymentStatus.refunded

        # Cancel the linked ticket
        user_dict = {"user_id": payment.user_id}
        TickectService().cancel_ticket(user_dict, db, payment.event_id)

        db.commit()
        db.refresh(payment)
        return _payment_to_dict(payment)

    @staticmethod
    def handle_webhook(db: Session, payload: str, signature: str, background_tasks: BackgroundTasks) -> dict:
        """Legacy Chargily webhook handler."""
        if not CHARGILY_AVAILABLE:
            raise HTTPException(status_code=501, detail="Chargily not configured")

        if not chargily_client.validate_signature(signature, payload):
            raise HTTPException(status_code=403, detail="Invalid signature")

        event = json.loads(payload)
        event_type = event.get("type", "")
        checkout_data = event.get("data", {})
        checkout_id = checkout_data.get("id")

        payment = db.query(Payment).filter(
            Payment.payment_intent_id == checkout_id
        ).first()
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")

        if event_type == "checkout.paid":
            payment.status = PaymentStatus.paid
            user = {"user_id": payment.user_id}
            ticket_result = TickectService().purchase_ticket(
                user, db, payment.event_id, background_tasks
            )
            payment.ticket_id = ticket_result["id"]
        elif event_type == "checkout.failed":
            payment.status = PaymentStatus.failed
        elif event_type == "checkout.canceled":
            payment.status = PaymentStatus.canceled
        elif event_type == "checkout.expired":
            payment.status = PaymentStatus.expired

        db.commit()
        db.refresh(payment)
        return {"status": "ok"}
