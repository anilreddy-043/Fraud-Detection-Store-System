from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

import joblib
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, precision_score, recall_score
from sklearn.model_selection import train_test_split

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DATA_PATH = ROOT / "data" / "processed" / "fraud_sampled.csv"
DEFAULT_MODEL_PATH = ROOT / "models" / "production" / "fraud_model.joblib"
DEFAULT_METRICS_PATH = ROOT / "models" / "production" / "training_metrics.json"
DEFAULT_METADATA_PATH = ROOT / "models" / "production" / "model_metadata.json"


def build_features(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series]:
    feature_columns = [
        "amount",
        "oldbalanceOrg",
        "newbalanceOrig",
        "oldbalanceDest",
        "newbalanceDest",
        "type",
    ]
    missing = sorted(set(feature_columns) - set(df.columns))
    if missing:
        raise ValueError(f"Missing required columns for training: {missing}")

    X = pd.get_dummies(df[feature_columns], columns=["type"], drop_first=True)
    y = df["isFraud"].astype(int)
    return X, y


def train_model(X_train: pd.DataFrame, y_train: pd.Series) -> LogisticRegression:
    model = LogisticRegression(class_weight="balanced", max_iter=1000, random_state=42)
    model.fit(X_train, y_train)
    return model


def retrain_model(data_path: Path, model_path: Path, metrics_path: Path, metadata_path: Path) -> dict:
    if not data_path.exists():
        raise FileNotFoundError(f"Training dataset not found at {data_path}")

    df = pd.read_csv(data_path)
    X, y = build_features(df)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=42
    )

    model = train_model(X_train, y_train)
    predictions = model.predict(X_test)

    metrics = {
        "accuracy": round(float(accuracy_score(y_test, predictions)), 4),
        "precision": round(float(precision_score(y_test, predictions, zero_division=0)), 4),
        "recall": round(float(recall_score(y_test, predictions, zero_division=0)), 4),
        "report": classification_report(y_test, predictions, target_names=["Non-Fraud", "Fraud"], output_dict=True),
    }

    model_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, model_path)
    metrics_path.write_text(json.dumps(metrics, indent=2))

    metadata = {
        "model_name": "logistic_regression",
        "version": "1.0.0",
        "status": "active",
        "training_date": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "source_data": str(data_path),
    }
    metadata_path.write_text(json.dumps(metadata, indent=2))

    return metrics


def main() -> None:
    parser = argparse.ArgumentParser(description="Retrain the fraud detection model from the processed dataset.")
    parser.add_argument("--data-path", type=Path, default=DEFAULT_DATA_PATH)
    parser.add_argument("--model-path", type=Path, default=DEFAULT_MODEL_PATH)
    parser.add_argument("--metrics-path", type=Path, default=DEFAULT_METRICS_PATH)
    parser.add_argument("--metadata-path", type=Path, default=DEFAULT_METADATA_PATH)
    args = parser.parse_args()

    metrics = retrain_model(args.data_path, args.model_path, args.metrics_path, args.metadata_path)

    print(json.dumps({
        "accuracy": metrics["accuracy"],
        "precision": metrics["precision"],
        "recall": metrics["recall"],
        "training_data": str(args.data_path),
        "model_path": str(args.model_path),
    }, indent=2))


if __name__ == "__main__":
    main()
