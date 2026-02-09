"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import type { StormDrainItem } from "@/types/storm-drain";

const LINE_COLOR = "#0ea5e9";

/** 곡선 경로 생성 (quadratic bezier) */
function createCurvedPath(
  start: { x: number; y: number },
  end: { x: number; y: number }
): string {
  const midX = (start.x + end.x) / 2;
  const midY = Math.min(start.y, end.y) - 20;
  return `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`;
}

interface RouteOverlayProps {
  mapInstance: unknown;
  mapContainerRef: React.RefObject<HTMLDivElement | null>;
  route: StormDrainItem[];
  onAnimationComplete?: () => void;
}

/**
 * 지도 위에 곡선 경로와 숫자 마커를 실시간 애니메이션으로 표시
 * map.pointFromCoord 또는 유사 API로 lat/lng → pixel 변환
 */
export default function RouteOverlay({
  mapInstance,
  mapContainerRef,
  route,
  onAnimationComplete,
}: RouteOverlayProps) {
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  const [ready, setReady] = useState(false);

  const updatePoints = useCallback(() => {
    const map = mapInstance as {
      pointFromCoord?: (coord: { lat: () => number; lng: () => number }) => { x: number; y: number };
    };
    const container = mapContainerRef.current;
    if (!map || !container || route.length === 0) return;

    const naver = (window as unknown as { naver?: { maps: { LatLng: new (lat: number, lng: number) => unknown } } }).naver;
    if (!naver?.maps?.LatLng) return;

    try {
      const pointFromCoord =
        (map as { pointFromCoord?: (c: unknown) => { x: number; y: number } }).pointFromCoord;
      if (typeof pointFromCoord !== "function") {
        // NCP API에 pointFromCoord가 없을 수 있음 → 간단한 뷰포트 기반 투영
        const rect = container.getBoundingClientRect();
        const bounds = route.reduce(
          (acc, r) => ({
            minLat: Math.min(acc.minLat, r.lat),
            maxLat: Math.max(acc.maxLat, r.lat),
            minLng: Math.min(acc.minLng, r.lng),
            maxLng: Math.max(acc.maxLng, r.lng),
          }),
          { minLat: route[0].lat, maxLat: route[0].lat, minLng: route[0].lng, maxLng: route[0].lng }
        );
        const latSpan = bounds.maxLat - bounds.minLat || 0.01;
        const lngSpan = bounds.maxLng - bounds.minLng || 0.01;
        const pad = 40;
        const w = rect.width - pad * 2;
        const h = rect.height - pad * 2;
        const pts = route.map((r) => ({
          x: pad + ((r.lng - bounds.minLng) / lngSpan) * w,
          y: pad + (1 - (r.lat - bounds.minLat) / latSpan) * h,
        }));
        setPoints(pts);
      } else {
        const pts = route.map((r) => {
          const coord = new naver.maps.LatLng(r.lat, r.lng) as { lat: () => number; lng: () => number };
          const p = pointFromCoord(coord);
          return { x: p.x, y: p.y };
        });
        setPoints(pts);
      }
      setReady(true);
    } catch (err) {
      // fallback: 간단한 투영
      const rect = container.getBoundingClientRect();
      const bounds = route.reduce(
        (acc, r) => ({
          minLat: Math.min(acc.minLat, r.lat),
          maxLat: Math.max(acc.maxLat, r.lat),
          minLng: Math.min(acc.minLng, r.lng),
          maxLng: Math.max(acc.maxLng, r.lng),
        }),
        { minLat: route[0].lat, maxLat: route[0].lat, minLng: route[0].lng, maxLng: route[0].lng }
      );
      const latSpan = bounds.maxLat - bounds.minLat || 0.01;
      const lngSpan = bounds.maxLng - bounds.minLng || 0.01;
      const pad = 40;
      const w = rect.width - pad * 2;
      const h = rect.height - pad * 2;
      setPoints(
        route.map((r) => ({
          x: pad + ((r.lng - bounds.minLng) / lngSpan) * w,
          y: pad + (1 - (r.lat - bounds.minLat) / latSpan) * h,
        }))
      );
      setReady(true);
    }
  }, [mapInstance, mapContainerRef, route]);

  useEffect(() => {
    updatePoints();
  }, [updatePoints]);

  // 지도 bounds 변경 시 재계산 (이벤트 리스너) - NCP API에 addListener가 있을 때만
  useEffect(() => {
    const map = mapInstance as { addListener?: (e: string, h: () => void) => void };
    const addListener = map?.addListener;
    if (!map || typeof addListener !== "function") return;
    const listeners: (() => void)[] = [];
    try {
      ["bounds_changed", "zoom_changed", "dragend"].forEach((ev) => {
        const h = () => updatePoints();
        addListener(ev, h);
        listeners.push(() => {
          try {
            (map as { removeListener?: (e: string, h: () => void) => void }).removeListener?.(ev, h);
          } catch {
            // ignore
          }
        });
      });
    } catch {
      // ignore
    }
    return () => listeners.forEach((f) => f());
  }, [mapInstance, updatePoints]);

  if (route.length === 0 || !ready || points.length === 0) return null;

  return (
    <svg
      className="absolute inset-0 w-full h-full"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="route-path-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={LINE_COLOR} stopOpacity="0.3" />
          <stop offset="50%" stopColor={LINE_COLOR} stopOpacity="1" />
          <stop offset="100%" stopColor={LINE_COLOR} stopOpacity="0.3" />
        </linearGradient>
      </defs>
      {/* 곡선 경로들 */}
      {points.slice(0, -1).map((start, i) => {
        const end = points[i + 1];
        const d = createCurvedPath(start, end);
        return (
          <motion.path
            key={`path-${i}`}
            d={d}
            fill="none"
            stroke="url(#route-path-gradient)"
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: i * 0.5, ease: "easeInOut" }}
            onAnimationComplete={
              i === points.length - 2 ? onAnimationComplete : undefined
            }
          />
        );
      })}
      {/* 숫자 마커 */}
      {points.map((p, i) => (
        <motion.g
          key={`marker-${i}`}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.5 + 0.3, type: "spring", stiffness: 300, damping: 20 }}
        >
          <circle cx={p.x} cy={p.y} r="14" fill={LINE_COLOR} />
          <text
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="central"
            fill="white"
            fontSize="12"
            fontWeight="bold"
          >
            {i + 1}
          </text>
        </motion.g>
      ))}
    </svg>
  );
}
