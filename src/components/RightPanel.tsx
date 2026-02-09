"use client";

import { useState } from "react";
import type { StormDrainItem } from "@/types/storm-drain";
import {
  MOCK_DRAIN_DETAIL,
  MOCK_PRIORITY_VISIT,
  MOCK_CLEANING_SCHEDULE,
} from "@/data/mock-drain-detail";

type TabId = "info" | "ai" | "priority" | "schedule";

export default function RightPanel({
  item,
  onClose,
  onPriorityItemSelect,
}: {
  item: StormDrainItem;
  onClose?: () => void;
  onPriorityItemSelect?: (code: string) => void;
}) {
  const detail = MOCK_DRAIN_DETAIL[item.id];
  const [activeTab, setActiveTab] = useState<TabId>("info");

  const tabs: { id: TabId; label: string }[] = [
    { id: "info", label: "배수구 정보" },
    { id: "ai", label: "AI분석" },
    { id: "priority", label: "우선 방문" },
    { id: "schedule", label: "청소 일정" },
  ];

  const criColor =
    (detail?.cri ?? 0) >= 70
      ? "text-red-600"
      : (detail?.cri ?? 0) >= 40
        ? "text-amber-600"
        : "text-emerald-600";

  return (
    <aside
      className="w-[380px] shrink-0 flex flex-col bg-white border-l border-gray-200 shadow-xl overflow-hidden"
      role="dialog"
      aria-label="빗물받이 상세 정보"
    >
      {/* 상단: 닫기 + 지도/구분 */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50/80">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span aria-hidden>📍</span>
          <span>지도</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition-colors"
          aria-label="상세 패널 닫기"
        >
          <span className="text-lg leading-none">×</span>
        </button>
      </div>

      {/* 히어로: 배경 이미지 영역 (플레이스홀더) */}
      <div className="shrink-0 h-32 bg-gradient-to-br from-teal-600 to-cyan-700 flex items-center justify-center">
        <div className="text-white/90 text-center">
          <span className="text-4xl block mb-1" aria-hidden>
            🚿
          </span>
          <span className="text-sm font-medium">빗물받이</span>
        </div>
      </div>

      {/* 제목 + 관리번호 */}
      <div className="shrink-0 px-4 pt-4 pb-2">
        <h2 className="text-lg font-bold text-gray-900">{item.name}</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          {detail?.manageNo ?? "—"} · {item.address}
        </p>
      </div>

      {/* 액션 버튼 (출발/도착 스타일) */}
      <div className="shrink-0 px-4 pb-4 flex gap-2">
        <button
          type="button"
          className="flex-1 py-2.5 rounded-lg border-2 border-teal-500 text-teal-600 font-medium text-sm hover:bg-teal-50 transition-colors"
        >
          지도에서 보기
        </button>
        <button
          type="button"
          className="flex-1 py-2.5 rounded-lg bg-teal-600 text-white font-medium text-sm hover:bg-teal-700 transition-colors"
        >
          점검 기록
        </button>
      </div>

      {/* CRI 요약 */}
      {detail && (
        <div className="shrink-0 px-4 pb-3">
          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
            <span className="text-sm text-gray-600">위험지수 (CRI)</span>
            <span className={`text-2xl font-bold ${criColor}`}>{detail.cri}</span>
          </div>
        </div>
      )}

      {/* 탭 네비 */}
      <div className="shrink-0 border-b border-gray-200">
        <nav className="flex gap-0" aria-label="상세 정보 탭">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? "text-teal-600 border-b-2 border-teal-600 bg-teal-50/50"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* 탭 콘텐츠 (스크롤) */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {activeTab === "info" && detail && (
          <section className="p-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">마지막 청소일</span>
              <span className="text-gray-900">{detail.lastCleaned}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">최근 수거량</span>
              <span className="text-gray-900">{detail.recentCollectionKg}kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">권장 청소 주기</span>
              <span className="text-gray-900">{detail.recommendedCycle}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">부실 시공 유무</span>
              <span className="text-gray-900">
                {detail.defectiveConstruction ? "있음" : "없음"}
              </span>
            </div>
          </section>
        )}

        {activeTab === "ai" && (
          <section className="p-4 bg-gray-50/80 rounded-none">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">
              AI분석 및 권장 조치
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              {detail?.aiRecommendation ?? "—"}
            </p>
          </section>
        )}

        {activeTab === "priority" && (
          <section className="p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">
              우선 방문 리스트
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              클릭 시 해당 구역으로 지도 이동
            </p>
            <ul className="space-y-2">
              {MOCK_PRIORITY_VISIT.map((v) => (
                <li key={v.id}>
                  <button
                    type="button"
                    onClick={() => onPriorityItemSelect?.(v.id)}
                    className={`w-full text-left text-sm py-2.5 px-3 rounded-xl border-l-4 transition-all ${
                      v.highlight
                        ? "bg-red-50 border-red-500 text-red-800 hover:bg-red-100 font-medium"
                        : "bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <span className="font-semibold">{v.id}</span>
                    <span className="text-gray-600"> · {v.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {activeTab === "schedule" && (
          <section className="p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">
              다가오는 청소 일정
            </h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
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
        )}
      </div>
    </aside>
  );
}
