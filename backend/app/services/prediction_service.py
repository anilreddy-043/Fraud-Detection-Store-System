import pandas as pd

from backend.app.ml.predictor import FraudPredictor

predictor = FraudPredictor()


def predict_transaction(payload: dict):
    df = pd.DataFrame([payload])
    score = predictor.predict(df)[0]
    decision = 1 if score >= 0.5 else 0
    return {
        "transaction_id": payload.get("transaction_id", "unknown"),
        "prediction": decision,
        "probability": round(float(score), 4),
        "fraudulent": bool(decision),
    }
