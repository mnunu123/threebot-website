"use client";

import Script from "next/script";
import { useRef, useEffect, useCallback, useImperativeHandle, forwardRef, useMemo, useState } from "react";
import type { StormDrainItem } from "@/types/storm-drain";
import RouteOverlay from "@/components/RouteOverlay";

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
        Polygon: new (options: {
          map: unknown;
          paths?: unknown[][];
          path?: unknown[];
          strokeColor?: string;
          strokeWeight?: number;
          fillColor?: string;
          fillOpacity?: number;
        }) => { setMap: (map: unknown | null) => void };
        Polyline: new (options: {
          map: unknown;
          path: unknown[];
          strokeColor?: string;
          strokeWeight?: number;
        }) => { setMap: (map: unknown | null) => void };
        Event: { addListener: (target: unknown, event: string, handler: () => void) => void };
      };
    };
  }
}

export type FlyToFn = (lat: number, lng: number, zoom?: number) => void;

/** 시군구 경계 폴리곤 데이터 */
export type DistrictBoundary = {
  id: string;
  name: string;
  positions: [number, number][][]; // [lat, lng][]
};

interface NaverMapProps {
  items: StormDrainItem[];
  selectedId: string | null;
  onSelectFromMap?: (item: StormDrainItem) => void;
  onMapReady?: (flyTo: FlyToFn) => void;
  onMapInstanceReady?: (map: unknown) => void;
  route?: StormDrainItem[] | null;
  districtBoundaries?: DistrictBoundary[];
  /** 구역 클릭 시 해당 구역만 CRI 표시. null이면 전부 표시 */
  selectedDistrictName?: string | null;
  /** 구역(폴리곤) 클릭 시 콜백 */
  onDistrictClick?: (district: { id: string; name: string }) => void;
  showHeatmap?: boolean;
  clientId: string;
}

const NaverMap = forwardRef<NaverMapHandle, NaverMapProps>(function NaverMap(
  { items, selectedId, onSelectFromMap, onMapReady, onMapInstanceReady, route, districtBoundaries, selectedDistrictName = null, onDistrictClick, showHeatmap = false, clientId },
  ref
) {
  const mapRef = useRef<any>(null);
  const mapDivRef = useRef<HTMLDivElement>(null);
  const [mapReady, setMapReady] = useState(false);
  const markersRef = useRef<any[]>([]);
  const heatmapOverlaysRef = useRef<any[]>([]);
  const polygonsRef = useRef<any[]>([]);
  const itemsRef = useRef(items);
  const onSelectRef = useRef(onSelectFromMap);
  const selectedIdRef = useRef(selectedId);
  const selectedDistrictNameRef = useRef(selectedDistrictName);
  const onDistrictClickRef = useRef(onDistrictClick);
  itemsRef.current = items;
  onSelectRef.current = onSelectFromMap;
  selectedIdRef.current = selectedId;
  selectedDistrictNameRef.current = selectedDistrictName;
  onDistrictClickRef.current = onDistrictClick;

  const flyTo = useCallback((lat: number, lng: number, zoom = 16) => {
    const map = mapRef.current;
    if (!map) return;
    const naver = window.naver?.maps;
    if (!naver) return;
    const center = new naver.LatLng(lat, lng);
    const m = map as unknown as {
      panTo: (c: unknown, opts?: { duration?: number }) => void;
      setZoom: (z: number) => void;
    };
    if (typeof m.panTo === "function") {
      m.panTo(center, { duration: 400 });
      setTimeout(() => m.setZoom(zoom), 50);
    } else {
      (map as unknown as { setCenter: (c: unknown) => void }).setCenter(center);
      m.setZoom(zoom);
    }
  }, []);

  useImperativeHandle(ref, () => ({ flyTo }), [flyTo]);

  /** 지도 위에 빗물받이 마커. 구역 선택 시 해당 구역만 CRI 표시, 나머지는 작은 점만 */
  const updateMarkers = useCallback((map: any) => {
    const naver = window.naver?.maps;
    if (!naver) return;
    try {
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
      const selId = selectedIdRef.current;
      const selectedDistrict = selectedDistrictNameRef.current;
      const hasSelection = selId != null;

      list.forEach((item) => {
        const cri = item.cri ?? 0;
        const color = cri >= 80 ? "#ef4444" : cri >= 40 ? "#f59e0b" : "#10b981";
        const isSelected = item.id === selId;
        const useLarge = !hasSelection || isSelected;
        const inSelectedDistrict = !selectedDistrict || (item.address && item.address.includes(selectedDistrict));
        const showCri = inSelectedDistrict;

        const content = showCri
          ? useLarge
            ? `<div style="transform:translate(-50%,-100%);display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:9999px;background:${color};color:#fff;font-weight:800;font-size:12px;line-height:1;box-shadow:0 10px 20px rgba(0,0,0,0.22);border:2px solid rgba(255,255,255,0.95);user-select:none;cursor:pointer;">${cri}</div>`
            : `<div style="transform:translate(-50%,-100%);display:flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:9999px;background:${color};color:#fff;font-weight:700;font-size:10px;line-height:1;box-shadow:0 4px 12px rgba(0,0,0,0.2);border:1.5px solid rgba(255,255,255,0.95);user-select:none;cursor:pointer;">${cri}</div>`
          : `<div style="transform:translate(-50%,-100%);width:14px;height:14px;border-radius:9999px;background:${color};opacity:0.7;box-shadow:0 2px 6px rgba(0,0,0,0.2);border:1px solid rgba(255,255,255,0.8);user-select:none;cursor:pointer;"></div>`;

        const icon = { content };
        const zIdx = isSelected ? 300 : 200;

        const marker = new naver.Marker({
          position: new naver.LatLng(item.lat, item.lng),
          map,
          icon,
          zIndex: zIdx,
        });
        markersRef.current.push(marker);
        if (onSelect) naver.Event.addListener(marker, "click", () => onSelect(item));
      });
    } catch (err) {
      console.warn("[NaverMap] updateMarkers error:", err);
    }
  }, []);

  const showHeatmapRef = useRef(showHeatmap);
  showHeatmapRef.current = showHeatmap;

  /** 홍수 예상 지역 히트맵: CRI 50 이상인 지점에 적색 반투명 원으로 집중 구역 표시 */
  const updateHeatmap = useCallback((map: any, itemsList: StormDrainItem[], enabled: boolean) => {
    const naver = window.naver?.maps;
    if (!naver) return;
    try {
      heatmapOverlaysRef.current.forEach((o) => {
        try {
          if (o && typeof o.setMap === "function") o.setMap(null);
        } catch {
          // 무시
        }
      });
      heatmapOverlaysRef.current = [];
      if (!enabled || !itemsList.length) return;
      const radius = 80;
      const opacity = 0.22;
      itemsList.forEach((item) => {
        const cri = item.cri ?? 0;
        if (cri < 50) return;
        const content = `<div style="transform:translate(-50%,-50%);width:${radius}px;height:${radius}px;border-radius:50%;background:rgba(220,38,38,${opacity});pointer-events:none;" title="CRI ${cri}"></div>`;
        const marker = new naver.Marker({
          position: new naver.LatLng(item.lat, item.lng),
          map,
          icon: { content },
          zIndex: 50,
        });
        heatmapOverlaysRef.current.push(marker);
      });
    } catch (err) {
      console.warn("[NaverMap] updateHeatmap error:", err);
    }
  }, []);

  /** 시군구 경계 폴리곤 + 구역명 라벨. 빈 배열이면 기존 오버레이 전부 제거 */
  const updateDistrictPolygons = useCallback(
    (map: any) => {
      const naver = window.naver?.maps;
      if (!naver) return;
      try {
        polygonsRef.current.forEach((p) => {
          try {
            if (p && typeof p.setMap === "function") p.setMap(null);
          } catch {
            // 무시
          }
        });
        polygonsRef.current = [];
        if (!districtBoundaries?.length) return;
        const DISTRICT_COLORS = [
          { fill: "#60a5fa", stroke: "#3b82f6" },
          { fill: "#34d399", stroke: "#10b981" },
          { fill: "#a78bfa", stroke: "#8b5cf6" },
          { fill: "#fb923c", stroke: "#ea580c" },
          { fill: "#f472b6", stroke: "#db2777" },
          { fill: "#22d3ee", stroke: "#06b6d4" },
        ];
        districtBoundaries.forEach((district, idx) => {
          const colors = DISTRICT_COLORS[idx % DISTRICT_COLORS.length];
          const pathsForDistrict: typeof naver.LatLng[][] = [];
          district.positions.forEach((ring) => {
            const path = ring.map(([lat, lng]) => new naver.LatLng(lat, lng));
            if (path.length < 2) return;
            pathsForDistrict.push(path);
            if (naver.Polygon) {
              try {
                const polygon = new naver.Polygon({
                  map,
                  paths: [path],
                  strokeColor: colors.stroke,
                  strokeWeight: 2,
                  fillColor: colors.fill,
                  fillOpacity: 0.18,
                });
                polygonsRef.current.push(polygon);
                const cb = onDistrictClickRef.current;
                if (cb) {
                  naver.Event.addListener(polygon, "click", () =>
                    cb({ id: district.id, name: district.name })
                  );
                }
              } catch {
                if (naver.Polyline) {
                  const polyline = new naver.Polyline({
                    map,
                    path,
                    strokeColor: colors.stroke,
                    strokeWeight: 3,
                  });
                  polygonsRef.current.push(polyline);
                }
              }
            } else if (naver.Polyline) {
              const polyline = new naver.Polyline({
                map,
                path,
                strokeColor: colors.stroke,
                strokeWeight: 3,
              });
              polygonsRef.current.push(polyline);
            }
          });
          if (pathsForDistrict.length > 0 && district.name) {
            const firstRing = district.positions[0];
            const centroidLat = firstRing.reduce((s, [lat]) => s + lat, 0) / firstRing.length;
            const centroidLng = firstRing.reduce((s, [, lng]) => s + lng, 0) / firstRing.length;
            const labelContent = `<div style="transform:translate(-50%,-50%);padding:4px 10px;background:rgba(0,0,0,0.6);color:white;font-size:13px;font-weight:600;border-radius:4px;white-space:nowrap;pointer-events:none;">${district.name}</div>`;
            const labelMarker = new naver.Marker({
              position: new naver.LatLng(centroidLat, centroidLng),
              map,
              icon: { content: labelContent },
              zIndex: 100,
            });
            polygonsRef.current.push(labelMarker);
          }
        });
      } catch (err) {
        console.warn("[NaverMap] updateDistrictPolygons error:", err);
      }
    },
    [districtBoundaries]
  );

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
      updateDistrictPolygons(map);
      updateHeatmap(map, itemsRef.current, showHeatmapRef.current);
      onMapReady?.(flyTo);
      onMapInstanceReady?.(map);
      setMapReady(true);
    } catch (err) {
      console.warn("[NaverMap] initMap error:", err);
    }
  }, [onMapReady, onMapInstanceReady, flyTo, updateMarkers, updateDistrictPolygons, updateHeatmap]);

  useEffect(() => {
    if (!window.naver?.maps) return;
    initMap();
    return () => {
      markersRef.current = [];
      heatmapOverlaysRef.current = [];
      polygonsRef.current = [];
      mapRef.current = null;
      setMapReady(false);
    };
  }, [initMap]);

  useEffect(() => {
    const map = mapRef.current;
    if (map && window.naver?.maps) {
      try {
        const m = map as unknown as { getCenter: () => { lat: () => number; lng: () => number }; getZoom: () => number; setCenter: (c: unknown) => void; setZoom: (z: number) => void };
        const prevCenter = m.getCenter?.();
        const prevZoom = typeof m.getZoom === "function" ? m.getZoom() : undefined;
        const savedCenter = prevCenter ? { lat: prevCenter.lat(), lng: prevCenter.lng() } : null;
        const savedZoom = typeof prevZoom === "number" ? prevZoom : null;

        updateMarkers(map);
        updateDistrictPolygons(map);
        updateHeatmap(map, items, showHeatmap);

        if (savedCenter != null && savedZoom != null) {
          const naver = window.naver?.maps;
          if (naver) {
            m.setCenter(new naver.LatLng(savedCenter.lat, savedCenter.lng));
            m.setZoom(savedZoom);
          }
        }
      } catch (err) {
        console.warn("[NaverMap] updateMarkers effect error:", err);
      }
    }
  }, [items, selectedId, selectedDistrictName, showHeatmap, onSelectFromMap, updateMarkers, updateDistrictPolygons, updateHeatmap]);

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
      <div className="relative h-full w-full min-h-[280px]">
        <div ref={mapDivRef} className="absolute inset-0" id="map" />
        {mapReady && route && route.length > 0 && (
          <div className="absolute inset-0 z-10 pointer-events-none">
            <RouteOverlay
              mapInstance={mapRef.current}
              mapContainerRef={mapDivRef}
              route={route}
            />
          </div>
        )}
      </div>
    </>
  );
});

export default NaverMap;
