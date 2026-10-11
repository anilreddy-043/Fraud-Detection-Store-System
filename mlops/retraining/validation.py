from __future__ import annotations

from pathlib import Path

import pandas as pd


def validate_retraining_output(model_path: str | Path, metrics_path: str | Path, required_metrics: list[str] | None = None) -> dict:
    """Validate that retraining produced a model and required metrics."""
    model_path = Path(model_path)
    metrics_path = Path(metrics_path)

    if required_metrics is None:
        required_metrics = ["accuracy", "precision", "recall"]

    model_exists = model_path.exists()
    metrics_exists = metrics_path.exists()

    report = {
        "model_exists": model_exists,
        "metrics_exists": metrics_exists,
        "valid": model_exists and metrics_exists,
        "missing_metrics": [],
    }

    if metrics_exists:
        metrics = pd.read_json(metrics_path)
        missing = [metric for metric in required_metrics if metric not in metrics.columns]
        report["missing_metrics"] = missing
        report["valid"] = report["valid"] and not missing

    return report
