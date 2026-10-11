from __future__ import annotations

import json
from pathlib import Path

import joblib

from backend.app.config.settings import settings


def get_model_path(model_path: str | Path | None = None) -> Path:
    if model_path is None:
        return settings.MODELS_DIR / "fraud_model.joblib"
    return Path(model_path)


def load_model(model_path: str | Path | None = None):
    path = get_model_path(model_path)
    if not path.exists():
        raise FileNotFoundError(f"Model artifact not found at {path}")
    return joblib.load(path)


def get_model_metadata() -> dict:
    metadata_path = settings.MODELS_DIR / "model_metadata.json"
    if metadata_path.exists():
        return json.loads(metadata_path.read_text())

    return {
        "model_name": "logistic_regression",
        "version": "1.0.0",
        "status": "active",
        "training_date": "2026-10-08",
    }
