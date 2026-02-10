"""ML 분석 파이프라인: 데이터 수신 시 트리거 또는 주기적 DB 읽기.

- CRI 산출: 쓰레기 부피(trash_vol) + 저지대(elevation_type=lowland) 가중치 반영
- 실시간성: ingestion에서 BackgroundTasks로 호출되어 앱 대기 시간 최소화
"""

import asyncio
from datetime import datetime

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import DrainageData

# CRI 보정: 저지대일 때 가중치 (저지대 + 쓰레기 많음 = CRI 최고점)
LOWLAND_CRI_BOOST = 15  # 0~100 기준 가점


async def trigger_ml_analysis(session: AsyncSession, location_id: str) -> None:
    """
    최신 레코드 기준으로 CRI·AI 권장조치 산출.
    저지대(lowland)면 CRI에 가중치 부여.
    """
    stmt = (
        select(DrainageData)
        .where(DrainageData.location_id == location_id)
        .order_by(DrainageData.created_at.desc())
        .limit(1)
    )
    result = await session.execute(stmt)
    row = result.scalar_one_or_none()
    if not row:
        return

    # 쓰레기 부피 기반 위험도 (0~1). trash_vol_L 없으면 volume_L·max_height로 대체
    trash_L = row.trash_vol_L
    if trash_L is not None:
        fill_ratio = min(1.0, trash_L / 150.0)  # 150L 기준
    else:
        volume = row.volume_L or 0
        height = row.max_height_mm or 0
        fill_ratio = min(1.0, (volume / 100) * (height / 200)) if volume and height else 0

    cri_base = int(fill_ratio * 100)
    is_lowland = (row.elevation_type or "").strip().lower() == "lowland"
    cri = min(100, cri_base + (LOWLAND_CRI_BOOST if is_lowland else 0))

    priority = 1 if cri >= 80 else (2 if cri >= 50 else 3)
    flood_prob = min(1.0, fill_ratio * 1.2)
    reason = (
        "저지대·쓰레기 과다로 즉시 점검 권장" if is_lowland and fill_ratio > 0.5
        else "부피 과다·유동인구 밀집" if fill_ratio > 0.7
        else "중간 수준 점검 권장" if fill_ratio > 0.4
        else "상대적으로 양호"
    )

    await session.execute(
        update(DrainageData)
        .where(DrainageData.id == row.id)
        .values(
            priority_score=priority,
            risk_reason=reason,
            flood_probability=round(flood_prob, 3),
            cri=cri,
            ml_updated_at=datetime.utcnow(),
        )
    )
    await session.flush()


async def run_periodic_ml_update(session: AsyncSession) -> None:
    """
    주기적으로 DB를 읽어 ML 분석 실행.
    Celery/APScheduler 등으로 스케줄링 시 이 함수 호출.
    """
    stmt = select(DrainageData).where(DrainageData.ml_updated_at.is_(None))
    result = await session.execute(stmt)
    rows = result.scalars().all()
    for row in rows:
        await trigger_ml_analysis(session, row.location_id)
        await asyncio.sleep(0.1)  # 부하 완화
