/**
 * 시군구 경계 폴리곤 타입
 * 좌표: [lat, lng] (네이버/Leaflet 순서). 실제 데이터는 브이월드 API로 로드.
 */

export type DistrictPolygon = {
  id: string;
  name: string;
  positions: [number, number][][]; // [lat, lng][] - 링별 좌표
};

/** 구간 데이터는 제거됨. 시군구는 '시군구 구역 표시' 버튼으로 브이월드 API에서 로드 */
export const SEOUL_DISTRICT_BOUNDARIES: DistrictPolygon[] = [];

/** 시군구 경계 기본 스타일 (Leaflet pathOptions용, AdvancedMap 등) */
export const DISTRICT_BOUNDARY_STYLE = {
  color: "#3b82f6",
  weight: 2,
  fillColor: "#60a5fa",
  fillOpacity: 0.25,
};

/** 시군구별 반투명 색상 (fillColor, strokeColor) */
export const DISTRICT_COLORS: { fill: string; stroke: string }[] = [
  { fill: "#60a5fa", stroke: "#3b82f6" }, // 파랑 - 강남구
  { fill: "#34d399", stroke: "#10b981" }, // 초록 - 서초구
  { fill: "#a78bfa", stroke: "#8b5cf6" }, // 보라 - 송파구
  { fill: "#fb923c", stroke: "#ea580c" }, // 주황 - 종로구
  { fill: "#f472b6", stroke: "#db2777" }, // 핑크 - 중구
  { fill: "#22d3ee", stroke: "#06b6d4" }, // 시안 - 용산구
];
