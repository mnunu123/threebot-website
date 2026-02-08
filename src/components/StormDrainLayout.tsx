"use client";

import { useRef, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import SidebarNav from "@/components/SidebarNav";
import TopHeader from "@/components/TopHeader";
import MapLegend from "@/components/MapLegend";
import RegionalRiskChart from "@/components/RegionalRiskChart";
import RightPanel from "@/components/RightPanel";
import ChatView from "@/components/ChatView";
import ResourcesView from "./ResourcesView";
import type { FlyToFn } from "@/components/NaverMap";
import type { StormDrainItem } from "@/types/storm-drain";
import type { MainViewType } from "@/constants/main-view";
import { MOCK_STORM_DRAINS } from "@/data/mock-storm-drains";

const NaverMap = dynamic(() => import("@/components/NaverMap"), { ssr: false });

const NAVER_CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID ?? "";

/** URL과 화면 매핑: /chat → chat, /resources → resources, 그 외(/) → overview. */
function mainViewFromPathname(pathname: string | null): MainViewType {
  if (pathname === "/chat") return "chat";
  if (pathname === "/resources") return "resources";
  return "overview";
}

/**
 * 메인 레이아웃: mainView 는 URL(pathname) 기준으로 결정
 * - overview: / (빗물받이 현황 대시보드)
 * - chat: /chat (ChatView)
 * F5 새로고침 시 pathname 이 유지되므로 보고 있던 화면이 그대로 유지됩니다.
 */
export default function StormDrainLayout() {
  const pathname = usePathname();
  const router = useRouter();
  const mainView = mainViewFromPathname(pathname);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const flyToRef = useRef<FlyToFn | null>(null);

  const handleMainViewChange = useCallback(
    (view: MainViewType) => {
      if (view === "chat") router.push("/chat");
      else if (view === "resources") router.push("/resources");
      else router.push("/");
    },
    [router]
  );

  const selectedItem = selectedId
    ? MOCK_STORM_DRAINS.find((d) => d.id === selectedId) ?? null
    : null;

  const handleSelectFromList = useCallback((item: StormDrainItem) => {
    setSelectedId(item.id);
    flyToRef.current?.(item.lat, item.lng);
  }, []);

  const handleSelectFromMap = useCallback((item: StormDrainItem) => {
    setSelectedId(item.id);
  }, []);

  const handleMapReady = useCallback((flyTo: FlyToFn) => {
    flyToRef.current = flyTo;
  }, []);

  return (
    <div className="h-screen flex flex-col bg-[#e8eaed]">
      <div className="flex-1 flex min-h-0">
        <SidebarNav
          items={MOCK_STORM_DRAINS}
          selectedId={selectedId}
          onSelect={handleSelectFromList}
          mainView={mainView}
          onMainViewChange={handleMainViewChange}
          showDrainList={mainView === "overview"}
        />

        {/* Chat 선택 시: Chat 전용 화면만 (상단 헤더·우측 패널 없음) */}
        {mainView === "chat" && (
          <div className="flex-1 flex flex-col min-h-0 min-w-0">
            <ChatView />
          </div>
        )}

        {/* RESOURCES 선택 시: 보유자원 현황 화면 */} 
        {mainView === "resources" && (
          <div className="flex-1 flex flex-col min-h-0 min-w-0">
            <ResourcesView />
          </div>
        )}

        {/* OVERVIEW 영역: 빗물받이 현황 대시보드 */}
        {mainView === "overview" && (
          <div className="flex-1 flex flex-col min-h-0 min-w-0">
            <TopHeader />
            <div className="flex-1 flex min-h-0">
              <main className="flex-1 flex flex-col min-h-0 min-w-0">
                {NAVER_CLIENT_ID ? (
                  <>
                    <div className="flex-1 min-h-0 flex flex-col mx-2 mt-2 rounded-lg overflow-hidden bg-white border border-gray-200 shadow-sm">
                      <div className="px-3 py-2 border-b border-gray-200">
                        <h2 className="font-semibold text-gray-800">빗물받이 현황</h2>
                      </div>
                      <div className="flex-1 min-h-[280px] relative">
                        <NaverMap
                          items={MOCK_STORM_DRAINS}
                          selectedId={selectedId}
                          onSelectFromMap={handleSelectFromMap}
                          onMapReady={handleMapReady}
                          clientId={NAVER_CLIENT_ID}
                        />
                      </div>
                      <MapLegend />
                    </div>
                    <RegionalRiskChart />
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-500">
                    <p>.env.local에 NEXT_PUBLIC_NAVER_MAP_CLIENT_ID를 설정하세요.</p>
                  </div>
                )}
              </main>
              <RightPanel item={selectedItem} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
