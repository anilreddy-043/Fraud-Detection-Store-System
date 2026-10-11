from __future__ import annotations

from typing import Any, Mapping

import pandas as pd


FEATURE_COLUMNS = [
    "amount",
    "oldbalanceOrg",
    "newbalanceOrig",
    "oldbalanceDest",
    "newbalanceDest",
    "type_CASH_OUT",
    "type_DEBIT",
    "type_PAYMENT",
    "type_TRANSFER",
]

TRANSACTION_TYPES = ["CASH_IN", "CASH_OUT", "DEBIT", "PAYMENT", "TRANSFER"]


def preprocess_transaction(data: Mapping[str, Any] | pd.DataFrame) -> dict[str, Any]:
    if isinstance(data, pd.DataFrame):
        row = data.iloc[0].to_dict()
    else:
        row = dict(data)

    transaction_type = str(row.get("type", "PAYMENT")).upper()
    if transaction_type not in TRANSACTION_TYPES:
        raise ValueError(f"Unsupported transaction type: {transaction_type}")

    features = {
        "amount": float(row.get("amount", 0.0)),
        "oldbalanceOrg": float(row.get("oldbalanceOrg", 0.0)),
        "newbalanceOrig": float(row.get("newbalanceOrig", 0.0)),
        "oldbalanceDest": float(row.get("oldbalanceDest", 0.0)),
        "newbalanceDest": float(row.get("newbalanceDest", 0.0)),
    }
    features.update({
        f"type_{kind}": int(transaction_type == kind)
        for kind in TRANSACTION_TYPES
        if kind != "CASH_IN"
    })
    return {column: features[column] for column in FEATURE_COLUMNS}
