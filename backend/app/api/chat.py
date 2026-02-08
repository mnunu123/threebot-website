"""User Query API: LLM Orchestrator 연동."""

import asyncio
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.debug_chat import debug_api_response, debug_request
from app.database import get_db
from app.schemas import ChatRequest, ChatResponse
from app.services.llm_orchestrator import orchestrate

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/query", response_model=ChatResponse)
async def chat_query(
    body: ChatRequest,
    db: AsyncSession = Depends(get_db),
) -> ChatResponse:
    """
    사용자 질문 → Intent Routing → Context Retrieval → Prompt Synthesis → vLLM.
    비동기 처리로 LLM 추론 중에도 플랫폼이 멈추지 않음.
    """
    debug_request(body.query, body.session_id)

    answer, intent, tools_used = await asyncio.wait_for(
        orchestrate(db, body.query),
        timeout=60,
    )

    debug_api_response(answer, intent, tools_used or None)

    return ChatResponse(
        answer=answer,
        intent=intent,
        tools_used=tools_used or None,
    )
