from __future__ import annotations

from pathlib import Path

from mlops.retraining.retrain import retrain_model


def trigger_retraining(data_path: str | Path | None = None) -> dict:
    """Run the retraining flow and return the generated metrics."""
    if data_path is None:
        data_path = Path("data/processed/fraud_sampled.csv")

    return retrain_model(data_path=data_path)


if __name__ == "__main__":
    print(trigger_retraining())
