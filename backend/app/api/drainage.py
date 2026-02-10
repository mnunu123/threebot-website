"""빗물받이 데이터 조회 API (프론트엔드/맵 연동용)."""

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import DrainageData
from app.schemas import DrainageDataOut

router = APIRouter(prefix="/drainage", tags=["drainage"])


@router.get("", response_model=list[DrainageDataOut])
async def list_drainage(
    limit: int = Query(50, le=200),
    db: AsyncSession = Depends(get_db),
) -> list[DrainageDataOut]:
    """location_id당 최신 1건만 반환 (웹 지도 중복 마커 방지)."""
    stmt = (
        select(DrainageData)
        .order_by(DrainageData.created_at.desc())
        .limit(limit * 3)
    )
    result = await db.execute(stmt)
    rows = result.scalars().all()
    seen: set[str] = set()
    out: list[DrainageDataOut] = []
    for r in rows:
        if r.location_id in seen:
            continue
        seen.add(r.location_id)
        out.append(DrainageDataOut.model_validate(r))
        if len(out) >= limit:
            break
    return out


@router.get("/{location_id}", response_model=Optional[DrainageDataOut])
async def get_drainage(
    location_id: str,
    db: AsyncSession = Depends(get_db),
) -> Optional[DrainageDataOut]:
    """특정 빗물받이의 최신 데이터 조회 (원본 + ML 분석)."""
    stmt = (
        select(DrainageData)
        .where(DrainageData.location_id == location_id)
        .order_by(DrainageData.created_at.desc())
        .limit(1)
    )
    result = await db.execute(stmt)
    row = result.scalar_one_or_none()
    if not row:
        return None
    return DrainageDataOut.model_validate(row)
