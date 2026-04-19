from typing import List
from fastapi import APIRouter, Request
from starlette import status

from app.db.session import db_dependency
from app.services.auth_service import user_dependency
from app.services.active_session_service import (
    get_user_sessions,
    revoke_session,
    revoke_all_other_sessions,
)
from app.schemas.active_session import ActiveSessionResponse

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.get("/", response_model=List[ActiveSessionResponse])
async def list_sessions(user: user_dependency, db: db_dependency, request: Request):
    """List all active sessions (logged-in devices) for the current user."""
    current_jti = user.get("jti")
    return get_user_sessions(user["user_id"], current_jti, db)


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def logout_session(session_id: int, user: user_dependency, db: db_dependency):
    """Revoke a specific session (log out a device)."""
    revoke_session(session_id, user["user_id"], db)


@router.delete("/", status_code=status.HTTP_200_OK)
async def logout_all_other_sessions(user: user_dependency, db: db_dependency):
    """Revoke all sessions except the current one."""
    current_jti = user.get("jti")
    count = revoke_all_other_sessions(user["user_id"], current_jti, db)
    return {"message": f"Logged out {count} other session(s)"}
