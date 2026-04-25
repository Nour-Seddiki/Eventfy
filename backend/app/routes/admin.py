from fastapi import APIRouter, Path
from starlette import status

from app.db.session import db_dependency
from app.services.admin_services import Admin
from app.services.auth_service import user_dependency


router = APIRouter(prefix="/admin", tags=["admin"])



@router.get("/view_all_users",status_code=status.HTTP_200_OK)
def view_all_users(user:user_dependency , db:db_dependency):
    return Admin().view_all_users(user,db)

@router.get("/dashboard", status_code=status.HTTP_200_OK)
def dashboard(user: user_dependency, db: db_dependency):
    return Admin().DashBoard(user, db)



@router.put("/deactivate_user/{user_id}", status_code=status.HTTP_202_ACCEPTED)
def deactivate_user(user: user_dependency, db: db_dependency, user_id: int = Path(gt=0)):
    return Admin().deactivate_user(user, db, user_id)


@router.put("/ban_user/{user_id}", status_code=status.HTTP_202_ACCEPTED)
def ban_user(user: user_dependency, db: db_dependency, user_id: int = Path(gt=0)):
    return Admin().ban_user(user, db, user_id)


@router.delete("/delete_user/{user_id}", status_code=status.HTTP_202_ACCEPTED)
def delete_user(user: user_dependency, db: db_dependency, user_id: int = Path(gt=0)):
    return Admin().delete_user(user, db, user_id)


@router.put("/reactive_user/{user_id}", status_code=status.HTTP_202_ACCEPTED)
def reactive_user(user: user_dependency, db: db_dependency, user_id: int = Path(gt=0)):
    return Admin().reactive_user(user, db, user_id)
