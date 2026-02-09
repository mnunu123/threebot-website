"use client";

import React, { useMemo, useState } from "react";
import { LineChart, Line, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Users, MapPin, Wrench, Package } from "lucide-react";
import { MOCK_ZONE_RESOURCES } from "@/data/mock-resources";
import {
  MOCK_SEDIMENTATION_ZONES,
  MOCK_MONTHLY_SAVINGS,
} from "@/data/mock-budget-report";

// --- CUSTOM TOOLTIP ---
const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
}) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="rounded-lg border border-white/10
                   bg-gray-900/80 p-2 text-sm
                   shadow-md backdrop-blur-sm"
      >
        <p className="text-white">{`값: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

// --- STAT CARD COMPONENT ---
function StatCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  chartData,
}: {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative";
  icon: React.ComponentType<{ className?: string }>;
  chartData: { name: string; uv: number }[];
}) {
  const chartColor = changeType === "positive" ? "#4ade80" : "#f87171";

  return (
    <div
      className="group rounded-2xl border border-white/10
                 bg-gray-800/40 p-5 shadow-lg
                 transition-all duration-300 ease-in-out
                 hover:border-white/20 hover:bg-gray-800/60
                 transform hover:-translate-y-1 cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium text-gray-400">{title}</h3>
        <Icon className="h-5 w-5 text-gray-500" />
      </div>
      <div className="mt-4 flex items-end justify-between">
        <div className="flex flex-col">
          <p className="text-3xl font-bold tracking-tighter text-white">{value}</p>
          <p
            className={`mt-1 text-xs ${
              changeType === "positive" ? "text-green-400" : "text-red-400"
            }`}
          >
            {change}
          </p>
        </div>
        <div className="h-12 w-28">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
            >
              <defs>
                <linearGradient
                  id={`colorUv-${title}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor={chartColor} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip
                content={<CustomTooltip />}
                cursor={{
                  stroke: "rgba(255,255,255,0.1)",
                  strokeWidth: 1,
                  strokeDasharray: "3 3",
                }}
              />
              <Line
                type="monotone"
                dataKey="uv"
                stroke={chartColor}
                strokeWidth={2}
                dot={false}
                fillOpacity={1}
                fill={`url(#colorUv-${title})`}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// --- 예산 최적화 리포트 모달 (리포트 생성 버튼 클릭 시) ---
function BudgetOptimizationReport({
  onClose,
}: {
  onClose: () => void;
}) {
  const chartData = useMemo(
    () =>
      MOCK_MONTHLY_SAVINGS.map((m) => ({
        name: m.month.slice(0, 7).replace("-", "/"),
        유류비절감: m.fuelSavings,
        인건비절감: m.laborSavings,
        행정시간절감: m.adminHoursSaved,
      })),
    []
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className="bg-gray-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        role="dialog"
        aria-labelledby="report-title"
        aria-modal="true"
      >
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 id="report-title" className="text-xl font-bold text-white">
            [통계/분석] 예산 최적화 리포트 (Budget Optimization)
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="리포트 닫기"
          >
            <span className="text-xl leading-none">×</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-8">
          {/* 1. 구역별 퇴적 속도 분석 */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-2">
              1. 구역별 퇴적 속도 분석 (Analysis of Sedimentation Speed by Area)
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              청소 후 1주일 이내 다시 막히는 구역을 파악하여, 해당 구역을 &quot;상습 투기 지역&quot;으로 분류하고
              &quot;집중 관리 구역&quot;으로 지정해 집중 관리할 것을 제안합니다.
            </p>
            <div className="rounded-xl border border-white/10 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white/5 text-gray-300 text-left">
                    <th className="px-4 py-3 font-medium">구역명</th>
                    <th className="px-4 py-3 font-medium">재막힘 소요 일수</th>
                    <th className="px-4 py-3 font-medium">지정</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_SEDIMENTATION_ZONES.map((z) => (
                    <tr key={z.zoneName} className="border-t border-white/10 text-gray-300">
                      <td className="px-4 py-3">{z.zoneName}</td>
                      <td className="px-4 py-3">{z.reblockWithinDays}일</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-amber-500/20 text-amber-400 px-2 py-0.5 text-xs font-medium">
                          {z.designation}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 2. 비용 절감 성과표 */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-2">
              2. 비용 절감 성과표 (Cost Reduction Performance Table)
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              기존 순찰 방식 대비 유류비·인건비 절감 및 행정 시간 단축 성과를 월/분기별로 보고합니다.
            </p>
            <div className="rounded-xl border border-white/10 overflow-hidden mb-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white/5 text-gray-300 text-left">
                    <th className="px-4 py-3 font-medium">기간</th>
                    <th className="px-4 py-3 font-medium">유류비 절감 (만원)</th>
                    <th className="px-4 py-3 font-medium">인건비 절감 (만원)</th>
                    <th className="px-4 py-3 font-medium">행정 시간 절감 (시간)</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_MONTHLY_SAVINGS.map((m) => (
                    <tr key={m.month} className="border-t border-white/10 text-gray-300">
                      <td className="px-4 py-3">{m.month}</td>
                      <td className="px-4 py-3 text-emerald-400">{m.fuelSavings}</td>
                      <td className="px-4 py-3 text-emerald-400">{m.laborSavings}</td>
                      <td className="px-4 py-3 text-emerald-400">{m.adminHoursSaved}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 12 }} />
                  <YAxis tick={{ fill: "#9ca3af", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(17,24,39,0.95)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#e5e7eb" }}
                  />
                  <Bar dataKey="유류비절감" fill="#34d399" name="유류비 절감 (만원)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="인건비절감" fill="#60a5fa" name="인건비 절감 (만원)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              ※ 월별 유류비·인건비 절감액 (만원). 행정 시간 절감은 표 참고.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

// --- RESOURCES VIEW (자원현황) ---
export default function ResourcesView() {
  const [showReport, setShowReport] = useState(false);
  const analyticsData = useMemo(() => {
    const totalPeople = MOCK_ZONE_RESOURCES.reduce(
      (sum, z) => sum + z.peopleAssigned,
      0
    );
    let totalAvailable = 0;
    let totalMaintenance = 0;
    MOCK_ZONE_RESOURCES.forEach((z) => {
      z.equipments.forEach((eq) => {
        totalAvailable += eq.status.available;
        totalMaintenance += eq.status.maintenance;
      });
    });
    const totalEquipment = totalAvailable + totalMaintenance;

    // 구역별 인원 차트 데이터
    const peopleChartData = MOCK_ZONE_RESOURCES.map((z) => ({
      name: z.zoneName,
      uv: z.peopleAssigned,
    }));

    // 구역별 가용 장비 차트 데이터
    const availableChartData = MOCK_ZONE_RESOURCES.map((z) => ({
      name: z.zoneName,
      uv: z.equipments.reduce((s, eq) => s + eq.status.available, 0),
    }));

    // 구역별 정비 중 장비 차트 데이터
    const maintenanceChartData = MOCK_ZONE_RESOURCES.map((z) => ({
      name: z.zoneName,
      uv: z.equipments.reduce((s, eq) => s + eq.status.maintenance, 0),
    }));

    return [
      {
        title: "총 할당 인원",
        value: `${totalPeople}명`,
        change: "전 구역 합계",
        changeType: "positive" as const,
        icon: Users,
        chartData: peopleChartData,
      },
      {
        title: "관리 구역",
        value: `${MOCK_ZONE_RESOURCES.length}개`,
        change: "북구, 중구, 서구, 남구",
        changeType: "positive" as const,
        icon: MapPin,
        chartData: MOCK_ZONE_RESOURCES.map((z, i) => ({
          name: `P${i + 1}`,
          uv: z.peopleAssigned,
        })),
      },
      {
        title: "가용 장비",
        value: `${totalAvailable}대`,
        change: `정비 중 ${totalMaintenance}대`,
        changeType: "positive" as const,
        icon: Package,
        chartData: availableChartData,
      },
      {
        title: "정비 중 장비",
        value: `${totalMaintenance}대`,
        change: `가용 ${totalAvailable}대`,
        changeType: totalMaintenance > totalAvailable ? ("negative" as const) : ("positive" as const),
        icon: Wrench,
        chartData: maintenanceChartData,
      },
    ];
  }, []);

  return (
    <div className="flex-1 min-h-0 bg-gradient-to-br from-[#0b0f2b] via-[#0a1a3a] to-[#071124] text-white overflow-y-auto">
      <div className="w-full max-w-7xl mx-auto px-10 py-10">
        <header className="flex items-center justify-between pb-6 border-b border-white/10">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              자원현황
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              구역별 할당된 인원 및 장비 현황을 확인합니다.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowReport(true)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white
                       shadow-sm transition-colors hover:bg-indigo-500
                       focus:outline-none focus:ring-2 focus:ring-indigo-500
                       focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            리포트 생성
          </button>
        </header>

        {showReport && (
          <BudgetOptimizationReport onClose={() => setShowReport(false)} />
        )}

        <main className="mt-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {analyticsData.map((data) => (
              <StatCard
                key={data.title}
                title={data.title}
                value={data.value}
                change={data.change}
                changeType={data.changeType}
                icon={data.icon}
                chartData={data.chartData}
              />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
