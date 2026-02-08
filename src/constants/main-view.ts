/**
 * 메인 화면 구분 (사이드바에서 전환)
 * - overview: 빗물받이 현황 대시보드 (지도, 차트, 우측 패널)
 * - chat: Chat 화면 (Figma Chat 디자인)
 * - resources: 보유자원 현황 (자원현황)
 *
 * 나중에 자원현황 등 추가 시 여기에 항목 추가하고 SidebarNav, StormDrainLayout에서 분기하면 됩니다.
 */
export type MainViewType = "overview" | "chat" | "resources";

export const MAIN_VIEW = {
  OVERVIEW: "overview" as const,
  CHAT: "chat" as const,
  RESOURCES: "resources" as const,
} as const;
