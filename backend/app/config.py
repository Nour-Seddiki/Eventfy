import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


# Load .env early so any module importing settings gets configured values.
load_dotenv(dotenv_path=Path(__file__).resolve().parents[1] / ".env")


BASE_DIR = Path(__file__).resolve().parents[1]  # …/backend/


@dataclass(frozen=True)
class Settings:
    secret_key: str
    algorithm: str
    access_token_expire_minutes: int
    # Supabase PostgreSQL connection fields
    db_host: str
    db_port: int
    db_user: str
    db_password: str
    db_name: str
    smtp_host: str
    smtp_port: int
    smtp_user: str | None
    smtp_password: str | None
    smtp_from: str | None
    smtp_use_tls: bool
    google_client_id: str | None
    chargily_key: str | None
    chargily_secret: str | None
    chargily_url: str
    stripe_secret_key: str | None
    stripe_publishable_key: str | None
    stripe_webhook_secret: str | None
    frontend_url: str


settings = Settings(
    secret_key=os.getenv("SECRET_KEY", "dev-insecure-secret-change-me"),
    algorithm=os.getenv("ALGORITHM", "HS256"),
    access_token_expire_minutes=int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")),
    db_host=os.getenv("DB_HOST", ""),
    db_port=int(os.getenv("DB_PORT", "6543")),
    db_user=os.getenv("DB_USER", "postgres"),
    db_password=os.getenv("DB_PASSWORD", ""),
    db_name=os.getenv("DB_NAME", "postgres"),
    smtp_host=os.getenv("SMTP_HOST", "smtp.gmail.com"),
    smtp_port=int(os.getenv("SMTP_PORT", "587")),
    smtp_user=os.getenv("SMTP_USER"),
    smtp_password=os.getenv("SMTP_PASSWORD"),
    smtp_from=os.getenv("SMTP_FROM"),
    smtp_use_tls=os.getenv("SMTP_USE_TLS", "true").lower() in {"1", "true", "yes"},
    google_client_id=os.getenv("GOOGLE_CLIENT_ID"),
    chargily_key=os.getenv("CHARGILY_KEY"),
    chargily_secret=os.getenv("CHARGILY_SECRET"),
    chargily_url=os.getenv("CHARGILY_URL", "https://pay.chargily.net/test/api/v2/"),
    stripe_secret_key=os.getenv("STRIPE_SECRET_KEY"),
    stripe_publishable_key=os.getenv("STRIPE_PUBLISHABLE_KEY"),
    stripe_webhook_secret=os.getenv("STRIPE_WEBHOOK_SECRET"),
    frontend_url=os.getenv("FRONTEND_URL", "http://localhost:8080"),
)