def get_monitoring_summary(events):
    total = len(events)
    suspicious = sum(1 for item in events if item.get("fraudulent"))
    average_amount = round(
        sum(float(item.get("amount", 0.0)) for item in events) / total,
        2,
    ) if total else 0.0

    recent_alerts = []
    for item in events[:5]:
        if item.get("fraudulent"):
            recent_alerts.append({
                "transaction_id": item.get("transaction_id", "unknown"),
                "merchant_id": item.get("merchant_id", "unknown"),
                "amount": float(item.get("amount", 0.0)),
                "risk_score": float(item.get("risk_score", 0.0)),
            })

    return {
        "total_transactions": total,
        "suspicious_transactions": suspicious,
        "alert_rate": round((suspicious / total) * 100, 2) if total else 0.0,
        "average_amount": average_amount,
        "recent_alerts": recent_alerts,
    }
