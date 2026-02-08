"use client";

import type { StormDrainItem } from "@/types/storm-drain";
import { MOCK_DRAIN_DETAIL, MOCK_PRIORITY_VISIT, MOCK_CLEANING_SCHEDULE } from "@/data/mock-drain-detail";

export default function RightPanel({ item }: { item: StormDrainItem | null }) {
  const detail = item ? MOCK_DRAIN_DETAIL[item.id] : null;

  return (
    <aside className="w-80 shrink-0 flex flex-col bg-white border-l border-gray-200 overflow-y-auto">
      {/* 배수구 정보 */}
      <section className="p-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-800">
          배수구 정보: {detail?.manageNo ?? "—"}
        </h2>
        {detail ? (
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-baseline justify-between">
              <span className="text-gray-600">위험지수(CRI)</span>
              <span className={`text-xl font-bold ${detail.cri >= 70 ? "text-red-600" : detail.cri >= 40 ? "text-amber-600" : "text-emerald-600"}`}>
                {detail.cri}
              </span>
            </div>
            <div className="flex justify-between"><span className="text-gray-600">마지막 청소일</span><span>{detail.lastCleaned}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">최근 수거량</span><span>{detail.recentCollectionKg}kg</span></div>
            <div className="flex justify-between"><span className="text-gray-600">권장 청소 주기</span><span>{detail.recommendedCycle}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">부실 시공 유무</span><span>{detail.defectiveConstruction ? "O" : "X"}</span></div>
          </div>
        ) : (
          <p className="mt-2 text-gray-400 text-sm">목록에서 빗물받이를 선택하세요.</p>
        )}
      </section>

      {/* AI분석 및 권장 조치 */}
      <section className="p-4 border-b border-gray-200 bg-gray-50/80">
        <h2 className="text-sm font-semibold text-gray-800">AI분석 및 권장 조치</h2>
        <p className="mt-2 text-sm text-gray-700">
          {detail?.aiRecommendation ?? "선택된 배수구가 없습니다."}
        </p>
      </section>

      {/* 우선 방문 리스트 */}
      <section className="p-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-800">우선 방문 리스트</h2>
        <ul className="mt-2 space-y-1.5">
          {MOCK_PRIORITY_VISIT.map((v) => (
            <li key={v.id} className={`text-sm ${v.highlight ? "text-red-600 font-medium" : "text-gray-700"}`}>
              {v.id} · {v.label}
            </li>
          ))}
        </ul>
      </section>

      {/* 다가오는 청소 일정 */}
      <section className="p-4">
        <h2 className="text-sm font-semibold text-gray-800">다가오는 청소 일정</h2>
        <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-600">
                <th className="text-left p-2">코드</th>
                <th className="text-left p-2">일정</th>
                <th className="text-left p-2">팀</th>
                <th className="text-left p-2">상태</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_CLEANING_SCHEDULE.map((s) => (
                <tr key={s.code} className="border-t border-gray-100">
                  <td className="p-2 font-medium">{s.code}</td>
                  <td className="p-2">{s.date}</td>
                  <td className="p-2">{s.team}</td>
                  <td className="p-2">{s.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </aside>
  );
}
