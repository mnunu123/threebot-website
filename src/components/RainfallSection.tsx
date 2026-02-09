"use client";

/**
 * 1주일 간 강수량
 * TODO: 네이버 날씨 API(또는 기상청 API) 연동 예정
 * - 선택 지역/전국 기준 1주일 강수량 데이터 표시
 * - API 연동 후 이 컴포넌트에서 데이터 fetch 및 차트/리스트로 표시
 */
export default function RainfallSection() {
  return (
    <section className="shrink-0 px-4 py-3 bg-white border-b border-gray-200">
      <h2 className="text-sm font-semibold text-gray-800">1주일 간 강수량</h2>
      {/* 네이버 날씨 API 연동 시 강수량 데이터 표시 영역 */}
      <div className="mt-2 flex items-center justify-center h-12 rounded-lg bg-gray-50 border border-dashed border-gray-200 text-gray-400 text-sm">
        (강수량 데이터 – API 연동 예정)
      </div>
    </section>
  );
}
