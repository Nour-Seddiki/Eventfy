from typing import Optional

from pydantic import BaseModel, Field


class TicketQRInput(BaseModel):
    qr_input: Optional[str] = Field(default=None, min_length=1)
    qr_code: Optional[str] = Field(default=None, min_length=1)



