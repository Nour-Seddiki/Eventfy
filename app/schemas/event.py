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
    
