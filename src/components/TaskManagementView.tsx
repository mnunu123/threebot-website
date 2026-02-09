"use client";

import { useState, useRef, useCallback } from "react";
import { MOCK_WORKERS, MOCK_AUDIT_ITEMS, type MockWorker, type MockAuditItem } from "@/data/mock-task-management";

const TABS = [
  { id: "assign", label: "작업 지시", desc: "드래그 앤 드롭 작업 할당" },
  { id: "tracking", label: "실시간 관제", desc: "작업자 위치·동선 추적" },
  { id: "audit", label: "검수", desc: "작업 전/후 자동 검수" },
] as const;

type TabId = (typeof TABS)[number]["id"];

/** 드래그로 구역 선택 가능한 지도 영역 (플레이스홀더) */
function MapSelectionArea({
  onSelectionComplete,
  selected,
}: {
  onSelectionComplete: (hasSelection: boolean) => void;
  selected: boolean;
}) {
  const [rect, setRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      startRef.current = { x, y };
      setRect(null);
      onSelectionComplete(false);
    },
    [onSelectionComplete]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!startRef.current || !containerRef.current) return;
      const r = containerRef.current.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      setRect({
        x: Math.min(startRef.current.x, x),
        y: Math.min(startRef.current.y, y),
        w: Math.abs(x - startRef.current.x),
        h: Math.abs(y - startRef.current.y),
      });
    },
    []
  );

  const handleMouseUp = useCallback(() => {
    if (rect && rect.w > 10 && rect.h > 10) {
      onSelectionComplete(true);
    } else {
      setRect(null);
      onSelectionComplete(false);
    }
    startRef.current = null;
  }, [rect, onSelectionComplete]);

  return (
    <div
      ref={containerRef}
      role="application"
      aria-label="지도에서 드래그하여 구역 선택"
      className="relative w-full h-[280px] rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 overflow-hidden select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        startRef.current = null;
        if (!selected) setRect(null);
      }}
      onMouseUp={handleMouseUp}
    >
      <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
        지도에서 마우스 드래그로 구역을 선택하세요
      </div>
      {rect && rect.w > 5 && rect.h > 5 && (
        <div
          className="absolute border-2 border-teal-500 bg-teal-500/20 pointer-events-none"
          style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}
        />
      )}
    </div>
  );
}

/** 탭 1: 드래그 앤 드롭 작업 지시 */
function AssignTaskTab() {
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>("");
  const [hasSelection, setHasSelection] = useState(false);
  const [pushSent, setPushSent] = useState(false);

  const handleAssign = () => {
    if (!hasSelection || !selectedWorkerId) return;
    setPushSent(true);
    setTimeout(() => setPushSent(false), 3000);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        구역을 선택한 뒤 작업자를 지정하면 해당 작업자 앱으로 즉시 푸시 알림이 발송됩니다.
      </p>
      <MapSelectionArea onSelectionComplete={setHasSelection} selected={hasSelection} />
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          작업자
          <select
            value={selectedWorkerId}
            onChange={(e) => setSelectedWorkerId(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">선택</option>
            {MOCK_WORKERS.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.role})
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={handleAssign}
          disabled={!hasSelection || !selectedWorkerId}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-teal-700"
        >
          {pushSent ? "푸시 발송됨 ✓" : "할당 (푸시 발송)"}
        </button>
      </div>
    </div>
  );
}

/** 탭 2: 작업자 실시간 위치/동선 */
function WorkerTrackingTab({ workers }: { workers: MockWorker[] }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        GPS 기반 실시간 위치와 지정 경로 준수 여부를 확인합니다. (근무 태만 방지 및 안전 관리)
      </p>
      <ul className="space-y-2">
        {workers.map((w) => (
          <li
            key={w.id}
            className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-3 shadow-sm"
          >
            <div>
              <span className="font-semibold text-gray-800">{w.name}</span>
              <span className="text-gray-500 text-sm ml-2">({w.role})</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-gray-500">
                위도 {w.lat.toFixed(4)}, 경도 {w.lng.toFixed(4)}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  w.onRoute ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                }`}
              >
                {w.onRoute ? "경로 준수" : "경로 이탈"}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** 탭 3: 작업 전/후 자동 검수 (Smart Audit) */
function AuditTab({ items }: { items: MockAuditItem[] }) {
  const [approvedIds, setApprovedIds] = useState<Set<string>>(
    () => new Set(items.filter((i) => i.approved).map((i) => i.id))
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        청소 전/후 사진을 나란히 보여주며, AI가 "청소 완료됨(Clean)" 판정을 내린 건만 관리자가 승인할 수 있습니다.
      </p>
      <ul className="space-y-4">
        {items.map((item) => {
          const canApprove = item.aiVerdict === "clean" && !approvedIds.has(item.id);
          return (
            <li
              key={item.id}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-gray-800">{item.workerName}</span>
                <span className="text-sm text-gray-500">{item.locationLabel} · {item.taskDate}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">청소 전</p>
                  <div className="aspect-video rounded-lg bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                    {item.beforeImageUrl ? (
                      <img src={item.beforeImageUrl} alt="청소 전" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      "사진 없음"
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">청소 후</p>
                  <div className="aspect-video rounded-lg bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                    {item.afterImageUrl ? (
                      <img src={item.afterImageUrl} alt="청소 후" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      "사진 없음"
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span
                  className={`text-sm font-medium ${
                    item.aiVerdict === "clean"
                      ? "text-emerald-600"
                      : item.aiVerdict === "not_clean"
                        ? "text-amber-600"
                        : "text-gray-500"
                  }`}
                >
                  AI 판정:{" "}
                  {item.aiVerdict === "clean"
                    ? "청소 완료됨 (Clean)"
                    : item.aiVerdict === "not_clean"
                      ? "미완료"
                      : "대기 중"}
                </span>
                {approvedIds.has(item.id) ? (
                  <span className="text-sm text-emerald-600 font-medium">승인 완료</span>
                ) : (
                  <button
                    type="button"
                    disabled={!canApprove}
                    onClick={() => setApprovedIds((s) => new Set(s).add(item.id))}
                    className="rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-teal-700"
                  >
                    승인
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function TaskManagementView() {
  const [activeTab, setActiveTab] = useState<TabId>("assign");

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#e8eaed]">
      <header className="shrink-0 px-4 py-3 bg-white border-b border-gray-200">
        <p className="text-sm text-teal-600 font-medium">
          전화 통화 없이, 클릭 한 번으로 작업자를 보낸다.
        </p>
        <h1 className="text-xl font-bold text-gray-800 mt-0.5">작업관리 · 스마트 작업 할당 및 관제</h1>
      </header>

      <div className="shrink-0 border-b border-gray-200 bg-white px-4">
        <nav className="flex gap-0" aria-label="작업관리 탭">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-teal-600 text-teal-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1 min-h-0 overflow-auto p-4">
        <div className="max-w-4xl mx-auto">
          {activeTab === "assign" && <AssignTaskTab />}
          {activeTab === "tracking" && <WorkerTrackingTab workers={MOCK_WORKERS} />}
          {activeTab === "audit" && <AuditTab items={MOCK_AUDIT_ITEMS} />}
        </div>
      </div>
    </div>
  );
}
