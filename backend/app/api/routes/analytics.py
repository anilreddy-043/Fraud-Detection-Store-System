from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.api.dependencies import get_db
from backend.app.services.analytics_service import build_analytics_summary

router = APIRouter()


@router.get("")
def get_analytics(db: Session = Depends(get_db)):
    return build_analytics_summary(db)
