/**
 * 메인 화면 구분 (사이드바에서 전환)
 * - overview: 빗물받이 현황 대시보드
 * - chat: Chat 화면
 * - resources: 보유자원 현황
 * - tasks: 작업관리 (스마트 작업 할당·관제·검수)
 */
export type MainViewType = "overview" | "chat" | "resources" | "tasks";

export const MAIN_VIEW = {
  OVERVIEW: "overview" as const,
  CHAT: "chat" as const,
  RESOURCES: "resources" as const,
  TASKS: "tasks" as const,
} as const;
