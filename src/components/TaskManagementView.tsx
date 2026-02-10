"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import DashboardMetricCard from "@/components/ui/dashboard-metric-card";

type MetricId = "completed" | "inspectionRate" | "defectRate" | "avgCri" | "workloadByDistrict";

type TimeSeriesPoint = {
  date: string;
  completed: number;
  inspectionRate: number;
  defectRate: number;
  avgCri: number;
};

type WorkloadPoint = {
  district: string;
  completed: number;
  pending: number;
};

// 빗물받이 작업 관련 목업 시계열 데이터 (과거 → 현재)
const TIME_SERIES: TimeSeriesPoint[] = [
  { date: "2025-01", completed: 120, inspectionRate: 78, defectRate: 9, avgCri: 68 },
  { date: "2025-02", completed: 145, inspectionRate: 82, defectRate: 8, avgCri: 64 },
  { date: "2025-03", completed: 160, inspectionRate: 85, defectRate: 7, avgCri: 61 },
  { date: "2025-04", completed: 190, inspectionRate: 88, defectRate: 6, avgCri: 58 },
  { date: "2025-05", completed: 210, inspectionRate: 90, defectRate: 6, avgCri: 56 },
  { date: "2025-06", completed: 230, inspectionRate: 91, defectRate: 5, avgCri: 54 },
  { date: "2025-07", completed: 260, inspectionRate: 93, defectRate: 5, avgCri: 52 },
  { date: "2025-08", completed: 275, inspectionRate: 94, defectRate: 4, avgCri: 50 },
];

// 자치구별 작업량 분포 목업
const WORKLOAD_BY_DISTRICT: WorkloadPoint[] = [
  { district: "강남구", completed: 82, pending: 14 },
  { district: "서초구", completed: 64, pending: 11 },
  { district: "송파구", completed: 71, pending: 9 },
  { district: "관악구", completed: 55, pending: 13 },
];

const METRIC_CONFIG: Record<
  MetricId,
  {
    title: string;
    description: string;
    unit: string;
    formatValue: (v: number) => string;
  }
> = {
  completed: {
    title: "월별 작업 완료 건수",
    description: "빗물받이 청소·점검 완료 추이 (과거 → 현재)",
    unit: "건",
    formatValue: (v) => v.toLocaleString("ko-KR") + "건",
  },
  inspectionRate: {
    title: "점검 완료율",
    description: "계획 대비 실제 점검 완료 비율",
    unit: "%",
    formatValue: (v) => `${v.toFixed(1)}%`,
  },
  defectRate: {
    title: "이상(불량) 발견 비율",
    description: "점검 중 이상이 발견된 비율",
    unit: "%",
    formatValue: (v) => `${v.toFixed(1)}%`,
  },
  avgCri: {
    title: "평균 침수 위험지수(CRI)",
    description: "관할 빗물받이 평균 CRI 추이 (낮을수록 양호)",
    unit: "점",
    formatValue: (v) => v.toFixed(1),
  },
  workloadByDistrict: {
    title: "자치구별 작업량 분포",
    description: "주요 자치구별 완료·대기 작업량 비교",
    unit: "건",
    formatValue: (v) => v.toLocaleString("ko-KR") + "건",
  },
};

const chartConfig: ChartConfig = {
  completed: {
    label: "완료 건수",
    color: "hsl(174 65% 45%)",
  },
  inspectionRate: {
    label: "점검 완료율",
    color: "hsl(201 96% 32%)",
  },
  defectRate: {
    label: "이상 발견 비율",
    color: "hsl(25 95% 53%)",
  },
  avgCri: {
    label: "평균 CRI",
    color: "hsl(262 83% 58%)",
  },
  completedWorkload: {
    label: "완료 작업",
    color: "hsl(174 65% 45%)",
  },
  pendingWorkload: {
    label: "대기 작업",
    color: "hsl(32 95% 53%)",
  },
};

export default function TaskManagementView() {
  const [activeMetric, setActiveMetric] = useState<MetricId>("completed");

  const latestPoint = TIME_SERIES[TIME_SERIES.length - 1];
  const prevPoint = TIME_SERIES[TIME_SERIES.length - 2] ?? latestPoint;

  const summaryCards = useMemo(() => {
    const diff = (current: number, prev: number) => current - prev;
    const pct = (cur: number, prev: number) =>
      prev === 0 ? 0 : ((cur - prev) / prev) * 100;

    return [
      {
        id: "completed" as MetricId,
        value: latestPoint.completed.toLocaleString("ko-KR") + "건",
        fromValue: prevPoint.completed.toLocaleString("ko-KR"),
        change: diff(latestPoint.completed, prevPoint.completed),
        changePct: pct(latestPoint.completed, prevPoint.completed),
      },
      {
        id: "inspectionRate" as MetricId,
        value: METRIC_CONFIG.inspectionRate.formatValue(latestPoint.inspectionRate),
        fromValue: METRIC_CONFIG.inspectionRate.formatValue(prevPoint.inspectionRate),
        change: diff(latestPoint.inspectionRate, prevPoint.inspectionRate),
        changePct: pct(latestPoint.inspectionRate, prevPoint.inspectionRate),
      },
      {
        id: "defectRate" as MetricId,
        value: METRIC_CONFIG.defectRate.formatValue(latestPoint.defectRate),
        fromValue: METRIC_CONFIG.defectRate.formatValue(prevPoint.defectRate),
        change: diff(latestPoint.defectRate, prevPoint.defectRate),
        changePct: pct(latestPoint.defectRate, prevPoint.defectRate),
      },
      {
        id: "avgCri" as MetricId,
        value: METRIC_CONFIG.avgCri.formatValue(latestPoint.avgCri),
        fromValue: METRIC_CONFIG.avgCri.formatValue(prevPoint.avgCri),
        change: diff(prevPoint.avgCri, latestPoint.avgCri), // CRI는 감소가 좋음
        changePct: prevPoint.avgCri === 0 ? 0 : ((prevPoint.avgCri - latestPoint.avgCri) / prevPoint.avgCri) * 100,
      },
    ];
  }, [latestPoint, prevPoint]);

  const renderMainChart = () => {
    switch (activeMetric) {
      case "completed":
        return (
          <ChartContainer config={chartConfig} className="bg-white rounded-xl border border-slate-200/60 p-6 min-h-[320px]">
            <AreaChart data={TIME_SERIES} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="grad-completed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend content={<ChartLegendContent />} />
              <Area
                type="monotone"
                dataKey="completed"
                name="완료 건수"
                stroke="#14b8a6"
                strokeWidth={2}
                strokeLinecap="round"
                fill="url(#grad-completed)"
              />
            </AreaChart>
          </ChartContainer>
        );
      case "inspectionRate":
        return (
          <ChartContainer config={chartConfig} className="bg-white rounded-xl border border-slate-200/60 p-6 min-h-[320px]">
            <AreaChart data={TIME_SERIES} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="grad-inspection" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0d9488" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#0d9488" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <YAxis tickFormatter={(v) => `${v}%`} tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => [`${(value as number).toFixed(1)}%`, "점검 완료율"]}
                  />
                }
              />
              <Legend content={<ChartLegendContent />} />
              <Area
                type="monotone"
                dataKey="inspectionRate"
                name="점검 완료율"
                stroke="#0d9488"
                strokeWidth={2}
                strokeLinecap="round"
                fill="url(#grad-inspection)"
              />
            </AreaChart>
          </ChartContainer>
        );
      case "defectRate":
        return (
          <ChartContainer config={chartConfig} className="bg-white rounded-xl border border-slate-200/60 p-6 min-h-[320px]">
            <AreaChart data={TIME_SERIES} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="grad-defect" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#f97316" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <YAxis tickFormatter={(v) => `${v}%`} tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => [`${(value as number).toFixed(1)}%`, "이상 발견 비율"]}
                  />
                }
              />
              <Legend content={<ChartLegendContent />} />
              <Area
                type="monotone"
                dataKey="defectRate"
                name="이상 발견 비율"
                stroke="#f97316"
                strokeWidth={2}
                strokeLinecap="round"
                fill="url(#grad-defect)"
              />
            </AreaChart>
          </ChartContainer>
        );
      case "avgCri":
        return (
          <ChartContainer config={chartConfig} className="bg-white rounded-xl border border-slate-200/60 p-6 min-h-[320px]">
            <AreaChart data={TIME_SERIES} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="grad-avgCri" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => [`${(value as number).toFixed(1)}`, "평균 CRI"]}
                  />
                }
              />
              <Legend content={<ChartLegendContent />} />
              <Area
                type="monotone"
                dataKey="avgCri"
                name="평균 CRI"
                stroke="#8b5cf6"
                strokeWidth={2}
                strokeLinecap="round"
                fill="url(#grad-avgCri)"
              />
            </AreaChart>
          </ChartContainer>
        );
      case "workloadByDistrict":
        return (
          <ChartContainer config={chartConfig} className="bg-white rounded-xl border border-slate-200/60 p-6 min-h-[320px]">
            <BarChart data={WORKLOAD_BY_DISTRICT} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="district" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend content={<ChartLegendContent />} />
              <Bar
                dataKey="completed"
                name="완료 작업"
                stackId="workload"
                fill="var(--color-completedWorkload)"
              />
              <Bar
                dataKey="pending"
                name="대기 작업"
                stackId="workload"
                fill="var(--color-pendingWorkload)"
              />
            </BarChart>
          </ChartContainer>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-gradient-to-br from-slate-50 via-teal-50/30 to-cyan-50/40">
      <header className="shrink-0 px-4 py-4 bg-white/80 backdrop-blur-sm border-b border-slate-200/80 shadow-sm">
        <p className="text-sm font-medium bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
          과거부터 지금까지의 작업 데이터를 한 눈에 보고, 클릭으로 지표를 바꿔보세요.
        </p>
        <h1 className="text-xl font-bold text-slate-800 mt-1 tracking-tight">
          작업관리 · 스마트 작업 현황 및 성과 분석
        </h1>
      </header>

      <div className="flex-1 min-h-0 overflow-auto p-4">
        <div className="max-w-6xl mx-auto space-y-5">
          {/* 상단 KPI 카드 (클릭 시 차트 전환) */}
          <section aria-label="핵심 작업 지표 요약" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {summaryCards.map((card) => {
              const metric = METRIC_CONFIG[card.id];
              const changeAbs = Math.abs(card.changePct ?? 0);
              const isUp =
                card.id === "defectRate" || card.id === "avgCri"
                  ? (card.changePct ?? 0) > 0
                  : (card.changePct ?? 0) > 0;
              const trendType = changeAbs === 0 ? "neutral" : isUp ? "up" : "down";
              const trendBadge =
                changeAbs === 0 ? "" : `${(card.changePct ?? 0) > 0 ? "↑" : "↓"} ${Math.abs(card.changePct ?? 0).toFixed(1)}%`;
              const isActive = activeMetric === card.id;

              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => setActiveMetric(card.id)}
                  className={`
                    w-full text-left rounded-xl p-[3px] transition-all duration-200
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2
                    ${isActive ? "ring-2 ring-teal-500 ring-offset-2 ring-offset-white shadow-md shadow-teal-500/20" : "hover:shadow-md"}
                  `}
                >
                  <DashboardMetricCard
                    value={card.value}
                    title={metric.title}
                    fromValue={card.fromValue}
                    trendChange={trendBadge}
                    trendType={trendType}
                    badgeStyle
                    className="h-full"
                  />
                </button>
              );
            })}
          </section>

          {/* 메인 차트 영역 */}
          <section aria-label="시간에 따른 작업 지표" className="space-y-2">
            <div className="flex items-baseline justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-800">
                  {METRIC_CONFIG[activeMetric].title}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {METRIC_CONFIG[activeMetric].description}
                </p>
              </div>
            </div>
            <div className="rounded-2xl shadow-xl shadow-slate-200/40 border border-slate-200/60 overflow-hidden">
              {renderMainChart()}
            </div>
          </section>

          {/* 간단 표 요약 */}
          <section
            aria-label="요약 테이블"
            className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-md p-5 text-xs text-slate-700"
          >
            <h3 className="font-semibold text-sm mb-3 text-slate-800">최근 3개월 요약</h3>
            <div className="overflow-x-auto rounded-lg border border-slate-200/60">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-teal-50/30">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">월</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">완료 건수</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">점검 완료율</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">이상 발견 비율</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">평균 CRI</th>
                  </tr>
                </thead>
                <tbody>
                  {TIME_SERIES.slice(-3).map((row, idx) => (
                    <tr
                      key={row.date}
                      className={`border-b border-slate-100 last:border-0 transition-colors hover:bg-teal-50/30 ${
                        idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                      }`}
                    >
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-700">{row.date}</td>
                      <td className="px-4 py-3 tabular-nums text-slate-600">{row.completed.toLocaleString("ko-KR")}</td>
                      <td className="px-4 py-3 tabular-nums text-slate-600">{row.inspectionRate.toFixed(1)}%</td>
                      <td className="px-4 py-3 tabular-nums text-slate-600">{row.defectRate.toFixed(1)}%</td>
                      <td className="px-4 py-3 tabular-nums text-slate-600">{row.avgCri.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

