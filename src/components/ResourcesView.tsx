"use client";

import { MOCK_ZONE_RESOURCES } from "@/data/mock-resources";

/**
 * 자원현황 화면 (Figma: node-id=705-3122)
 * - 데이터는 아직 없으므로 더미값으로 구성 (src/data/mock-resources.ts)
 * - 나중에 API 연동 시 MOCK_ZONE_RESOURCES 부분만 교체하면 UI는 유지됩니다.
 */
export default function ResourcesView() {
  return (
    <div className="flex-1 min-h-0 bg-gradient-to-br from-[#0b0f2b] via-[#0a1a3a] to-[#071124] text-white overflow-y-auto">
      <div className="max-w-6xl mx-auto px-10 py-10">
        <header>
          <h1 className="text-3xl font-semibold text-cyan-300">
            보유자원 현황
            <span className="block mt-2 h-1 w-40 bg-cyan-400/80 rounded" />
          </h1>
          <p className="mt-5 text-lg text-white/80">
            구역별 할당된 인원 및 장비 현황을 확인합니다.
          </p>
          <div className="mt-6 h-px bg-white/20" />
        </header>

        <section className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-10">
          {MOCK_ZONE_RESOURCES.map((zone) => (
            <div
              key={zone.zoneName}
              className="rounded-md bg-white/15 border border-white/10 shadow-[0_12px_30px_rgba(0,0,0,0.25)]"
            >
              <div className="px-7 py-6">
                <div className="text-xl font-semibold text-cyan-300">
                  {zone.zoneName} <span className="font-normal">zone</span>
                </div>
                <div className="mt-3 h-px bg-white/25" />

                {/* 할당 인원 */}
                <div className="mt-5 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-white/90">
                    <span className="text-lg" aria-hidden>
                      ⚑
                    </span>
                    <span className="text-lg">할당 인원</span>
                  </div>
                  <div className="text-lg font-semibold">{zone.peopleAssigned}명</div>
                </div>

                <div className="mt-5 h-px bg-white/25" />

                {/* 청소 장비 */}
                <div className="mt-5 text-lg font-semibold text-cyan-300">청소 장비</div>
                <div className="mt-4 space-y-5">
                  {zone.equipments.map((eq) => (
                    <div key={eq.name} className="flex items-start justify-between gap-6">
                      <div className="flex items-center gap-3 text-white/90">
                        <span className="text-lg" aria-hidden>
                          {eq.name.includes("준설") ? "🚚" : "🌀"}
                        </span>
                        <span className="text-lg">{eq.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold">{eq.count}개</div>
                        <div className="mt-1 text-xs">
                          <span className="text-emerald-300">사용가능: {eq.status.available}</span>
                          <span className="text-white/40"> / </span>
                          <span className="text-amber-300">정비중: {eq.status.maintenance}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

