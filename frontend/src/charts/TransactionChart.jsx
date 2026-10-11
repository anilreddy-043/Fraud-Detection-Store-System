import React from 'react';
import {
	Area,
	AreaChart,
	CartesianGrid,
	ReferenceLine,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';

function RiskDot({ cx, cy, payload }) {
	return (
		<circle
			cx={cx}
			cy={cy}
			r={payload.fraudulent ? 5.5 : 4.5}
			fill={payload.fraudulent ? 'var(--fraud-chart)' : 'var(--primary)'}
			stroke="var(--panel)"
			strokeWidth={2}
		/>
	);
}

function RiskTooltip({ active, payload }) {
	if (!active || !payload?.length) return null;

	const assessment = payload[0].payload;

	return (
		<div className="risk-chart-tooltip">
			<strong>{assessment.transactionId}</strong>
			<span>{assessment.probability.toFixed(1)}% fraud probability</span>
			<span>{assessment.fraudulent ? 'Flagged as fraud' : 'Classified as safe'}</span>
		</div>
	);
}

function TransactionChart({ data }) {
	const visibleData = data.slice(-20);

	return (
		<section className="panel risk-chart-panel" aria-label="Recent transaction risk graph">
			<div className="panel-header risk-chart-header">
				<div>
					<h2>Recent assessments</h2>
					<p>Fraud probability by transaction check</p>
				</div>
				<span className="risk-chart-count">{visibleData.length} / 20 shown</span>
			</div>

			{visibleData.length ? (
				<div className="risk-chart-plot">
					<ResponsiveContainer width="100%" height="100%">
						<AreaChart data={visibleData} margin={{ top: 18, right: 16, bottom: 2, left: 4 }}>
							<defs>
								<linearGradient id="assessmentRiskFill" x1="0" x2="0" y1="0" y2="1">
									<stop offset="0%" stopColor="var(--sky)" stopOpacity={0.34} />
									<stop offset="100%" stopColor="var(--sky)" stopOpacity={0.015} />
								</linearGradient>
							</defs>
							<CartesianGrid stroke="var(--chart-grid)" strokeDasharray="4 6" vertical={false} />
							<XAxis
								dataKey="assessment"
								tickFormatter={(value) => `#${value}`}
								tick={{ fill: 'var(--muted)', fontSize: 12 }}
								axisLine={{ stroke: 'var(--border-strong)' }}
								tickLine={false}
							/>
							<YAxis
								domain={[0, 100]}
								tickFormatter={(value) => `${value}%`}
								tick={{ fill: 'var(--muted)', fontSize: 12 }}
								axisLine={false}
								tickLine={false}
								width={42}
							/>
							<ReferenceLine
								y={50}
								stroke="var(--fraud-chart)"
								strokeDasharray="5 5"
								label={{ value: '50% review threshold', fill: 'var(--danger)', fontSize: 11, position: 'insideTopRight' }}
							/>
							<Tooltip content={<RiskTooltip />} cursor={{ stroke: 'var(--border-strong)' }} />
							<Area
								type="monotone"
								dataKey="probability"
								name="Fraud probability"
								stroke="var(--sky)"
								strokeWidth={2.8}
								fill="url(#assessmentRiskFill)"
								dot={<RiskDot />}
								activeDot={{ r: 7, stroke: 'var(--text)', strokeWidth: 2 }}
								isAnimationActive
								animationDuration={500}
							/>
						</AreaChart>
					</ResponsiveContainer>
				</div>
			) : (
				<div className="risk-chart-empty">Risk scores will appear here after a transaction is checked.</div>
			)}
		</section>
	);
}

export default TransactionChart;
