/**
 * 백엔드 빗물받이 API 연동
 * - 목록/상세를 백엔드 DrainageData 형식에서 프론트 StormDrainItem·상세 타입으로 매핑
 */

import type { StormDrainItem } from "@/types/storm-drain";
import type { DrainDetailDummy } from "@/data/mock-drain-detail";

/** 백엔드 GET /drainage 응답 한 건 (DrainageDataOut) */
export interface DrainageDataOut {
  location_id: string;
  name?: string | null;
  address?: string | null;
  elevation_type?: string | null;
  max_height_mm?: number | null;
  lat?: number | null;
  lng?: number | null;
  last_measured_lat?: number | null;
  last_measured_lng?: number | null;
  cleaned_at?: string | null;
  defect_status?: string | null;
  volume_L?: number | null;
  trash_vol_L?: number | null;
  cycle_days?: number | null;
  cri?: number | null;
  risk_reason?: string | null;
  priority_score?: number | null;
  flood_probability?: number | null;
  foot_traffic_score?: number | null;
  damage_scale?: string | null;
  created_at?: string | null;
  ml_updated_at?: string | null;
}

function statusFromCri(cri: number | null | undefined): "normal" | "warning" | "error" {
  if (cri == null) return "normal";
  if (cri >= 90) return "error";
  if (cri >= 60) return "warning";
  return "normal";
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

/** GPS 우선: 앱 실측 좌표(last_measured)가 있으면 사용 */
function effectiveLat(row: DrainageDataOut): number {
  return row.last_measured_lat ?? row.lat ?? 0;
}
function effectiveLng(row: DrainageDataOut): number {
  return row.last_measured_lng ?? row.lng ?? 0;
}

/** DrainageDataOut → StormDrainItem */
export function mapDrainageToStormDrainItem(row: DrainageDataOut): StormDrainItem {
  const lat = effectiveLat(row);
  const lng = effectiveLng(row);
  const cri = row.cri ?? undefined;
  return {
    id: row.location_id,
    name: row.name?.trim() || `빗물받이 ${row.location_id}`,
    address: row.address?.trim() || "",
    lat,
    lng,
    status: statusFromCri(row.cri ?? null),
    lastChecked: formatDate(row.cleaned_at ?? row.created_at ?? row.ml_updated_at),
    manageNo: row.location_id,
    cri,
    drainageCapacity: row.volume_L != null ? row.volume_L / 1000 : undefined,
    checkCycleDays: undefined,
    installedAt: undefined,
  };
}

/** DrainageDataOut → 상세 패널용 (DrainDetailDummy 호환) */
export function mapDrainageToDetail(row: DrainageDataOut): DrainDetailDummy {
  const lastDate = formatDate(row.cleaned_at ?? row.created_at ?? row.ml_updated_at);
  const defect = (row.defect_status ?? "").trim().toLowerCase();
  const defectiveConstruction = defect !== "" && defect !== "none";
  return {
    id: row.location_id,
    manageNo: row.location_id,
    cri: row.cri ?? 0,
    lastCleaned: lastDate ? lastDate.replace(/-/g, ".") : "—",
    recentCollectionKg: row.trash_vol_L != null ? Math.round(row.trash_vol_L * 0.1) / 10 : (row.volume_L != null ? Math.round(row.volume_L * 0.1) / 10 : 0),
    recommendedCycle: row.cycle_days != null ? `${row.cycle_days}일 이내` : (row.risk_reason ? "점검 권장" : "30일 이내"),
    defectiveConstruction,
    aiRecommendation: row.risk_reason?.trim() || "현재 데이터 기준 상태를 확인해 주세요.",
  };
}

const DEFAULT_LIMIT = 200;

/**
 * 백엔드에서 빗물받이 목록 조회 후 StormDrainItem[] 반환
 * @param baseUrl 백엔드 base URL (예: http://localhost:8001)
 */
export async function fetchStormDrainsFromBackend(
  baseUrl: string,
  limit: number = DEFAULT_LIMIT
): Promise<StormDrainItem[]> {
  const url = `${baseUrl.replace(/\/$/, "")}/drainage?limit=${limit}`;
  const res = await fetch(url, { next: { revalidate: 30 } });
  if (!res.ok) throw new Error(`drainage list failed: ${res.status}`);
  const data = (await res.json()) as DrainageDataOut[];
  return data.map(mapDrainageToStormDrainItem).filter((i) => i.lat !== 0 || i.lng !== 0);
}

/**
 * 백엔드에서 빗물받이 한 건 조회
 */
export async function fetchDrainDetailFromBackend(
  baseUrl: string,
  locationId: string
): Promise<DrainageDataOut | null> {
  const url = `${baseUrl.replace(/\/$/, "")}/drainage/${encodeURIComponent(locationId)}`;
  const res = await fetch(url, { next: { revalidate: 30 } });
  if (!res.ok) return null;
  return (await res.json()) as DrainageDataOut;
}

/**
 * Next.js API 경로로 빗물받이 목록 조회 (클라이언트/서버 공용)
 * - 503/502 또는 실패 시 null 반환 → 호출 측에서 목업 사용
 */
export async function fetchStormDrainsFromApi(
  limit: number = DEFAULT_LIMIT
): Promise<StormDrainItem[] | null> {
  try {
    const res = await fetch(`/api/drainage?limit=${limit}`);
    if (!res.ok) return null;
    const data = (await res.json()) as StormDrainItem[];
    return Array.isArray(data) && data.length > 0 ? data : null;
  } catch {
    return null;
  }
}

/**
 * Next.js API 경로로 빗물받이 상세 조회
 * - 성공 시 { item, detail }, 실패 시 null
 */
export async function fetchDrainDetailFromApi(locationId: string): Promise<{
  item: StormDrainItem;
  detail: DrainDetailDummy;
} | null> {
  try {
    const res = await fetch(`/api/drainage/${encodeURIComponent(locationId)}`);
    if (!res.ok) return null;
    return (await res.json()) as { item: StormDrainItem; detail: DrainDetailDummy };
  } catch {
    return null;
  }
}
