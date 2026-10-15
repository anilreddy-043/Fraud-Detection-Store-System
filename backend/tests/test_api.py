from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.api.dependencies import get_db
from backend.app.database.database import Base
from backend.app.main import app

test_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
Base.metadata.create_all(bind=test_engine)


def override_get_db():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


def test_predict_route():
    transaction_id = f"txn_{uuid4().hex}"
    initial_analytics = client.get("/analytics").json()
    payload = {
        "transaction_id": transaction_id,
        "amount": 90.0,
        "merchant_id": "m-101",
        "device_type": "desktop",
        "customer_id": "c-200",
        "country": "US",
        "hour": 10,
        "is_new_customer": False,
    }

    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert "prediction" in body
    assert "probability" in body
    assert body["fraudulent"] is (body["prediction"] == 1)

    analytics = client.get("/analytics").json()
    assert analytics["total_transactions"] == initial_analytics["total_transactions"] + 1
    assert analytics["suspicious_transactions"] == (
        initial_analytics["suspicious_transactions"] + int(body["fraudulent"])
    )
    activity_at_hour = next(item for item in analytics["activity_by_hour"] if item["hour"] == "10")
    fraud_at_hour = next(item for item in analytics["fraud_by_hour"] if item["hour"] == "10")
    assert activity_at_hour == {"hour": "10", "transactions": 1, "users": 1}
    assert fraud_at_hour["total"] == 1
    assert fraud_at_hour["fraud_cases"] == int(body["fraudulent"])
    assert analytics["recent_assessments"][-1]["transactionId"] == transaction_id

    repeated_response = client.post("/predict", json=payload)
    assert repeated_response.status_code == 200
    repeated_analytics = client.get("/analytics").json()
    assert repeated_analytics["total_transactions"] == initial_analytics["total_transactions"] + 1
    assert repeated_analytics["suspicious_transactions"] == analytics["suspicious_transactions"]


def test_transaction_route_lists_all_saved_transactions():
    transaction_id = f"txn_list_{uuid4().hex}"
    payload = {
        "transaction_id": transaction_id,
        "amount": 125.0,
        "type": "PAYMENT",
        "oldbalanceOrg": 100.0,
        "newbalanceOrig": 50.0,
        "oldbalanceDest": 0,
        "newbalanceDest": 0,
        "merchant_id": "m-555",
        "device_type": "mobile",
        "customer_id": "c-555",
        "country": "US",
        "hour": 8,
        "is_new_customer": False,
    }

    response = client.post("/predict", json=payload)
    assert response.status_code == 200

    saved = client.get("/transactions")
    assert saved.status_code == 200
    items = saved.json()
    assert any(item["transaction_id"] == transaction_id for item in items)
    stored = next(item for item in items if item["transaction_id"] == transaction_id)
    assert "transaction_date" in stored
    assert "transaction_time" in stored


def test_model_route_returns_saved_performance_metrics():
    response = client.get("/models")
    assert response.status_code == 200
    metrics = response.json()["metrics"]
    assert set(metrics) == {"accuracy", "precision", "recall"}
    assert all(0 <= value <= 1 for value in metrics.values())


def test_native_model_features_separate_and_persist_risk_levels():
    transaction_inputs = [
        {
            "transaction_id": f"demo_low_{uuid4().hex}",
            "amount": 14183.02,
            "type": "PAYMENT",
            "oldbalanceOrg": 424164.19,
            "newbalanceOrig": 409981.17,
            "oldbalanceDest": 0,
            "newbalanceDest": 0,
        },
        {
            "transaction_id": f"demo_medium_{uuid4().hex}",
            "amount": 264977.25,
            "type": "CASH_OUT",
            "oldbalanceOrg": 20303,
            "newbalanceOrig": 0,
            "oldbalanceDest": 991497.14,
            "newbalanceDest": 1256474.39,
        },
        {
            "transaction_id": f"demo_high_{uuid4().hex}",
            "amount": 925579.57,
            "type": "TRANSFER",
            "oldbalanceOrg": 925579.57,
            "newbalanceOrig": 0,
            "oldbalanceDest": 0,
            "newbalanceDest": 0,
        },
    ]
    responses = [client.post("/predict", json=payload) for payload in transaction_inputs]

    assert all(response.status_code == 200 for response in responses)
    results = [response.json() for response in responses]
    assert 0 <= results[0]["probability"] < 0.5
    assert 0 <= results[1]["probability"] < 0.5
    assert results[2]["probability"] >= 0.5
    assert results[2]["fraudulent"] is True

    saved = client.get(f"/transactions/{transaction_inputs[2]['transaction_id']}")
    assert saved.status_code == 200
    assert saved.json()["type"] == "TRANSFER"
    assert saved.json()["oldbalanceOrg"] == 925579.57


def test_monitoring_route_returns_recent_alerts():
    response = client.get("/monitoring")
    assert response.status_code == 200
    body = response.json()
    assert "total_transactions" in body
    assert "alert_rate" in body
    assert "recent_alerts" in body
    assert isinstance(body["recent_alerts"], list)
