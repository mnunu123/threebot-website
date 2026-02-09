"use client";

import { useState, useMemo } from "react";
import type { StormDrainItem } from "@/types/storm-drain";

/** 강수 확률에 따른 아이콘: 0 → 맑음, 1~50 → 구름, 51+ → 비 */
function RainIcon({ percent }: { percent: number }) {
  if (percent >= 51) {
    return (
      <svg className="w-5 h-5 text-blue-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        <path d="M7 14c0-2.76 2.24-5 5-5s5 2.24 5 5-2.24 5-5 5" />
        <path d="M12 14v4M9 17l3-3 3 3" />
      </svg>
    );
  }
  if (percent >= 1) {
    return (
      <svg className="w-5 h-5 text-gray-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
      </svg>
    );
  }
  return (
    <svg className="w-5 h-5 text-amber-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

/** 값(0~1)에 비례하는 미니 막대 높이 */
function MiniBar({ value, max = 1 }: { value: number; max?: number }) {
  const h = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="w-1.5 bg-gray-200 rounded-full overflow-hidden h-8 flex flex-col justify-end" title={`${value}mm`}>
      <div className="w-full bg-teal-500 rounded-full transition-all" style={{ height: `${h}%` }} />
    </div>
  );
}

/** items 기준 전체·청소필요·작업완료 개수 (헤더용) */
function useDrainCounts(items: StormDrainItem[] | undefined) {
  return useMemo(() => {
    if (!items?.length) return null;
    const total = items.length;
    const needCleaning = items.filter((i) => i.status === "warning" || i.status === "error").length;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const completed = items.filter((i) => {
      if (!i.lastChecked) return false;
      return new Date(i.lastChecked) >= sevenDaysAgo;
    }).length;
    return { total, needCleaning, completed };
  }, [items]);
}

/**
 * 상단: 1주일 강수량 타임라인(아이콘+미니 차트) + 전체/청소필요/작업완료 개수 + 배수구 검색
 */
export default function TopHeader({
  onSearch,
  drainItems,
}: {
  onSearch?: (code: string) => void;
  drainItems?: StormDrainItem[];
}) {
  const [searchValue, setSearchValue] = useState("");
  const counts = useDrainCounts(drainItems);

  const days = [
    { label: "오늘", value: 2.3, am: 0, pm: 0 },
    { label: "내일", value: 2.0, am: 20, pm: 20 },
    { label: "목", value: 2.0, am: 20, pm: 20 },
    { label: "금", value: 2.0, am: 20, pm: 20 },
    { label: "토", value: 0.5, am: 10, pm: 10 },
    { label: "일", value: 0, am: 0, pm: 0 },
  ];
  const maxRain = Math.max(...days.map((d) => d.value), 1);

  const handleSearch = () => {
    const code = searchValue.trim();
    if (code && onSearch) onSearch(code);
  };

  return (
    <header className="shrink-0 min-h-14 px-4 py-2 flex flex-wrap items-center gap-4 bg-[#e8eaed] border-b border-gray-200">
      <h2 className="text-sm font-semibold text-gray-800 whitespace-nowrap sr-only sm:not-sr-only">
        1주일 간 강수량
      </h2>
      <div className="flex items-end gap-2 sm:gap-3" role="img" aria-label="요일별 강수량 타임라인">
        {days.map((d) => (
          <div
            key={d.label}
            className="flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg bg-white border border-gray-200 shadow-sm min-w-[52px]"
          >
            <span className="text-[10px] font-medium text-gray-600 uppercase">{d.label}</span>
            <div className="flex items-end gap-1">
              <RainIcon percent={d.am + d.pm} />
              <MiniBar value={d.value} max={maxRain} />
            </div>
            <span className="text-[10px] text-gray-500" title={`강수량 ${d.value}mm`}>
              {d.value}mm
            </span>
          </div>
        ))}
      </div>
      {counts && (
        <div className="flex items-center gap-2 text-[11px] text-gray-600 shrink-0 px-2 py-1 rounded-md bg-white/80 border border-gray-200">
          <span>전체 <strong className="tabular-nums text-gray-800">{counts.total}</strong></span>
          <span className="text-gray-300">|</span>
          <span>청소필요 <strong className="tabular-nums text-amber-700">{counts.needCleaning}</strong></span>
          <span className="text-gray-300">|</span>
          <span>작업완료 <strong className="tabular-nums text-teal-600">{counts.completed}</strong></span>
        </div>
      )}
      <div className="ml-auto flex-1 min-w-0 max-w-xs">
        <div className="relative flex items-center">
          <span className="absolute left-2.5 text-gray-400 text-sm pointer-events-none" aria-hidden>🔍</span>
          <input
            type="search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="배수구 코드 검색 (예: AA-013)"
            className="w-full pl-8 pr-20 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            aria-label="배수구 코드로 검색"
          />
          <button
            type="button"
            onClick={handleSearch}
            className="absolute right-2 py-1 px-2 text-xs font-medium text-teal-600 hover:text-teal-700"
          >
            이동
          </button>
        </div>
      </div>
    </header>
  );
}
