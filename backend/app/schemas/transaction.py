from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class TransactionBase(BaseModel):
    transaction_id: str = Field(..., description="Unique transaction ID")
    amount: float = Field(..., ge=0)
    type: Literal["CASH_IN", "CASH_OUT", "DEBIT", "PAYMENT", "TRANSFER"] = "PAYMENT"
    oldbalanceOrg: float = Field(default=0.0, ge=0)
    newbalanceOrig: float = Field(default=0.0, ge=0)
    oldbalanceDest: float = Field(default=0.0, ge=0)
    newbalanceDest: float = Field(default=0.0, ge=0)
    merchant_id: str = Field(...)
    device_type: str = Field(default="mobile")
    customer_id: str = Field(...)
    country: str = Field(default="US")
    hour: int = Field(default=12, ge=0, le=23)
    is_new_customer: bool = Field(default=False)


class TransactionCreate(TransactionBase):
    pass


class TransactionResponse(TransactionBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
