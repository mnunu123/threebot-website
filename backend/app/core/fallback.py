"""LLM/ML 실패 시 Fallback 로직."""

from typing import Any, Optional


def get_fallback_response(
    error_type: str,
    user_query: str,
    fallback_enabled: bool = True,
) -> str:
    """
    LLM 서버 미응답 또는 ML 데이터 부재 시 기본 답변 반환.

    Args:
        error_type: "llm_timeout" | "llm_error" | "ml_no_data" | "unknown"
        user_query: 사용자 질문 (맥락 반영용)
        fallback_enabled: Fallback 사용 여부

    Returns:
        사용자에게 보여줄 안내 문구
    """
    if not fallback_enabled:
        return (
            "시스템에 일시적인 문제가 있습니다. "
            "잠시 후 다시 시도해 주세요."
        )

    fallbacks = {
        "llm_timeout": (
            "AI 분석 서버 응답이 지연되고 있습니다. "
            "잠시 후 다시 질문해 주세요. "
            "또는 '특정 빗물받이 데이터 조회'처럼 구체적으로 요청해 주시면 빠르게 답변드릴 수 있습니다."
        ),
        "llm_error": (
            "AI 서비스에 일시적인 오류가 발생했습니다. "
            "Tailscale 네트워크 연결과 vLLM 서버 상태를 확인해 주세요."
        ),
        "ml_no_data": (
            "해당 지점의 분석 데이터가 아직 준비되지 않았습니다. "
            "ML 팀에서 부피·유동인구 분석을 완료하면 위험 스코어와 권고 사항을 제공할 수 있습니다."
        ),
        "db_error": (
            "데이터베이스 접근 중 문제가 발생했습니다. "
            "관리자에게 문의해 주세요."
        ),
    }

    return fallbacks.get(error_type, fallbacks["llm_error"])


def get_default_ml_values() -> dict[str, Any]:
    """ML 분석 결과가 없을 때 사용할 기본값."""
    return {
        "priority_score": 0,
        "risk_reason": "분석 데이터 대기 중",
        "flood_probability": 0.0,
        "cri": 50,
    }
