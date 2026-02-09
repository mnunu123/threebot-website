import type { StormDrainItem } from "@/types/storm-drain";

/** 위도·경도 간 거리(km) - Haversine 공식 */
function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // 지구 반지름 km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * 우선 방문 리스트 + 위험도(CRI) 기반 최적 방문 동선 계산
 * - CRI 높은 순 우선 (고위험 먼저)
 * - 동일 위험 구간은 거리 최소화(가장 가까운 다음 지점)
 */
export function computeOptimalRoute(items: StormDrainItem[]): StormDrainItem[] {
  if (items.length <= 1) return [...items];

  // CRI 내림차순 정렬 (고위험 우선)
  const sorted = [...items].sort((a, b) => (b.cri ?? 0) - (a.cri ?? 0));

  const route: StormDrainItem[] = [sorted[0]];
  const remaining = new Set(sorted.slice(1));

  while (remaining.size > 0) {
    const current = route[route.length - 1];
    let nearest: StormDrainItem | null = null;
    let nearestDist = Infinity;

    remaining.forEach((item) => {
      const dist = haversineDistance(
        current.lat,
        current.lng,
        item.lat,
        item.lng
      );
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = item;
      }
    });

    if (nearest) {
      route.push(nearest);
      remaining.delete(nearest);
    } else break;
  }

  return route;
}
