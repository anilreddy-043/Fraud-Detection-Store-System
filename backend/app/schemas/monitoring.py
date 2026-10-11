from pydantic import BaseModel


class MonitoringSummary(BaseModel):
    total_transactions: int = 0
    suspicious_transactions: int = 0
    alert_rate: float = 0.0
    average_amount: float = 0.0
