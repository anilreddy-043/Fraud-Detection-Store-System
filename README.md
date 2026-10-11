# Store Fraud Detection

A lightweight fraud detection project with:

- FastAPI backend for predictions and monitoring
- ML preprocessing and logistic-regression prediction model
- Frontend shell for interacting with the app
- Docker support for local orchestration

## Quick start

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Tests

```bash
cd ..
python -m pytest -q
```

The API exposes a health check at `/health` and prediction endpoint at `/predict`.
