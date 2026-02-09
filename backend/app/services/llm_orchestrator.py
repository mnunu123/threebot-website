"""LLM Orchestrator: Intent Routing → Context Retrieval → Prompt Synthesis → vLLM (Tailscale)."""

from typing import Any, Optional

from openai import AsyncOpenAI
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.core.fallback import get_fallback_response, get_default_ml_values
from app.core.debug_chat import (
    debug_context,
    debug_intent,
    debug_llm_error,
    debug_llm_request,
    debug_llm_response,
    debug_prompt_synthesis,
)
from app.models import DrainageData
from app.services.tools import get_tool_definitions

settings = get_settings()

# Tailscale IP로 vLLM 서버 연결 (OpenAI 호환)
def _get_openai_client() -> AsyncOpenAI:
    return AsyncOpenAI(
        base_url=settings.vllm_base_url,
        api_key=settings.vllm_api_key or "not-needed",
    )


INTENT_SYSTEM = """당신은 빗물받이 관리 플랫폼의 의도 분류기입니다.
사용자 질문을 다음 중 하나로만 분류하세요:
- data_analysis: 데이터 분석, 통계, 위험도 조회, 특정 지점 정보 등
- system_action: 메시지 전송, 차트 생성, 알림 발송 등 액션 수행
- general: 일반 상담, 인사, 설명 요청 등

답변은 반드시 한 단어로만: data_analysis / system_action / general"""


async def classify_intent(query: str) -> str:
    """Intent Routing: LLM으로 질문 분류."""
    try:
        client = _get_openai_client()
        resp = await client.chat.completions.create(
            model=settings.vllm_model,
            messages=[
                {"role": "system", "content": INTENT_SYSTEM},
                {"role": "user", "content": query},
            ],
            max_tokens=32,
        )
        text = (resp.choices[0].message.content or "general").strip().lower()
        for intent in ("data_analysis", "system_action", "general"):
            if intent in text:
                return intent
        return "general"
    except Exception:
        return "general"


async def get_context_for_query(
    session: AsyncSession,
    query: str,
    location_id: Optional[str] = None,
) -> str:
    """Context Retrieval: DB에서 원본 + ML 분석 결과 조회."""
    stmt = select(DrainageData).order_by(DrainageData.created_at.desc())
    if location_id:
        stmt = stmt.where(DrainageData.location_id == location_id)
    stmt = stmt.limit(20)
    result = await session.execute(stmt)
    rows = result.scalars().all()

    if not rows:
        defs = get_default_ml_values()
        return f"[DB 데이터 없음] ML 기본값: {defs}"

    lines = []
    for r in rows:
        d = {
            "location_id": r.location_id,
            "volume_L": r.volume_L,
            "max_height_mm": r.max_height_mm,
            "priority_score": r.priority_score,
            "risk_reason": r.risk_reason,
            "flood_probability": r.flood_probability,
            "cri": r.cri,
            "address": r.address,
        }
        lines.append(str(d))
    return "\n".join(lines)


AGENT_SYSTEM = """당신은 Nova Robotics 빗물받이 관리 플랫폼의 AI 에이전트입니다.
- ML이 만든 수치(priority_score, risk_reason, flood_probability)를 해석해 사용자에게 실행 가능한 권고를 제공합니다.
- 예: "이곳은 90% 차있고 유동인구가 많아 우선순위 1위야" → "매우 위험하니 당장 청소팀을 보내세요"처럼 구체적으로 제안합니다.
- 필요한 경우 get_drainage_data, generate_risk_chart, send_admin_alert 도구를 호출하세요.
- 한글로 답변합니다."""


async def orchestrate(
    session: AsyncSession,
    query: str,
) -> tuple[str, Optional[str], list[str]]:
    """
    Agentic Workflow: Intent → Context → Prompt → vLLM.
    Returns: (answer, intent, tools_used)
    """
    intent = await classify_intent(query)
    debug_intent(query, intent)

    context = await get_context_for_query(session, query)
    debug_context(context)

    user_msg = f"""[컨텍스트 - DB 조회 결과]
{context}

[사용자 질문]
{query}
"""
    debug_prompt_synthesis(user_msg, AGENT_SYSTEM)

    tools_used: list[str] = []
    messages = [
        {"role": "system", "content": AGENT_SYSTEM},
        {"role": "user", "content": user_msg},
    ]

    try:
        client = _get_openai_client()
        debug_llm_request(settings.vllm_base_url, settings.vllm_model)
        resp = await client.chat.completions.create(
            model=settings.vllm_model,
            messages=messages,
            tools=get_tool_definitions(),
            tool_choice="auto",
            max_tokens=1024,
        )
    except Exception as e:
        debug_llm_error(e)
        err = "llm_timeout" if "timeout" in str(e).lower() else "llm_error"
        return (
            get_fallback_response(err, query, settings.fallback_enabled),
            intent,
            tools_used,
        )

    choice = resp.choices[0]
    msg = choice.message

    # Tool calls 처리 (최대 2회 루프)
    for _ in range(2):
        tc_list = getattr(msg, "tool_calls", None) or []
        if not tc_list:
            break
        # Assistant 메시지 추가 (API 호환 dict)
        asst: dict[str, Any] = {"role": "assistant", "content": msg.content or ""}
        if tc_list and hasattr(msg, "model_dump"):
            d = msg.model_dump(exclude_none=True)
            if "tool_calls" in d:
                asst["tool_calls"] = d["tool_calls"]
        messages.append(asst)
        for tc in tc_list:
            name = getattr(tc.function, "name", "") or ""
            args_str = getattr(tc.function, "arguments", "{}") or "{}"
            tools_used.append(name)
            result = await _execute_tool(session, name, args_str)
            messages.append({
                "role": "tool",
                "tool_call_id": tc.id,
                "content": str(result),
            })
        resp = await client.chat.completions.create(
            model=settings.vllm_model,
            messages=messages,
            tools=get_tool_definitions(),
            tool_choice="auto",
            max_tokens=1024,
        )
        msg = resp.choices[0].message

    answer = (msg.content or "").strip()
    if not answer:
        answer = get_fallback_response("llm_error", query, settings.fallback_enabled)
    debug_llm_response(answer, tools_used)
    return answer, intent, tools_used


async def _execute_tool(
    session: AsyncSession,
    name: str,
    args_str: str,
) -> Any:
    """도구 실행 (get_drainage_data, generate_risk_chart, send_admin_alert)."""
    import json

    try:
        args = json.loads(args_str) if args_str else {}
    except json.JSONDecodeError:
        args = {}

    if name == "get_drainage_data":
        lid = args.get("location_id", "")
        from sqlalchemy import select
        stmt = (
            select(DrainageData)
            .where(DrainageData.location_id == lid)
            .order_by(DrainageData.created_at.desc())
            .limit(1)
        )
        r = await session.execute(stmt)
        row = r.scalar_one_or_none()
        if not row:
            return {"error": "해당 location_id 데이터 없음", "location_id": lid}
        return {
            "location_id": row.location_id,
            "volume_L": row.volume_L,
            "max_height_mm": row.max_height_mm,
            "priority_score": row.priority_score,
            "risk_reason": row.risk_reason,
            "flood_probability": row.flood_probability,
            "cri": row.cri,
        }

    if name == "generate_risk_chart":
        data = args.get("data", {})
        return {"chart_data": data, "message": "차트용 JSON 생성됨"}

    if name == "send_admin_alert":
        msg = args.get("message", "")
        # Webhook/이메일 전송 (실제 구현 시 httpx 등 사용)
        if settings.admin_webhook_url:
            import httpx
            async with httpx.AsyncClient() as c:
                await c.post(settings.admin_webhook_url, json={"text": msg})
        return {"ok": True, "message": "관리자 알림 전송 완료"}

    return {"error": f"알 수 없는 도구: {name}"}
