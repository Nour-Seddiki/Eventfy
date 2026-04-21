"""
Full booking flow tests: Free events and Paid events (with mocked Chargily).
Tests the flow: purchase_ticket → (paid: checkout) / (free: ticket directly)
                                     ↓
                              webhook → create_ticket_after_payment
"""
import sys
from pathlib import Path
from datetime import datetime, timedelta, timezone
from unittest.mock import patch, MagicMock

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.db.base import Base
from app.models.user import User
from app.models.event import Event
from app.models.ticket import Ticket
from app.models.payment import Payment
from app.services.auth_service import hashing_password
from app.schemas.ticket import TicketStatus
from app.schemas.payment import PaymentStatus


# ─────────────────────────────────────────────
#  Fixtures
# ─────────────────────────────────────────────

@pytest.fixture()
def db():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = Session()
    try:
        yield session
    finally:
        session.close()
    Base.metadata.drop_all(bind=engine)
    engine.dispose()


@pytest.fixture()
def organizer(db):
    u = User(
        username="organizer1",
        email="org@test.com",
        hashed_password=hashing_password("pass"),
        role="organizer",
        is_verified=True,
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


@pytest.fixture()
def attendee(db):
    u = User(
        username="attendee1",
        email="att@test.com",
        hashed_password=hashing_password("pass"),
        role="attendee",
        is_verified=True,
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


def make_event(db, organizer_id, price=0.0, tickets=10):
    e = Event(
        title="Test Event",
        description="desc",
        category="Music",
        location="Algiers",
        price=price,
        available_tickets=tickets,
        date=datetime.now(timezone.utc) + timedelta(days=5),
        organizer_id=organizer_id,
    )
    db.add(e)
    db.commit()
    db.refresh(e)
    return e


def user_dict(user):
    return {"user_id": user.id}


# ─────────────────────────────────────────────
#  Helpers
# ─────────────────────────────────────────────

def _mock_background():
    bg = MagicMock()
    bg.add_task = MagicMock()
    return bg


# ─────────────────────────────────────────────
#  1. FREE EVENT FLOW
# ─────────────────────────────────────────────

class TestFreeEventFlow:

    def test_free_event_creates_ticket_immediately(self, db, organizer, attendee):
        """Free event: purchase_ticket should create a ticket right away, no payment."""
        event = make_event(db, organizer.id, price=0.0)

        from app.services.ticket_service import TickectService

        with patch("app.utils.email_sender.send_ticket_email"), \
             patch("app.services.notification_service.NotificationService.create_notification"):
            result = TickectService().purchase_ticket(
                user_dict(attendee), db, event.id, _mock_background()
            )

        # Returns ticket dict, not a checkout URL
        assert "qr_code" in result
        assert "status" in result
        assert result["status"] == TicketStatus.active
        assert "checkout_url" not in result

    def test_free_event_decrements_available_tickets(self, db, organizer, attendee):
        event = make_event(db, organizer.id, price=0.0, tickets=5)
        from app.services.ticket_service import TickectService

        with patch("app.utils.email_sender.send_ticket_email"), \
             patch("app.services.notification_service.NotificationService.create_notification"):
            TickectService().purchase_ticket(
                user_dict(attendee), db, event.id, _mock_background()
            )

        db.refresh(event)
        assert event.available_tickets == 4

    def test_free_event_no_duplicate_ticket(self, db, organizer, attendee):
        from fastapi import HTTPException
        event = make_event(db, organizer.id, price=0.0)
        from app.services.ticket_service import TickectService

        with patch("app.utils.email_sender.send_ticket_email"), \
             patch("app.services.notification_service.NotificationService.create_notification"):
            TickectService().purchase_ticket(
                user_dict(attendee), db, event.id, _mock_background()
            )

        with pytest.raises(HTTPException) as exc:
            TickectService().purchase_ticket(
                user_dict(attendee), db, event.id, _mock_background()
            )
        assert exc.value.status_code == 409

    def test_free_event_sold_out(self, db, organizer, attendee):
        from fastapi import HTTPException
        event = make_event(db, organizer.id, price=0.0, tickets=0)
        from app.services.ticket_service import TickectService

        with pytest.raises(HTTPException) as exc:
            TickectService().purchase_ticket(
                user_dict(attendee), db, event.id, _mock_background()
            )
        assert exc.value.status_code == 400
        assert "sold out" in exc.value.detail.lower()

    def test_free_event_past_date_rejected(self, db, organizer, attendee):
        from fastapi import HTTPException
        e = Event(
            title="Past Event",
            description="desc",
            category="Music",
            location="Algiers",
            price=0.0,
            available_tickets=10,
            date=datetime.now(timezone.utc) - timedelta(days=1),
            organizer_id=organizer.id,
        )
        db.add(e)
        db.commit()
        db.refresh(e)

        from app.services.ticket_service import TickectService

        with pytest.raises(HTTPException) as exc:
            TickectService().purchase_ticket(
                user_dict(attendee), db, e.id, _mock_background()
            )
        assert exc.value.status_code == 400
        assert "over" in exc.value.detail.lower()


# ─────────────────────────────────────────────
#  2. PAID EVENT FLOW
# ─────────────────────────────────────────────

class TestPaidEventFlow:

    def _mock_chargily(self):
        """Returns a mock that simulates Chargily checkout creation."""
        mock_client = MagicMock()
        mock_client.create_checkout.return_value = {
            "id": "chk_abc123",
            "checkout_url": "https://pay.chargily.com/chk_abc123",
        }
        return mock_client

    def test_paid_event_returns_checkout_url(self, db, organizer, attendee):
        """Paid event: purchase_ticket should return a Chargily checkout URL."""
        event = make_event(db, organizer.id, price=1500.0)
        from app.services.ticket_service import TickectService

        with patch("app.services.payment_service.chargily_client", self._mock_chargily()):
            result = TickectService().purchase_ticket(
                user_dict(attendee), db, event.id, _mock_background(), payment_method="edahabia"
            )

        assert "checkout_url" in result
        assert result["checkout_url"] == "https://pay.chargily.com/chk_abc123"
        assert "checkout_id" in result
        assert result["checkout_id"] == "chk_abc123"
        assert "payment_id" in result
        assert result["message"] == "Complete payment to receive your ticket."

    def test_paid_event_no_ticket_before_payment(self, db, organizer, attendee):
        """No ticket must exist until payment is confirmed."""
        event = make_event(db, organizer.id, price=1500.0)
        from app.services.ticket_service import TickectService

        with patch("app.services.payment_service.chargily_client", self._mock_chargily()):
            TickectService().purchase_ticket(
                user_dict(attendee), db, event.id, _mock_background()
            )

        tickets = db.query(Ticket).filter(Ticket.user_id == attendee.id).all()
        assert len(tickets) == 0, "Ticket must NOT be created before payment confirmation"

    def test_paid_event_creates_pending_payment_record(self, db, organizer, attendee):
        event = make_event(db, organizer.id, price=1500.0)
        from app.services.ticket_service import TickectService

        with patch("app.services.payment_service.chargily_client", self._mock_chargily()):
            TickectService().purchase_ticket(
                user_dict(attendee), db, event.id, _mock_background()
            )

        payment = db.query(Payment).filter(Payment.user_id == attendee.id).first()
        assert payment is not None
        assert payment.status == PaymentStatus.pending
        assert payment.amount == 1500.0
        assert payment.event_id == event.id

    def test_webhook_paid_creates_ticket(self, db, organizer, attendee):
        """After Chargily fires checkout.paid, a ticket must be created."""
        import json
        event = make_event(db, organizer.id, price=1500.0)

        # Pre-create a pending payment (simulating what purchase_ticket does)
        payment = Payment(
            user_id=attendee.id,
            event_id=event.id,
            amount=1500.0,
            currency="dzd",
            payment_method="edahabia",
            payment_intent_id="chk_abc123",
            status=PaymentStatus.pending,
        )
        db.add(payment)
        db.commit()
        db.refresh(payment)

        webhook_payload = json.dumps({
            "type": "checkout.paid",
            "data": {"id": "chk_abc123"},
        })

        from app.services.payment_service import PaymentService

        mock_client = self._mock_chargily()
        mock_client.validate_signature.return_value = True

        with patch("app.services.payment_service.chargily_client", mock_client), \
             patch("app.utils.email_sender.send_ticket_email"), \
             patch("app.services.notification_service.NotificationService.create_notification"):
            PaymentService.handle_webhook(
                db, webhook_payload, "valid_sig", _mock_background()
            )

        db.refresh(payment)
        assert payment.status == PaymentStatus.paid
        assert payment.ticket_id is not None

        ticket = db.query(Ticket).filter(Ticket.user_id == attendee.id).first()
        assert ticket is not None
        assert ticket.status == TicketStatus.active

    def test_webhook_failed_no_ticket(self, db, organizer, attendee):
        """checkout.failed webhook must NOT create a ticket."""
        import json
        event = make_event(db, organizer.id, price=1500.0)

        payment = Payment(
            user_id=attendee.id,
            event_id=event.id,
            amount=1500.0,
            currency="dzd",
            payment_method="edahabia",
            payment_intent_id="chk_fail",
            status=PaymentStatus.pending,
        )
        db.add(payment)
        db.commit()

        webhook_payload = json.dumps({
            "type": "checkout.failed",
            "data": {"id": "chk_fail"},
        })

        from app.services.payment_service import PaymentService

        mock_client = self._mock_chargily()
        mock_client.validate_signature.return_value = True

        with patch("app.services.payment_service.chargily_client", mock_client):
            PaymentService.handle_webhook(
                db, webhook_payload, "valid_sig", _mock_background()
            )

        db.refresh(payment)
        assert payment.status == PaymentStatus.failed
        tickets = db.query(Ticket).filter(Ticket.user_id == attendee.id).all()
        assert len(tickets) == 0

    def test_webhook_invalid_signature_rejected(self, db, organizer, attendee):
        """Webhook with bad signature must be rejected with 403."""
        import json
        from fastapi import HTTPException
        event = make_event(db, organizer.id, price=1500.0)

        payment = Payment(
            user_id=attendee.id,
            event_id=event.id,
            amount=1500.0,
            currency="dzd",
            payment_method="edahabia",
            payment_intent_id="chk_badsig",
            status=PaymentStatus.pending,
        )
        db.add(payment)
        db.commit()

        webhook_payload = json.dumps({
            "type": "checkout.paid",
            "data": {"id": "chk_badsig"},
        })

        from app.services.payment_service import PaymentService

        mock_client = self._mock_chargily()
        mock_client.validate_signature.return_value = False  # bad sig

        with patch("app.services.payment_service.chargily_client", mock_client):
            with pytest.raises(HTTPException) as exc:
                PaymentService.handle_webhook(
                    db, webhook_payload, "bad_sig", _mock_background()
                )
        assert exc.value.status_code == 403

    def test_paid_event_duplicate_rejected_after_payment(self, db, organizer, attendee):
        """A second purchase attempt for the same event is blocked even before payment."""
        event = make_event(db, organizer.id, price=1500.0)
        from app.services.ticket_service import TickectService

        # First purchase (checkout)
        with patch("app.services.payment_service.chargily_client", self._mock_chargily()):
            TickectService().purchase_ticket(
                user_dict(attendee), db, event.id, _mock_background()
            )

        # Simulate payment confirmation → ticket created
        from app.utils.qr_generator import generate_qr_code
        uid, _ = generate_qr_code()
        ticket = Ticket(
            user_id=attendee.id,
            event_id=event.id,
            qr_code=uid,
            status=TicketStatus.active,
            purchased_at=datetime.now(timezone.utc),
        )
        db.add(ticket)
        db.commit()

        # Second purchase attempt → should be blocked
        from fastapi import HTTPException
        with pytest.raises(HTTPException) as exc:
            from unittest.mock import patch as p
            with p("app.services.payment_service.chargily_client", self._mock_chargily()):
                TickectService().purchase_ticket(
                    user_dict(attendee), db, event.id, _mock_background()
                )
        assert exc.value.status_code == 409


# ─────────────────────────────────────────────
#  3. AUTH GUARD
# ─────────────────────────────────────────────

class TestAuthGuards:

    def test_unauthenticated_user_blocked(self, db, organizer):
        from fastapi import HTTPException
        event = make_event(db, organizer.id, price=0.0)
        from app.services.ticket_service import TickectService

        with pytest.raises(HTTPException) as exc:
            TickectService().purchase_ticket(None, db, event.id, _mock_background())
        assert exc.value.status_code == 401

    def test_invalid_user_id_blocked(self, db, organizer):
        from fastapi import HTTPException
        event = make_event(db, organizer.id, price=0.0)
        from app.services.ticket_service import TickectService

        with pytest.raises(HTTPException) as exc:
            TickectService().purchase_ticket(
                {"user_id": 99999}, db, event.id, _mock_background()
            )
        assert exc.value.status_code == 401

    def test_nonexistent_event_blocked(self, db, attendee):
        from fastapi import HTTPException
        from app.services.ticket_service import TickectService

        with pytest.raises(HTTPException) as exc:
            TickectService().purchase_ticket(
                user_dict(attendee), db, 99999, _mock_background()
            )
        assert exc.value.status_code == 404
