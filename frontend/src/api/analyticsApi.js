const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export async function fetchAnalyticsSummary() {
  const response = await fetch(`${API_BASE_URL}/analytics`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || 'Failed to load analytics summary');
  }

  return {
    total_transactions: Number(data.total_transactions ?? 0),
    suspicious_transactions: Number(data.suspicious_transactions ?? 0),
    alert_rate: Number(data.alert_rate ?? 0),
    average_amount: Number(data.average_amount ?? 0),
    activity_by_hour: Array.isArray(data.activity_by_hour) ? data.activity_by_hour : [],
    fraud_by_hour: Array.isArray(data.fraud_by_hour) ? data.fraud_by_hour : [],
    recent_assessments: Array.isArray(data.recent_assessments) ? data.recent_assessments : [],
  };
}
