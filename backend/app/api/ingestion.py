"""Data Ingestion API: 모바일 앱 → 포인트 클라우드·스캔 데이터 수신.

- 실시간 Ingestion: 앱에서 산출된 값(GPS 포함) POST /ingestion/drainage
- 위치 동기화: 앱에서 수집한 GPS를 last_measured_lat/lng에 우선 반영
- 실시간성: 응답 즉시 반환, CRI/AI 분석은 BackgroundTasks로 처리
"""

from fastapi import APIRouter, BackgroundTasks, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session, get_db
from app.models import DrainageData
from app.schemas import IngestionRequest, IngestionResponse
from app.services.ml_pipeline import trigger_ml_analysis

router = APIRouter(prefix="/ingestion", tags=["ingestion"])


def _trash_vol_L(before: float | None, after: float | None) -> float | None:
    if before is not None and after is not None:
        return max(0.0, after - before)
    return None


@router.post("/drainage", response_model=IngestionResponse)
async def ingest_drainage_data(
    body: IngestionRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
) -> IngestionResponse:
    """
    앱에서 산출된 모든 값(GPS 포함) 수신.
    After - Before = 쓰레기 부피 산출, GPS 우선 정책으로 실측 좌표 갱신.
    응답은 즉시 반환하고, CRI·AI 권장조치는 백그라운드에서 처리.
    """
    trash = _trash_vol_L(body.before_volume_L, body.after_volume_L)
    volume = body.after_volume_L if body.after_volume_L is not None else body.volume_L

    row = DrainageData(
        location_id=body.location_id,
        # Master
        address=body.address,
        elevation_type=body.elevation_type,
        max_height_mm=body.max_height_mm,
        name=body.name,
        # Session: GPS 우선 — 앱에서 보낸 좌표를 실측으로 저장
        lat=body.lat,
        lng=body.lng,
        last_measured_lat=body.lat,
        last_measured_lng=body.lng,
        cleaned_at=body.cleaned_at,
        defect_status=body.defect_status,
        # 원본·Analytics
        volume_L=volume,
        trash_vol_L=trash,
    )
    db.add(row)
    await db.flush()

    # 실시간성: 응답 먼저 보내고, CRI/AI 분석은 백그라운드에서 수행
    location_id = body.location_id
    background_tasks.add_task(_run_ml_after_commit, location_id)

    return IngestionResponse(
        ok=True,
        message="데이터 수신 완료. CRI·AI 분석은 백그라운드에서 처리됩니다.",
        location_id=location_id,
    )


async def _run_ml_after_commit(location_id: str) -> None:
    """새 세션을 열어 ML 분석 실행 (요청 세션은 이미 종료된 후 호출됨)."""
    async with async_session() as session:
        try:
            await trigger_ml_analysis(session, location_id)
        except Exception:
            pass  # 로깅만 하고 앱에는 이미 성공 응답을 보냄
