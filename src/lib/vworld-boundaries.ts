/**
 * 브이월드 데이터 API로 서울 시군구 경계 조회 후 WGS84(EPSG:4326)로 변환
 * 네이버 지도(위경도)에 맞는 [lat, lng] 폴리곤 반환
 */

import type { DistrictPolygon } from "@/data/district-boundaries";
import {
  convertRing,
  isLikelyEpsg3857,
  simplifyRing,
} from "./vworld-coord";

/** 링당 최대 꼭짓점 수 (넘으면 단순화해 렉 방지) */
const MAX_POINTS_PER_RING = 48;

const VWORLD_DATA_URL = "https://api.vworld.kr/req/data";
const DEFAULT_KEY = "AC45C1D2-DA91-3CBC-B1DC-96A0E3937C25";
/** 서울 시군구: sig_cd 11로 시작 (서울특별시) */
const SEOUL_SIG_PREFIX = "11";

function getApiKey(): string {
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_VWORLD_API_KEY) {
    return process.env.NEXT_PUBLIC_VWORLD_API_KEY;
  }
  return DEFAULT_KEY;
}

function getDomain(override?: string): string {
  if (override) return override;
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  return "http://localhost:3000";
}

/** 브이월드 API: 시군구 경계 조회 (geometry=true). crs=EPSG:4326 요청 시 위경도 반환, 3857 시 미터 단위 */
async function fetchSeoulDistrictsFromVWorld(
  crs: "EPSG:4326" | "EPSG:3857" = "EPSG:4326",
  domainOverride?: string
): Promise<VWorldFeatureCollection> {
  const key = getApiKey();
  const domain = getDomain(domainOverride);
  const url = new URL(VWORLD_DATA_URL);
  url.searchParams.set("key", key);
  url.searchParams.set("domain", domain);
  url.searchParams.set("service", "data");
  url.searchParams.set("version", "2.0");
  url.searchParams.set("request", "getfeature");
  url.searchParams.set("format", "json");
  url.searchParams.set("size", "1000");
  url.searchParams.set("page", "1");
  url.searchParams.set("geometry", "true");
  url.searchParams.set("attribute", "true");
  url.searchParams.set("crs", crs);
  url.searchParams.set("data", "LT_C_ADSIGG_INFO");
  url.searchParams.set("attrfilter", `sig_cd:like:${SEOUL_SIG_PREFIX}`);

  const res = await fetch(url.toString(), { method: "GET" });
  if (!res.ok) {
    throw new Error(`V-World API ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  const fc = data?.response?.result?.featureCollection;
  if (!fc) {
    throw new Error("V-World API: featureCollection 없음");
  }
  return fc as VWorldFeatureCollection;
}

/** Polygon coordinates → [lat, lng][][] (외곽 링 + 홀), 링 단순화 적용 */
function polygonToPositions(
  coordinates: number[][][],
  is3857: boolean
): [number, number][][] {
  return coordinates.map((ring) =>
    simplifyRing(
      convertRing(
        ring.map((p) => [p[0], p[1]]),
        is3857
      ),
      MAX_POINTS_PER_RING
    )
  );
}

/** MultiPolygon coordinates → 첫 번째 폴리곤의 외곽만 사용 (단순화) */
function multiPolygonToPositions(
  coordinates: number[][][][],
  is3857: boolean
): [number, number][][] {
  const firstPoly = coordinates[0];
  if (!firstPoly || firstPoly.length === 0) return [];
  return polygonToPositions(firstPoly, is3857);
}

/** Feature → DistrictPolygon (시군구명: sig_kor_nm) */
function featureToDistrict(
  f: VWorldFeature,
  is3857: boolean
): DistrictPolygon | null {
  const props = f.properties as Record<string, string> | undefined;
  const name = props?.sig_kor_nm ?? props?.sig_eng_nm ?? "unknown";
  const sigCd = props?.sig_cd ?? "";
  const id = sigCd || name.replace(/\s/g, "_").toLowerCase();

  const geom = f.geometry;
  if (!geom || geom.type === "Point" || geom.type === "LineString") return null;

  let positions: [number, number][][] = [];
  if (geom.type === "Polygon") {
    positions = polygonToPositions(geom.coordinates, is3857);
  } else if (geom.type === "MultiPolygon") {
    positions = multiPolygonToPositions(geom.coordinates, is3857);
  }
  if (positions.length === 0) return null;

  return { id, name, positions };
}

/** V-World API 응답용 GeoJSON 타입 (전역 GeoJSON과 충돌 방지) */
type VWorldGeometry =
  | { type: "Point"; coordinates: number[] }
  | { type: "LineString"; coordinates: number[][] }
  | { type: "Polygon"; coordinates: number[][][] }
  | { type: "MultiPolygon"; coordinates: number[][][][] };
type VWorldFeature = {
  type: "Feature";
  geometry: VWorldGeometry;
  properties?: Record<string, unknown>;
};
type VWorldFeatureCollection = {
  type: "FeatureCollection";
  features: VWorldFeature[];
  bbox?: number[];
};

/** 첫 좌표로 3857 여부 판단 */
function detectCrs(features: VWorldFeature[]): boolean {
  for (const f of features) {
    const g = f.geometry;
    if (!g) continue;
    let coords: number[] = [];
    if (g.type === "Polygon" && g.coordinates[0]?.[0]) {
      coords = g.coordinates[0][0];
    } else if (g.type === "MultiPolygon" && g.coordinates[0]?.[0]?.[0]) {
      coords = g.coordinates[0][0][0];
    }
    if (coords.length >= 2) return isLikelyEpsg3857(coords);
  }
  return false;
}

/**
 * 서울 시군구 경계를 브이월드에서 조회해 WGS84(EPSG:4326) [lat, lng] 폴리곤으로 반환
 * @param domainOverride - 서버에서 호출 시 등록된 도메인 (예: process.env.NEXT_PUBLIC_APP_URL)
 */
export async function fetchSeoulDistrictBoundaries(
  domainOverride?: string
): Promise<DistrictPolygon[]> {
  let fc: VWorldFeatureCollection;
  try {
    fc = await fetchSeoulDistrictsFromVWorld("EPSG:4326", domainOverride);
  } catch {
    fc = await fetchSeoulDistrictsFromVWorld("EPSG:3857", domainOverride);
  }

  const features = fc.features ?? [];
  const is3857 = detectCrs(features);

  const list: DistrictPolygon[] = [];
  for (const f of features) {
    const district = featureToDistrict(f, is3857);
    if (district) list.push(district);
  }
  return list;
}
