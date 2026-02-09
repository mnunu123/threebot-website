"""API 요청/응답 스키마."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


# === Data Ingestion (모바일 앱) ===
class IngestionRequest(BaseModel):
    """모바일 앱 → API: 포인트 클라우드 추정 부피 데이터."""

    location_id: str = Field(..., description="빗물받이 고유 ID")
    volume_L: float = Field(..., ge=0, description="추정 부피 (L)")
    max_height_mm: float = Field(..., ge=0, description="최대 높이 (mm)")


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
    volume_L: Optional[float] = None
    max_height_mm: Optional[float] = None
    priority_score: Optional[int] = None
    risk_reason: Optional[str] = None
    flood_probability: Optional[float] = None
    cri: Optional[int] = None
    foot_traffic_score: Optional[float] = None
    damage_scale: Optional[str] = None
    name: Optional[str] = None
    address: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    created_at: Optional[datetime] = None
    ml_updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
