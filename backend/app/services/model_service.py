import json

from backend.app.config.settings import settings
from backend.app.ml.model_loader import get_model_metadata


def get_model_status():
    metadata = get_model_metadata()
    metrics_path = settings.MODELS_DIR / "training_metrics.json"
    metrics = json.loads(metrics_path.read_text()) if metrics_path.exists() else {}
    return {
        "model_name": metadata.get("model_name", "logistic_regression"),
        "version": metadata.get("version", "1.0.0"),
        "status": metadata.get("status", "active"),
        "training_date": metadata.get("training_date"),
        "metrics": {
            name: metrics.get(name)
            for name in ("accuracy", "precision", "recall")
        },
    }
