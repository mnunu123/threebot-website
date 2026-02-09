"use client";

import type { StormDrainItem } from "@/types/storm-drain";

const statusLabels = {
  normal: "정상",
  warning: "주의",
  error: "점검 필요",
};

const statusBg = {
  normal: "bg-emerald-100 text-emerald-800",
  warning: "bg-amber-100 text-amber-800",
  error: "bg-red-100 text-red-800",
};

/** 오른쪽 사이드바: 해당빗물받이 클릭 시 표시되는 상세 정보 (더미값 포함, 추후 API 연동) */
export default function DetailPanel({ item }: { item: StormDrainItem | null }) {
  if (!item) {
    return (
      <div className="h-full min-h-0 flex flex-col bg-white">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="font-semibold text-gray-800">해당빗물받이</h2>
        </div>
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm px-4">
          목록 또는 지도에서 빗물받이를 선택하세요.
        </div>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 flex flex-col bg-white">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="font-semibold text-gray-800">해당빗물받이</h2>
        <p className="text-xs text-gray-500 mt-0.5">(더미 데이터 · API 연동 예정)</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">이름</div>
          <div className="mt-1 font-medium text-gray-900">{item.name}</div>
        </div>
        <div>
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">주소</div>
          <div className="mt-1 text-gray-700">{item.address}</div>
        </div>
        {item.manageNo && (
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">관리번호</div>
            <div className="mt-1 text-gray-700 font-mono text-sm">{item.manageNo}</div>
          </div>
        )}
        <div>
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">상태</div>
          <span className={`inline-block mt-1 px-2 py-1 rounded text-sm font-medium ${statusBg[item.status]}`}>
            {statusLabels[item.status]}
          </span>
        </div>
        {item.lastChecked && (
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">최종 점검일</div>
            <div className="mt-1 text-gray-700">{item.lastChecked}</div>
          </div>
        )}
        {item.installedAt != null && (
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">설치일</div>
            <div className="mt-1 text-gray-700">{item.installedAt}</div>
          </div>
        )}
        {item.drainageCapacity != null && (
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">배수량</div>
            <div className="mt-1 text-gray-700">{item.drainageCapacity} m³</div>
          </div>
        )}
        {item.checkCycleDays != null && (
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">점검 주기</div>
            <div className="mt-1 text-gray-700">{item.checkCycleDays}일</div>
          </div>
        )}
        <div>
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">좌표</div>
          <div className="mt-1 text-gray-600 font-mono text-sm">
            {item.lat.toFixed(6)}, {item.lng.toFixed(6)}
          </div>
        </div>
      </div>
    </div>
  );
}
