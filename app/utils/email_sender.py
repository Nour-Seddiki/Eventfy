# utils/email_sender.py

import logging
import smtplib
from email.message import EmailMessage
from app.config import settings

logger = logging.getLogger(__name__)

def send_ticket_email(user_email: str, event_name: str, event_date: str, qr_image: bytes):
    """
    Sends a ticket confirmation email with QR code attached.

    Parameters:
    - user_email: str → recipient email
    - event_name: str → name of the event
    - event_date: str → event date/time
    - qr_image: bytes → QR code PNG bytes
    """

    # 1️⃣ Create email message
    msg = EmailMessage()
    msg['Subject'] = f"Your Ticket for {event_name}"
    smtp_host = settings.smtp_host
    smtp_port = settings.smtp_port
    smtp_user = settings.smtp_user
    smtp_password = settings.smtp_password
    smtp_from = settings.smtp_from or smtp_user
    use_tls = settings.smtp_use_tls

    if not smtp_user or not smtp_password:
        logger.error("SMTP credentials missing; set SMTP_USER and SMTP_PASSWORD")
        return False

    msg['From'] = smtp_from
    msg['To'] = user_email

    # 2️⃣ Email body
    msg.set_content(
        f"Hello!\n\n"
        f"Thank you for purchasing a ticket for '{event_name}'.\n"
        f"Event Date: {event_date}\n\n"
        f"Please find your QR code attached below.\n\n"
        f"Enjoy the event!"
    )

    # 3️⃣ Attach QR code image
    if qr_image:
        msg.add_attachment(qr_image, maintype='image', subtype='png', filename='ticket_qr.png')

    # 4️⃣ Send email via SMTP
    try:
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            if use_tls:
                server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)
            logger.info("Ticket email sent to %s", user_email)
            return True
    except Exception as e:
        logger.exception("Failed to send email: %s", e)
        return False
