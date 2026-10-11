from __future__ import annotations

import argparse
import json
from pathlib import Path

import joblib
import pandas as pd
from sklearn.metrics import (
    average_precision_score,
    classification_report,
    confusion_matrix,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_MODEL_PATH = ROOT / "models" / "production" / "fraud_model.joblib"
DEFAULT_DATA_PATH = ROOT / "data" / "processed" / "fraud_sampled.csv"
DEFAULT_REPORT_PATH = ROOT / "artifacts" / "reports" / "evaluation_report.json"


def build_features(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series]:
    feature_columns = [
        "amount",
        "oldbalanceOrg",
        "newbalanceOrig",
        "oldbalanceDest",
        "newbalanceDest",
        "type",
    ]
    if not set(feature_columns).issubset(df.columns):
        missing = sorted(set(feature_columns) - set(df.columns))
        raise ValueError(f"Missing required columns for evaluation: {missing}")

    X = pd.get_dummies(df[feature_columns], columns=["type"], drop_first=True)
    y = df["isFraud"].astype(int)
    return X, y


def evaluate_model(model_path: Path, data_path: Path) -> dict:
    if not model_path.exists():
        raise FileNotFoundError(f"Model not found at {model_path}")
    if not data_path.exists():
        raise FileNotFoundError(f"Dataset not found at {data_path}")

    model = joblib.load(model_path)
    df = pd.read_csv(data_path)
    X, y = build_features(df)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=42
    )

    if hasattr(model, "predict_proba"):
        probs = model.predict_proba(X_test)[:, 1]
    else:
        probs = model.decision_function(X_test)
    preds = model.predict(X_test)

    report = classification_report(
        y_test,
        preds,
        target_names=["Non-Fraud", "Fraud"],
        output_dict=True,
    )
    metrics = {
        "accuracy": float((preds == y_test).mean()),
        "precision": float(report["Fraud"]["precision"]),
        "recall": float(report["Fraud"]["recall"]),
        "f1_score": float(report["Fraud"]["f1-score"]),
        "roc_auc": float(roc_auc_score(y_test, probs)),
        "average_precision": float(average_precision_score(y_test, probs)),
        "confusion_matrix": confusion_matrix(y_test, preds).tolist(),
        "classification_report": report,
    }
    return metrics


def main() -> None:
    parser = argparse.ArgumentParser(description="Evaluate the fraud detection model.")
    parser.add_argument("--model-path", type=Path, default=DEFAULT_MODEL_PATH)
    parser.add_argument("--data-path", type=Path, default=DEFAULT_DATA_PATH)
    parser.add_argument("--output-path", type=Path, default=DEFAULT_REPORT_PATH)
    args = parser.parse_args()

    metrics = evaluate_model(args.model_path, args.data_path)

    args.output_path.parent.mkdir(parents=True, exist_ok=True)
    args.output_path.write_text(json.dumps(metrics, indent=2))

    print(json.dumps({
        "accuracy": round(metrics["accuracy"], 4),
        "precision": round(metrics["precision"], 4),
        "recall": round(metrics["recall"], 4),
        "f1_score": round(metrics["f1_score"], 4),
        "roc_auc": round(metrics["roc_auc"], 4),
        "average_precision": round(metrics["average_precision"], 4),
    }, indent=2))
    print(f"Saved evaluation report to: {args.output_path}")


if __name__ == "__main__":
    main()
