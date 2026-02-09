# 채팅 → LLM 오케스트레이션 디버깅 가이드

"물어보기"에 입력한 문자가 LLM 프롬프트로 제대로 전달되는지 확인하는 방법입니다.

## 1. 백엔드 실행

```bash
cd backend
pip install -r requirements.txt
python run.py
# 또는: uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

## 2. 프론트엔드 실행

```bash
# 프로젝트 루트에서
npm run dev
```

브라우저에서 `/chat` 페이지로 이동한 뒤, "물어보기" 입력창에 **예시 문장**을 입력하고 전송(→) 버튼을 누릅니다.

---

## 3. 디버깅으로 확인하는 위치

### A. 브라우저 개발자 도구 (F12 → Console)

전송 시 다음 그룹이 출력됩니다:

- **\[1] 사용자 입력** – "물어보기"에 넣은 문자가 그대로 표시되는지 확인
- **\[2] API 요청 payload** – `{ query: "입력한 문자", session_id: null }`
- **\[3] 요청 URL** – `http://localhost:8001/chat/query`
- **\[4] API 응답 상태** – 200이면 정상
- **\[5] API 응답 body** – `answer`, `intent`, `tools_used`
- **\[6] LLM이 생성한 답변** – `answer` 필드 값

→ 여기서 **입력한 문자 = API로 보내진 query** 인지 확인하면 됩니다.

### B. 백엔드 터미널 (uvicorn 실행 중인 터미널)

요청이 들어올 때마다 `[CHAT_DEBUG]` 로그가 단계별로 출력됩니다:

| 단계 | 로그 내용 |
|------|-----------|
| [1] API 수신 | `query: '입력한 문자'` |
| [2] Intent Routing | 분류된 의도 (data_analysis / system_action / general) |
| [3] Context Retrieval | DB에서 가져온 컨텍스트 (앞 500자) |
| [4] Prompt Synthesis | **LLM에 전달되는 최종 프롬프트 전체** ([사용자 질문] 포함) |
| [5] vLLM 요청 | endpoint, model |
| [6] vLLM 응답 | tools_used, answer (앞 300자) |
| [7] API 응답 | 클라이언트로 반환하는 answer 요약 |

→ **[4] Prompt Synthesis** 에서 사용자가 입력한 문자가 `[사용자 질문]` 아래에 그대로 들어가 있는지 보면, **문자 → 프롬프트 변환**이 제대로 되었는지 확인할 수 있습니다.

---

## 4. API URL 변경

프론트엔드가 다른 주소의 백엔드를 쓰려면 프로젝트 루트 `.env.local` 에 추가:

```
NEXT_PUBLIC_CHAT_API_URL=http://localhost:8001
```

---

## 5. 동작 요약

1. 사용자가 "물어보기"에 문자 입력 후 전송
2. 프론트엔드가 `POST /chat/query` 로 `{ query: "입력한 문자" }` 전송
3. 백엔드가 수신 → Intent 분류 → DB 컨텍스트 조회 → **프롬프트 합성** (사용자 질문 포함) → vLLM 호출
4. LLM 응답을 그대로 `answer` 로 반환 → 화면에 "LLM 응답 (디버깅용)" 으로 표시

콘솔과 터미널 로그로 1→2→3→4 가 한 번에 추적 가능합니다.
