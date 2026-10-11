from fastapi import APIRouter

from backend.app.services.model_service import get_model_status

router = APIRouter()


@router.get("")
def get_model():
    return get_model_status()
