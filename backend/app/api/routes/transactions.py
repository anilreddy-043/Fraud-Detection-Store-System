from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.api.dependencies import get_db
from backend.app.database.crud import create_transaction, get_transaction
from backend.app.schemas.transaction import TransactionCreate, TransactionResponse

router = APIRouter()


@router.get("", response_model=list[TransactionResponse])
def list_transactions(db: Session = Depends(get_db)):
    return []


@router.get("/{transaction_id}", response_model=TransactionResponse)
def read_transaction(transaction_id: str, db: Session = Depends(get_db)):
    record = get_transaction(db, transaction_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return TransactionResponse(
        id=record.id,
        transaction_id=record.transaction_id,
        amount=record.amount,
        type=record.type,
        oldbalanceOrg=record.oldbalanceOrg,
        newbalanceOrig=record.newbalanceOrig,
        oldbalanceDest=record.oldbalanceDest,
        newbalanceDest=record.newbalanceDest,
        merchant_id=record.merchant_id,
        device_type=record.device_type,
        customer_id=record.customer_id,
        country=record.country,
        hour=record.hour,
        is_new_customer=record.is_new_customer,
    )


@router.post("", response_model=TransactionResponse)
def store_transaction(payload: TransactionCreate, db: Session = Depends(get_db)):
    record = create_transaction(db, payload.model_dump())
    return TransactionResponse(
        id=record.id,
        transaction_id=record.transaction_id,
        amount=record.amount,
        type=record.type,
        oldbalanceOrg=record.oldbalanceOrg,
        newbalanceOrig=record.newbalanceOrig,
        oldbalanceDest=record.oldbalanceDest,
        newbalanceDest=record.newbalanceDest,
        merchant_id=record.merchant_id,
        device_type=record.device_type,
        customer_id=record.customer_id,
        country=record.country,
        hour=record.hour,
        is_new_customer=record.is_new_customer,
    )
