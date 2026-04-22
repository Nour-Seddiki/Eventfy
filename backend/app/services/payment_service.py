import json
import hmac
import hashlib
import uuid
from chargily_pay import ChargilyClient
from chargily_pay.entity import Checkout
from fastapi import HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.models.payment import Payment
from app.models.event import Event
from app.models.user import User
from app.schemas.payment import PaymentStatus
from app.schemas.notification import CreateNotification, NotificationType
from app.services.ticket_service import TickectService
from app.config import settings

chargily_client = ChargilyClient(
    key=settings.chargily_key or "",
    secret=settings.chargily_secret or "",
    url=settings.chargily_url,
)


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

    @staticmethod
    def create_checkout_session(user: dict, db: Session, event_id: int, payment_method: str = "edahabia", background_tasks: BackgroundTasks = None) -> dict:
        """Create a Chargily checkout and a pending Payment record."""
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

        # Free event → create ticket directly, no payment needed
        if event.price is None or event.price <= 0:
            from app.services.ticket_service import TickectService
            bg = background_tasks if background_tasks is not None else BackgroundTasks()
            return TickectService().create_ticket_after_payment(
                user, db, event_id, bg
            )

        # Create Chargily Checkout
        try:
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

        # Create pending payment record
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

    @staticmethod
    def handle_webhook(db: Session, payload: str, signature: str, background_tasks: BackgroundTasks) -> dict:
        """Verify and process Chargily webhook events."""
        # Validate signature using HMAC-SHA256
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

            # Create the ticket via existing ticket service
            user = {"user_id": payment.user_id}
            ticket_result = TickectService().create_ticket_after_payment(
                user, db, payment.event_id, background_tasks
            )
            payment.ticket_id = uuid.UUID(ticket_result["id"])

        elif event_type == "checkout.failed":
            payment.status = PaymentStatus.failed
        elif event_type == "checkout.canceled":
            payment.status = PaymentStatus.canceled
        elif event_type == "checkout.expired":
            payment.status = PaymentStatus.expired

        db.commit()
        db.refresh(payment)
        return {"status": "ok"}

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
        """Cancel the linked ticket (Chargily does not support API refunds)."""
        if user is None:
            raise HTTPException(status_code=401, detail="Authentication failed")

        try:
            payment_uuid = uuid.UUID(payment_id)
        except (ValueError, AttributeError):
            raise HTTPException(status_code=400, detail="Invalid payment ID format")

        payment = db.query(Payment).filter(
            Payment.id == payment_uuid,
            Payment.user_id == user.get("user_id"),
        ).first()
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
        if payment.status != PaymentStatus.paid:
            raise HTTPException(status_code=400, detail="Only paid payments can be refunded")

        payment.status = PaymentStatus.refunded

        # Cancel the linked ticket
        user_dict = {"user_id": payment.user_id}
        TickectService().cancel_ticket(user_dict, db, payment.event_id)

        db.commit()
        db.refresh(payment)

        # Create refund notification
        from app.services.notification_service import NotificationService
        event = db.query(Event).filter(Event.id == payment.event_id).first()
        event_title = event.title if event else f"event #{payment.event_id}"
        notification_data = CreateNotification(
            user_id=payment.user_id,
            type=NotificationType.PAYMENT_REFUNDED,
            title="Payment Refunded",
            message=f"Your payment for '{event_title}' has been refunded and your ticket has been cancelled.",
            related_object_id=str(payment.id),
            related_object_type="payment",
        )
        NotificationService.create_notification(db, notification_data)

        return _payment_to_dict(payment)
