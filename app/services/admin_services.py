from datetime import datetime, timezone

from fastapi import HTTPException, status
from app.models.user import User


class Admin : 
    def view_all_users(self ,user,db):
        if user is None:
            raise  HTTPException(status_code=401 , detail="Authentication failed")
        
        if user.get("user_role") != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admin has the right to see all users",
            )
        
        users_model = db.query(User).all()
        if not users_model :
            raise HTTPException(status_code=404 , detail="users not found")
        
        return users_model

    def deactivate_user(self , user ,db , user_to_deactive):
        if user is None:
            raise HTTPException(status_code=401, detail="Authentication failed")

        if user.get("user_role") != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admin can deactivate users",
            )

        user_model = (
            db.query(User)
            .filter(User.id == user_to_deactive, User.is_deleted.is_(False))
            .first()
        )
        if user_model is None:
            raise HTTPException(status_code=404, detail="user not found")

        user_model.is_deleted = True
        user_model.deleted_at = datetime.now(timezone.utc)
        user_model.is_verified = False
        db.add(user_model)
        db.commit()
        db.refresh(user_model)
        return {"message": "user has been deactivated successfully"}
    

    def ban_user(self, user, db, user_to_ban):
        if user is None:
            raise HTTPException(status_code=401, detail="Authentication failed")

        if user.get("user_role") != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admin can ban users",
            )

        user_model = (
            db.query(User)
            .filter(User.id == user_to_ban, User.is_deleted.is_(False))
            .first()
        )
        if user_model is None:
            raise HTTPException(status_code=404, detail="user not found")

        user_model.is_deleted = True
        user_model.deleted_at = datetime.now(timezone.utc)
        user_model.is_verified = False
        db.add(user_model)
        db.commit()
        db.refresh(user_model)
        return {"message": "user has been banned successfully"}

    def delete_user(self, user, db, user_to_delete):
        return self.deactivate_user(user, db, user_to_delete)
    
    def reactive_user(self , user ,db , user_to_reactive):
        if user is None:
            raise HTTPException(status_code=401, detail="Authentication failed")

        if user.get("user_role") != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admin can ban users",
            )

        user_model = (
            db.query(User)
            .filter(User.id == user_to_reactive, User.is_deleted.is_(True))
            .first()
        )
        if user_model is None:
            raise HTTPException(status_code=404, detail="user not found")
        
        user_model.is_deleted = False
        user_model.deleted_at = datetime.now(timezone.utc)
        user_model.is_verified = True
        db.add(user_model)
        db.commit()
        db.refresh(user_model)
        return {"message": "user has reactive  banned successfully"}


