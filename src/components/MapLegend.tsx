"use client";

/** GIS 컨트롤타워 - 직관적 위험 시각화 (신호등 UI) */
export default function MapLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-1 px-3 py-2 bg-white/95 border-t border-gray-200 rounded-b-lg">
      <span className="text-xs text-gray-500 mr-2">직관적 위험 시각화 (신호등)</span>
      <span className="flex items-center gap-2 text-sm text-gray-700">
        <span className="w-3 h-3 rounded-full bg-red-500 ring-1 ring-red-300" />
        위험 · 즉시 청소
      </span>
      <span className="flex items-center gap-2 text-sm text-gray-700">
        <span className="w-3 h-3 rounded-full bg-amber-500 ring-1 ring-amber-300" />
        주의 · 관찰 필요
      </span>
      <span className="flex items-center gap-2 text-sm text-gray-700">
        <span className="w-3 h-3 rounded-full bg-emerald-500 ring-1 ring-emerald-300" />
        정상 · 통과
      </span>
    </div>
  );
}
