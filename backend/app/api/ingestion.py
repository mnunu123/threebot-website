"""Data Ingestion API: 모바일 앱 → 포인트 클라우드 부피 데이터 수신."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import DrainageData
from app.schemas import IngestionRequest, IngestionResponse
from app.services.ml_pipeline import trigger_ml_analysis

router = APIRouter(prefix="/ingestion", tags=["ingestion"])


@router.post("/drainage", response_model=IngestionResponse)
async def ingest_drainage_data(
    body: IngestionRequest,
    db: AsyncSession = Depends(get_db),
) -> IngestionResponse:
    """
    모바일 앱으로부터 location_id, volume_L, max_height_mm 수신.
    DB 저장 후 ML 분석 파이프라인 트리거.
    """
    row = DrainageData(
        location_id=body.location_id,
        volume_L=body.volume_L,
        max_height_mm=body.max_height_mm,
    )
    db.add(row)
    await db.flush()

    await trigger_ml_analysis(db, body.location_id)

    return IngestionResponse(
        ok=True,
        message="데이터 수신 및 ML 분석 트리거 완료",
        location_id=body.location_id,
    )
