"""
Eventfy -- Inject test data for verification.
Creates sample users, events, and tickets to test the audit fixes.

Usage:
  cd backend
  python -m scripts.inject_test_data
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from datetime import datetime, timezone, timedelta
from app.db.session import SessionLocal
from app.models.user import User
from app.models.event import Event
from app.models.ticket import Ticket
from app.services.auth_service import hashing_password
import uuid


def inject():
    db = SessionLocal()

    try:
        # -- Find or create test organizer --
        organizer = db.query(User).filter(User.username == "test_organizer").first()
        if organizer:
            print(f"  [=] Organizer already exists: {organizer.username} (id={organizer.id})")
            # Update profile fields if they're empty
            if not organizer.full_name:
                organizer.full_name = "Demo Organizer"
                organizer.bio = "Event management enthusiast and community builder."
                organizer.phone = "+213 555 123 456"
                organizer.location = "Algiers, Algeria"
                organizer.website = "https://eventfy.demo"
                db.commit()
                print(f"  [+] Updated organizer profile fields")
        else:
            organizer = User(
                username="test_organizer",
                email="organizer@test.com",
                hashed_password=hashing_password("Test1234!"),
                role="organizer",
                is_verified=True,
                full_name="Demo Organizer",
                bio="Event management enthusiast and community builder.",
                phone="+213 555 123 456",
                location="Algiers, Algeria",
                website="https://eventfy.demo",
            )
            db.add(organizer)
            db.flush()
            print(f"  [+] Created organizer: {organizer.username} (id={organizer.id})")

        # -- Find or create test attendee --
        attendee = db.query(User).filter(User.username == "test_attendee").first()
        if attendee:
            print(f"  [=] Attendee already exists: {attendee.username} (id={attendee.id})")
            if not attendee.full_name:
                attendee.full_name = "Demo Attendee"
                attendee.bio = "Love discovering local events!"
                attendee.phone = "+213 555 789 012"
                attendee.location = "Oran, Algeria"
                db.commit()
                print(f"  [+] Updated attendee profile fields")
        else:
            attendee = User(
                username="test_attendee",
                email="attendee@test.com",
                hashed_password=hashing_password("Test1234!"),
                role="attendee",
                is_verified=True,
                full_name="Demo Attendee",
                bio="Love discovering local events!",
                phone="+213 555 789 012",
                location="Oran, Algeria",
            )
            db.add(attendee)
            db.flush()
            print(f"  [+] Created attendee: {attendee.username} (id={attendee.id})")

        # -- 3. Create sample events --
        events_data = [
            {
                "title": "AI and Machine Learning Summit 2026",
                "description": "A full-day summit exploring the latest in AI, deep learning, and automation.",
                "category": "Science",
                "location": "Algiers, CIC Convention Center",
                "price": 2500.0,
                "available_tickets": 200,
                "date": datetime.now(timezone.utc) + timedelta(days=30),
            },
            {
                "title": "Startup Weekend Algeria",
                "description": "54 hours to build your startup from idea to MVP. Mentors, investors, and pizza included.",
                "category": "Business",
                "location": "Oran, TechHub Co-Working",
                "price": 0,
                "available_tickets": 100,
                "date": datetime.now(timezone.utc) + timedelta(days=14),
            },
            {
                "title": "Electronic Music Festival",
                "description": "The biggest outdoor EDM festival in North Africa. 3 stages, 20+ artists.",
                "category": "Music",
                "location": "Constantine, Olympic Stadium",
                "price": 3500.0,
                "available_tickets": 500,
                "date": datetime.now(timezone.utc) + timedelta(days=45),
            },
            {
                "title": "Gaming Tournament - League Finals",
                "description": "National League of Legends championship with $5000 prize pool.",
                "category": "Gaming",
                "location": "Algiers, Esports Arena",
                "price": 1000.0,
                "available_tickets": 150,
                "date": datetime.now(timezone.utc) + timedelta(days=7),
            },
            {
                "title": "Street Food Festival",
                "description": "Taste the best street food from 50+ vendors across Algeria.",
                "category": "Food",
                "location": "Annaba, Corniche Square",
                "price": 500.0,
                "available_tickets": 300,
                "date": datetime.now(timezone.utc) + timedelta(days=21),
            },
        ]

        created_events = []
        for ev_data in events_data:
            existing_ev = db.query(Event).filter(Event.title == ev_data["title"]).first()
            if existing_ev:
                print(f"  [=] Event already exists: {existing_ev.title} (id={existing_ev.id})")
                created_events.append(existing_ev)
            else:
                event = Event(organizer_id=organizer.id, **ev_data)
                db.add(event)
                db.flush()
                created_events.append(event)
                print(f"  [+] Created event: {event.title} (id={event.id})")

        # -- 4. Create tickets (simulate real sales) --
        ticket_counts = [12, 5, 28, 8, 15]  # tickets sold per event
        for event, count in zip(created_events, ticket_counts):
            existing_tickets = db.query(Ticket).filter(Ticket.event_id == event.id).count()
            if existing_tickets > 0:
                print(f"  [=] {existing_tickets} tickets already exist for: {event.title}")
                continue
            for i in range(count):
                ticket = Ticket(
                    id=str(uuid.uuid4()),
                    user_id=attendee.id,
                    event_id=event.id,
                    qr_code=f"QR-{event.id}-{uuid.uuid4().hex[:8]}",
                    status="active",
                )
                db.add(ticket)
            print(f"  [+] Created {count} tickets for: {event.title}")

        db.commit()
        print("\n[OK] Test data injected successfully!")
        print(f"\nLogin credentials:")
        print(f"   Organizer: organizer@test.com / Test1234!")
        print(f"   Attendee:  attendee@test.com  / Test1234!")

    except Exception as e:
        db.rollback()
        print(f"\n[ERROR] {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    inject()
