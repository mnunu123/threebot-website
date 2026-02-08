/** 배수구 상세 더미 (이미지 UI: 위험지수 CRI, 마지막 청소일, 최근 수거량 등) */
export interface DrainDetailDummy {
  id: string;
  manageNo: string;
  cri: number;
  lastCleaned: string;
  recentCollectionKg: number;
  recommendedCycle: string;
  defectiveConstruction: boolean;
  aiRecommendation: string;
}

export const MOCK_DRAIN_DETAIL: Record<string, DrainDetailDummy> = {
  "1": { id: "1", manageNo: "AA-013", cri: 97, lastCleaned: "2024.06.12", recentCollectionKg: 1.4, recommendedCycle: "12-15일 이내", defectiveConstruction: false, aiRecommendation: "집중호우 예보와 겹칠 즉시 방문이 급으로 후보입니다." },
  "2": { id: "2", manageNo: "EE-070", cri: 72, lastCleaned: "2024.07.01", recentCollectionKg: 0.8, recommendedCycle: "14일 이내", defectiveConstruction: false, aiRecommendation: "다음 강수 전 점검 권장합니다." },
  "3": { id: "3", manageNo: "BE-139", cri: 88, lastCleaned: "2024.05.20", recentCollectionKg: 2.1, recommendedCycle: "7일 이내", defectiveConstruction: true, aiRecommendation: "부실 시공 구간으로 우선 점검이 필요합니다." },
  "4": { id: "4", manageNo: "CC-675", cri: 45, lastCleaned: "2024.08.10", recentCollectionKg: 0.5, recommendedCycle: "30일 이내", defectiveConstruction: false, aiRecommendation: "현재 상태 양호합니다." },
  "5": { id: "5", manageNo: "FD-145", cri: 63, lastCleaned: "2024.07.15", recentCollectionKg: 1.0, recommendedCycle: "15일 이내", defectiveConstruction: false, aiRecommendation: "다음 달 정기 점검 예정입니다." },
};

/** 우선 방문 리스트 더미 */
export const MOCK_PRIORITY_VISIT = [
  { id: "AA-013", label: "고위험 · 즉시 점검", highlight: true },
  { id: "EE-070", label: "중위험 · 1주 내 방문", highlight: true },
  { id: "BE-139", label: "고위험 · 부실 시공", highlight: false },
];

/** 다가오는 청소 일정 더미 */
export const MOCK_CLEANING_SCHEDULE = [
  { code: "CC 675", date: "2026.02.15", team: "A팀", status: "진행 순" },
  { code: "AC 240", date: "2026.02.15", team: "B팀", status: "대기" },
  { code: "FD-145", date: "2026.02.18", team: "A팀", status: "대기" },
];
