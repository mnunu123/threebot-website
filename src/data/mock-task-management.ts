/** 작업자 (실시간 위치/동선 추적용) */
export type MockWorker = {
  id: string;
  name: string;
  role: string;
  lat: number;
  lng: number;
  onRoute: boolean;
  lastUpdated: string;
};

/** 검수 건 (작업 전/후 사진 + AI 판정) */
export type MockAuditItem = {
  id: string;
  workerName: string;
  locationLabel: string;
  beforeImageUrl: string | null;
  afterImageUrl: string | null;
  aiVerdict: "clean" | "not_clean" | "pending";
  approved: boolean;
  taskDate: string;
};

export const MOCK_WORKERS: MockWorker[] = [
  { id: "w1", name: "김반장", role: "반장", lat: 37.5012, lng: 127.0396, onRoute: true, lastUpdated: "2025-02-09T10:30:00" },
  { id: "w2", name: "이작업자", role: "작업자 A", lat: 37.4989, lng: 127.0378, onRoute: true, lastUpdated: "2025-02-09T10:28:00" },
  { id: "w3", name: "박팀장", role: "팀장", lat: 37.5060, lng: 127.0500, onRoute: false, lastUpdated: "2025-02-09T10:25:00" },
];

export const MOCK_AUDIT_ITEMS: MockAuditItem[] = [
  {
    id: "a1",
    workerName: "김반장",
    locationLabel: "강남구 테헤란로 123",
    beforeImageUrl: null,
    afterImageUrl: null,
    aiVerdict: "clean",
    approved: false,
    taskDate: "2025-02-09",
  },
  {
    id: "a2",
    workerName: "이작업자",
    locationLabel: "서초구 서초동 789",
    beforeImageUrl: null,
    afterImageUrl: null,
    aiVerdict: "not_clean",
    approved: false,
    taskDate: "2025-02-09",
  },
  {
    id: "a3",
    workerName: "박팀장",
    locationLabel: "송파구 잠실동 202",
    beforeImageUrl: null,
    afterImageUrl: null,
    aiVerdict: "clean",
    approved: true,
    taskDate: "2025-02-08",
  },
];
