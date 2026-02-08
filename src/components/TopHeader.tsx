"use client";

/**
 * 상단: 1주일 간 강수량 + 날씨 카드(더미) + 검색
 * TODO: 1주일 강수량·날씨는 네이버 날씨 API 등 연동 예정
 */
export default function TopHeader() {
  const days = [
    { label: "오늘", value: "2.3L", am: 0, pm: 0 },
    { label: "내일", value: "2.0L", am: 20, pm: 20 },
    { label: "목", value: "2.0L", am: 20, pm: 20 },
    { label: "금", value: "2.0L", am: 20, pm: 20 },
  ];

  return (
    <header className="shrink-0 h-14 px-4 flex items-center gap-6 bg-[#e8eaed] border-b border-gray-200">
      <h2 className="text-sm font-semibold text-gray-800 whitespace-nowrap">1주일 간 강수량</h2>
      <div className="flex items-center gap-3">
        {days.map((d) => (
          <div key={d.label} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-gray-200 shadow-sm">
            <span className="text-xs font-medium text-gray-700">{d.label}</span>
            <span className="text-xs text-gray-600">{d.value}</span>
            <span className="text-[10px] text-gray-500">오전 {d.am}% · 오후 {d.pm}%</span>
          </div>
        ))}
      </div>
      <div className="ml-auto flex-1 max-w-xs">
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" aria-hidden>🔍</span>
          <input
            type="search"
            placeholder="Search here"
            className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
          />
        </div>
      </div>
    </header>
  );
}
