from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from typing import Annotated , Literal
from enum import Enum


class UserRole(str, Enum):
    ADMIN = "admin"
    ORGANIZER = "organizer"
    ATTENDEE = "attendee"


class CreateUser(BaseModel):
    user_name : str = Field(min_length=1 , max_length=20)
    email : EmailStr = Field(min_length=1 , max_length=60)
    password : str
    role : UserRole

    @validator("password")
    def password_max_72_bytes(cls, value: str) -> str:
        if len(value.encode("utf-8")) > 72:
            raise ValueError("password must be 72 bytes or fewer")
        return value
    
class UpdateUser(BaseModel):
    user_name : str = Field(min_length=1 , max_length=20)
    email : EmailStr = Field(min_length=1 , max_length=60)
    role : UserRole

class UserResponce(BaseModel):
    id :int
    user_name : str 
    email : EmailStr 
    role : UserRole
    is_verified : bool

class UserUpdate(BaseModel):
    username: Optional[str]
    password: Optional[str]
    role: Optional[UserRole]

class Token(BaseModel):
    access_token : str
    token_type : str

class GoogleTokenRequest(BaseModel):
    id_token: str = Field(min_length=1)

class update_password(BaseModel):
    current_password : str 
    new_password : str

    @validator("new_password")
    def new_password_max_72_bytes(cls, value: str) -> str:
        if len(value.encode("utf-8")) > 72:
            raise ValueError("password must be 72 bytes or fewer")
        return value
