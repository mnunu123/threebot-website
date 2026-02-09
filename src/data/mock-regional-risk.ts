/** 지역별 위험지수 더미 데이터 (실제 API/데이터 연동 예정) */
export interface RegionalRiskItem {
  region: string;
  riskLevel: "low" | "medium" | "high";
  score: number;
  count: number;
}

export const MOCK_REGIONAL_RISK: RegionalRiskItem[] = [
  { region: "강남구", riskLevel: "low", score: 23, count: 12 },
  { region: "서초구", riskLevel: "medium", score: 58, count: 8 },
  { region: "송파구", riskLevel: "high", score: 82, count: 15 },
  { region: "역삼동", riskLevel: "low", score: 31, count: 5 },
  { region: "삼성동", riskLevel: "medium", score: 65, count: 7 },
];
