import React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { fetchAnalyticsSummary } from './api/analyticsApi';
import { fetchModelStatus } from './api/modelApi';
import { predictTransaction } from './api/predictionApi';

const RiskTrendChart = React.lazy(() => import('./charts/TransactionChart'));
const UserActivityChart = React.lazy(() => import('./charts/UserActivityChart'));
const FraudTrendChart = React.lazy(() => import('./charts/FraudTrendChart'));

const initialForm = {
  transaction_id: 'txn_001',
  amount: 14183.02,
  type: 'PAYMENT',
  oldbalanceOrg: 424164.19,
  newbalanceOrig: 409981.17,
  oldbalanceDest: 0,
  newbalanceDest: 0,
  merchant_id: 'm-100',
  device_type: 'mobile',
  customer_id: 'c-200',
  country: 'US',
  hour: 14,
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
    is_new_customer: true,
  },
};

function App() {
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState(null);
  const [riskHistory, setRiskHistory] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [modelStatus, setModelStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const riskLevel = useMemo(() => {
    if (!result) return { label: 'Awaiting review', tone: 'neutral' };
    if (result.fraudulent) {
      return { label: 'High risk', tone: 'high' };
    }
    return { label: 'Low risk', tone: 'low' };
  }, [result]);

  useEffect(() => {
    fetchAnalyticsSummary()
      .then((summary) => {
        setAnalytics(summary);
        setRiskHistory(summary.recent_assessments);
      })
      .catch(() => setAnalytics(null));
    fetchModelStatus().then(setModelStatus).catch(() => setModelStatus(null));
  }, []);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
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
        is_new_customer: Boolean(form.is_new_customer),
      };
      const data = await predictTransaction(payload);
      setResult(data);
      fetchAnalyticsSummary()
        .then((summary) => {
          setAnalytics(summary);
          setRiskHistory(summary.recent_assessments);
        })
        .catch(() => {});
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const applySample = (caseName) => {
    setForm(sampleCases[caseName]);
    setResult(null);
    setError('');
  };

  return (
    <div className="app-shell">
      <div className="dashboard">
        <header className="topbar">
          <div className="brand-lockup">
            <div className="brand-mark" aria-hidden="true">SD</div>
            <div className="brand-copy">
              <p className="eyebrow">Risk operations</p>
              <h1>Store Fraud Detection</h1>
            </div>
          </div>
          <div className={`status-pill ${riskLevel.tone}`}>
            <span className="status-indicator" aria-hidden="true" />
            {riskLevel.label}
          </div>
        </header>

        <section className="overview-heading">
          <div>
            <p className="eyebrow">Live monitoring</p>
            <h2>Risk overview</h2>
          </div>
          <div className="overview-meta">
            <span className={`overview-model ${modelStatus?.status === 'active' ? 'active' : ''}`}>
              <span className="status-indicator" aria-hidden="true" />
              {modelStatus?.status === 'active' ? 'Model online' : 'Model status unavailable'}
            </span>
            <span>{analytics ? `${analytics.total_transactions.toLocaleString()} saved assessments` : 'Loading saved assessments'}</span>
          </div>
        </section>

        <section className="stats-grid">
          <article className="stat-card stat-risk">
            <span>Risk score</span>
            <strong>{result ? `${Number(result.probability * 100).toFixed(1)}%` : '--'}</strong>
            <small>{result ? 'Model probability' : 'Awaiting first check'}</small>
          </article>
          <article className={`stat-card ${result?.fraudulent ? 'stat-fraud' : 'stat-prediction'}`}>
            <span>Prediction</span>
            <strong>{result ? (result.fraudulent ? 'Fraud' : 'Safe') : 'Pending'}</strong>
            <small>{result ? 'Latest classification' : 'No transaction scored'}</small>
          </article>
          <article className="stat-card stat-volume">
            <span>Total transactions checked</span>
            <strong>{analytics ? analytics.total_transactions.toLocaleString() : '--'}</strong>
            <small>Saved assessments</small>
          </article>
          <article className="stat-card stat-fraud">
            <span>Flagged as suspicious</span>
            <strong>{analytics ? analytics.suspicious_transactions.toLocaleString() : '--'}</strong>
            <small>{analytics ? `${analytics.alert_rate.toFixed(1)}% of checked transactions` : 'Saved fraud decisions'}</small>
          </article>
        </section>

        <section className="panel performance-panel" aria-label="Model performance summary">
          <div className="performance-heading">
            <div>
              <h2>Model performance</h2>
              <p>
                {modelStatus
                  ? `${modelStatus.model_name.replaceAll('_', ' ')} · v${modelStatus.version}${modelStatus.training_date ? ` · evaluated ${new Date(modelStatus.training_date).toLocaleDateString()}` : ''}`
                  : 'Evaluation metrics'}
              </p>
            </div>
            <span className={`model-status ${modelStatus?.status === 'active' ? 'active' : ''}`}>
              {modelStatus?.status || 'Loading'}
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
                <strong>{Number.isFinite(value) ? `${(value * 100).toFixed(1)}%` : '--'}</strong>
              </div>
            ))}
          </div>
        </section>

        <div className="chart-grid-two">
          <React.Suspense
            fallback={
              <section className="panel risk-chart-panel">
                <div className="risk-chart-loading">Loading user activity...</div>
              </section>
            }
          >
            <UserActivityChart data={analytics?.activity_by_hour ?? []} />
          </React.Suspense>

          <React.Suspense
            fallback={
              <section className="panel risk-chart-panel">
                <div className="risk-chart-loading">Loading fraud trend...</div>
              </section>
            }
          >
            <FraudTrendChart data={analytics?.recent_assessments ?? []} />
          </React.Suspense>
        </div>

        <React.Suspense
          fallback={
            <section className="panel risk-chart-panel">
              <div className="risk-chart-loading">Loading recent assessments...</div>
            </section>
          }
        >
          <RiskTrendChart data={riskHistory} />
        </React.Suspense>

        <main className="content-grid">
          <section className="panel form-panel">
            <div className="panel-header">
              <h2>Transaction details</h2>
              <div className="quick-actions">
                <button type="button" className="ghost" onClick={() => applySample('low')}>
                  Low risk
                </button>
                <button type="button" className="ghost" onClick={() => applySample('medium')}>
                  Elevated risk
                </button>
                <button type="button" className="ghost" onClick={() => applySample('high')}>
                  High risk
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="form-grid">
              <label>
                Transaction ID
                <input name="transaction_id" value={form.transaction_id} onChange={handleChange} required />
              </label>
              <label>
                Amount
                <input name="amount" type="number" min="0" step="0.01" value={form.amount} onChange={handleChange} required />
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
                Sender balance before
                <input name="oldbalanceOrg" type="number" min="0" step="0.01" value={form.oldbalanceOrg} onChange={handleChange} required />
              </label>
              <label>
                Sender balance after
                <input name="newbalanceOrig" type="number" min="0" step="0.01" value={form.newbalanceOrig} onChange={handleChange} required />
              </label>
              <label>
                Receiver balance before
                <input name="oldbalanceDest" type="number" min="0" step="0.01" value={form.oldbalanceDest} onChange={handleChange} required />
              </label>
              <label>
                Receiver balance after
                <input name="newbalanceDest" type="number" min="0" step="0.01" value={form.newbalanceDest} onChange={handleChange} required />
              </label>
              <label>
                Merchant ID
                <input name="merchant_id" value={form.merchant_id} onChange={handleChange} required />
              </label>
              <label>
                Device Type
                <select name="device_type" value={form.device_type} onChange={handleChange}>
                  <option value="mobile">Mobile</option>
                  <option value="desktop">Desktop</option>
                  <option value="tablet">Tablet</option>
                </select>
              </label>
              <label>
                Customer ID
                <input name="customer_id" value={form.customer_id} onChange={handleChange} required />
              </label>
              <label>
                Country
                <input name="country" value={form.country} onChange={handleChange} maxLength="2" aria-label="Country code" required />
              </label>
              <label>
                Hour
                <input name="hour" type="number" min="0" max="23" value={form.hour} onChange={handleChange} required />
              </label>
              <label className="checkbox-row">
                <input type="checkbox" name="is_new_customer" checked={form.is_new_customer} onChange={handleChange} />
                New customer
              </label>

              <button type="submit" className="primary-btn" disabled={loading}>
                {loading ? 'Analyzing...' : 'Run risk assessment'}
              </button>
            </form>
          </section>

          <aside className="panel result-panel">
            <h2>Assessment</h2>

            {error ? <div className="alert error">{error}</div> : null}

            {!result && !error ? (
              <div className="empty-state">
                <p>No transaction reviewed yet.</p>
                <small>Submit a sample transaction to inspect the risk signal.</small>
              </div>
            ) : null}

            {result ? (
              <div className="result-box">
                <div className={`risk-badge ${result.fraudulent ? 'fraud' : 'safe'}`}>
                  {result.fraudulent ? 'Fraud likely' : 'Looks safe'}
                </div>

                <div className="score-row">
                  <span>Probability</span>
                  <strong>{Number(result.probability * 100).toFixed(2)}%</strong>
                </div>

                <div className="score-row">
                  <span>Model label</span>
                  <strong>{result.prediction}</strong>
                </div>

                <div className="score-row">
                  <span>Decision</span>
                  <strong>{result.fraudulent ? 'Block / review' : 'Allow transaction'}</strong>
                </div>
              </div>
            ) : null}
          </aside>
        </main>
      </div>
    </div>
  );
}

export default App;
