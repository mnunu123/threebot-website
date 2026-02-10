/**
 * GS 인증 대비: 입력 검증 유틸
 * - 보안성: XSS·입력 검증
 * - 기능정확성: 유효 입력만 허용
 */

/** 배수구 코드: 영문·숫자·하이픈 허용, 최대 20자 */
const DRAIN_CODE_PATTERN = /^[A-Za-z0-9\-]{1,20}$/;

/** 안전한 문자열 길이 제한 */
const MAX_SEARCH_LENGTH = 100;

/**
 * 배수구 코드 검증. 예: AA-013, SD-2024-001
 */
export function isValidDrainCode(input: string): boolean {
  if (typeof input !== "string") return false;
  const trimmed = input.trim();
  return trimmed.length > 0 && DRAIN_CODE_PATTERN.test(trimmed) && trimmed.length <= MAX_SEARCH_LENGTH;
}

/**
 * 검색어 안전 처리: 길이 제한·앞뒤 공백 제거
 */
export function sanitizeSearchInput(input: string): string {
  if (typeof input !== "string") return "";
  return input.trim().slice(0, MAX_SEARCH_LENGTH);
}
