import React from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

function UserTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="risk-chart-tooltip">
      <strong>{label}:00</strong>
      <span>{payload[0].value} transactions</span>
      <span>{payload[1].value} active users</span>
    </div>
  );
}

function UserActivityChart({ data }) {
  return (
    <section className="panel chart-panel" aria-label="User activity chart">
      <div className="panel-header risk-chart-header">
        <div>
          <h2>User activity</h2>
          <p>Saved transactions and unique customers by hour</p>
        </div>
      </div>

      {data.length ? (
        <div className="risk-chart-plot smaller-chart">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 6 }}>
              <defs>
                <linearGradient id="activityFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="4 6" vertical={false} />
              <XAxis dataKey="hour" interval={3} tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={{ stroke: 'var(--border-strong)' }} tickLine={false} />
              <YAxis tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<UserTooltip />} />
              <Area type="monotone" dataKey="transactions" stroke="var(--primary)" strokeWidth={2.6} fill="url(#activityFill)" name="Transactions" />
              <Area type="monotone" dataKey="users" stroke="var(--sky)" strokeWidth={2.2} fill="rgba(131,200,212,0.12)" name="Users" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="risk-chart-empty">Activity will appear after transactions are assessed.</div>
      )}
    </section>
  );
}

export default UserActivityChart;
