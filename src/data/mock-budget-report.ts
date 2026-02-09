/**
 * 예산 최적화 리포트용 목데이터
 * - 구역별 퇴적 속도 (1주일 이내 재막힘 → 집중 관리 구역)
 * - 월/분기별 비용 절감 성과 (유류비, 인건비, 행정 시간)
 */

/** 1주일 이내 재막힘 구역 → 상습 투기 지역 / 집중 관리 구역 후보 */
export type SedimentationZone = {
  zoneName: string;
  reblockWithinDays: number;
  designation: "집중 관리 구역";
};

export const MOCK_SEDIMENTATION_ZONES: SedimentationZone[] = [
  { zoneName: "강남구 역삼동", reblockWithinDays: 5, designation: "집중 관리 구역" },
  { zoneName: "서초구 서초동", reblockWithinDays: 7, designation: "집중 관리 구역" },
  { zoneName: "송파구 잠실동", reblockWithinDays: 4, designation: "집중 관리 구역" },
];

/** 월별 비용 절감 성과 (기존 순찰 방식 대비) */
export type MonthlySavings = {
  month: string;
  fuelSavings: number; // 만원
  laborSavings: number; // 만원
  adminHoursSaved: number; // 시간
};

export const MOCK_MONTHLY_SAVINGS: MonthlySavings[] = [
  { month: "2024-10", fuelSavings: 120, laborSavings: 340, adminHoursSaved: 42 },
  { month: "2024-11", fuelSavings: 135, laborSavings: 380, adminHoursSaved: 48 },
  { month: "2024-12", fuelSavings: 118, laborSavings: 320, adminHoursSaved: 39 },
  { month: "2025-01", fuelSavings: 142, laborSavings: 410, adminHoursSaved: 52 },
];
