from fastapi import Depends
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy.orm import sessionmaker
from typing import Annotated
from app.config import settings

# Build the connection URL using SQLAlchemy's URL.create() to properly
# handle special characters in the password without manual URL-encoding.
#
# Supabase pooler (port 6543) expects the project ref in the username
# as "postgres.PROJECT_REF". psycopg2 can misinterpret the dot, so we
# pass it explicitly via the `options` connect_arg as well.
SQLALCHEMY_DATABASE_URL = URL.create(
    drivername="postgresql+psycopg2",
    username=settings.db_user,
    password=settings.db_password,
    host=settings.db_host,
    port=settings.db_port,
    database=settings.db_name,
)

# Extract project ref from the DB_USER (e.g. "postgres.axpgoderxxcvbxqaigmo")
_project_ref = settings.db_user.split(".", 1)[1] if "." in settings.db_user else None
_connect_args = {}
if _project_ref:
    _connect_args["options"] = f"-c search_path=public --cluster=postgres/{_project_ref}"

# QueuePool keeps a pool of open connections, avoiding the ~200-500ms
# TCP+TLS handshake penalty on every request to Supabase.
# pool_pre_ping detects and replaces stale / dropped connections.
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
    pool_recycle=300,
    connect_args=_connect_args,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


db_dependency = Annotated[Session, Depends(get_db)]
