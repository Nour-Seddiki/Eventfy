from fastapi import APIRouter
from starlette import status

from app.db.session import db_dependency
from app.schemas.user import UpdateUser
from app.services.auth_service import user_dependency
from app.services.user_service import userServices


router = APIRouter(prefix="/users", tags=["users"])

_svc = userServices()


@router.get("/my_profile", status_code=status.HTTP_200_OK)
async def get_my_profile(user: user_dependency, db: db_dependency):
    return _svc.get_my_profile(user, db)


@router.put("/update_me", status_code=status.HTTP_202_ACCEPTED)
async def update_me(user: user_dependency, db: db_dependency, data: UpdateUser):
    return _svc.update_user(user, db, data)


@router.get("/my_activity", status_code=status.HTTP_200_OK)
async def get_my_activity(user: user_dependency, db: db_dependency):
    return _svc.get_my_activity(user, db)


@router.delete("/delete_me", status_code=status.HTTP_202_ACCEPTED)
async def delete_my_account(user: user_dependency, db: db_dependency):
    return _svc.delete_my_account(user, db)
