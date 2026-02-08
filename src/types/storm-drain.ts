/** 빗물받이 한 건 (상세 더미 필드 포함, 추후 API 연동 시 교체) */
export interface StormDrainItem {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  status: "normal" | "warning" | "error";
  lastChecked?: string;
  /** 더미: 관리번호 */
  manageNo?: string;
  /** 더미: 설치일 */
  installedAt?: string;
  /** 더미: 배수량 (m³) */
  drainageCapacity?: number;
  /** 더미: 점검 주기 (일) */
  checkCycleDays?: number;
  /** 위험지수 CRI (지도 마커에 표시) */
  cri?: number;
}
