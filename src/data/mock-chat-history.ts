/** 채팅 목록 항목 (사이드바 "채팅" 섹션) */
export type ChatListItem = {
  id: string
  title: string
}

/** 대화 이력 요약 항목 (사이드바 하단) */
export type ConversationSummaryItem = {
  id: string
  summary: string
  dateLabel?: string
}

export const MOCK_CHAT_LIST: ChatListItem[] = [
  { id: "1", title: "빗물받이 막힘 위험 지역 문의" },
  { id: "2", title: "오늘 강수량이 많은 구역 조회" },
  { id: "3", title: "점검 필요한 배수 시설 목록" },
]

export const MOCK_CONVERSATION_SUMMARIES: ConversationSummaryItem[] = [
  { id: "s1", summary: "빗물받이 점검 요청 및 위험 지역 분석", dateLabel: "오늘" },
  { id: "s2", summary: "강수량 기반 배수 시설 우선순위", dateLabel: "어제" },
  { id: "s3", summary: "지역별 막힘 위험도 요약", dateLabel: "이번 주" },
]
