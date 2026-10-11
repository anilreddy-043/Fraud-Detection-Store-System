from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.app.database.models import PredictionRecord, Transaction


def build_analytics_summary(db: Session):
    total = db.query(func.count(PredictionRecord.id)).scalar() or 0
    suspicious = (
        db.query(func.count(PredictionRecord.id))
        .filter(PredictionRecord.prediction == 1)
        .scalar()
        or 0
    )
    avg_amount = (
        db.query(func.avg(Transaction.amount))
        .join(PredictionRecord, Transaction.transaction_id == PredictionRecord.transaction_id)
        .scalar()
        or 0.0
    )
    hourly_rows = (
        db.query(
            Transaction.hour,
            func.count(PredictionRecord.id),
            func.count(func.distinct(Transaction.customer_id)),
            func.sum(PredictionRecord.prediction),
        )
        .join(PredictionRecord, Transaction.transaction_id == PredictionRecord.transaction_id)
        .group_by(Transaction.hour)
        .all()
    )
    hourly = {
        int(hour): {
            "transactions": int(transactions),
            "users": int(users),
            "suspicious": int(suspicious_count or 0),
        }
        for hour, transactions, users, suspicious_count in hourly_rows
    }
    activity_by_hour = [
        {
            "hour": f"{hour:02d}",
            "transactions": hourly.get(hour, {}).get("transactions", 0),
            "users": hourly.get(hour, {}).get("users", 0),
        }
        for hour in range(24)
    ] if total else []
    fraud_by_hour = [
        {
            "hour": f"{hour:02d}",
            "fraud_cases": hourly.get(hour, {}).get("suspicious", 0),
            "fraud_rate": round(
                hourly[hour]["suspicious"] / hourly[hour]["transactions"] * 100,
                2,
            ) if hourly.get(hour, {}).get("transactions") else 0.0,
            "total": hourly.get(hour, {}).get("transactions", 0),
        }
        for hour in range(24)
    ] if total else []
    recent_assessments = [
        {
            "assessment": record.id,
            "transactionId": record.transaction_id,
            "probability": float(record.probability) * 100,
            "fraudulent": bool(record.prediction),
        }
        for record in reversed(
            db.query(PredictionRecord)
            .order_by(PredictionRecord.id.desc())
            .limit(20)
            .all()
        )
    ]
    return {
        "total_transactions": total,
        "suspicious_transactions": suspicious,
        "alert_rate": round((suspicious / total) * 100, 2) if total else 0.0,
        "average_amount": round(float(avg_amount), 2),
        "activity_by_hour": activity_by_hour,
        "fraud_by_hour": fraud_by_hour,
        "recent_assessments": recent_assessments,
    }
