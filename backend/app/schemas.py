"""API 요청/응답 스키마."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, model_validator


# === Data Ingestion (모바일 앱) ===
class IngestionRequest(BaseModel):
    """
    모바일 앱 → API: 스캔(Before/After) 산출값 + GPS 등.
    데이터 산출: After 부피 - Before 부피 = 쓰레기 부피(trash_vol_L). 서버에서 계산 가능.
    """

    location_id: str = Field(..., description="빗물받이 고유 ID (관리번호 mgmt_id)")
    # 부피: Before/After 모두 보내면 서버에서 trash_vol_L 산출. 단일 값이면 volume_L만 저장.
    before_volume_L: float | None = Field(None, ge=0, description="청소 전 부피 (L)")
    after_volume_L: float | None = Field(None, ge=0, description="청소 후 부피 (L)")
    volume_L: float | None = Field(None, ge=0, description="단일 측정 부피 (L) — before/after 미사용 시")
    max_height_mm: float | None = Field(None, ge=0, description="최대 높이 (mm)")
    # Session: 스캔 시마다 전송, GPS 우선 정책으로 좌표 갱신
    lat: float | None = Field(None, description="앱에서 수집한 위도 (실측 우선)")
    lng: float | None = Field(None, description="앱에서 수집한 경도 (실측 우선)")
    cleaned_at: datetime | None = Field(None, description="청소 일시 (ISO 또는 YYYY-MM-DD HH:MM)")
    defect_status: str | None = Field(None, description="구조적 결함: none | crack | subsidence | other")
    # Master (선택)
    address: str | None = Field(None, description="주소")
    elevation_type: str | None = Field(None, description="고지/저지대: highland | lowland")
    name: str | None = Field(None, description="이름")

    @model_validator(mode="after")
    def require_volume(self):
        has_before_after = self.before_volume_L is not None and self.after_volume_L is not None
        if has_before_after or self.volume_L is not None:
            return self
        raise ValueError("before_volume_L+after_volume_L 또는 volume_L 중 하나는 필수입니다.")


class IngestionResponse(BaseModel):
    ok: bool
    message: str
    location_id: str


# === User Query (Chat / LLM) ===
class ChatRequest(BaseModel):
    query: str = Field(..., description="사용자 질문")
    session_id: Optional[str] = None


class ChatResponse(BaseModel):
    answer: str
    intent: Optional[str] = None
    tools_used: Optional[list[str]] = None


# === Drainage Data (DB ↔ API) ===
class DrainageDataOut(BaseModel):
    location_id: str
    # Master
    name: Optional[str] = None
    address: Optional[str] = None
    elevation_type: Optional[str] = None
    max_height_mm: Optional[float] = None
    # Session (GPS 우선: 지도 표시 시 last_measured 사용)
    lat: Optional[float] = None
    lng: Optional[float] = None
    last_measured_lat: Optional[float] = None
    last_measured_lng: Optional[float] = None
    cleaned_at: Optional[datetime] = None
    defect_status: Optional[str] = None
    # 원본·Analytics
    volume_L: Optional[float] = None
    trash_vol_L: Optional[float] = None
    cycle_days: Optional[int] = None
    cri: Optional[int] = None
    risk_reason: Optional[str] = None
    priority_score: Optional[int] = None
    flood_probability: Optional[float] = None
    foot_traffic_score: Optional[float] = None
    damage_scale: Optional[str] = None
    created_at: Optional[datetime] = None
    ml_updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
