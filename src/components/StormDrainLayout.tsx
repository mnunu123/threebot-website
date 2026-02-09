"use client";

import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import SidebarNav from "@/components/SidebarNav";
import TopHeader from "@/components/TopHeader";
import MapLegend from "@/components/MapLegend";
import RightPanel from "@/components/RightPanel";
import ChatView from "@/components/ChatView";
import type { ChatMessage, ChatRoom } from "@/components/ChatView";
import ResourcesView from "./ResourcesView";
import TaskManagementView from "./TaskManagementView";
import type { FlyToFn } from "@/components/NaverMap";
import type { StormDrainItem } from "@/types/storm-drain";
import type { MainViewType } from "@/constants/main-view";
import { MOCK_STORM_DRAINS } from "@/data/mock-storm-drains";
import { getDrainIdByManageNo } from "@/data/mock-drain-detail";
import { computeOptimalRoute } from "@/lib/optimal-route";
import type { DistrictPolygon } from "@/data/district-boundaries";
import { MovingBorderButton } from "@/components/ui/moving-border-button";
import DashboardMapFilters, {
  getDefaultFilterValues,
  type MapFilterValues,
} from "@/components/DashboardMapFilters";

function genChatId() {
  return `chat-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const CHAT_STORAGE_KEY = "threebor-chat-persist";

function loadChatsFromStorage(): { chats: ChatRoom[]; selectedChatId: string | null } {
  if (typeof window === "undefined") return { chats: [], selectedChatId: null };
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return { chats: [], selectedChatId: null };
    const data = JSON.parse(raw) as { chats?: ChatRoom[]; selectedChatId?: string | null };
    const chats = Array.isArray(data.chats) ? data.chats : [];
    const selectedChatId =
      data.selectedChatId != null && chats.some((c) => c.id === data.selectedChatId)
        ? data.selectedChatId
        : chats[0]?.id ?? null;
    return { chats, selectedChatId };
  } catch {
    return { chats: [], selectedChatId: null };
  }
}

function saveChatsToStorage(chats: ChatRoom[], selectedChatId: string | null) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      CHAT_STORAGE_KEY,
      JSON.stringify({ chats, selectedChatId })
    );
  } catch {
    // ignore
  }
}

const NaverMap = dynamic(() => import("@/components/NaverMap"), { ssr: false });

const NAVER_CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID ?? "";

/** URL과 화면 매핑: /chat → chat, /resources → resources, /tasks → tasks, 그 외(/) → overview. */
function mainViewFromPathname(pathname: string | null): MainViewType {
  if (pathname === "/chat") return "chat";
  if (pathname === "/resources") return "resources";
  if (pathname === "/tasks") return "tasks";
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

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return sessionStorage.getItem("sidebarCollapsed") === "1";
    } catch {
      return false;
    }
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [chats, setChats] = useState<ChatRoom[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [optimalRoute, setOptimalRoute] = useState<StormDrainItem[] | null>(null);
  const [showDistrictBoundaries, setShowDistrictBoundaries] = useState(false);
  const [districtBoundariesData, setDistrictBoundariesData] = useState<
    DistrictPolygon[] | null
  >(null);
  const [districtBoundariesLoading, setDistrictBoundariesLoading] =
    useState(false);
  const [mapFilters, setMapFilters] = useState<MapFilterValues>(getDefaultFilterValues);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [selectedDistrictName, setSelectedDistrictName] = useState<string | null>(null);
  const flyToRef = useRef<FlyToFn | null>(null);
  /** 로드가 끝난 뒤에만 저장하도록 해서, 빈 상태로 덮어쓰지 않음 */
  const chatStorageReadyRef = useRef(false);

  /** 채팅 목록·선택 상태 localStorage 복원 (탭 전환/새로고침 후에도 유지) */
  useEffect(() => {
    const { chats: loadedChats, selectedChatId: loadedId } = loadChatsFromStorage();
    if (loadedChats.length > 0) {
      setChats(loadedChats);
      setSelectedChatId(loadedId);
    }
  }, []);

  /** 채팅이 있거나 선택이 있으면 "로드 완료"로 보고, 이후부터 저장 허용 */
  useEffect(() => {
    if (chats.length > 0 || selectedChatId !== null) {
      chatStorageReadyRef.current = true;
    }
  }, [chats.length, selectedChatId]);

  /** 채팅/선택 변경 시 localStorage 저장 (로드 후에만) */
  useEffect(() => {
    if (!chatStorageReadyRef.current) return;
    saveChatsToStorage(chats, selectedChatId);
  }, [chats, selectedChatId]);

  /** Overview 진입 시 시군구 경계 데이터 미리 로드 → 버튼 클릭 시 즉시 표시 */
  useEffect(() => {
    if (mainView !== "overview" || districtBoundariesData !== null) return;
    fetch("/api/vworld-boundaries")
      .then((res) => {
        if (!res.ok) return;
        return res.json();
      })
      .then((data: DistrictPolygon[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setDistrictBoundariesData(data);
        }
      })
      .catch(() => {});
  }, [mainView, districtBoundariesData]);

  /** 시군구 구역 표시 토글. 데이터는 미리 로드되어 있으면 즉시 반영 */
  const handleToggleDistrictBoundaries = useCallback(() => {
    if (showDistrictBoundaries) {
      setShowDistrictBoundaries(false);
      return;
    }
    if (districtBoundariesData !== null && districtBoundariesData.length > 0) {
      setShowDistrictBoundaries(true);
      return;
    }
    setDistrictBoundariesLoading(true);
    fetch("/api/vworld-boundaries")
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status}`);
        return res.json();
      })
      .then((data: DistrictPolygon[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setDistrictBoundariesData(data);
          setShowDistrictBoundaries(true);
        }
      })
      .catch(() => {})
      .finally(() => setDistrictBoundariesLoading(false));
  }, [showDistrictBoundaries, districtBoundariesData]);

  /** 필터 선택 시 해당 구역 경계만 표시. 전체 선택 시에만 '구역 표시' 버튼으로 전체 토글 */
  const effectiveDistrict =
    mapFilters.gunGu !== "전체" ? mapFilters.gunGu : mapFilters.sido;

  const districtBoundariesToShow = useMemo(() => {
    if (!districtBoundariesData?.length) return [];
    if (effectiveDistrict === "전체") {
      return showDistrictBoundaries ? districtBoundariesData : [];
    }
    const matchByName = districtBoundariesData.filter((d) => d.name === effectiveDistrict);
    if (matchByName.length > 0) return matchByName;
    if (effectiveDistrict === "서울특별시") return districtBoundariesData;
    return [];
  }, [districtBoundariesData, effectiveDistrict, showDistrictBoundaries]);

  const filteredDrainItems = useMemo(() => {
    let list = MOCK_STORM_DRAINS;
    if (effectiveDistrict !== "전체") {
      if (mapFilters.gunGu !== "전체") {
        list = list.filter((i) => i.address.includes(mapFilters.gunGu));
      } else {
        const sidoKeyword = mapFilters.sido
          .replace(/특별시|광역시|특별자치시|특별자치도$/g, "")
          .replace(/도$/g, "")
          .trim();
        list = list.filter((i) => i.address.includes(sidoKeyword));
      }
    }
    if (mapFilters.date) {
      list = list.filter((i) => i.lastChecked?.startsWith(mapFilters.date));
    }
    if (mapFilters.severity50Only) {
      list = list.filter((i) => (i.cri ?? 0) >= 50);
    }
    return list;
  }, [mapFilters, effectiveDistrict]);

  /** 실시간 필터에서 시·군·구 선택 시 해당 구역 경계만 표시 (데이터 없으면 로드) */
  useEffect(() => {
    if (mainView !== "overview" || effectiveDistrict === "전체") return;
    setShowDistrictBoundaries(true);
    if (!districtBoundariesData) {
      setDistrictBoundariesLoading(true);
      fetch("/api/vworld-boundaries")
        .then((res) => (res.ok ? res.json() : null))
        .then((data: DistrictPolygon[] | null) => {
          if (Array.isArray(data) && data.length > 0) setDistrictBoundariesData(data);
        })
        .catch(() => {})
        .finally(() => setDistrictBoundariesLoading(false));
    }
  }, [mainView, effectiveDistrict, districtBoundariesData]);

  const handleMainViewChange = useCallback(
    (view: MainViewType) => {
      if (view === "chat") {
        router.push("/chat");
        if (chats.length === 0) {
          const newChat: ChatRoom = { id: genChatId(), title: "새 채팅", messages: [] };
          setChats([newChat]);
          setSelectedChatId(newChat.id);
        }
      } else if (view === "resources") router.push("/resources");
      else if (view === "tasks") router.push("/tasks");
      else router.push("/");
    },
    [router, chats.length]
  );

  const handleSelectChat = useCallback((id: string) => {
    if (id === "new") {
      const newChat: ChatRoom = { id: genChatId(), title: "새 채팅", messages: [] };
      setChats((prev) => [...prev, newChat]);
      setSelectedChatId(newChat.id);
    } else {
      setSelectedChatId(id);
    }
  }, []);

  const activeChat = selectedChatId ? chats.find((c) => c.id === selectedChatId) ?? null : null;

  const handleUpdateChat = useCallback((chatId: string, patch: { messages?: ChatMessage[]; title?: string }) => {
    setChats((prev) =>
      prev.map((c) =>
        c.id === chatId
          ? {
              ...c,
              ...(patch.messages !== undefined && { messages: patch.messages }),
              ...(patch.title !== undefined && { title: patch.title }),
            }
          : c
      )
    );
  }, []);

  const chatListForSidebar = chats.map((c) => ({ id: c.id, title: c.title }));

  useEffect(() => {
    if (mainView === "chat" && chats.length === 0) {
      const newChat: ChatRoom = { id: genChatId(), title: "새 채팅", messages: [] };
      setChats([newChat]);
      setSelectedChatId(newChat.id);
    }
  }, [mainView, chats.length]);

  const selectedItem = selectedId
    ? MOCK_STORM_DRAINS.find((d) => d.id === selectedId) ?? null
    : null;

  const handleSelectFromList = useCallback((item: StormDrainItem) => {
    setSelectedId(item.id);
    flyToRef.current?.(item.lat, item.lng);
  }, []);

  /** 배수구 코드(AA-013 등)로 선택 후 지도 이동 */
  const handleSelectByCode = useCallback(
    (code: string) => {
      const drainId = getDrainIdByManageNo(code);
      if (!drainId) return;
      const item = MOCK_STORM_DRAINS.find((d) => d.id === drainId);
      if (item) handleSelectFromList(item);
    },
    [handleSelectFromList]
  );

  const handleSelectFromMap = useCallback((item: StormDrainItem) => {
    setSelectedId(item.id);
  }, []);

  const handleMapReady = useCallback((flyTo: FlyToFn) => {
    flyToRef.current = flyTo;
  }, []);

  const handleOptimizeRoute = useCallback(() => {
    const route = computeOptimalRoute(filteredDrainItems);
    setOptimalRoute(route);
    if (route.length > 0) {
      flyToRef.current?.(route[0].lat, route[0].lng, 14);
      route.forEach((point, i) => {
        setTimeout(() => {
          flyToRef.current?.(point.lat, point.lng, 15);
        }, (i + 1) * 800);
      });
    }
  }, [filteredDrainItems]);

  return (
    <div className="h-screen flex flex-col bg-[#e8eaed]">
      <div className="flex-1 flex min-h-0">
        <SidebarNav
          items={filteredDrainItems}
          selectedId={selectedId}
          onSelect={handleSelectFromList}
          mainView={mainView}
          onMainViewChange={handleMainViewChange}
          showDrainList={mainView === "overview"}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => {
            setSidebarCollapsed((c) => {
              const next = !c;
              try {
                sessionStorage.setItem("sidebarCollapsed", next ? "1" : "0");
              } catch {
                // ignore
              }
              return next;
            });
          }}
          chatList={chatListForSidebar}
          selectedChatId={selectedChatId}
          onSelectChat={handleSelectChat}
          onOptimizeRoute={mainView === "overview" ? handleOptimizeRoute : undefined}
        />

        {/* Chat 선택 시: Chat 전용 화면만 (상단 헤더·우측 패널 없음) */}
        {mainView === "chat" && (
          <div className="flex-1 flex flex-col min-h-0 min-w-0">
            <ChatView
              chat={activeChat}
              onUpdateChat={handleUpdateChat}
            />
          </div>
        )}

        {/* RESOURCES 선택 시: 보유자원 현황 화면 */}
        {mainView === "resources" && (
          <div className="flex-1 flex flex-col min-h-0 min-w-0">
            <ResourcesView />
          </div>
        )}

        {/* 작업관리: 스마트 작업 할당·관제·검수 */}
        {mainView === "tasks" && (
          <div className="flex-1 flex flex-col min-h-0 min-w-0">
            <TaskManagementView />
          </div>
        )}

        {/* OVERVIEW 영역: 빗물받이 현황 대시보드 (시군구 경계 포함) */}
        {mainView === "overview" && (
          <div className="flex-1 flex flex-col min-h-0 min-w-0 relative">
            <TopHeader onSearch={handleSelectByCode} drainItems={filteredDrainItems} />
            <div className="flex-1 flex min-h-0 min-w-0 relative">
              <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
                {NAVER_CLIENT_ID ? (
                  <>
                    <div className="flex-1 min-h-0 flex flex-col mx-2 mt-2 rounded-lg overflow-hidden bg-white border border-gray-200 shadow-sm">
                      <div className="px-3 py-2 border-b border-gray-200 space-y-1">
                        <p className="text-xs text-teal-600 font-medium">
                          한눈에 파악하는 도시 동맥(하수관·빗물받이) 상태
                        </p>
                        <div className="flex items-center justify-between gap-2">
                          <h2 className="font-semibold text-gray-800">빗물받이 현황</h2>
                          <MovingBorderButton
                          type="button"
                          onClick={handleToggleDistrictBoundaries}
                          disabled={districtBoundariesLoading}
                          containerClassName="!h-10 !w-36 shrink-0"
                          className="!text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                          duration={3000}
                        >
                          {districtBoundariesLoading
                            ? "불러오는 중…"
                            : showDistrictBoundaries
                              ? "시군구 구역 숨기기"
                              : "시군구 구역 표시"}
                        </MovingBorderButton>
                        <button
                          type="button"
                          onClick={() => setShowHeatmap((v) => !v)}
                          className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                            showHeatmap
                              ? "bg-red-100 text-red-700 border border-red-200"
                              : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
                          }`}
                        >
                          홍수 예상 히트맵
                        </button>
                        </div>
                      </div>
                      <DashboardMapFilters
                        value={mapFilters}
                        onChange={(v) => {
                          setMapFilters(v);
                          if (v.sido === "전체") setSelectedDistrictName(null);
                        }}
                      />
                      <div className="flex-1 min-h-[320px] relative">
                        <NaverMap
                          items={filteredDrainItems}
                          selectedId={selectedId}
                          onSelectFromMap={handleSelectFromMap}
                          onMapReady={handleMapReady}
                          route={optimalRoute}
                          districtBoundaries={districtBoundariesToShow}
                          selectedDistrictName={selectedDistrictName}
                          onDistrictClick={({ name }) => setSelectedDistrictName(name)}
                          showHeatmap={showHeatmap}
                          clientId={NAVER_CLIENT_ID}
                        />
                      </div>
                      <MapLegend />
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-500">
                    <p>.env.local에 NEXT_PUBLIC_NAVER_MAP_CLIENT_ID를 설정하세요.</p>
                  </div>
                )}
              </main>
              {selectedItem && (
                <RightPanel
                  item={selectedItem}
                  onClose={() => setSelectedId(null)}
                  onPriorityItemSelect={handleSelectByCode}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
