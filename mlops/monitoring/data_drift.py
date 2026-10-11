from __future__ import annotations

from pathlib import Path

import pandas as pd


def compute_data_drift(reference_df: pd.DataFrame, current_df: pd.DataFrame) -> dict:
    """Compute a simple drift summary for numeric columns."""
    reference = reference_df.copy()
    current = current_df.copy()

    numeric_cols = [col for col in reference.columns if pd.api.types.is_numeric_dtype(reference[col])]
    results = {}

    for col in numeric_cols:
        if col not in current.columns:
            continue

        ref_mean = float(reference[col].mean())
        cur_mean = float(current[col].mean())
        ref_std = float(reference[col].std(ddof=0) if reference[col].std(ddof=0) != 0 else 1.0)
        cur_std = float(current[col].std(ddof=0) if current[col].std(ddof=0) != 0 else 1.0)

        mean_shift = abs(cur_mean - ref_mean)
        std_shift = abs(cur_std - ref_std)

        results[col] = {
            "reference_mean": ref_mean,
            "current_mean": cur_mean,
            "mean_shift": mean_shift,
            "reference_std": ref_std,
            "current_std": cur_std,
            "std_shift": std_shift,
        }

    return results


def save_drift_report(reference_path: str | Path, current_path: str | Path, output_path: str | Path) -> dict:
    reference_df = pd.read_csv(reference_path)
    current_df = pd.read_csv(current_path)
    drift = compute_data_drift(reference_df, current_df)

    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(str(drift), encoding="utf-8")
    return drift
