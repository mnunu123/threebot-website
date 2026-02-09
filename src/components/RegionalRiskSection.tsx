"use client";

import { MOCK_REGIONAL_RISK } from "@/data/mock-regional-risk";
import type { RegionalRiskItem } from "@/data/mock-regional-risk";

const riskStyles: Record<RegionalRiskItem["riskLevel"], string> = {
  low: "bg-emerald-100 text-emerald-800",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-red-100 text-red-800",
};

const riskLabels: Record<RegionalRiskItem["riskLevel"], string> = {
  low: "낮음",
  medium: "보통",
  high: "높음",
};

/** 지역별 위험지수 – 현재 더미 데이터, 추후 API/데이터 구체화 예정 */
export default function RegionalRiskSection() {
  return (
    <section className="shrink-0 flex flex-col border-t border-gray-200 bg-white">
      <div className="p-3 border-b border-gray-100 bg-gray-50">
        <h2 className="text-sm font-semibold text-gray-800">지역별 위험지수</h2>
        <p className="text-xs text-gray-500 mt-0.5">(더미 데이터 · API 연동 예정)</p>
      </div>
      <ul className="divide-y divide-gray-100">
        {MOCK_REGIONAL_RISK.map((item) => (
          <li key={item.region} className="flex items-center justify-between px-3 py-2">
            <span className="font-medium text-gray-800">{item.region}</span>
            <span className={`text-xs px-2 py-0.5 rounded ${riskStyles[item.riskLevel]}`}>
              {riskLabels[item.riskLevel]} {item.score}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
