
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.api.dependencies import get_db
from backend.app.database.models import PredictionRecord
from backend.app.database.crud import (
    create_transaction,
    get_transaction,
    list_transactions as get_all_transactions,
)
from backend.app.schemas.transaction import TransactionCreate, TransactionResponse

router = APIRouter()


def transaction_response(record, db: Session):
    prediction_record = (
        db.query(PredictionRecord)
        .filter(
            PredictionRecord.transaction_id == record.transaction_id
        )
        .first()
    )

    prediction = (
        prediction_record.prediction
        if prediction_record is not None
        else None
    )
    probability = (
        prediction_record.probability
        if prediction_record is not None
        else None
    )

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
        transaction_date=record.transaction_date,
        transaction_time=record.transaction_time,
        is_new_customer=record.is_new_customer,
        prediction=prediction,
        probability=probability,
        fraudulent=bool(prediction) if prediction is not None else None,
    )


@router.get("", response_model=list[TransactionResponse])
def read_transactions(db: Session = Depends(get_db)):
    records = get_all_transactions(db)
    return [transaction_response(record, db) for record in records]


@router.get("/{transaction_id}", response_model=TransactionResponse)
def read_transaction(
    transaction_id: str,
    db: Session = Depends(get_db),
):
    record = get_transaction(db, transaction_id)

    if record is None:
        raise HTTPException(
            status_code=404,
            detail="Transaction not found",
        )

    return transaction_response(record, db)


@router.post("", response_model=TransactionResponse)
def store_transaction(
    payload: TransactionCreate,
    db: Session = Depends(get_db),
):
    record = create_transaction(db, payload.model_dump())
    return transaction_response(record, db)
