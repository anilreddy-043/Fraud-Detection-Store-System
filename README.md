# Store Fraud Detection — End-to-End ML Application

An end-to-end fraud detection application that uses machine learning to assess financial transactions and presents prediction results through an interactive dashboard.

## Dashboard Preview

![Fraud Detection Dashboard](frontend/public/dashboard.png)

## Project Overview

Financial fraud detection is challenging because fraudulent transactions are much less common than legitimate transactions. This project combines a machine learning model, a REST API, and a web dashboard to demonstrate how transaction risk can be assessed and reviewed.

## Key Features

- **Fraud prediction:** Estimate transaction fraud risk using a machine learning model.
- **REST API:** Serve predictions through a FastAPI backend.
- **Interactive dashboard:** Review risk scores, predictions, and assessment history.
- **Prediction history:** Store and review assessment records.
- **Model evaluation:** Evaluate model performance using classification metrics.
- **Container support:** Docker configuration for application setup.
- **Testing and workflow configuration:** Project tests and supporting ML workflow files.

## Model Performance

Reported evaluation metrics:

| Metric | Result |
|---|---:|
| Accuracy | 94.8% |
| Precision | 47.5% |
| Recall | 92.3% |

**Interpretation:** The reported recall means the model identifies a high proportion of fraudulent cases in the evaluated dataset. The lower precision means some legitimate transactions may also be flagged as potentially fraudulent. Accuracy alone should not be used to evaluate an imbalanced fraud detection problem.

*These figures should correspond to the final held-out test-set evaluation. Confirm the evaluation report before treating them as final results.*

## Technology Stack

- **Language:** Python, JavaScript
- **Machine learning:** pandas, NumPy, scikit-learn, joblib
- **Backend:** FastAPI
- **Frontend:** React, Vite, Recharts
- **Data storage:** SQLAlchemy and database-backed prediction history
- **MLOps and development:** Docker, DVC, pytest

## Project Structure

```text
.
├── backend/       # API and application services
├── configs/       # Configuration files
├── data/          # Data-related files
├── frontend/      # Web dashboard
├── ml/            # Machine learning code
├── mlops/         # ML workflow components
├── notebooks/     # Exploratory analysis
├── scripts/       # Utility scripts
├── tests/         # Automated tests
├── Dockerfile
├── docker-compose.yml
├── dvc.yaml
├── params.yaml
└── README.md
```

## Run Locally

### 1. Start the backend

From the project root, open a terminal and run:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The API health check is available at `http://127.0.0.1:8000/health`. The prediction endpoint is `/predict`.

### 2. Start the frontend

Open a **second terminal** at the project root:

```powershell
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite in your terminal, commonly `http://localhost:5173/`.

### 3. Run tests

From the project root, run:

```powershell
python -m pytest -q
```

## Project Goals

This project demonstrates how machine learning can be integrated into an application with an API, a user-facing dashboard, prediction records, evaluation metrics, and supporting deployment workflows.

## Future Improvements

- Monitor data and model performance over time.
- Tune decision thresholds based on fraud detection requirements.
- Add automated model retraining and deployment checks.
- Improve explainability for individual transaction predictions.

## Author

**Santosh Chavan**

- GitHub: [@chavansantosh](https://github.com/chavansantosh)
- Project repository: [Store Fraud Detection](https://github.com/chavansantosh/-chavansantosh-fraud-detection-mlops)
