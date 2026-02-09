"""
채팅 → LLM 오케스트레이션 디버깅용 로깅.
터미널에서 흐름을 추적할 수 있도록 stdout에 단계별로 출력합니다.
"""

import logging
import sys
# 디버깅 전용 로거 (콘솔에만 출력)
_debug_log = logging.getLogger("chat_orchestration_debug")
_debug_log.setLevel(logging.DEBUG)
_debug_log.handlers.clear()
_h = logging.StreamHandler(sys.stdout)
_h.setLevel(logging.DEBUG)
_h.setFormatter(logging.Formatter("[CHAT_DEBUG] %(message)s"))
_debug_log.addHandler(_h)
_debug_log.propagate = False


def debug_request(query: str, session_id: str | None = None) -> None:
    """[1] API가 사용자 입력을 수신했을 때."""
    _debug_log.debug("=" * 60)
    _debug_log.debug("[1] API 수신 (POST /chat/query)")
    _debug_log.debug("    query: %s", repr(query))
    if session_id:
        _debug_log.debug("    session_id: %s", session_id)
    _debug_log.debug("-" * 60)


def debug_intent(query: str, intent: str) -> None:
    """[2] Intent 분류 결과."""
    _debug_log.debug("[2] Intent Routing 결과")
    _debug_log.debug("    사용자 질문: %s", repr(query))
    _debug_log.debug("    분류된 Intent: %s", intent)
    _debug_log.debug("-" * 60)


def debug_context(context: str) -> None:
    """[3] DB에서 가져온 컨텍스트."""
    _debug_log.debug("[3] Context Retrieval (DB 조회 결과)")
    _debug_log.debug("    컨텍스트 (앞 500자):\n%s", (context[:500] + "..." if len(context) > 500 else context))
    _debug_log.debug("-" * 60)


def debug_prompt_synthesis(user_msg: str, system_prompt: str) -> None:
    """[4] LLM에 보낼 최종 프롬프트 (Prompt Synthesis 결과)."""
    _debug_log.debug("[4] Prompt Synthesis (LLM에 전달할 메시지)")
    _debug_log.debug("    [system] 길이=%d", len(system_prompt))
    _debug_log.debug("    [user] (전체):\n%s", user_msg)
    _debug_log.debug("-" * 60)


def debug_llm_request(endpoint: str, model: str) -> None:
    """[5] vLLM 요청 직전."""
    _debug_log.debug("[5] vLLM 요청")
    _debug_log.debug("    endpoint: %s", endpoint)
    _debug_log.debug("    model: %s", model)
    _debug_log.debug("-" * 60)


def debug_llm_response(answer: str, tools_used: list[str] | None = None) -> None:
    """[6] LLM 응답 수신."""
    _debug_log.debug("[6] vLLM 응답 수신")
    _debug_log.debug("    tools_used: %s", tools_used or [])
    _debug_log.debug("    answer (앞 300자): %s", (answer[:300] + "..." if len(answer) > 300 else answer))
    _debug_log.debug("=" * 60)


def debug_llm_error(error: Exception) -> None:
    """LLM 오류 시."""
    _debug_log.debug("[ERROR] vLLM 호출 실패: %s", error)
    _debug_log.debug("=" * 60)


def debug_api_response(answer: str, intent: str | None, tools_used: list[str] | None) -> None:
    """[7] API가 클라이언트에 반환하는 응답."""
    _debug_log.debug("[7] API 응답 (클라이언트로 반환)")
    _debug_log.debug("    intent: %s", intent)
    _debug_log.debug("    tools_used: %s", tools_used or [])
    _debug_log.debug("    answer: %s", (answer[:200] + "..." if len(answer) > 200 else answer))
    _debug_log.debug("=" * 60)
