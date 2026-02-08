"use client";

import Script from "next/script";
import { useRef, useEffect, useCallback, useImperativeHandle, forwardRef, useMemo } from "react";
import type { StormDrainItem } from "@/types/storm-drain";

const DEFAULT_CENTER = { lat: 37.5012, lng: 127.0396 };
const DEFAULT_ZOOM = 15;

export type NaverMapHandle = {
  flyTo: (lat: number, lng: number, zoom?: number) => void;
};

declare global {
  interface Window {
    naver?: {
      maps: {
        Map: new (el: HTMLElement, options: { center: unknown; zoom: number }) => {
          setCenter: (coord: { lat: number; lng: number }) => void;
          setZoom: (zoom: number) => void;
          getCenter: () => { lat: () => number; lng: () => number };
          getZoom: () => number;
          panTo: (coord: { lat: number; lng: number }, options?: { duration?: number }) => void;
        };
        LatLng: new (lat: number, lng: number) => { lat: () => number; lng: () => number };
        Marker: new (options: { position: unknown; map: unknown; icon?: unknown; zIndex?: number }) => {
          setMap: (map: unknown | null) => void;
        };
        Event: { addListener: (target: unknown, event: string, handler: () => void) => void };
      };
    };
  }
}

export type FlyToFn = (lat: number, lng: number, zoom?: number) => void;

interface NaverMapProps {
  items: StormDrainItem[];
  selectedId: string | null;
  onSelectFromMap?: (item: StormDrainItem) => void;
  onMapReady?: (flyTo: FlyToFn) => void;
  clientId: string;
}

const NaverMap = forwardRef<NaverMapHandle, NaverMapProps>(function NaverMap(
  { items, selectedId, onSelectFromMap, onMapReady, clientId },
  ref
) {
  // Naver Maps 타입은 런타임 로드라 TS에서 정확히 잡기 어려워 any로 완화
  const mapRef = useRef<any>(null);
  const mapDivRef = useRef<HTMLDivElement>(null);
  // CRI 숫자가 보이는 커스텀 Marker(HTML icon)를 사용
  const markersRef = useRef<any[]>([]);
  const itemsRef = useRef(items);
  const onSelectRef = useRef(onSelectFromMap);
  itemsRef.current = items;
  onSelectRef.current = onSelectFromMap;

  const flyTo = useCallback((lat: number, lng: number, zoom = 16) => {
    const map = mapRef.current;
    if (!map) return;
    const naver = window.naver?.maps;
    if (!naver) return;
    (map as unknown as { panTo: (c: unknown, o?: { duration?: number }) => void }).panTo(
      new naver.LatLng(lat, lng),
      { duration: 600 }
    );
    (map as unknown as { setZoom: (z: number) => void }).setZoom(zoom);
  }, []);

  useImperativeHandle(ref, () => ({ flyTo }), [flyTo]);

  /** 지도 위에 빗물받이 마커를 항상 표시. 지도 생성 직후·items 변경 시 호출 */
  const updateMarkers = useCallback((map: any) => {
    const naver = window.naver?.maps;
    if (!naver) return;
    try {
      // 기존 마커 제거
      markersRef.current.forEach((m) => {
        try {
          if (m && typeof m.setMap === "function") m.setMap(null);
        } catch {
          // 무시
        }
      });
      markersRef.current = [];
      const list = itemsRef.current;
      const onSelect = onSelectRef.current;

      list.forEach((item) => {
        const cri = item.cri ?? 0;
        // 요청: 80 이상 빨강, 40~80 노랑, 0~40 초록
        const color = cri >= 80 ? "#ef4444" : cri >= 40 ? "#f59e0b" : "#10b981";

        const icon = {
          content: `<div style="transform:translate(-50%,-100%);display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:9999px;background:${color};color:#fff;font-weight:800;font-size:12px;line-height:1;box-shadow:0 10px 20px rgba(0,0,0,0.22);border:2px solid rgba(255,255,255,0.95);user-select:none;">${cri}</div>`,
        };

        const marker = new naver.Marker({
          position: new naver.LatLng(item.lat, item.lng),
          map,
          icon,
          zIndex: 200,
        });
        markersRef.current.push(marker);
        if (onSelect) naver.Event.addListener(marker, "click", () => onSelect(item));
      });
    } catch (err) {
      console.warn("[NaverMap] updateMarkers error:", err);
    }
  }, []);

  const initMap = useCallback(() => {
    if (!mapDivRef.current || !window.naver?.maps) return;
    try {
      const naver = window.naver.maps;
      const map = new naver.Map(mapDivRef.current, {
        center: new naver.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng),
        zoom: DEFAULT_ZOOM,
      });
      mapRef.current = map;
      updateMarkers(map);
      onMapReady?.(flyTo);
    } catch (err) {
      console.warn("[NaverMap] initMap error:", err);
    }
  }, [onMapReady, flyTo, updateMarkers]);

  useEffect(() => {
    if (!window.naver?.maps) return;
    initMap();
    return () => {
      markersRef.current = [];
      mapRef.current = null;
    };
  }, [initMap]);

  useEffect(() => {
    const map = mapRef.current;
    if (map && window.naver?.maps) {
      try {
        updateMarkers(map);
      } catch (err) {
        console.warn("[NaverMap] updateMarkers effect error:", err);
      }
    }
  }, [items, onSelectFromMap, updateMarkers]);

  // NCP 최신 API: oapi + ncpKeyId (인증 실패 시 구버전 openapi + ncpClientId 도 NCP 콘솔에서 확인)
  const scriptUrl = useMemo(
    () => `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(clientId)}`,
    [clientId]
  );

  return (
    <>
      <Script
        src={scriptUrl}
        strategy="afterInteractive"
        onLoad={() => {
          if (mapDivRef.current && window.naver?.maps) initMap();
        }}
      />
      <div ref={mapDivRef} className="h-full w-full min-h-[280px]" id="map" />
    </>
  );
});

export default NaverMap;
