from __future__ import annotations

import json
from pathlib import Path

import joblib
import pandas as pd
from sklearn.linear_model import LogisticRegression

from backend.app.config.settings import settings
from backend.app.ml.model_loader import load_model
from backend.app.ml.preprocessor import FEATURE_COLUMNS, preprocess_transaction


class FraudPredictor:
    def __init__(self, model_path: str | Path | None = None):
        self.model_path = Path(model_path) if model_path else settings.MODELS_DIR / "fraud_model.joblib"
        self.model = self._load_or_train_model()

    def _train_fallback_model(self):
        model = LogisticRegression(max_iter=2000, random_state=42)
        sample = pd.DataFrame(
            [
                {"amount": 14183.02, "type": "PAYMENT", "oldbalanceOrg": 424164.19, "newbalanceOrig": 409981.17, "oldbalanceDest": 0.0, "newbalanceDest": 0.0, "label": 0},
                {"amount": 264977.25, "type": "CASH_OUT", "oldbalanceOrg": 20303.0, "newbalanceOrig": 0.0, "oldbalanceDest": 991497.14, "newbalanceDest": 1256474.39, "label": 0},
                {"amount": 925579.57, "type": "TRANSFER", "oldbalanceOrg": 925579.57, "newbalanceOrig": 0.0, "oldbalanceDest": 0.0, "newbalanceDest": 0.0, "label": 1},
                {"amount": 254719.63, "type": "CASH_OUT", "oldbalanceOrg": 254719.63, "newbalanceOrig": 0.0, "oldbalanceDest": 0.0, "newbalanceDest": 0.0, "label": 1},
            ]
        )
        X = pd.DataFrame([preprocess_transaction(row) for _, row in sample.iterrows()])
        y = sample["label"]
        model.fit(X, y)
        self.model_path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(model, self.model_path)
        metadata = {"model_name": "logistic_regression", "version": "1.0.0", "status": "active"}
        (self.model_path.parent / "model_metadata.json").write_text(json.dumps(metadata, indent=2))
        return model

    def _load_or_train_model(self):
        if self.model_path.exists():
            model = load_model(self.model_path)
            try:
                sample = pd.DataFrame([
                    {
                        "amount": 50.0,
                        "type": "PAYMENT",
                        "oldbalanceOrg": 500.0,
                        "newbalanceOrig": 450.0,
                        "oldbalanceDest": 0.0,
                        "newbalanceDest": 0.0,
                    }
                ])
                features = self._prepare_features(sample, model)
                model.predict_proba(features)
                return model
            except Exception:
                return self._train_fallback_model()

        return self._train_fallback_model()

    def _prepare_features(self, dataframe: pd.DataFrame, model=None) -> pd.DataFrame:
        features = pd.DataFrame([preprocess_transaction(row) for _, row in dataframe.iterrows()])
        expected_columns = list(getattr(model, "feature_names_in_", FEATURE_COLUMNS))

        aligned = pd.DataFrame(index=features.index)
        for column in expected_columns:
            if column in features.columns:
                aligned[column] = features[column].astype(float)
            else:
                aligned[column] = 0.0
        return aligned[expected_columns]

    def predict(self, dataframe: pd.DataFrame):
        features = self._prepare_features(dataframe, self.model)
        probabilities = self.model.predict_proba(features)[:, 1]
        return [float(round(p, 4)) for p in probabilities]

    def predict_one(self, data: dict):
        feature_row = pd.DataFrame([data])
        probability = self.predict(feature_row)[0]
        return {"prediction": int(probability >= 0.5), "probability": probability}
