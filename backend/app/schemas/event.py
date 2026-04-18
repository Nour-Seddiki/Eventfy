from pydantic import BaseModel, EmailStr,Field
from typing import Optional
from typing import Annotated , Literal
from datetime import datetime

class eventRequest(BaseModel):
    title : str =Field(min_length=3 , max_length=50)
    description : str 
    category : str 
    location : str 
    price : float
    available_tickets : int
    date : datetime
    image : Optional[str] = None

class eventUpdate(BaseModel):
    title : Optional[str] = Field(default=None, min_length=3, max_length=50)
    description : Optional[str] = None
    category : Optional[str] = None
    location : Optional[str] = None
    price : Optional[float] = None
    available_tickets : Optional[int] = None
    date : Optional[datetime] = None
    image : Optional[str] = None
    
