
import React from 'react';
import {
  Line,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

function FraudTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;

  const transaction = payload[0].payload;

  return (
    <div className="risk-chart-tooltip">
      <strong>{transaction.transaction_id}</strong>
      <span>
        Fraud probability: {transaction.fraud_probability.toFixed(2)}%
      </span>
      <span>
        Classification: {transaction.fraudulent ? 'Fraud' : 'Normal'}
      </span>
      <span>
        Transaction amount: {Number(transaction.amount || 0).toLocaleString(
          'en-IN',
          { style: 'currency', currency: 'INR' }
        )}
      </span>
    </div>
  );
}

function FraudDot({ cx, cy, payload }) {
  return (
    <circle
      cx={cx}
      cy={cy}
      r={payload.fraudulent ? 6 : 4}
      fill={payload.fraudulent ? '#ef4444' : 'var(--fraud-chart)'}
      stroke="var(--panel)"
      strokeWidth={2}
    />
  );
}

function FraudTrendChart({ data = [] }) {
  const chartData = data.map((transaction) => {
    const probability = Number(transaction.probability ?? 0);

    return {
      ...transaction,
      transaction_id:
        transaction.transaction_id ?? `Transaction ${transaction.id}`,
      fraud_probability: Math.max(
        0,
        Math.min(100, probability * 100)
      ),
      fraudulent:
        transaction.fraudulent ??
        Boolean(transaction.prediction),
    };
  });

  const totalTransactions = chartData.length;

  const totalCases = chartData.filter(
    (transaction) => transaction.fraudulent
  ).length;

  const fraudRate = totalTransactions
    ? (totalCases / totalTransactions) * 100
    : 0;

  const highRiskCount = chartData.filter(
    (transaction) => transaction.fraud_probability >= 50
  ).length;

  return (
    <section className="panel chart-panel" aria-label="Fraud risk overview">
      <div className="panel-header risk-chart-header">
        <div>
          <h2>Fraud Risk Overview</h2>
          <p>Fraud probability across saved transactions</p>
        </div>

        <span className="risk-chart-count fraud-case-count">
          {totalCases} / {totalTransactions} flagged
        </span>
      </div>

      <div className="fraud-summary">
        <div className="fraud-summary-item">
          <span>Total transactions</span>
          <strong>{totalTransactions}</strong>
        </div>

        <div className="fraud-summary-item">
          <span>Fraud rate</span>
          <strong>{fraudRate.toFixed(2)}%</strong>
        </div>

        <div className="fraud-summary-item">
          <span>High risk (≥50%)</span>
          <strong>{highRiskCount}</strong>
        </div>
      </div>

      {chartData.length > 0 ? (
        <div className="risk-chart-plot smaller-chart">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 12, right: 16, left: 4, bottom: 8 }}
            >
              <CartesianGrid
                stroke="var(--chart-grid)"
                strokeDasharray="4 6"
                vertical={false}
              />

              <XAxis
                dataKey="transaction_id"
                tickFormatter={(value) =>
                  String(value).length > 10
                    ? `${String(value).slice(0, 8)}…`
                    : value
                }
                interval="preserveStartEnd"
                tick={{ fill: 'var(--muted)', fontSize: 10 }}
                axisLine={{ stroke: 'var(--border-strong)' }}
                tickLine={false}
              />

              <YAxis
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tickFormatter={(value) => `${value}%`}
                tick={{ fill: 'var(--muted)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={42}
              />

              <Tooltip
                content={<FraudTooltip />}
                cursor={{ stroke: 'var(--border-strong)' }}
              />

              <Line
                type="monotone"
                dataKey="fraud_probability"
                name="Fraud probability"
                stroke="var(--fraud-chart)"
                strokeWidth={3}
                dot={<FraudDot />}
                activeDot={{ r: 7, stroke: 'var(--text)', strokeWidth: 2 }}
                isAnimationActive
                animationDuration={450}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="risk-chart-empty">
          Fraud risk data will appear here after transactions are assessed.
        </div>
      )}

      <div className="fraud-chart-legend">
        <span>
          <i className="legend-dot normal-dot" />
          Normal classification
        </span>
        <span>
          <i className="legend-dot fraud-dot" />
          Fraud classification
        </span>
      </div>

      {totalCases > 0 && (
        <p className="risk-chart-empty-note" role="status">
          {totalCases} transaction{totalCases === 1 ? '' : 's'} flagged by
          the model. Review flagged transactions before taking action.
        </p>
      )}
    </section>
  );
}

export default FraudTrendChart;
