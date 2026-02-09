/**
 * 좌표계 변환: 브이월드 데이터 API가 반환하는 좌표 → 네이버 지도용 WGS84(ESPG:4326)
 * - API에서 crs=EPSG:3857 로 요청 시 Web Mercator(미터) 반환 → 위경도로 변환
 * - API에서 crs=EPSG:4326 지원 시 위경도 직접 사용 (swap만 필요)
 */

/** EPSG:3857 (Web Mercator) 단일 점 → EPSG:4326 [lng, lat] */
export function epsg3857ToWgs84(x: number, y: number): [number, number] {
  const lng = (x * 180) / 20037508.34;
  let lat = (y * 180) / 20037508.34;
  lat =
    (Math.atan(Math.exp((lat * Math.PI) / 180)) * 360) / Math.PI - 90;
  return [lng, lat];
}

/**
 * GeoJSON은 [lng, lat] 순서. 네이버/Leaflet은 [lat, lng].
 * 한 점을 [lat, lng]로 반환.
 */
export function toLatLng(lng: number, lat: number): [number, number] {
  return [lat, lng];
}

/**
 * 좌표 배열이 3857인지 4326인지 추정 (값 범위로 판단).
 * 3857: x 보통 수백만~천만, y 수백만. 4326: lng 124~132, lat 33~43.
 */
export function isLikelyEpsg3857(coords: number[]): boolean {
  if (coords.length < 2) return false;
  const x = coords[0];
  const y = coords[1];
  return Math.abs(x) > 180 || Math.abs(y) > 90;
}

/**
 * 폴리곤 링 하나 변환: [[x,y], ...] 또는 [[lng,lat], ...] → [[lat,lng], ...]
 * is3857이 true면 3857→4326 변환 후 [lat,lng], false면 swap만.
 */
export function convertRing(
  ring: number[][],
  is3857: boolean
): [number, number][] {
  return ring.map((p) => {
    const [a, b] = p;
    if (is3857) {
      const [lng, lat] = epsg3857ToWgs84(a, b);
      return toLatLng(lng, lat);
    }
    return toLatLng(a, b); // GeoJSON [lng, lat] → [lat, lng]
  });
}

/** 링 단순화: 최대 maxPoints개 꼭짓점만 유지해 렌더링 부하 감소 (닫힌 링 유지) */
export function simplifyRing(
  ring: [number, number][],
  maxPoints: number = 48
): [number, number][] {
  if (ring.length <= maxPoints) return ring;
  const step = ring.length / maxPoints;
  const out: [number, number][] = [];
  for (let i = 0; i < maxPoints; i++) {
    const idx = Math.min(Math.floor(i * step), ring.length - 1);
    out.push(ring[idx]);
  }
  const first = ring[0];
  const last = out[out.length - 1];
  if (last[0] !== first[0] || last[1] !== first[1]) {
    out.push([first[0], first[1]]);
  }
  return out;
}
