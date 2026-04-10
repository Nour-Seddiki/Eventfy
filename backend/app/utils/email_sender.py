# utils/email_sender.py

import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
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

    try:
        # Get SMTP settings from config
        smtp_host = settings.smtp_host
        smtp_port = settings.smtp_port
        smtp_user = settings.smtp_user
        smtp_password = settings.smtp_password
        smtp_from = settings.smtp_from or smtp_user
        use_tls = settings.smtp_use_tls

        # Validate credentials
        if not smtp_user or not smtp_password:
            logger.error("SMTP credentials missing; set SMTP_USER and SMTP_PASSWORD in .env")
            return False

        if not user_email:
            logger.error("User email is missing")
            return False

        # Create MIME message
        msg = MIMEMultipart('related')
        msg['Subject'] = f"🎫 Your Ticket for {event_name}"
        msg['From'] = smtp_from
        msg['To'] = user_email

        # Email body - plain text
        email_body = (
            f"Hello!\n\n"
            f"Thank you for purchasing a ticket for '{event_name}'.\n"
            f"Event Date: {event_date}\n\n"
            f"Your QR code is attached below. Please bring it to the event.\n\n"
            f"Enjoy the event!\n\n"
            f"Best regards,\n"
            f"Eventfy Team"
        )
        
        msg_alternative = MIMEMultipart('alternative')
        msg.attach(msg_alternative)
        msg_alternative.attach(MIMEText(email_body, 'plain'))

        # Attach QR code image
        if qr_image:
            from email.mime.image import MIMEImage
            img = MIMEImage(qr_image, 'png')
            img.add_header('Content-ID', '<ticket_qr>')
            img.add_header('Content-Disposition', 'attachment', filename='ticket_qr.png')
            msg.attach(img)
            logger.debug("QR code image attached")

        # Send email via SMTP
        logger.info(f"Attempting to send email to {user_email} via {smtp_host}:{smtp_port}")
        
        with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
            logger.debug(f"Connected to SMTP server {smtp_host}")
            
            if use_tls:
                server.starttls()
                logger.debug("TLS enabled and started")
            
            server.login(smtp_user, smtp_password)
            logger.debug(f"Logged in as {smtp_user}")
            
            server.send_message(msg)
            logger.info(f"✅ Ticket confirmation email sent successfully to {user_email}")
            return True
            
    except smtplib.SMTPAuthenticationError as e:
        logger.error(f"❌ SMTP Authentication failed for {smtp_user}: {e}")
        logger.error("Check your SMTP_USER and SMTP_PASSWORD in .env")
        return False
    except smtplib.SMTPException as e:
        logger.error(f"❌ SMTP error occurred: {e}")
        return False
    except Exception as e:
        logger.exception(f"❌ Unexpected error sending email: {e}")
        return False

