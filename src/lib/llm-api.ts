/**
 * LLM API 클라이언트 (OpenAI 호환 /v1/chat/completions)
 * Novarobotics AI Platform — vLLM(Qwen-32B) 백엔드 연동
 */

/** 노바로보틱스 LLM API (ngrok 터널) — base만 지정, /v1/chat/completions 는 코드에서 붙임 */
const DEFAULT_LLM_BASE_URL = "https://unmummied-arlette-overdrily.ngrok-free.dev";

export const LLM_API_BASE =
  typeof process !== "undefined"
    ? (process.env.NEXT_PUBLIC_LLM_API_URL ?? DEFAULT_LLM_BASE_URL).replace(/\/$/, "")
    : DEFAULT_LLM_BASE_URL;

export type LLMMessage = { role: "system" | "user" | "assistant"; content: string };

export type ChatCompletionOptions = {
  messages: LLMMessage[];
  model?: string;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  stop?: string[];
  /** 응답 대기 최대 시간(ms). 기본 2분 */
  timeoutMs?: number;
};

export type ChatCompletionResult =
  | { ok: true; content: string }
  | { ok: false; error: string };

/** 직군별 오케스트레이션 — 시스템 프롬프트 첫 줄이 이 값으로 주입됨 */
export type UserRole = "office" | "field" | "data";

/** VLLM 서버 모델 ID */
const DEFAULT_LLM_MODEL = "qwen-32b";

/** Qwen 토큰 종료 시퀀스 (불필요한 장문·타언어 혼용 방지) */
const DEFAULT_STOP_SEQUENCES = ["<|im_end|>", "<|endoftext|>"];

/** 기본 타임아웃 2분 */
const DEFAULT_TIMEOUT_MS = 120_000;

/** 신뢰도·일관성 (메타 프롬프트 명시) */
const DEFAULT_TEMPERATURE = 0.3;
const DEFAULT_TOP_P = 0.85;

/** 직군별 시스템 프롬프트 첫 줄 (System Prompt Injection) */
const ROLE_FIRST_LINE: Record<UserRole, string> = {
  office:
    "너는 사무직 사용자를 위한 AI 비서다. 전략적 인사이트, 비용, 기획·데이터 중심으로 답변해라.",
  field:
    "너는 노동자·현장 관리직을 위한 AI 비서다. 현장 안전 지표, 작업 효율, 직관적인 관리 지시 중심으로 답변해라.",
  data:
    "너는 데이터 관리직을 위한 AI 비서다. 수치 정확성, 통계·이상치, DB 연동 데이터 중심으로 답변해라.",
};

const COMMON_SYSTEM_SUFFIX =
  " Answer only in Korean. 수치·데이터가 나오면 반드시 Markdown 테이블로 정리해라. 간결하고 명확하게 답변해라.";

export function getSystemPrompt(role: UserRole): string {
  return ROLE_FIRST_LINE[role] + COMMON_SYSTEM_SUFFIX;
}

/** Serveo/vLLM 연결 실패 시 사용자 안내 문구 (메타 프롬프트 명시) */
export const SERVER_ERROR_MESSAGE =
  "현재 노바로보틱스 GPU 서버와 통신이 원활하지 않습니다.";

/**
 * OpenAI 호환 POST /v1/chat/completions 호출
 */
export async function chatCompletion(
  options: ChatCompletionOptions
): Promise<ChatCompletionResult> {
  const url = `${LLM_API_BASE}/v1/chat/completions`;
  const body = {
    model: options.model ?? DEFAULT_LLM_MODEL,
    messages: options.messages,
    max_tokens: options.max_tokens ?? 512,
    temperature: options.temperature ?? DEFAULT_TEMPERATURE,
    top_p: options.top_p ?? DEFAULT_TOP_P,
    stop: options.stop ?? DEFAULT_STOP_SEQUENCES,
  };

  const apiKey = typeof process !== "undefined" ? (process.env.NEXT_PUBLIC_LLM_API_KEY ?? "none") : "none";
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        ok: false,
        error: SERVER_ERROR_MESSAGE,
      };
    }

    const content = data?.choices?.[0]?.message?.content;
    if (content == null) {
      return { ok: false, error: SERVER_ERROR_MESSAGE };
    }
    return { ok: true, content: String(content).trim() };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === "AbortError") {
      return {
        ok: false,
        error: `응답 시간이 ${timeoutMs / 1000}초를 초과했습니다. 다시 시도해 주세요.`,
      };
    }
    return {
      ok: false,
      error: SERVER_ERROR_MESSAGE,
    };
  }
}

/**
 * 대화 이력 포함하여 LLM 호출 (직군별 시스템 프롬프트 주입)
 */
export async function askLLMWithHistory(
  history: { role: "user" | "assistant"; content: string }[],
  timeoutMs?: number,
  role: UserRole = "office"
): Promise<ChatCompletionResult> {
  const messages: LLMMessage[] = [
    { role: "system", content: getSystemPrompt(role) },
    ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
  ];
  return chatCompletion({ messages, timeoutMs });
}

/**
 * 단일 턴 채팅 (기본 직군: 사무직)
 */
export async function askLLM(
  userMessage: string,
  role: UserRole = "office"
): Promise<ChatCompletionResult> {
  return askLLMWithHistory([{ role: "user", content: userMessage }], undefined, role);
}
