from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, precision_score, recall_score

from backend.app.config.settings import settings
from backend.app.ml.preprocessor import preprocess_transaction


MODEL_DIR = settings.MODELS_DIR
MODEL_DIR.mkdir(parents=True, exist_ok=True)


def build_training_dataset() -> tuple[pd.DataFrame, pd.Series]:
    records = [
        {
            "amount": 45.0,
            "merchant_id": "m-001",
            "device_type": "mobile",
            "customer_id": "c-001",
            "country": "US",
            "hour": 12,
            "is_new_customer": False,
            "label": 0,
        },
        {
            "amount": 240.0,
            "merchant_id": "m-010",
            "device_type": "desktop",
            "customer_id": "c-002",
            "country": "CA",
            "hour": 3,
            "is_new_customer": True,
            "label": 1,
        },
        {
            "amount": 120.0,
            "merchant_id": "m-003",
            "device_type": "tablet",
            "customer_id": "c-003",
            "country": "US",
            "hour": 18,
            "is_new_customer": False,
            "label": 0,
        },
        {
            "amount": 820.0,
            "merchant_id": "m-004",
            "device_type": "mobile",
            "customer_id": "c-004",
            "country": "UK",
            "hour": 1,
            "is_new_customer": True,
            "label": 1,
        },
        {
            "amount": 62.0,
            "merchant_id": "m-005",
            "device_type": "mobile",
            "customer_id": "c-005",
            "country": "US",
            "hour": 11,
            "is_new_customer": False,
            "label": 0,
        },
        {
            "amount": 560.0,
            "merchant_id": "m-006",
            "device_type": "desktop",
            "customer_id": "c-006",
            "country": "FR",
            "hour": 2,
            "is_new_customer": True,
            "label": 1,
        },
        {
            "amount": 80.0,
            "merchant_id": "m-007",
            "device_type": "tablet",
            "customer_id": "c-007",
            "country": "US",
            "hour": 21,
            "is_new_customer": False,
            "label": 0,
        },
        {
            "amount": 710.0,
            "merchant_id": "m-008",
            "device_type": "mobile",
            "customer_id": "c-008",
            "country": "IN",
            "hour": 0,
            "is_new_customer": True,
            "label": 1,
        },
    ]

    for record in records:
        is_fraud = bool(record["label"])
        record.update({
            "type": "TRANSFER" if is_fraud else "PAYMENT",
            "oldbalanceOrg": record["amount"] if is_fraud else record["amount"] * 5,
            "newbalanceOrig": 0.0 if is_fraud else record["amount"] * 4,
            "oldbalanceDest": 0.0,
            "newbalanceDest": 0.0,
        })

    df = pd.DataFrame(records)
    X = pd.DataFrame([preprocess_transaction(record) for _, record in df.iterrows()])
    y = df["label"]
    return X, y


def train_model() -> LogisticRegression:
    X, y = build_training_dataset()
    model = LogisticRegression(max_iter=2000, random_state=42)
    model.fit(X, y)
    return model


def main() -> None:
    model = train_model()
    model_path = MODEL_DIR / "fraud_model.joblib"
    metrics_path = MODEL_DIR / "training_metrics.json"

    import joblib

    joblib.dump(model, model_path)

    X, y = build_training_dataset()
    predictions = model.predict(X)
    metrics = {
        "accuracy": round(float(accuracy_score(y, predictions)), 4),
        "precision": round(float(precision_score(y, predictions, zero_division=0)), 4),
        "recall": round(float(recall_score(y, predictions, zero_division=0)), 4),
        "report": classification_report(y, predictions, output_dict=True),
    }
    metrics_path.write_text(json.dumps(metrics, indent=2))

    metadata = {
        "model_name": "logistic_regression",
        "version": "1.0.0",
        "status": "active",
        "training_date": "2026-10-08",
    }
    (MODEL_DIR / "model_metadata.json").write_text(json.dumps(metadata, indent=2))

    print(f"Model saved to {model_path}")
    print(f"Metrics saved to {metrics_path}")


if __name__ == "__main__":
    main()
