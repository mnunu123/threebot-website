"use client";

import { MOCK_CHART_RISK } from "@/data/mock-chart-risk";

const MAX_BAR = 100;

/** 지역별 위험지수 막대 차트 (더미) – 막힘 지수(teal), 지형 위험도(회색) */
export default function RegionalRiskChart() {
  return (
    <section className="shrink-0 p-4 bg-[#f0f2f5] border-t border-gray-200">
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-sm font-semibold text-gray-800">지역별 위험지수</h2>
        <select className="text-xs border border-gray-300 rounded px-2 py-1.5 bg-white text-gray-700">
          <option>홍수 지수</option>
        </select>
      </div>
      <div className="flex items-end gap-2 h-32">
        {MOCK_CHART_RISK.map((d) => (
          <div key={d.region} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex gap-0.5 items-end justify-center h-24">
              <div
                className="w-1/2 min-w-[4px] rounded-t bg-teal-500"
                style={{ height: `${(d.clogIndex / MAX_BAR) * 100}%` }}
                title={`막힘 지수 ${d.clogIndex}`}
              />
              <div
                className="w-1/2 min-w-[4px] rounded-t bg-gray-400"
                style={{ height: `${(d.topographyRisk / MAX_BAR) * 100}%` }}
                title={`지형 위험도 ${d.topographyRisk}`}
              />
            </div>
            <span className="text-[10px] text-gray-600 truncate w-full text-center">{d.region}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-4 mt-2 text-xs text-gray-600">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-teal-500" /> 막힘 지수</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-400" /> 지형 위험도</span>
      </div>
    </section>
  );
}
