"use client";

import type { StormDrainItem } from "@/types/storm-drain";

type KpiItem = {
  label: string;
  value: number;
  subLabel?: string;
  icon: "total" | "warning" | "done";
  colorClass: string;
};

function KpiIcon({ type }: { type: KpiItem["icon"] }) {
  const base = "w-8 h-8 rounded-lg flex items-center justify-center shrink-0";
  if (type === "total") {
    return (
      <span className={`${base} bg-slate-100 text-slate-600`} aria-hidden>
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      </span>
    );
  }
  if (type === "warning") {
    return (
      <span className={`${base} bg-amber-100 text-amber-700`} aria-hidden>
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h18.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </span>
    );
  }
  // done
  return (
    <span className={`${base} bg-teal-100 text-teal-700`} aria-hidden>
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    </span>
  );
}

/** items 기준으로 KPI 집계 (점검 필요 = warning+error, 작업 완료 = 최근 7일 이내 점검 완료). 정상 제거, 작업 완료를 세 번째 칸에 배치 */
function computeKpis(items: StormDrainItem[]): KpiItem[] {
  const total = items.length;
  const needInspection = items.filter((i) => i.status === "warning" || i.status === "error").length;
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const completed = items.filter((i) => {
    if (!i.lastChecked) return false;
    const d = new Date(i.lastChecked);
    return d >= sevenDaysAgo;
  }).length;

  return [
    { label: "전체 빗물받이", value: total, icon: "total", colorClass: "text-slate-700" },
    { label: "점검 필요", value: needInspection, subLabel: "warning·error", icon: "warning", colorClass: "text-amber-700" },
    { label: "작업 완료", value: completed, subLabel: "최근 7일", icon: "done", colorClass: "text-teal-700" },
  ];
}

export default function DashboardKpiSummary({ items }: { items: StormDrainItem[] }) {
  const kpis = computeKpis(items);

  return (
    <section
      className="shrink-0 px-4 py-3 bg-white border-b border-gray-200"
      aria-label="대시보드 핵심 지표"
    >
      <div className="flex flex-wrap items-stretch gap-3">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-100 shadow-sm min-w-0 flex-1 basis-0 sm:basis-[calc(33.333%-0.5rem)]"
          >
            <KpiIcon type={kpi.icon} />
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-500 truncate">{kpi.label}</p>
              <p className={`text-xl font-bold tabular-nums ${kpi.colorClass}`}>
                {kpi.value}
                {kpi.subLabel && (
                  <span className="text-xs font-normal text-gray-400 ml-1">({kpi.subLabel})</span>
                )}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
