import { NextRequest, NextResponse } from "next/server";
import { fetchSeoulDistrictBoundaries } from "@/lib/vworld-boundaries";

/**
 * GET /api/vworld-boundaries
 * 브이월드 API로 서울 시군구 경계 조회 후 WGS84(EPSG:4326)로 변환해 반환
 */
export async function GET(request: NextRequest) {
  try {
    const host = request.headers.get("host");
    const protocol = request.headers.get("x-forwarded-proto") ?? "http";
    const domain = host ? `${protocol}://${host}` : process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const boundaries = await fetchSeoulDistrictBoundaries(domain);
    return NextResponse.json(boundaries);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
