from fastapi import APIRouter

from backend.app.services.monitoring_service import get_monitoring_summary

router = APIRouter()


@router.get("")
def monitoring_dashboard():
    return get_monitoring_summary([])
