from datetime import datetime

from sqlalchemy.orm import Session

from backend.app.database.models import PredictionRecord, Transaction


def ensure_transaction_time(transaction_data: dict) -> dict:
    updated = dict(transaction_data)
    updated.setdefault("transaction_date", datetime.now().strftime("%Y-%m-%d"))
    updated.setdefault("transaction_time", datetime.now().strftime("%H:%M:%S"))
    return updated


def list_transactions(db: Session, limit: int | None = None):
    query = db.query(Transaction).order_by(Transaction.id.desc())
    if limit is not None:
        query = query.limit(limit)
    return query.all()


def create_transaction(db: Session, transaction_data: dict) -> Transaction:
    transaction = Transaction(**transaction_data)
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction


def get_transaction(db: Session, transaction_id: str):
    return db.query(Transaction).filter(Transaction.transaction_id == transaction_id).first()


def create_prediction(db: Session, transaction_id: str, prediction: int, probability: float) -> PredictionRecord:
    record = PredictionRecord(transaction_id=transaction_id, prediction=prediction, probability=probability)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def save_assessment(db: Session, transaction_data: dict, prediction: int, probability: float) -> None:
    transaction_data = ensure_transaction_time(transaction_data)
    transaction_id = transaction_data["transaction_id"]
    transaction = get_transaction(db, transaction_id)
    if transaction is None:
        db.add(Transaction(**transaction_data))
    else:
        for field, value in transaction_data.items():
            setattr(transaction, field, value)

    prediction_record = (
        db.query(PredictionRecord)
        .filter(PredictionRecord.transaction_id == transaction_id)
        .first()
    )
    if prediction_record is None:
        prediction_record = PredictionRecord(transaction_id=transaction_id)
        db.add(prediction_record)

    prediction_record.prediction = prediction
    prediction_record.probability = probability
    db.commit()
