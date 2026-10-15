# 🛡️ Store Fraud Detection System
### An End-to-End Machine Learning Application for Transaction Risk Assessment

<p align="center">
  <strong>Detect suspicious transactions • Assess financial risk • Track prediction history</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Machine_Learning-FF6F00?style=for-the-badge" alt="Machine Learning" />
  <img src="https://img.shields.io/badge/Scikit--learn-F7931E?style=for-the-badge&logo=scikitlearn&logoColor=white" alt="Scikit-learn" />
</p>

## 📌 Project Overview

The **Store Fraud Detection System** is a machine learning application designed to assess financial transactions, estimate fraud risk, and maintain a history of prediction results.

The project combines a machine learning prediction pipeline, a FastAPI backend, a database-backed assessment history, and an interactive web dashboard to demonstrate how fraud risk assessment can be integrated into a practical application.

Rather than producing a prediction in isolation, the system connects transaction scoring with API-based processing, persistent assessment records, and risk monitoring.

## 🎯 Problem Statement

Financial transaction fraud can lead to financial losses and reduced customer trust. Reviewing every transaction manually is time-consuming, while suspicious transactions may require timely investigation.

This project explores how machine learning can help identify potentially fraudulent transactions and provide structured information for further review.

## ✨ Key Features

- **Transaction Risk Assessment:** Submit transaction details and receive a fraud prediction with a probability score.
- **Machine Learning Integration:** Uses a trained Logistic Regression model for transaction classification.
- **REST API:** Provides prediction endpoints through FastAPI.
- **Persistent Assessment History:** Stores transaction assessment results for later retrieval.
- **Interactive Dashboard:** Displays risk scores, prediction summaries, transaction counts, and model performance information.
- **Fraud Classification:** Classifies transactions according to the configured decision threshold.
- **Model Evaluation:** Tracks accuracy, precision, and recall using saved evaluation metrics.
- **Monitoring Workflow:** Includes code for monitoring model/data behavior and a retraining workflow.
- **Automated Testing:** Uses pytest to validate important backend API behaviors.

## 🖥️ Dashboard Preview

### Store Fraud Detection Dashboard

![Store Fraud Detection Dashboard](frontend/public/dashboard.png)

*The dashboard provides a visual overview of transaction assessments, risk classification, and model performance.*

## ⚙️ How the System Works

1. **Transaction Input:** Transaction details are submitted through the application.
2. **Data Preprocessing:** Transaction fields are transformed into the feature format expected by the model.
3. **Fraud Probability:** The trained model estimates the probability associated with the fraud class.
4. **Risk Classification:** The probability is compared with the configured threshold to produce a classification.
5. **API Response:** The backend returns the prediction and associated probability.
6. **Database Persistence:** The assessment is saved so that its result can be retrieved later.
7. **Dashboard & Monitoring:** The interface presents assessment information, while supporting code provides evaluation and monitoring workflows.

## 🏗️ System Architecture

```text
Transaction Input
       |
       v
React Web Dashboard
       |
       v
FastAPI REST API
       |
       v
Data Preprocessing
       |
       v
Trained ML Model
       |
       v
Fraud Probability
       |
       v
Risk Classification
       |
       v
Database & Assessment History
       |
       v
Dashboard and Monitoring
```

## 🧰 Technology Stack

| Component | Technologies |
|---|---|
| Programming Language | Python |
| Data Processing | Pandas, NumPy |
| Machine Learning | Scikit-learn |
| Backend | FastAPI |
| Frontend | React, Vite, JavaScript |
| Data Persistence | Database-backed assessment history |
| Testing | Pytest |
| Model Artifacts | Joblib |
| Version Control | Git, GitHub |
| Additional Workflow | Model evaluation, monitoring, retraining |

## 📊 Model Performance

The saved evaluation report contains the following model metrics:

| Metric | Score |
|---|---:|
| Accuracy | 94.77% |
| Precision — Fraud Class | 47.50% |
| Recall — Fraud Class | 92.33% |

**Understanding the results**

- **Accuracy — 94.77%:** The proportion of evaluated transactions classified correctly.
- **Precision — 47.50%:** Of the transactions classified as fraudulent, approximately 47.5% were actually fraudulent in the evaluation.
- **Recall — 92.33%:** The model identified approximately 92.3% of the fraudulent transactions in the evaluation data.

Fraud detection often involves a trade-off between catching fraudulent transactions and avoiding false alarms. The recall and precision values should therefore be considered together.

*These are saved evaluation metrics, not a guarantee of performance on future or live transactions. Results depend on the evaluation dataset and its class distribution.*

## 📁 Project Structure

```text
Store-Fraud-Detection-System/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── ml/
│   │   └── services/
│   ├── tests/
│   └── requirements.txt
├── frontend/
│   ├── public/
│   │   ├── dashboard.png
│   │   └── dashboard-2.png
│   └── src/
├── models/
│   └── production/
│       ├── model_metadata.json
│       └── training_metrics.json
├── artifacts/
│   └── reports/
├── Dockerfile
├── docker-compose.yml
├── dvc.yaml
├── params.yaml
└── README.md
```

*Some generated model files and local data are excluded from version control. The structure above highlights the main application components.*

## 🚀 Running the Project Locally

### Prerequisites

- Python installed
- Node.js and npm installed
- Git installed

### 1. Clone the repository

```bash
git clone https://github.com/chavansantosh/Store-Fraud-Detection-System.git
cd Store-Fraud-Detection-System
```

### 2. Set up the backend

From the project root, activate the existing backend virtual environment:

**Windows Command Prompt**

```bat
backend\.venv\Scripts\activate
```

If you are setting up the project on a new machine, create a virtual environment and install the backend dependencies using the project's dependency file.

### 3. Start the backend

Run the FastAPI application using the entry point configured in the project. The API's interactive documentation is normally available at `/docs` when the backend is running.

### 4. Start the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite in your terminal.

*The backend startup command and required model/data files depend on the project's current configuration. Ensure the backend is running before testing dashboard predictions.*

## 🧪 Testing

Run the backend tests from the project root:

```bat
backend\.venv\Scripts\python.exe -m pytest -q
```

The latest verified test run completed with **9 passed**. One dependency deprecation warning was reported.

## 🔮 Future Improvements

- Evaluate the model on additional unseen and recent transaction data.
- Improve fraud-class precision while maintaining strong recall.
- Add more detailed false-positive and false-negative analysis.
- Introduce authentication and role-based access for transaction reviewers.
- Expand monitoring with measurable data-drift and model-performance alerts.
- Add a controlled retraining and model-validation pipeline.
- Deploy the application to a production hosting environment with appropriate security controls.

## 🎓 Project Information

**Project Title:** End-to-End Fraud Detection System with ML Model Deployment and Monitoring

**Developed by:** Santosh Chavan

**Faculty Mentor:** [Faculty Name]

**Project Type:** Machine Learning / Data Science / Full-Stack ML Application

**GitHub Repository:** [Store Fraud Detection System](https://github.com/chavansantosh/Store-Fraud-Detection-System)

## 💡 Key Takeaway

This project demonstrates the integration of machine learning predictions with a REST API, a web dashboard, persistent assessment history, model evaluation, and supporting monitoring workflows.

It represents a practical step toward building machine learning applications that are not limited to model training, but also consider how predictions are delivered, stored, presented, and evaluated.

---

⭐ If you find this project interesting, feel free to explore the repository and its implementation.
