"use client";

import type { StormDrainItem } from "@/types/storm-drain";

const statusColors = {
  normal: "bg-emerald-500",
  warning: "bg-amber-500",
  error: "bg-red-500",
};

export default function StormDrainList({
  items,
  selectedId,
  onSelect,
}: {
  items: StormDrainItem[];
  selectedId: string | null;
  onSelect: (item: StormDrainItem) => void;
}) {
  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      <div className="p-3 border-b border-gray-200 bg-gray-50">
        <h2 className="font-semibold text-gray-800">빗물받이 목록</h2>
        <p className="text-xs text-gray-500 mt-0.5">항목 클릭 시 지도에서 위치로 이동</p>
      </div>
      <ul className="flex-1 overflow-y-auto divide-y divide-gray-100">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onSelect(item)}
              className={`w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 transition-colors ${
                selectedId === item.id ? "bg-blue-50 border-l-4 border-blue-500" : ""
              }`}
            >
              <span
                className={`shrink-0 w-3 h-3 rounded-full ${statusColors[item.status]}`}
                title={item.status}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <div className="font-medium text-gray-900 truncate">{item.name}</div>
                <div className="text-xs text-gray-500 truncate">{item.address}</div>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
