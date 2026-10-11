from typing import Literal

from pydantic import BaseModel, Field


class PredictionRequest(BaseModel):
    transaction_id: str = Field(..., description="Unique transaction identifier")
    amount: float = Field(..., ge=0)
    type: Literal["CASH_IN", "CASH_OUT", "DEBIT", "PAYMENT", "TRANSFER"] = "PAYMENT"
    oldbalanceOrg: float = Field(default=0.0, ge=0)
    newbalanceOrig: float = Field(default=0.0, ge=0)
    oldbalanceDest: float = Field(default=0.0, ge=0)
    newbalanceDest: float = Field(default=0.0, ge=0)
    merchant_id: str = Field(default="merchant-default")
    device_type: str = Field(default="mobile")
    customer_id: str = Field(default="customer-default")
    country: str = Field(default="US")
    hour: int = Field(default=12, ge=0, le=23)
    is_new_customer: bool = Field(default=False)


class PredictionResponse(BaseModel):
    transaction_id: str
    prediction: int
    probability: float
    fraudulent: bool
