"""DB 모델 - 실시간 관리를 위한 3분류 스키마 반영.

[구조] Master / Session / Analytics
- Master: 기준 데이터 (mgmt_id=location_id, address, elevation_type, max_height_mm)
- Session: 스캔 시마다 생성 (GPS, cleaned_at, defect_status) → 앱 GPS 우선 시 last_measured_lat/lng 갱신
- Analytics: 산출값 (trash_vol, cycle_days, CRI, AI 권장조치)
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Float, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class DrainageData(Base):
    """
    빗물받이 데이터: Master + Session + Analytics 통합 테이블.
    청소/스캔 1회 = 1레코드, 동일 location_id로 세션 누적.
    """

    __tablename__ = "drainage_data"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    location_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)  # 관리번호(mgmt_id)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # === Master: 변하지 않는 기준 데이터 ===
    address: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    elevation_type: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)  # highland | lowland (고지/저지대)
    max_height_mm: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    name: Mapped[Optional[str]] = mapped_column(String(256), nullable=True)

    # === Session: 스캔 시마다 생성·갱신 (GPS 우선 정책) ===
    lat: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    lng: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    last_measured_lat: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # 앱 실측 좌표 우선
    last_measured_lng: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    cleaned_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)  # 청소 일시
    defect_status: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)  # none | crack | subsidence | etc (구조적 결함)

    # === 원본 수치 (스캔 시 측정값, Before/After 산출용) ===
    volume_L: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # 측정 부피 (After 또는 단일)

    # === Analytics: 포인트 클라우드 비교 후 산출 ===
    trash_vol_L: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # 쓰레기 부피 (After - Before)
    cycle_days: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # 청소 주기(일)
    cri: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # CRI 수치 (저지대 가중치 반영)
    risk_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # AI 권장조치
    priority_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    flood_probability: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    foot_traffic_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    damage_scale: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    ml_updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
