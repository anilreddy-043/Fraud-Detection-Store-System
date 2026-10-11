from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.routes.analytics import router as analytics_router
from backend.app.api.routes.model import router as model_router
from backend.app.api.routes.monitoring import router as monitoring_router
from backend.app.api.routes.prediction import router as prediction_router
from backend.app.api.routes.transactions import router as transactions_router
from backend.app.database.database import initialize_database

app = FastAPI(title="Store Fraud Detection API", version="1.0.0")
initialize_database()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "store-fraud-detection"}


app.include_router(prediction_router)
app.include_router(transactions_router, prefix="/transactions")
app.include_router(monitoring_router, prefix="/monitoring")
app.include_router(analytics_router, prefix="/analytics")
app.include_router(model_router, prefix="/models")
