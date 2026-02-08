"""ML 분석 파이프라인: 데이터 수신 시 트리거 또는 주기적 DB 읽기.

Stats Team(ML)이 구현할 실제 분석 로직과 연동하는 인터페이스.
현재는 더미 업데이트로 동작. ML 팀이 DB에 직접 priority_score, risk_reason 등을 써도 됨.
"""

import asyncio
from datetime import datetime
from typing import Optional

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import DrainageData


async def trigger_ml_analysis(session: AsyncSession, location_id: str) -> None:
    """
    데이터 수신 시 ML 분석을 트리거.
    실제 구현: Stats Team의 분석 스크립트 호출 또는 메시지 큐 전달.

    현재: 더미로 priority_score, risk_reason 등 업데이트.
    """
    # 최신 drainage 데이터 조회
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

    # 더미 ML 분석 (실제로는 Stats Team 모듈 호출)
    volume = row.volume_L or 0
    height = row.max_height_mm or 0
    fill_ratio = min(1.0, (volume / 100) * (height / 200)) if volume and height else 0
    priority = 1 if fill_ratio > 0.8 else (2 if fill_ratio > 0.5 else 3)
    flood_prob = min(1.0, fill_ratio * 1.2)
    cri = int(fill_ratio * 100)
    reason = (
        "부피 과다·유동인구 밀집" if fill_ratio > 0.7
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
