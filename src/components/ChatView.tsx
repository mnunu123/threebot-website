"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PromptSuggestion } from "@/components/ui/prompt-suggestion";
import { askLLMWithHistory, type UserRole } from "@/lib/llm-api";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const SUGGESTIONS = [
  "빗물받이 막힘 위험 지역 알려줘",
  "오늘 강수량이 많은 구역은?",
  "점검 필요한 배수 시설 목록",
];

/** 오른쪽 상단 사용자 아바타 (Gemini 스타일: 원형 + 이니셜) */
function UserAvatar({ name = "세준" }: { name?: string }) {
  const initial = name.slice(0, 1).toUpperCase();
  return (
    <button
      type="button"
      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-medium bg-gradient-to-br from-violet-500 to-purple-600 hover:opacity-90 transition-opacity shrink-0"
      title={name}
      aria-label={`사용자 ${name}`}
    >
      {initial}
    </button>
  );
}

/** AI 응답 앞에 붙는 네모 별 아이콘 (Gemini 스타일) */
function GeminiStarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7z" />
    </svg>
  );
}

/** 플러스(첨부) 아이콘 */
function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

/** 아래쪽 화살표 (빠른 모드 드롭다운) */
function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

/** 공유 아이콘 */
function ShareIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

/** 세로 점 3개 메뉴 아이콘 */
function MoreIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <circle cx="12" cy="6" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="12" cy="18" r="1.5" />
    </svg>
  );
}

/** 마이크 아이콘 */
function MicIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  );
}

function genId() {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export type ChatRoom = {
  id: string;
  title: string;
  messages: ChatMessage[];
};

type ChatViewProps = {
  chat: ChatRoom | null;
  onUpdateChat: (chatId: string, patch: { messages?: ChatMessage[]; title?: string }) => void;
};

const ROLE_LABELS: Record<UserRole, string> = {
  office: "사무직",
  field: "노동자 관리직",
  data: "데이터 관리직",
};

export default function ChatView({ chat, onUpdateChat }: ChatViewProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [highlight, setHighlight] = useState("");
  const [userRole, setUserRole] = useState<UserRole>("office");
  const scrollEndRef = useRef<HTMLDivElement>(null);

  const messages = chat?.messages ?? [];
  const firstUser = messages.find((m) => m.role === "user");
  const currentTitle = chat?.title && chat.title !== "새 채팅" ? chat.title : firstUser
    ? firstUser.content.slice(0, 30) + (firstUser.content.length > 30 ? "…" : "")
    : null;

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading || !chat) return;

    const userInput = query.trim();
    setQuery("");
    setError(null);
    const userMsg: ChatMessage = { id: genId(), role: "user", content: userInput };
    const newMessages = [...messages, userMsg];
    const isFirstUserMessage = messages.filter((m) => m.role === "user").length === 0;
    const newTitle = isFirstUserMessage
      ? userInput.slice(0, 30) + (userInput.length > 30 ? "…" : "")
      : undefined;
    onUpdateChat(chat.id, { messages: newMessages, ...(newTitle && { title: newTitle }) });
    setLoading(true);

    const history = newMessages.map((m) => ({ role: m.role, content: m.content }));

    try {
      const result = await askLLMWithHistory(history, 120_000, userRole);

      if (!result.ok) {
        setError(result.error);
        return;
      }
      const assistantMsg: ChatMessage = {
        id: genId(),
        role: "assistant",
        content: result.content,
      };
      onUpdateChat(chat.id, { messages: [...newMessages, assistantMsg] });
    } catch (err) {
      setError("현재 노바로보틱스 GPU 서버와 통신이 원활하지 않습니다.");
    } finally {
      setLoading(false);
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="chat-view-root flex-1 flex flex-col min-h-0 bg-background">
      {/* 헤더: Gemini 스타일 — 왼쪽 채팅 제목, 오른쪽 공유·메뉴·아바타 */}
      <header className="shrink-0 h-14 flex items-center justify-between px-4 border-b border-border">
        <div className="min-w-0 flex-1">
          <h1 className="font-semibold text-foreground text-lg tracking-tight truncate" title={currentTitle ?? undefined}>
            {currentTitle || "새 채팅"}
          </h1>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground hover:bg-accent"
            aria-label="공유"
          >
            <ShareIcon className="w-5 h-5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground hover:bg-accent"
            aria-label="메뉴"
          >
            <MoreIcon className="w-5 h-5" />
          </Button>
          <UserAvatar name="세준" />
        </div>
      </header>

      {/* 스크롤 가능한 대화 목록 (제미나이 스타일: 사용자 우측 말풍선, AI 좌측+파란별 아이콘) */}
      <div className="flex-1 min-h-0 overflow-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-8">
          {error && (
            <div className="rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive-foreground">
              {error}
            </div>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "user" ? (
                <div className="max-w-[85%] rounded-2xl bg-[hsl(0,0%,18%)] text-[hsl(0,0%,98%)] px-4 py-3 text-sm shadow-sm">
                  {msg.content}
                </div>
              ) : (
                <div className="flex items-start gap-3 max-w-[90%]">
                  <span className="text-[#8ab4f8] shrink-0 mt-0.5" aria-hidden>
                    <GeminiStarIcon className="w-6 h-6" />
                  </span>
                  <div className="rounded-2xl text-foreground text-sm whitespace-pre-wrap leading-relaxed">
                    {msg.content}
                  </div>
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="flex items-start gap-3 max-w-[90%]">
                <span className="text-[#8ab4f8] shrink-0 mt-0.5" aria-hidden>
                  <GeminiStarIcon className="w-6 h-6" />
                </span>
                <div className="text-muted-foreground text-sm">응답 생성 중…</div>
              </div>
            </div>
          )}
          {!hasMessages && !loading && (
            <div className="flex flex-wrap justify-center gap-2 pt-4">
              {SUGGESTIONS.map((text) => (
                <PromptSuggestion
                  key={text}
                  highlight={highlight}
                  className="text-foreground border-border bg-background/80 hover:bg-accent"
                  onClick={() => {
                    setQuery(text);
                    setHighlight("");
                  }}
                >
                  {text}
                </PromptSuggestion>
              ))}
            </div>
          )}
          <div ref={scrollEndRef} />
        </div>
      </div>

      {/* 하단 입력 영역 (Gemini 스타일): + 버튼 · 큰 입력창 · 마이크 · 전송, 푸터에 안내+빠른 모드 */}
      <div className="shrink-0 border-t border-border px-4 py-3">
        <form
          onSubmit={handleSubmit}
          className="max-w-3xl mx-auto flex items-center gap-2 rounded-full border border-input bg-[hsl(0,0%,14%)] px-4 py-3 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background"
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 rounded-full text-muted-foreground hover:text-foreground"
            aria-label="첨부"
          >
            <PlusIcon className="w-5 h-5" />
          </Button>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setHighlight(e.target.value.trim());
            }}
            placeholder="NOVA에게 물어보기"
            className="flex-1 min-w-0 bg-transparent text-sm outline-none py-2 text-foreground placeholder:text-muted-foreground"
            aria-label="채팅 입력"
            disabled={loading}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 rounded-full text-muted-foreground hover:text-foreground"
            aria-label="음성 입력"
          >
            <MicIcon className="w-5 h-5" />
          </Button>
          <Button
            type="submit"
            size="icon"
            className="shrink-0 rounded-full h-9 w-9 text-primary-foreground bg-primary hover:bg-primary/90"
            aria-label="전송"
            disabled={!query.trim() || loading}
          >
            {loading ? (
              <span className="text-sm">...</span>
            ) : (
              <span className="font-bold">→</span>
            )}
          </Button>
        </form>
        <div className="max-w-3xl mx-auto mt-2 flex items-center justify-between gap-4 text-xs text-muted-foreground flex-wrap">
          <span>
            NOVA는 AI이며 정보 제공 시 실수를 할 수 있습니다. 개인정보 보호에 유의하세요.
          </span>
          <label className="flex items-center gap-2 shrink-0">
            <span>빠른 모드</span>
            <span className="relative inline-block">
              <select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value as UserRole)}
                className="bg-transparent text-foreground cursor-pointer outline-none border-none appearance-none pr-6 py-1 hover:text-foreground focus:ring-0"
                aria-label="직군 선택 (시스템 프롬프트)"
              >
                <option value="office">{ROLE_LABELS.office}</option>
                <option value="field">{ROLE_LABELS.field}</option>
                <option value="data">{ROLE_LABELS.data}</option>
              </select>
              <ChevronDownIcon className="w-4 h-4 pointer-events-none absolute right-0 top-1/2 -translate-y-1/2" aria-hidden />
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
