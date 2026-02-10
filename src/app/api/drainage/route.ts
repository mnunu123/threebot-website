import { NextRequest, NextResponse } from "next/server";
import { fetchStormDrainsFromBackend } from "@/lib/drainage-api";

function getBackendUrl(): string | null {
  return process.env.BACKEND_API_URL ?? null;
}

/**
 * GET /api/drainage?limit=200
 * 백엔드 빗물받이 목록을 프록시하고 StormDrainItem[] 형태로 반환
 */
export async function GET(request: NextRequest) {
  const baseUrl = getBackendUrl();
  if (!baseUrl) {
    return NextResponse.json(
      { error: "BACKEND_API_URL not configured" },
      { status: 503 }
    );
  }
  try {
    const limit = Math.min(
      Math.max(1, Number(request.nextUrl.searchParams.get("limit") ?? 200)),
      200
    );
    const items = await fetchStormDrainsFromBackend(baseUrl, limit);
    return NextResponse.json(items);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: message },
      { status: 502 }
    );
  }
}
