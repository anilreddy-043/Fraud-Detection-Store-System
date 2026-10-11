from sqlalchemy import Boolean, Column, Float, Integer, String

from backend.app.database.database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String, unique=True, index=True)
    amount = Column(Float, nullable=False)
    type = Column(String, nullable=False, default="PAYMENT")
    oldbalanceOrg = Column(Float, nullable=False, default=0.0)
    newbalanceOrig = Column(Float, nullable=False, default=0.0)
    oldbalanceDest = Column(Float, nullable=False, default=0.0)
    newbalanceDest = Column(Float, nullable=False, default=0.0)
    merchant_id = Column(String, nullable=False)
    device_type = Column(String, nullable=False)
    customer_id = Column(String, nullable=False)
    country = Column(String, nullable=False)
    hour = Column(Integer, nullable=False)
    is_new_customer = Column(Boolean, default=False)


class PredictionRecord(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String, unique=True, index=True)
    prediction = Column(Integer, nullable=False)
    probability = Column(Float, nullable=False)
