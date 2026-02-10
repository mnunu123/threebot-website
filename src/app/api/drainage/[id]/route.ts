import { NextRequest, NextResponse } from "next/server";
import {
  fetchDrainDetailFromBackend,
  mapDrainageToStormDrainItem,
  mapDrainageToDetail,
} from "@/lib/drainage-api";

function getBackendUrl(): string | null {
  return process.env.BACKEND_API_URL ?? null;
}

/**
 * GET /api/drainage/[id]
 * 백엔드에서 해당 빗물받이 상세 조회 후 목록용·상세용 모두 반환
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const baseUrl = getBackendUrl();
  if (!baseUrl) {
    return NextResponse.json(
      { error: "BACKEND_API_URL not configured" },
      { status: 503 }
    );
  }
  const { id: locationId } = await params;
  if (!locationId) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  try {
    const row = await fetchDrainDetailFromBackend(baseUrl, locationId);
    if (!row) {
      return NextResponse.json(null, { status: 404 });
    }
    return NextResponse.json({
      item: mapDrainageToStormDrainItem(row),
      detail: mapDrainageToDetail(row),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: message },
      { status: 502 }
    );
  }
}
