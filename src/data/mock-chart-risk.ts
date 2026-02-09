/** 지역별 위험지수 차트 더미 (막힘 지수, 지형 위험도) */
export interface RegionalChartDummy {
  region: string;
  clogIndex: number;
  topographyRisk: number;
}

export const MOCK_CHART_RISK: RegionalChartDummy[] = [
  { region: "성내1동", clogIndex: 72, topographyRisk: 45 },
  { region: "대봉2동", clogIndex: 58, topographyRisk: 62 },
  { region: "남산4동", clogIndex: 85, topographyRisk: 38 },
  { region: "용산2동", clogIndex: 41, topographyRisk: 71 },
  { region: "신천2동", clogIndex: 66, topographyRisk: 55 },
  { region: "상인1동", clogIndex: 90, topographyRisk: 48 },
  { region: "산격3동", clogIndex: 53, topographyRisk: 67 },
];
