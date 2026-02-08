"""DB 모델 - 원본 수치 + ML 분석 결과 통합.

⚠️ DB 스키마 협의: 통계학과(ML) 팀과 컬럼명을 미리 맞춰야 LLM이 정확한 데이터를 읽어옵니다.
예: priority_score, risk_reason, flood_probability
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Float, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class DrainageData(Base):
    """
    빗물받이 데이터: 원본(모바일) + ML 분석 결과.

    - 모바일: location_id, volume_L, max_height_mm
    - ML: priority_score, risk_reason, flood_probability, cri 등
    """

    __tablename__ = "drainage_data"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    location_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # === 원본 수치 (모바일 앱 → 포인트 클라우드 추정) ===
    volume_L: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    max_height_mm: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # === ML 분석 결과 (Stats Team) ===
    priority_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # 1=최우선
    risk_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    flood_probability: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # 0~1
    cri: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # 위험지수 CRI
    foot_traffic_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # 유동인구 점수
    damage_scale: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)  # 예상 피해 규모

    # 메타 (이름, 주소 등 - 선택)
    name: Mapped[Optional[str]] = mapped_column(String(256), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    lat: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    lng: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ml_updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
