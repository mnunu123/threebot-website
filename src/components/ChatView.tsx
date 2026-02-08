"use client";

import { useState } from "react";

/** 채팅 API 베이스 URL (백엔드 포트 8001) */
const CHAT_API_URL =
  process.env.NEXT_PUBLIC_CHAT_API_URL ?? "http://localhost:8001";

/**
 * Chat 화면 (Figma 디자인: node-id=708-4260)
 * - 왼쪽 사이드바에서 "Chat" 클릭 시 표시되는 화면
 * - 메인 영역: 검정 배경, 중앙 입력창 "물어보기" + 전송 버튼
 * - 상단 우측: 햄버거 메뉴, 새 채팅(연필) 아이콘
 *
 * 구분용: 이 파일은 Chat 전용 UI입니다. Overview(빗물받이 현황)와 분리되어 있으므로
 * 라우팅·API 연동 시 이 컴포넌트만 수정하면 됩니다.
 */
export default function ChatView() {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userInput = query.trim();
    setQuery("");
    setError(null);
    setAnswer(null);
    setLoading(true);

    // ---------- 디버깅: [1] 사용자가 "물어보기"에 입력한 문자 ----------
    const debugPayload = { query: userInput, session_id: null as string | null };
    console.group("[Chat 디버깅] 물어보기 → LLM 오케스트레이션");
    console.log("[1] 사용자 입력 (프롬프트로 전달될 문자):", userInput);
    console.log("[2] API 요청 payload:", debugPayload);
    console.log("[3] 요청 URL:", `${CHAT_API_URL}/chat/query`);

    try {
      const res = await fetch(`${CHAT_API_URL}/chat/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(debugPayload),
      });

      const data = await res.json().catch(() => ({}));

      // ---------- 디버깅: [4] API 응답 (LLM이 반환한 답변) ----------
      console.log("[4] API 응답 상태:", res.status);
      console.log("[5] API 응답 body (answer, intent, tools_used):", data);
      console.log("[6] LLM이 생성한 답변 (answer):", data?.answer ?? "(없음)");
      console.groupEnd();

      if (!res.ok) {
        setError(data?.detail ?? `HTTP ${res.status}`);
        return;
      }

      setAnswer(data.answer ?? "");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[Chat 디버깅] 요청 실패:", msg);
      console.groupEnd();
      setError(`연결 실패: ${msg}. 백엔드가 localhost:8001 에서 떠 있는지 확인하세요.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-black">
      {/* Chat 전용 상단 바: 우측 아이콘만 (Figma 기준) */}
      <header className="chat-view-header shrink-0 h-12 flex items-center justify-end gap-2 px-4 border-b border-white/10">
        <button
          type="button"
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          aria-label="메뉴"
        >
          <span className="text-lg">☰</span>
        </button>
        <button
          type="button"
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          aria-label="새 채팅"
        >
          <span className="text-lg">✎</span>
        </button>
      </header>

      {/* 메인 영역: "물어보기" 입력창 + 디버깅용 응답 표시 */}
      <div className="flex-1 flex flex-col min-h-0 items-center justify-center px-4 gap-4">
        {error && (
          <div className="w-full max-w-2xl rounded-lg bg-red-500/20 border border-red-500/50 px-4 py-2 text-sm text-red-200">
            {error}
          </div>
        )}
        {answer !== null && (
          <div className="w-full max-w-2xl rounded-lg bg-[#2a2d35] border border-white/10 px-4 py-3 text-sm text-gray-200 whitespace-pre-wrap">
            <span className="text-teal-400 text-xs font-medium block mb-1">LLM 응답 (디버깅용)</span>
            {answer}
          </div>
        )}
        <form
          onSubmit={handleSubmit}
          className="chat-view-input-wrapper w-full max-w-2xl"
        >
          <div className="flex items-center gap-2 rounded-2xl bg-[#2a2d35] border border-white/10 px-4 py-3 focus-within:border-teal-500/50 focus-within:ring-1 focus-within:ring-teal-500/30 transition-colors">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="물어보기"
              className="flex-1 min-w-0 bg-transparent text-white placeholder:text-gray-500 text-sm outline-none py-1"
              aria-label="채팅 입력"
              disabled={loading}
            />
            <button
              type="submit"
              className="shrink-0 w-9 h-9 rounded-full bg-teal-500 hover:bg-teal-400 text-white flex items-center justify-center transition-colors disabled:opacity-50"
              aria-label="전송"
              disabled={!query.trim() || loading}
            >
              {loading ? (
                <span className="text-white text-sm">...</span>
              ) : (
                <span className="text-white font-bold">→</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
