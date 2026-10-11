from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.api.dependencies import get_db
from backend.app.database.crud import save_assessment
from backend.app.schemas.prediction import PredictionRequest, PredictionResponse
from backend.app.services.prediction_service import predict_transaction

router = APIRouter()


@router.post("/predict", response_model=PredictionResponse)
def create_prediction(payload: PredictionRequest, db: Session = Depends(get_db)):
    transaction_data = payload.model_dump()
    result = predict_transaction(transaction_data)
    save_assessment(
        db,
        transaction_data,
        result["prediction"],
        result["probability"],
    )
    return PredictionResponse(
        transaction_id=result["transaction_id"],
        prediction=result["prediction"],
        probability=result["probability"],
        fraudulent=result["fraudulent"],
    )
