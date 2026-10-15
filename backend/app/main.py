from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from backend.app.api.dependencies import get_db
from backend.app.api.routes.analytics import router as analytics_router
from backend.app.api.routes.model import router as model_router
from backend.app.api.routes.monitoring import router as monitoring_router
from backend.app.api.routes.prediction import router as prediction_router
from backend.app.api.routes.transactions import router as transactions_router
from backend.app.database.crud import list_transactions
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


@app.get("/backend", response_class=HTMLResponse)
def backend_page(db: Session = Depends(get_db)):
    recent_transactions = list_transactions(db, limit=10)
    rows = "".join(
        f"<tr><td>{item.transaction_id}</td><td>{item.type}</td><td>{item.amount}</td><td>{item.transaction_date or 'N/A'}</td><td>{item.transaction_time or 'N/A'}</td><td>{'Yes' if item.is_new_customer else 'No'}</td></tr>"
        for item in recent_transactions
    )
    if not rows:
        rows = '<tr><td colspan="6">No transactions stored yet.</td></tr>'

    return f"""
    <html>
        <head>
            <title>Backend Portal</title>
            <style>
                body {{ font-family: Arial, sans-serif; background: #0b1020; color: #f5f7ff; padding: 40px; }}
                .card {{ background: #141d33; border-radius: 12px; padding: 24px; max-width: 900px; margin: 0 auto; }}
                table {{ width: 100%; border-collapse: collapse; margin-top: 16px; }}
                th, td {{ border: 1px solid #2c3d66; padding: 10px; text-align: left; }}
                th {{ background: #1b294a; }}
                a {{ color: #7dd3fc; }}
            </style>
        </head>
        <body>
            <div class="card">
                <h1>Store Fraud Detection Backend</h1>
                <p>API service is running successfully.</p>
                <p><a href="/health">Health check</a> | <a href="/docs">Open API docs</a></p>
                <table>
                    <thead>
                        <tr>
                            <th>Transaction ID</th>
                            <th>Type</th>
                            <th>Amount</th>
                            <th>Transaction Date</th>
                            <th>Transaction Time</th>
                            <th>New Customer</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows}
                    </tbody>
                </table>
            </div>
        </body>
    </html>
    """


app.include_router(prediction_router)
app.include_router(transactions_router, prefix="/transactions")
app.include_router(monitoring_router, prefix="/monitoring")
app.include_router(analytics_router, prefix="/analytics")
app.include_router(model_router, prefix="/models")
