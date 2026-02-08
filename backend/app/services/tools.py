"""LLM Function Calling용 도구 정의."""

from typing import Any

# OpenAI 호환 Function Calling 스키마
TOOLS_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "get_drainage_data",
            "description": "특정 빗물받이(location_id)의 원본 수치(부피, 높이) 및 ML 분석 결과(우선순위, 위험 사유, 침수 확률, CRI 등)를 조회합니다.",
            "parameters": {
                "type": "object",
                "properties": {
                    "location_id": {
                        "type": "string",
                        "description": "빗물받이 고유 ID (예: 1, 2, AA-013)",
                    },
                },
                "required": ["location_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "generate_risk_chart",
            "description": "위험도 분석 결과를 시각화하기 위한 JSON 데이터를 생성합니다. 프론트엔드에서 차트 렌더링에 사용합니다.",
            "parameters": {
                "type": "object",
                "properties": {
                    "data": {
                        "type": "object",
                        "description": "차트에 표시할 데이터 (location_id, priority_score, flood_probability 등)",
                    },
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "send_admin_alert",
            "description": "긴급 상황 시 관리자에게 알림을 전송합니다. 침수 위험이 높거나 즉시 조치가 필요한 경우 사용합니다.",
            "parameters": {
                "type": "object",
                "properties": {
                    "message": {
                        "type": "string",
                        "description": "관리자에게 전달할 긴급 메시지",
                    },
                },
                "required": ["message"],
            },
        },
    },
]


def get_tool_definitions() -> list[dict[str, Any]]:
    """LLM에 전달할 도구 정의 목록."""
    return TOOLS_DEFINITIONS
