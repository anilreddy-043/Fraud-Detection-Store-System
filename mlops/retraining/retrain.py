from __future__ import annotations

import json
from pathlib import Path

import joblib
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score
from sklearn.model_selection import train_test_split

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DATA_PATH = ROOT / "data" / "processed" / "fraud_sampled.csv"
DEFAULT_MODEL_PATH = ROOT / "models" / "production" / "fraud_model.joblib"
DEFAULT_METRICS_PATH = ROOT / "models" / "production" / "training_metrics.json"


def build_features(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series]:
    feature_columns = [
        "amount",
        "merchant_id_hash",
        "customer_id_hash",
        "device_type_mobile",
        "device_type_desktop",
        "device_type_tablet",
        "country_US",
        "country_CA",
        "country_UK",
        "country_IN",
        "country_FR",
        "country_OTHER",
        "hour",
        "hour_sin",
        "hour_cos",
        "amount_log",
        "is_new_customer_int",
    ]

    missing = [col for col in feature_columns if col not in df.columns]
    if missing:
        raise ValueError(f"Missing required feature columns: {missing}")

    X = df[feature_columns]
    y = df["isFraud"].astype(int)
    return X, y


def retrain_model(data_path: str | Path = DEFAULT_DATA_PATH, model_path: str | Path = DEFAULT_MODEL_PATH) -> dict:
    df = pd.read_csv(data_path)
    X, y = build_features(df)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=42
    )

    model = LogisticRegression(class_weight="balanced", max_iter=1000, random_state=42)
    model.fit(X_train, y_train)

    predictions = model.predict(X_test)
    metrics = {
        "accuracy": round(float(accuracy_score(y_test, predictions)), 4),
        "precision": round(float(precision_score(y_test, predictions, zero_division=0)), 4),
        "recall": round(float(recall_score(y_test, predictions, zero_division=0)), 4),
    }

    model_path = Path(model_path)
    model_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, model_path)

    metrics_path = model_path.parent / "training_metrics.json"
    metrics_path.write_text(json.dumps(metrics, indent=2), encoding="utf-8")

    metadata = {
        "model_name": "logistic_regression",
        "version": "1.0.0",
        "status": "active",
        "data_path": str(data_path),
    }
    (model_path.parent / "model_metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")

    return metrics


if __name__ == "__main__":
    print(retrain_model())
