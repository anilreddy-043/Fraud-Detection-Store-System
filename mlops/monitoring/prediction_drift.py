from __future__ import annotations

from pathlib import Path

import pandas as pd


def compute_prediction_drift(reference_predictions: pd.Series, current_predictions: pd.Series) -> dict:
    """Compare prediction-rate drift between two score series."""
    ref = pd.Series(reference_predictions, copy=True)
    cur = pd.Series(current_predictions, copy=True)

    reference_rate = float(ref.mean()) if len(ref) else 0.0
    current_rate = float(cur.mean()) if len(cur) else 0.0

    return {
        "reference_prediction_rate": reference_rate,
        "current_prediction_rate": current_rate,
        "rate_shift": abs(current_rate - reference_rate),
        "samples_reference": int(len(ref)),
        "samples_current": int(len(cur)),
    }


def save_prediction_drift_report(reference_path: str | Path, current_path: str | Path, output_path: str | Path) -> dict:
    reference = pd.read_csv(reference_path)
    current = pd.read_csv(current_path)

    reference_series = reference.iloc[:, 0] if reference.columns.size else pd.Series([], dtype=float)
    current_series = current.iloc[:, 0] if current.columns.size else pd.Series([], dtype=float)

    drift = compute_prediction_drift(reference_series, current_series)

    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(str(drift), encoding="utf-8")
    return drift
