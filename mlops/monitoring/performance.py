from __future__ import annotations

from pathlib import Path

import pandas as pd
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score


def evaluate_model_performance(y_true: pd.Series, y_pred: pd.Series, y_proba: pd.Series | None = None) -> dict:
    """Compute standard classification metrics for fraud detection."""
    metrics = {
        "accuracy": round(float(accuracy_score(y_true, y_pred)), 4),
        "precision": round(float(precision_score(y_true, y_pred, zero_division=0)), 4),
        "recall": round(float(recall_score(y_true, y_pred, zero_division=0)), 4),
        "f1_score": round(float(f1_score(y_true, y_pred, zero_division=0)), 4),
    }

    if y_proba is not None:
        metrics["roc_auc"] = round(float(roc_auc_score(y_true, y_proba)), 4)

    return metrics


def save_performance_report(metrics: dict, output_path: str | Path) -> None:
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(str(metrics), encoding="utf-8")
