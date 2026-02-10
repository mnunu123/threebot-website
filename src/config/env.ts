/**
 * GS 인증 대비: 환경 변수 검증 및 설정
 * - 보안성: 민감 정보 검증
 * - 유지보수성: 설정 중앙화
 */

export type EnvConfig = {
  NAVER_MAP_CLIENT_ID: string;
  LLM_API_URL: string | null;
  VWORLD_API_KEY: string | null;
  APP_URL: string | null;
};

/** Next.js는 process.env.KEY 정적 접근만 빌드 시 인라인. 동적 process.env[key] 미지원 */
export function getEnvConfig(): EnvConfig {
  const navId =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID) ?? "";
  if (!navId && typeof window === "undefined") {
    console.warn("[Env] NEXT_PUBLIC_NAVER_MAP_CLIENT_ID 미설정. .env.local을 확인하세요.");
  }

  return {
    NAVER_MAP_CLIENT_ID: navId,
    LLM_API_URL:
      (typeof process !== "undefined" && process.env.NEXT_PUBLIC_LLM_API_URL) ?? null,
    VWORLD_API_KEY:
      (typeof process !== "undefined" && process.env.NEXT_PUBLIC_VWORLD_API_KEY) ?? null,
    APP_URL: (typeof process !== "undefined" && process.env.NEXT_PUBLIC_APP_URL) ?? null,
  };
}

export function isNaverMapAvailable(): boolean {
  const config = getEnvConfig();
  return Boolean(config.NAVER_MAP_CLIENT_ID?.trim());
}
