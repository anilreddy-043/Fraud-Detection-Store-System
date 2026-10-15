import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { fetchAnalyticsSummary } from './api/analyticsApi';
import { fetchModelStatus } from './api/modelApi';
import { fetchTransactions } from './api/transactionApi';
import { predictTransaction } from './api/predictionApi';
import { openBackendAfterAssessment } from './utils/backendLauncher';

const RiskTrendChart = lazy(() => import('./charts/TransactionChart'));
const UserActivityChart = lazy(() => import('./charts/UserActivityChart'));
const FraudTrendChart = lazy(() => import('./charts/FraudTrendChart'));

const initialForm = {
  transaction_id: '',
  amount: '',
  type: 'PAYMENT',
  merchant_id: '',
  device_type: 'mobile',
  customer_id: '',
  country: '',
  hour: '',
  transaction_date: '',
  transaction_time: '',
  is_new_customer: false,
};

const sampleCases = {
  low: {
    transaction_id: 'txn_low_001',
    amount: 14183.02,
    type: 'PAYMENT',
    oldbalanceOrg: 424164.19,
    newbalanceOrig: 409981.17,
    oldbalanceDest: 0,
    newbalanceDest: 0,
    merchant_id: 'm-100',
    device_type: 'mobile',
    customer_id: 'c-100',
    country: 'US',
    hour: 15,
    transaction_date: new Date().toISOString().slice(0, 10),
    transaction_time: new Date().toTimeString().slice(0, 8),
    is_new_customer: false,
  },
  medium: {
    transaction_id: 'txn_medium_002',
    amount: 264977.25,
    type: 'CASH_OUT',
    oldbalanceOrg: 20303,
    newbalanceOrig: 0,
    oldbalanceDest: 991497.14,
    newbalanceDest: 1256474.39,
    merchant_id: 'm-225',
    device_type: 'tablet',
    customer_id: 'c-225',
    country: 'US',
    hour: 13,
    transaction_date: new Date().toISOString().slice(0, 10),
    transaction_time: new Date().toTimeString().slice(0, 8),
    is_new_customer: false,
  },
  high: {
    transaction_id: 'txn_high_009',
    amount: 925579.57,
    type: 'TRANSFER',
    oldbalanceOrg: 925579.57,
    newbalanceOrig: 0,
    oldbalanceDest: 0,
    newbalanceDest: 0,
    merchant_id: 'm-999',
    device_type: 'desktop',
    customer_id: 'c-900',
    country: 'NG',
    hour: 2,
    transaction_date: new Date().toISOString().slice(0, 10),
    transaction_time: new Date().toTimeString().slice(0, 8),
    is_new_customer: true,
  },
};

const navigation = [
  { id: 'overview', icon: '◫', label: 'Overview' },
  { id: 'transactions', icon: '⇄', label: 'Transactions' },
  { id: 'assessment', icon: '⌕', label: 'Check transaction' },
  { id: 'analytics', icon: '▥', label: 'Analytics' },
  { id: 'monitoring', icon: '◎', label: 'Monitoring' },
  { id: 'model', icon: '◇', label: 'Model management' },
];

function formatAmount(value) {
  const amount = Number(value);
  if (value === null || value === undefined || value === '' || !Number.isFinite(amount)) {
    return '—';
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(value) {
  if (!value) return '—';

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString();
}

function getTransactionId(item) {
  return item?.transaction_id ?? item?.id ?? item?.assessment_id ?? '—';
}

function getPredictionLabel(item) {
  if (item?.fraudulent === true || item?.is_fraud === true) return 'Fraud';
  if (item?.fraudulent === false || item?.is_fraud === false) return 'Normal';

  const prediction =
    item?.prediction ?? item?.predicted_label ?? item?.model_label;

  if (prediction === 1 || prediction === '1') return 'Fraud';
  if (prediction === 0 || prediction === '0') return 'Normal';

  return 'Not assessed';
}

function getProbability(item) {
  const raw =
    item?.probability ?? item?.fraud_probability ?? item?.risk_score;

  if (raw === null || raw === undefined || raw === '') return '—';

  const value = Number(raw);
  if (!Number.isFinite(value)) return '—';

  return `${(value <= 1 ? value * 100 : value).toFixed(2)}%`;
}

function formatMetric(value) {
  const number = Number(value);
  if (value === null || value === undefined || value === '' || !Number.isFinite(number)) {
    return '—';
  }

  return `${(number * 100).toFixed(1)}%`;
}

function App() {
  const [activeView, setActiveView] = useState('overview');
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState(null);
  const [riskHistory, setRiskHistory] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [modelStatus, setModelStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const riskLevel = useMemo(() => {
    if (!result) return { label: 'Awaiting review', tone: 'neutral' };

    return result.fraudulent
      ? { label: 'High risk', tone: 'high' }
      : { label: 'Low risk', tone: 'low' };
  }, [result]);

  /*
   * Match saved transactions to assessments using transaction_id.
   * Never associate predictions with transactions by list position.
   */
  const transactionHistory = useMemo(() => {
    const assessmentsById = new Map();

    riskHistory.forEach((assessment) => {
      const id = assessment?.transaction_id;

      if (id !== null && id !== undefined && id !== '') {
        assessmentsById.set(String(id), assessment);
      }
    });

    const matchedAssessmentIds = new Set();

    const savedTransactions = transactions.map((transaction) => {
      const id = transaction?.transaction_id;
      const assessment =
        id !== null && id !== undefined && id !== ''
          ? assessmentsById.get(String(id))
          : undefined;

      if (assessment) {
        matchedAssessmentIds.add(String(id));
      }

      return {
        ...transaction,
        ...(assessment ?? {}),
        transaction_id: transaction?.transaction_id,
        customer_id: transaction?.customer_id ?? assessment?.customer_id,
        merchant_id: transaction?.merchant_id ?? assessment?.merchant_id,
        amount: transaction?.amount ?? assessment?.amount,
        type: transaction?.type ?? assessment?.type,
        transaction_date:
          transaction?.transaction_date ?? assessment?.transaction_date,
        transaction_time:
          transaction?.transaction_time ?? assessment?.transaction_time,
        prediction:
          assessment?.prediction ??
          assessment?.predicted_label ??
          assessment?.model_label ??
          transaction?.prediction,
        fraudulent:
          assessment?.fraudulent ?? assessment?.is_fraud ??
          transaction?.fraudulent,
        probability:
          assessment?.probability ??
          assessment?.fraud_probability ??
          assessment?.risk_score ??
          transaction?.probability,
      };
    });

    // Keep assessment-only records visible too. Their missing transaction
    // details remain blank rather than being guessed from another record.
    const unmatchedAssessments = riskHistory.filter((assessment) => {
      const id = assessment?.transaction_id;

      return (
        id === null ||
        id === undefined ||
        id === '' ||
        !matchedAssessmentIds.has(String(id))
      );
    });

    return [...savedTransactions, ...unmatchedAssessments];
  }, [transactions, riskHistory]);

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return transactionHistory;

    return transactionHistory.filter((item) => {
      const searchable = [
        getTransactionId(item),
        item?.customer_id,
        item?.merchant_id,
        item?.type,
        getPredictionLabel(item),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [transactionHistory, search]);

  const loadDashboard = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);

    try {
      const [summaryResult, transactionResult, modelResult] =
        await Promise.allSettled([
          fetchAnalyticsSummary(),
          fetchTransactions(),
          fetchModelStatus(),
        ]);

      if (summaryResult.status === 'fulfilled') {
        const summary = summaryResult.value;
        setAnalytics(summary);
        setRiskHistory(
          Array.isArray(summary?.recent_assessments)
            ? summary.recent_assessments
            : []
        );
      } else {
        setAnalytics(null);
        setRiskHistory([]);
        console.error('Could not load analytics summary:', summaryResult.reason);
      }

      if (transactionResult.status === 'fulfilled') {
        setTransactions(
          Array.isArray(transactionResult.value)
            ? transactionResult.value
            : []
        );
      } else {
        setTransactions([]);
        console.error(
          'Could not load saved transactions:',
          transactionResult.reason
        );
      }

      if (modelResult.status === 'fulfilled') {
        setModelStatus(modelResult.value);
      } else {
        setModelStatus(null);
        console.error('Could not load model status:', modelResult.reason);
      }
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        ...form,
        amount: Number(form.amount),
        hour: Number(form.hour),
        transaction_date:
          form.transaction_date || new Date().toISOString().slice(0, 10),
        transaction_time:
          form.transaction_time || new Date().toTimeString().slice(0, 8),
        is_new_customer: Boolean(form.is_new_customer),
      };

      const data = await predictTransaction(payload);

      setResult(data);
      openBackendAfterAssessment();

      // Reload saved transactions, assessments, and model metadata.
      await loadDashboard();
    } catch (err) {
      setError(err.message || 'Unable to assess this transaction.');
    } finally {
      setLoading(false);
    }
  };

  const applySample = (caseName) => {
    setForm({
      ...initialForm,
      ...sampleCases[caseName],
    });
    setResult(null);
    setError('');
  };

  const navigate = (view) => {
    setActiveView(view);
    setError('');
  };

  const totalTransactions = Number(analytics?.total_transactions ?? 0);
  const suspiciousTransactions = Number(
    analytics?.suspicious_transactions ?? 0
  );
  const alertRate = Number(analytics?.alert_rate ?? 0);
  const modelIsActive = modelStatus?.status === 'active';

  const renderTransactionTable = () => (
    <div className="table-wrap">
      <table className="transaction-table">
        <thead>
          <tr>
            <th>Transaction</th>
            <th>Customer</th>
            <th>Amount</th>
            <th>Type</th>
            <th>Prediction</th>
            <th>Probability</th>
          </tr>
        </thead>
        <tbody>
          {filteredTransactions.length === 0 ? (
            <tr>
              <td colSpan="6" className="table-empty">
                No transaction records found.
              </td>
            </tr>
          ) : (
            filteredTransactions.map((item, index) => {
              const prediction = getPredictionLabel(item);
              const isFraud = prediction === 'Fraud';
              const isNormal = prediction === 'Normal';

              return (
                <tr key={`${getTransactionId(item)}-${index}`}>
                  <td>
                    <strong className="transaction-id">
                      {getTransactionId(item)}
                    </strong>
                    <small>
                      {formatDate(
                        item?.created_at ??
                          item?.timestamp ??
                          item?.transaction_date
                      )}
                    </small>
                  </td>
                  <td>{item?.customer_id ?? '—'}</td>
                  <td>{formatAmount(item?.amount)}</td>
                  <td>{item?.type ?? item?.transaction_type ?? '—'}</td>
                  <td>
                    <span
                      className={`prediction-pill ${
                        isFraud ? 'fraud' : isNormal ? 'safe' : 'unknown'
                      }`}
                    >
                      <span className="status-indicator" />
                      {prediction}
                    </span>
                  </td>
                  <td>{getProbability(item)}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );

  const renderAssessmentForm = () => (
    <div className="assessment-layout">
      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Transaction screening</p>
            <h2>Check a transaction</h2>
            <p className="muted">
              Enter transaction details to request a prediction from your model.
            </p>
          </div>
          <span className="subtle-tag">Model powered</span>
        </div>

        <div className="quick-actions">
          <button type="button" className="ghost" onClick={() => applySample('low')}>
            Load low-risk example
          </button>
          <button type="button" className="ghost" onClick={() => applySample('medium')}>
            Load medium example
          </button>
          <button type="button" className="ghost" onClick={() => applySample('high')}>
            Load high-risk example
          </button>
        </div>

        <form onSubmit={handleSubmit} className="form-grid">
          <label>
            Transaction ID
            <input
              name="transaction_id"
              value={form.transaction_id}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Amount
            <input
              name="amount"
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Transaction type
            <select name="type" value={form.type} onChange={handleChange}>
              <option value="CASH_IN">Cash in</option>
              <option value="CASH_OUT">Cash out</option>
              <option value="DEBIT">Debit</option>
              <option value="PAYMENT">Payment</option>
              <option value="TRANSFER">Transfer</option>
            </select>
          </label>

          <label>
            Merchant ID
            <input
              name="merchant_id"
              value={form.merchant_id}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Device type
            <select
              name="device_type"
              value={form.device_type}
              onChange={handleChange}
            >
              <option value="mobile">Mobile</option>
              <option value="desktop">Desktop</option>
              <option value="tablet">Tablet</option>
            </select>
          </label>

          <label>
            Customer ID
            <input
              name="customer_id"
              value={form.customer_id}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Country code
            <input
              name="country"
              value={form.country}
              onChange={handleChange}
              maxLength="2"
              required
            />
          </label>

          <label>
            Transaction hour (0–23)
            <input
              name="hour"
              type="number"
              min="0"
              max="23"
              value={form.hour}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Transaction date
            <input
              name="transaction_date"
              type="date"
              value={form.transaction_date}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Transaction time
            <input
              name="transaction_time"
              type="time"
              step="1"
              value={form.transaction_time}
              onChange={handleChange}
              required
            />
          </label>

          <label className="checkbox-row">
            <input
              type="checkbox"
              name="is_new_customer"
              checked={form.is_new_customer}
              onChange={handleChange}
            />
            New customer
          </label>

          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? 'Analyzing transaction…' : 'Run risk assessment →'}
          </button>
        </form>
      </section>

      <aside className="panel result-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Prediction output</p>
            <h2>Assessment result</h2>
          </div>
          <span className={`status-pill ${riskLevel.tone}`}>
            <span className="status-indicator" />
            {riskLevel.label}
          </span>
        </div>

        {error && <div className="alert error">{error}</div>}

        {!result && !error && (
          <div className="empty-state">
            <div className="empty-icon">⌕</div>
            <p>Ready for assessment</p>
            <small>
              Submit transaction details to see the model's result here.
            </small>
          </div>
        )}

        {result && (
          <div className="result-box">
            <span
              className={`risk-badge ${result.fraudulent ? 'fraud' : 'safe'}`}
            >
              <span className="status-indicator" />
              {result.fraudulent ? 'Fraud detected' : 'Normal prediction'}
            </span>

            <div className="result-score">
              <span>Fraud probability</span>
              <strong>
                {Number.isFinite(Number(result.probability))
                  ? `${(Number(result.probability) * 100).toFixed(2)}%`
                  : '—'}
              </strong>
              <div className="probability-track">
                <div
                  className={`probability-fill ${
                    result.fraudulent ? 'fraud' : 'safe'
                  }`}
                  style={{
                    width: `${Math.max(
                      0,
                      Math.min(100, Number(result.probability) * 100)
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="score-row">
              <span>Model label</span>
              <strong>{String(result.prediction ?? '—')}</strong>
            </div>

            <div className="score-row">
              <span>Transaction ID</span>
              <strong>{form.transaction_id || '—'}</strong>
            </div>

            <div className="score-row">
              <span>Suggested action</span>
              <strong>
                {result.fraudulent ? 'Review transaction' : 'Normal prediction'}
              </strong>
            </div>

            <p className="result-disclaimer">
              This is a model prediction, not confirmation of actual fraud.
              Review flagged transactions before taking action.
            </p>
          </div>
        )}
      </aside>
    </div>
  );

  const renderOverview = () => (
    <>
      <section className="stats-grid">
        <article className="stat-card">
          <div className="stat-topline">
            <span>Total assessments</span>
            <span className="stat-icon blue">⇄</span>
          </div>
          <strong>{totalTransactions.toLocaleString('en-IN')}</strong>
          <small>Saved transaction assessments</small>
        </article>

        <article className="stat-card">
          <div className="stat-topline">
            <span>Flagged transactions</span>
            <span className="stat-icon red">!</span>
          </div>
          <strong>{suspiciousTransactions.toLocaleString('en-IN')}</strong>
          <small>Predictions requiring review</small>
        </article>

        <article className="stat-card">
          <div className="stat-topline">
            <span>Alert rate</span>
            <span className="stat-icon amber">◉</span>
          </div>
          <strong>{alertRate.toFixed(1)}%</strong>
          <small>Share of assessments flagged</small>
        </article>

        <article className="stat-card">
          <div className="stat-topline">
            <span>Model status</span>
            <span className="stat-icon green">✓</span>
          </div>
          <strong className="status-value">
            {modelIsActive ? 'Active' : 'Unavailable'}
          </strong>
          <small>
            {modelStatus?.model_name?.replaceAll('_', ' ') ??
              'Model status not loaded'}
          </small>
        </article>
      </section>

      <section className="panel welcome-panel">
        <div>
          <p className="eyebrow">Fraud intelligence</p>
          <h2>Monitor transaction risk in one place.</h2>
          <p className="muted">
            Assess transactions, review saved predictions, and monitor model
            performance from your fraud detection workspace.
          </p>
          <button
            className="primary-btn welcome-button"
            onClick={() => navigate('assessment')}
          >
            Check a transaction →
          </button>
        </div>

        <div className="welcome-visual" aria-hidden="true">
          <div className="visual-ring ring-one" />
          <div className="visual-ring ring-two" />
          <div className="visual-center">SD</div>
          <span className="visual-dot dot-one" />
          <span className="visual-dot dot-two" />
          <span className="visual-dot dot-three" />
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Model performance</h2>
            <p className="muted">
              {modelStatus
                ? `${modelStatus.model_name?.replaceAll('_', ' ') ?? 'Fraud model'} · Version ${modelStatus.version ?? '—'}`
                : 'Evaluation metrics are unavailable'}
            </p>
          </div>
          <span className={`model-status ${modelIsActive ? 'active' : ''}`}>
            {modelStatus?.status ?? 'Unavailable'}
          </span>
        </div>

        <div className="performance-metrics">
          {[
            ['Accuracy', modelStatus?.metrics?.accuracy],
            ['Precision', modelStatus?.metrics?.precision],
            ['Recall', modelStatus?.metrics?.recall],
          ].map(([label, value]) => (
            <div className="performance-metric" key={label}>
              <span>{label}</span>
              <strong>{formatMetric(value)}</strong>
              <div className="metric-track">
                <div
                  className="metric-fill"
                  style={{
                    width: `${
                      Number.isFinite(Number(value))
                        ? Math.max(0, Math.min(100, Number(value) * 100))
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="chart-grid-two">
        <Suspense fallback={<div className="panel">Loading activity chart…</div>}>
          <UserActivityChart data={analytics?.activity_by_hour ?? []} />
        </Suspense>

        <Suspense fallback={<div className="panel">Loading fraud chart…</div>}>
          <FraudTrendChart data={riskHistory} />
        </Suspense>
      </div>

      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Recent assessments</h2>
            <p className="muted">Saved transactions and matching assessment results</p>
          </div>
          <button className="ghost" onClick={() => navigate('transactions')}>
            View transactions →
          </button>
        </div>
        {renderTransactionTable()}
      </section>
    </>
  );

  const renderTransactions = () => (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Assessment records</p>
          <h2>Transaction history</h2>
          <p className="muted">
            Saved transaction details are loaded separately from prediction history.
          </p>
        </div>
        <button
          className="ghost"
          disabled={refreshing}
          onClick={() => loadDashboard(true)}
        >
          {refreshing ? 'Refreshing…' : '↻ Refresh'}
        </button>
      </div>

      <label className="search-field">
        <span>⌕</span>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search transaction, customer, merchant, or prediction…"
        />
      </label>

      {renderTransactionTable()}
    </section>
  );

  const renderAnalytics = () => (
    <>
      <section className="stats-grid">
        <article className="stat-card">
          <span>Total assessments</span>
          <strong>{totalTransactions.toLocaleString('en-IN')}</strong>
          <small>Backend summary</small>
        </article>
        <article className="stat-card">
          <span>Flagged assessments</span>
          <strong>{suspiciousTransactions.toLocaleString('en-IN')}</strong>
          <small>Backend summary</small>
        </article>
        <article className="stat-card">
          <span>Alert rate</span>
          <strong>{alertRate.toFixed(1)}%</strong>
          <small>Backend summary</small>
        </article>
        <article className="stat-card">
          <span>Model version</span>
          <strong className="version-value">{modelStatus?.version ?? '—'}</strong>
          <small>{modelStatus?.model_name ?? 'Model not loaded'}</small>
        </article>
      </section>

      <div className="chart-grid-two">
        <Suspense fallback={<div className="panel">Loading chart…</div>}>
          <UserActivityChart data={analytics?.activity_by_hour ?? []} />
        </Suspense>
        <Suspense fallback={<div className="panel">Loading chart…</div>}>
          <FraudTrendChart data={riskHistory} />
        </Suspense>
      </div>

      <Suspense fallback={<div className="panel">Loading transaction trend…</div>}>
        <RiskTrendChart data={riskHistory} />
      </Suspense>
    </>
  );

  const renderMonitoring = () => (
    <>
      <section className="stats-grid">
        <article className="stat-card">
          <span>Model status</span>
          <strong className="status-value">
            {modelStatus?.status ?? 'Unavailable'}
          </strong>
          <small>Reported by model API</small>
        </article>
        <article className="stat-card">
          <span>Training date</span>
          <strong className="date-value">
            {modelStatus?.training_date
              ? new Date(modelStatus.training_date).toLocaleDateString()
              : '—'}
          </strong>
          <small>Reported model metadata</small>
        </article>
        <article className="stat-card">
          <span>Transactions assessed</span>
          <strong>{totalTransactions.toLocaleString('en-IN')}</strong>
          <small>Saved assessment count</small>
        </article>
        <article className="stat-card">
          <span>Flagged rate</span>
          <strong>{alertRate.toFixed(1)}%</strong>
          <small>Reported alert rate</small>
        </article>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Monitoring status</h2>
            <p className="muted">
              Information currently available from the existing APIs.
            </p>
          </div>
          <span className={`model-status ${modelIsActive ? 'active' : ''}`}>
            {modelIsActive ? 'Online' : 'Check connection'}
          </span>
        </div>

        <div className="monitoring-row">
          <span className="monitoring-indicator" />
          <div>
            <strong>Model status endpoint</strong>
            <p className="muted">
              {modelStatus
                ? 'A model status response was received.'
                : 'No model status response is currently available.'}
            </p>
          </div>
        </div>

        <div className="monitoring-row">
          <span className="monitoring-indicator" />
          <div>
            <strong>Analytics endpoint</strong>
            <p className="muted">
              {analytics
                ? 'Transaction summary was loaded successfully.'
                : 'Analytics summary is unavailable. Check the backend.'}
            </p>
          </div>
        </div>

        <p className="result-disclaimer">
          Live drift alerts, latency, and service health are not inferred here.
          They should be displayed only when the backend provides those metrics.
        </p>
      </section>
    </>
  );

  const renderModel = () => (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Model registry information</p>
          <h2>Model management</h2>
          <p className="muted">
            Current model information reported by your existing model API.
          </p>
        </div>
        <span className={`model-status ${modelIsActive ? 'active' : ''}`}>
          {modelStatus?.status ?? 'Unavailable'}
        </span>
      </div>

      <div className="model-details-grid">
        <div className="detail-tile">
          <span>Model name</span>
          <strong>{modelStatus?.model_name ?? '—'}</strong>
        </div>
        <div className="detail-tile">
          <span>Version</span>
          <strong>{modelStatus?.version ?? '—'}</strong>
        </div>
        <div className="detail-tile">
          <span>Training date</span>
          <strong>
            {modelStatus?.training_date
              ? new Date(modelStatus.training_date).toLocaleDateString()
              : '—'}
          </strong>
        </div>
      </div>

      <h3 className="subheading">Evaluation metrics</h3>
      <div className="performance-metrics">
        {[
          ['Accuracy', modelStatus?.metrics?.accuracy],
          ['Precision', modelStatus?.metrics?.precision],
          ['Recall', modelStatus?.metrics?.recall],
        ].map(([label, value]) => (
          <div className="performance-metric" key={label}>
            <span>{label}</span>
            <strong>{formatMetric(value)}</strong>
          </div>
        ))}
      </div>

      <p className="result-disclaimer">
        This view displays model metadata and metrics. It does not change or
        retrain the production model.
      </p>
    </section>
  );

  const pageTitles = {
    overview: ['Overview', 'Your fraud detection workspace at a glance.'],
    transactions: ['Transactions', 'Review and search saved assessment records.'],
    assessment: ['Check transaction', 'Submit transaction details for risk scoring.'],
    analytics: ['Analytics', 'Explore the transaction charts available from your backend.'],
    monitoring: ['Monitoring', 'Review the status and metrics reported by your services.'],
    model: ['Model management', 'Inspect the currently reported model version.'],
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark">SD</div>
          <div>
            <strong>Sentinel</strong>
            <span>FRAUD INTELLIGENCE</span>
          </div>
        </div>

        <p className="nav-label">WORKSPACE</p>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {navigation.map((item) => (
            <button
              type="button"
              key={item.id}
              className={`nav-item ${activeView === item.id ? 'active' : ''}`}
              onClick={() => navigate(item.id)}
              aria-current={activeView === item.id ? 'page' : undefined}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.id === 'transactions' && suspiciousTransactions > 0 && (
                <span className="nav-count">{suspiciousTransactions}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-status">
            <span className={`status-indicator ${modelIsActive ? 'online' : ''}`} />
            <div>
              <strong>{modelIsActive ? 'Model connected' : 'Model unavailable'}</strong>
              <small>Model service status</small>
            </div>
          </div>
          <div className="sidebar-footer">STORE FRAUD DETECTION</div>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Workspace</span>
            <span className="breadcrumb-divider">/</span>
            <strong>{pageTitles[activeView][0]}</strong>
          </div>

          <div className="topbar-actions">
            <span className={`connection-pill ${modelIsActive ? 'connected' : ''}`}>
              <span className="status-indicator" />
              {modelIsActive ? 'Model online' : 'Model unavailable'}
            </span>
            <button
              type="button"
              className="icon-button"
              aria-label="Refresh dashboard data"
              title="Refresh dashboard data"
              disabled={refreshing}
              onClick={() => loadDashboard(true)}
            >
              {refreshing ? '…' : '↻'}
            </button>
          </div>
        </header>

        <main className="page-content">
          <div className="page-heading">
            <div>
              <p className="eyebrow">RISK OPERATIONS / 01</p>
              <h1>{pageTitles[activeView][0]}</h1>
              <p className="muted">{pageTitles[activeView][1]}</p>
            </div>
            <div className="current-date">
              <span>LOCAL DATE</span>
              <strong>
                {new Date().toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </strong>
            </div>
          </div>

          {activeView === 'overview' && renderOverview()}
          {activeView === 'transactions' && renderTransactions()}
          {activeView === 'assessment' && renderAssessmentForm()}
          {activeView === 'analytics' && renderAnalytics()}
          {activeView === 'monitoring' && renderMonitoring()}
          {activeView === 'model' && renderModel()}

          <footer className="page-footer">
            <span>Store Fraud Detection</span>
            <span>Predictions are model outputs and may require human review.</span>
          </footer>
        </main>
      </div>
    </div>
  );
}

export default App;
