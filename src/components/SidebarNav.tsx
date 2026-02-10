"use client";

import { useMemo, useState } from "react";
import type { StormDrainItem } from "@/types/storm-drain";
import type { MainViewType } from "@/constants/main-view";
import {
  MOCK_CHAT_LIST,
  MOCK_CONVERSATION_SUMMARIES,
  type ChatListItem,
  type ConversationSummaryItem,
} from "@/data/mock-chat-history";
import { MOCK_DRAIN_DETAIL } from "@/data/mock-drain-detail";
import Dock from "@/components/ui/dock";
import {
  LayoutDashboard,
  MessageCircle,
  Truck,
  ClipboardList,
  Settings,
} from "lucide-react";
import { NeonButton } from "@/components/ui/neon-button";

/** 주소에서 시 단위 추출 후 표준명 반환 (예: "서울시" → "서울특별시") */
function getCityFromAddress(address: string): string {
  const match = address.match(/(\S+시)/);
  const raw = match ? match[1] : "기타";
  const normalize: Record<string, string> = {
    서울시: "서울특별시",
    부산시: "부산광역시",
    대구시: "대구광역시",
    인천시: "인천광역시",
    광주시: "광주광역시",
    대전시: "대전광역시",
    울산시: "울산광역시",
  };
  return normalize[raw] ?? raw;
}

/** 주소에서 군/구 단위 추출 (예: "서울시 강남구 테헤란로" → "강남구") */
function getDistrictFromAddress(address: string): string {
  const match = address.match(/(\S+[군구])/);
  return match ? match[1] : "기타";
}

/** 지도 마커와 동일: CRI 80 이상 빨강, 40~80 노랑, 40 미만 초록 */
function getMarkerColorClass(item: { cri?: number; status?: string }, detail?: { cri: number } | null): string {
  const cri = item.cri ?? detail?.cri ?? 0;
  if (cri >= 80) return "bg-red-500";
  if (cri >= 40) return "bg-amber-500";
  return "bg-emerald-500";
}

/** 긴급도별 카드 스타일: 배경·보더로 시각적 우선순위 */
function getPriorityCardClass(
  item: { cri?: number },
  detail?: { cri: number } | null,
  isSelected: boolean
): string {
  const cri = item.cri ?? detail?.cri ?? 0;
  const base = "w-full rounded-xl text-left transition-all border-l-4 ";
  if (isSelected) {
    return base + "bg-teal-600/70 text-white border-teal-400 shadow-md";
  }
  if (cri >= 80) {
    return base + "bg-red-500/10 border-red-500 text-gray-200 hover:bg-red-500/20";
  }
  if (cri >= 40) {
    return base + "bg-amber-500/10 border-amber-500 text-gray-200 hover:bg-amber-500/20";
  }
  return base + "bg-emerald-500/10 border-emerald-500 text-gray-200 hover:bg-emerald-500/20";
}

/** 햄버거 메뉴 아이콘 (세 줄) - 사이드바 접기/펼치기용 */
function HamburgerIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  );
}

/** 사이드바 네비: Gemini 스타일. 상단 햄버거로 접기/펼치기, 새 채팅/내 항목, 채팅 목록, 하단 대화 이력 요약 */
export default function SidebarNav({
  items,
  selectedId,
  onSelect,
  mainView,
  onMainViewChange,
  showDrainList = true,
  collapsed = false,
  onToggleCollapse,
  chatList = MOCK_CHAT_LIST,
  selectedChatId = null,
  onSelectChat,
  conversationSummaries = MOCK_CONVERSATION_SUMMARIES,
  onOptimizeRoute,
}: {
  items: StormDrainItem[];
  selectedId: string | null;
  onSelect: (item: StormDrainItem) => void;
  mainView: MainViewType;
  onMainViewChange: (view: MainViewType) => void;
  showDrainList?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  chatList?: ChatListItem[];
  selectedChatId?: string | null;
  onSelectChat?: (id: string) => void;
  conversationSummaries?: ConversationSummaryItem[];
  onOptimizeRoute?: () => void;
}) {
  /** 시 → 군/구 → 항목 2단계 그룹 (최상위: 서울특별시, 부산광역시 등) */
  const groupedByCityThenDistrict = useMemo(() => {
    const cityMap = new Map<string, Map<string, StormDrainItem[]>>();
    items.forEach((item) => {
      const city = getCityFromAddress(item.address);
      const district = getDistrictFromAddress(item.address);
      if (!cityMap.has(city)) cityMap.set(city, new Map());
      const districtMap = cityMap.get(city)!;
      if (!districtMap.has(district)) districtMap.set(district, []);
      districtMap.get(district)!.push(item);
    });
    cityMap.forEach((districtMap) => {
      districtMap.forEach((list) => list.sort((a, b) => (b.cri ?? 0) - (a.cri ?? 0)));
    });
    const cityEntries = Array.from(cityMap.entries()).sort(([a], [b]) => a.localeCompare(b));
    return cityEntries.map(([city, districtMap]) => {
      const districtEntries = Array.from(districtMap.entries()).sort(([a], [b]) => a.localeCompare(b));
      return [city, districtEntries] as const;
    });
  }, [items]);

  const [collapsedCities, setCollapsedCities] = useState<Set<string>>(new Set());
  const [collapsedDistricts, setCollapsedDistricts] = useState<Set<string>>(new Set());

  const isCityExpanded = (key: string) => !collapsedCities.has(key);
  const isDistrictExpanded = (key: string) => !collapsedDistricts.has(key);
  const toggleCity = (key: string) => {
    setCollapsedCities((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };
  const toggleDistrict = (key: string) => {
    setCollapsedDistricts((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const navItemClass = (view: MainViewType) =>
    `flex items-center gap-3 py-2.5 rounded-lg w-full text-left transition-colors ${
      collapsed ? "justify-center px-0" : "px-3"
    } ${
      mainView === view
        ? "bg-blue-600/80 text-white"
        : "text-gray-400 hover:bg-white/5 hover:text-white"
    }`;

  const btnBase =
    "flex items-center gap-3 py-2.5 rounded-lg w-full text-left transition-colors text-gray-400 hover:bg-white/5 hover:text-white";

  return (
    <aside
      role="navigation"
      aria-label="메인 메뉴"
      className={`shrink-0 flex flex-col bg-[#1a1d24] text-white min-h-0 transition-[width] duration-200 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* 상단: 햄버거(접기/펼치기) + 로고 */}
      <div
        className={`border-b border-white/10 flex items-center gap-2 ${
          collapsed ? "justify-center py-3 px-0" : "p-3"
        }`}
      >
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
            title={collapsed ? "사이드바 펼치기" : "사이드바 접기"}
            aria-label={collapsed ? "사이드바 펼치기" : "사이드바 접기"}
          >
            <HamburgerIcon className="w-5 h-5" />
          </button>
        )}
        {!collapsed && (
          <h1 className="font-bold text-base tracking-tight truncate">
            NOVA ROBOTICS
          </h1>
        )}
      </div>

      {/* 메인 네비: 새 Dock (호버 시 확대·툴팁, 활성 인디케이터) / 접힌 상태는 아이콘 버튼 */}
      {collapsed ? (
        <nav className="p-2 space-y-0.5">
          <button
            type="button"
            onClick={() => onMainViewChange("overview")}
            className={navItemClass("overview")}
            title="Overview"
          >
            <LayoutDashboard className="w-5 h-5 shrink-0" />
          </button>
          <button
            type="button"
            onClick={() => onMainViewChange("chat")}
            className={navItemClass("chat")}
            title="Chat"
          >
            <MessageCircle className="w-5 h-5 shrink-0" />
          </button>
          <button
            type="button"
            onClick={() => onMainViewChange("resources")}
            className={navItemClass("resources")}
            title="자원현황"
          >
            <Truck className="w-5 h-5 shrink-0" />
          </button>
          <button
            type="button"
            onClick={() => onMainViewChange("tasks")}
            className={navItemClass("tasks")}
            title="작업관리"
          >
            <ClipboardList className="w-5 h-5 shrink-0" />
          </button>
          <button
            type="button"
            className={`${btnBase} justify-center px-0`}
            title="Settings"
          >
            <Settings className="w-5 h-5 shrink-0" />
          </button>
        </nav>
      ) : (
        <nav className="shrink-0 flex justify-center pt-2 pb-2 overflow-y-auto [--background:0_0%_10%] [--primary:173_80%_45%]">
          <Dock
            direction="vertical"
            className="dock-sidebar py-1 [&_.rounded-2xl]:bg-white/10 [&_.rounded-2xl]:border-white/20"
            activeLabel={
              mainView === "overview"
                ? "Overview"
                : mainView === "chat"
                  ? "Chat"
                  : mainView === "resources"
                    ? "자원현황"
                    : mainView === "tasks"
                      ? "작업관리"
                      : null
            }
            items={[
              {
                icon: LayoutDashboard,
                label: "Overview",
                onClick: () => onMainViewChange("overview"),
              },
              {
                icon: MessageCircle,
                label: "Chat",
                onClick: () => onMainViewChange("chat"),
              },
              {
                icon: Truck,
                label: "자원현황",
                onClick: () => onMainViewChange("resources"),
              },
              {
                icon: ClipboardList,
                label: "작업관리",
                onClick: () => onMainViewChange("tasks"),
              },
              { icon: Settings, label: "Settings" },
            ]}
          />
        </nav>
      )}

      {/* 새 채팅, 내 항목 - Settings 아래, Chat 화면에서만 표시 */}
      {!collapsed && mainView === "chat" && (
        <div className="p-2 space-y-0.5 border-t border-white/10">
          <button
            type="button"
            className={`${btnBase} px-3`}
            onClick={() => onSelectChat?.("new")}
            title="새 채팅"
          >
            <span className="w-5 h-5 grid place-items-center text-sm shrink-0" aria-hidden>✎</span>
            <span>새 채팅</span>
          </button>
          <button type="button" className={`${btnBase} px-3`} title="내 항목">
            <span className="w-5 h-5 grid place-items-center text-sm shrink-0" aria-hidden>★</span>
            <span>내 항목</span>
          </button>
        </div>
      )}

      {/* 채팅 목록 (Chat 선택 시만, 펼침 시만) */}
      {mainView === "chat" && showDrainList === false && !collapsed && (
        <div className="flex-1 min-h-0 flex flex-col border-t border-white/10 overflow-hidden">
          <div className="p-2 pt-3 px-3">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              채팅
            </h2>
          </div>
          <ul className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5 min-h-0">
            {chatList.map((chat) => (
              <li key={chat.id}>
                <button
                  type="button"
                  onClick={() => onSelectChat?.(chat.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors truncate ${
                    selectedChatId === chat.id
                      ? "bg-blue-600/60 text-white"
                      : "text-gray-300 hover:bg-white/5"
                  }`}
                >
                  {chat.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 우선 방문 리스트 (Overview 선택 시) - 군/구 단위 토글로 계층 표시 */}
      {showDrainList && !collapsed && (
        <div className="flex-1 min-h-0 flex flex-col border-t border-white/10 mt-2 overflow-hidden">
          <div className="p-2 pt-3">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">
              우선 방문 리스트
            </h2>
            <p className="text-xs text-gray-500 px-2 mb-2">시 → 군·구 단위 펼치기/접기 · 클릭 시 지도 이동</p>
          </div>
          {onOptimizeRoute && (
            <div className="px-2 pb-3">
              <NeonButton
                type="button"
                onClick={onOptimizeRoute}
                variant="solid"
                size="default"
                className="w-full text-sm font-semibold"
              >
                최적 동선 분석
              </NeonButton>
            </div>
          )}
          <ul className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
            {groupedByCityThenDistrict.map(([city, districtEntries]) => {
              const cityExpanded = isCityExpanded(city);
              const cityItemCount = districtEntries.reduce((s, [, list]) => s + list.length, 0);
              const cityMaxCri = Math.max(
                ...districtEntries.flatMap(([, list]) => list.map((i) => i.cri ?? 0))
              );
              const cityColor = cityMaxCri >= 80 ? "bg-red-500" : cityMaxCri >= 40 ? "bg-amber-500" : "bg-emerald-500";
              return (
                <li key={city}>
                  <button
                    type="button"
                    onClick={() => toggleCity(city)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm font-semibold text-gray-100 hover:bg-white/10 transition-colors"
                  >
                    <span className="shrink-0 w-4 text-gray-500" aria-hidden>
                      {cityExpanded ? "▼" : "▶"}
                    </span>
                    <span className={`shrink-0 w-2.5 h-2.5 rounded-full ${cityColor}`} aria-hidden />
                    <span className="truncate">{city}</span>
                    <span className="shrink-0 text-xs text-gray-500">({cityItemCount})</span>
                  </button>
                  {cityExpanded && (
                    <ul className="mt-1 ml-3 space-y-1 border-l border-white/10 pl-2">
                      {districtEntries.map(([districtKey, districtItems]) => {
                        const districtFullKey = `${city}|${districtKey}`;
                        const districtExpanded = isDistrictExpanded(districtFullKey);
                        const maxCri = Math.max(...districtItems.map((i) => i.cri ?? 0));
                        const markerColor = maxCri >= 80 ? "bg-red-500" : maxCri >= 40 ? "bg-amber-500" : "bg-emerald-500";
                        return (
                          <li key={districtFullKey}>
                            <button
                              type="button"
                              onClick={() => toggleDistrict(districtFullKey)}
                              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-xs font-medium text-gray-300 hover:bg-white/10 transition-colors"
                            >
                              <span className="shrink-0 w-3 text-gray-500" aria-hidden>
                                {districtExpanded ? "▼" : "▶"}
                              </span>
                              <span className={`shrink-0 w-2 h-2 rounded-full ${markerColor}`} aria-hidden />
                              <span className="truncate">{districtKey}</span>
                              <span className="shrink-0 text-[10px] text-gray-500">({districtItems.length})</span>
                            </button>
                            {districtExpanded && (
                              <ul className="mt-1 ml-4 space-y-2 border-l border-white/10 pl-2">
                                {districtItems.map((item) => {
                                  const detail = MOCK_DRAIN_DETAIL[item.id];
                                  const code = detail?.manageNo ?? item.id;
                                  const cri = item.cri ?? detail?.cri ?? 0;
                                  const itemColor = getMarkerColorClass(item, detail);
                                  const isSelected = selectedId === item.id;
                                  return (
                                    <li key={item.id}>
                                      <button
                                        type="button"
                                        onClick={() => onSelect(item)}
                                        className={getPriorityCardClass(item, detail, isSelected)}
                                      >
                                        <div className="flex items-center gap-2.5 px-3 py-2.5">
                                          <span className={`shrink-0 w-2.5 h-2.5 rounded-full ${itemColor}`} aria-hidden />
                                          <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <span className="text-sm font-semibold truncate">{code}</span>
                                              <span
                                                className={`shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded ${
                                                  isSelected ? "bg-white/20" : "bg-white/10 text-gray-300"
                                                }`}
                                              >
                                                CRI {cri}
                                              </span>
                                            </div>
                                            <div
                                              className={`text-xs mt-0.5 truncate ${
                                                isSelected ? "text-white/90" : "text-gray-500"
                                              }`}
                                            >
                                              {item.address}
                                            </div>
                                          </div>
                                        </div>
                                      </button>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* 하단: 대화 이력 요약 (Chat 탭에서만 표시) */}
      {!collapsed && mainView === "chat" && (
        <div className="border-t border-white/10 p-3 shrink-0">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            대화 이력 요약
          </h2>
          <ul className="space-y-1.5">
            {conversationSummaries.slice(0, 5).map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="w-full text-left text-xs text-gray-400 hover:text-white transition-colors truncate block py-0.5"
                >
                  <span className="line-clamp-2">{item.summary}</span>
                  {item.dateLabel && (
                    <span className="text-gray-500 text-[10px] mt-0.5 block">
                      {item.dateLabel}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}
