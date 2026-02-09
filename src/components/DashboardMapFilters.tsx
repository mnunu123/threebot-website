"use client";

import { SIDO_NAMES, getSigunguBySido } from "@/data/sido-sigungu";

export type MapFilterValues = {
  sido: string;
  gunGu: string;
  date: string;
  severity50Only: boolean;
};

const DEFAULT_SIDO = "전체";
const DEFAULT_GUNGU = "전체";

export default function DashboardMapFilters({
  value,
  onChange,
}: {
  value: MapFilterValues;
  onChange: (v: MapFilterValues) => void;
}) {
  const sigunguOptions = value.sido === DEFAULT_SIDO ? [] : getSigunguBySido(value.sido);

  return (
    <div className="flex flex-wrap items-center gap-3 px-3 py-2 bg-gray-50 border-b border-gray-200 rounded-t-lg">
      <span className="text-xs font-medium text-gray-500">실시간 필터</span>
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <span className="whitespace-nowrap">시·도</span>
        <select
          value={value.sido}
          onChange={(e) => {
            const nextSido = e.target.value;
            onChange({
              ...value,
              sido: nextSido,
              gunGu: DEFAULT_GUNGU,
            });
          }}
          className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500/40"
          aria-label="시·도 선택"
        >
          <option value={DEFAULT_SIDO}>전체</option>
          {SIDO_NAMES.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <span className="whitespace-nowrap">군·구</span>
        <select
          value={value.gunGu}
          onChange={(e) => onChange({ ...value, gunGu: e.target.value })}
          disabled={value.sido === DEFAULT_SIDO}
          className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500/40 disabled:opacity-60 disabled:cursor-not-allowed"
          aria-label="군·구 선택"
        >
          <option value={DEFAULT_GUNGU}>전체</option>
          {sigunguOptions.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <span className="whitespace-nowrap">날짜</span>
        <input
          type="date"
          value={value.date}
          onChange={(e) => onChange({ ...value, date: e.target.value })}
          className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500/40"
          aria-label="날짜 필터"
        />
      </label>
      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
        <input
          type="checkbox"
          checked={value.severity50Only}
          onChange={(e) => onChange({ ...value, severity50Only: e.target.checked })}
          className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
          aria-label="50% 이상 적재만 보기"
        />
        <span>50% 이상 적재만</span>
      </label>
    </div>
  );
}

export const getDefaultFilterValues = (): MapFilterValues => ({
  sido: DEFAULT_SIDO,
  gunGu: DEFAULT_GUNGU,
  date: "",
  severity50Only: false,
});
