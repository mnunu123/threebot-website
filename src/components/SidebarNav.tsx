"use client";

import type { StormDrainItem } from "@/types/storm-drain";
import type { MainViewType } from "@/constants/main-view";

const statusColors = {
  normal: "bg-emerald-500",
  warning: "bg-amber-500",
  error: "bg-red-500",
};

/** 사이드바 네비: mainView / onMainViewChange 로 Overview vs Chat 구분 (나중에 자원현황 등 추가 가능) */
export default function SidebarNav({
  items,
  selectedId,
  onSelect,
  mainView,
  onMainViewChange,
  showDrainList = true,
}: {
  items: StormDrainItem[];
  selectedId: string | null;
  onSelect: (item: StormDrainItem) => void;
  mainView: MainViewType;
  onMainViewChange: (view: MainViewType) => void;
  showDrainList?: boolean;
}) {
  const navItemClass = (view: MainViewType) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-left transition-colors ${
      mainView === view ? "bg-teal-600/80 text-white" : "text-gray-400 hover:bg-white/5 hover:text-white"
    }`;

  return (
    <aside className="w-60 shrink-0 flex flex-col bg-[#1a1d24] text-white min-h-0">
      <div className="p-4 border-b border-white/10">
        <h1 className="font-bold text-lg tracking-tight">NOVA ROBOTICS</h1>
      </div>
      <nav className="p-2 space-y-0.5">
        <button type="button" onClick={() => onMainViewChange("overview")} className={navItemClass("overview")}>
          <span className="w-5 h-5 grid place-items-center text-sm" aria-hidden>▦</span>
          <span>Overview</span>
        </button>
        <button type="button" onClick={() => onMainViewChange("chat")} className={navItemClass("chat")}>
          <span className="w-5 h-5 grid place-items-center text-sm" aria-hidden>💬</span>
          <span>Chat</span>
        </button>
        <button type="button" onClick={() => onMainViewChange("resources")} className={navItemClass("resources")}>
          <span className="w-5 h-5 grid place-items-center text-sm" aria-hidden>🚗</span>
          <span>자원현황</span>
        </button>
        <button type="button" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-colors w-full text-left">
          <span className="w-5 h-5 grid place-items-center text-sm" aria-hidden>⚙</span>
          <span>Settings</span>
        </button>
      </nav>
      {showDrainList && (
        <div className="flex-1 min-h-0 flex flex-col border-t border-white/10 mt-2">
        <div className="p-2 pt-3">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">빗물받이 목록</h2>
          <p className="text-xs text-gray-500 px-2 mb-2">클릭 시 지도에서 해당 위치로 이동</p>
        </div>
        <ul className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelect(item)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors ${
                  selectedId === item.id ? "bg-teal-600/60 text-white" : "text-gray-300 hover:bg-white/5"
                }`}
              >
                <span className={`shrink-0 w-2.5 h-2.5 rounded-full ${statusColors[item.status]}`} aria-hidden />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{item.name}</div>
                  <div className="text-xs text-gray-500 truncate">{item.address}</div>
                </div>
              </button>
            </li>
          ))}
        </ul>
        </div>
      )}
    </aside>
  );
}
