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

function FraudTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const assessment = payload[0].payload;

  return (
    <div className="risk-chart-tooltip">
      <strong>{assessment.transactionId}</strong>
      <span>Assessment #{label}</span>
      <span>{assessment.fraud_cases} flagged fraud {assessment.fraud_cases === 1 ? 'case' : 'cases'}</span>
    </div>
  );
}

function FraudDot({ cx, cy, payload }) {
  return (
    <circle
      cx={cx}
      cy={cy}
      r={payload.fraud_cases > 0 ? 5 : 3}
      fill="var(--fraud-chart)"
      stroke="var(--panel)"
      strokeWidth={2}
    />
  );
}

function FraudTrendChart({ data }) {
  const chartData = data.slice(-20).map((assessment) => ({
    ...assessment,
    fraud_cases: Number(assessment.fraudulent),
  }));
  const totalCases = chartData.reduce((sum, entry) => sum + entry.fraud_cases, 0);

  return (
    <section className="panel chart-panel" aria-label="Fraud trend chart">
      <div className="panel-header risk-chart-header">
        <div>
          <h2>Fraud cases</h2>
          <p>Flagged cases across recent assessments</p>
        </div>
        <span className="risk-chart-count fraud-case-count">{totalCases} / {chartData.length} flagged</span>
      </div>

      {chartData.length ? (
        <div className="risk-chart-plot smaller-chart">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 16, left: 4, bottom: 2 }}>
              <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="4 6" vertical={false} />
              <XAxis
                dataKey="assessment"
                tickFormatter={(value) => `#${value}`}
                tick={{ fill: 'var(--muted)', fontSize: 12 }}
                axisLine={{ stroke: 'var(--border-strong)' }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                domain={[0, 1]}
                tick={{ fill: 'var(--muted)', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={32}
              />
              <Tooltip content={<FraudTooltip />} cursor={{ stroke: 'var(--border-strong)' }} />
              <Line
                type="monotone"
                dataKey="fraud_cases"
                name="Fraud cases"
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
      ) : null}
      {!chartData.length ? (
        <div className="risk-chart-empty">Fraud cases will appear here after a transaction is checked.</div>
      ) : null}
      {chartData.length > 0 && totalCases === 0 ? (
        <p className="risk-chart-empty-note no-fraud-cases" role="status">
          No suspicious transactions detected in recent assessments.
        </p>
      ) : null}
    </section>
  );
}

export default FraudTrendChart;
