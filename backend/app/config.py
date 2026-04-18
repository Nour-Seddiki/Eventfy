import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


# Load .env early so any module importing settings gets configured values.
load_dotenv(dotenv_path=Path(__file__).resolve().parents[1] / ".env")


BASE_DIR = Path(__file__).resolve().parents[1]  # …/backend/


def _resolve_database_url(raw: str) -> str:
    """Turn a relative SQLite path into an absolute one so the DB file is
    always created inside the project directory regardless of cwd."""
    if raw.startswith("sqlite:///./") or raw.startswith("sqlite:///Eventfy"):
        # Strip the SQLite prefix, resolve relative to BASE_DIR
        rel = raw.replace("sqlite:///./", "").replace("sqlite:///", "")
        return f"sqlite:///{BASE_DIR / rel}"
    return raw


@dataclass(frozen=True)
class Settings:
    secret_key: str
    algorithm: str
    access_token_expire_minutes: int
    database_url: str
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


settings = Settings(
    secret_key=os.getenv("SECRET_KEY", "dev-insecure-secret-change-me"),
    algorithm=os.getenv("ALGORITHM", "HS256"),
    access_token_expire_minutes=int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "20")),
    database_url=_resolve_database_url(os.getenv("DATABASE_URL", "sqlite:///./Eventfy.db")),
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
)