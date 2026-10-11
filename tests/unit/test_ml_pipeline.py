from pathlib import Path

import pandas as pd

from backend.app.main import app
from backend.app.ml.model_loader import load_model
from backend.app.ml.predictor import FraudPredictor
from backend.app.ml.preprocessor import preprocess_transaction
from fastapi.testclient import TestClient

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_preprocess_transaction():
    sample = {
        "amount": 75.5,
        "type": "PAYMENT",
        "oldbalanceOrg": 500.0,
        "newbalanceOrig": 424.5,
        "oldbalanceDest": 0.0,
        "newbalanceDest": 0.0,
    }

    transformed = preprocess_transaction(sample)
    assert isinstance(transformed, dict)
    assert "amount" in transformed
    assert transformed["type_PAYMENT"] == 1
    assert transformed["oldbalanceOrg"] == 500.0


def test_predictor_handles_batch():
    predictor = FraudPredictor()
    sample = pd.DataFrame([
        {
            "amount": 75.5,
            "type": "PAYMENT",
            "oldbalanceOrg": 500.0,
            "newbalanceOrig": 424.5,
            "oldbalanceDest": 0.0,
            "newbalanceDest": 0.0,
        }
    ])
    result = predictor.predict(sample)
    assert isinstance(result, list)
    assert len(result) == 1


def test_saved_model_can_be_loaded():
    model_path = Path("models/production/fraud_model.joblib")
    assert model_path.exists()

    model = load_model(model_path)
    assert model is not None
    assert hasattr(model, "predict")
