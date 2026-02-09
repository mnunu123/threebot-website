# 플랫폼 개발자용 핵심 가이드

## 1. "ML은 수치를 만들고, LLM은 그 수치를 해석해"

- **ML 모델**: 부피·유동인구·피해 규모를 분석해 `priority_score`, `risk_reason`, `flood_probability` 등을 **DB에 저장**합니다.
- **LLM 에이전트**: 그 글(데이터)을 읽고, 사용자에게 **"매우 위험하니 당장 청소팀을 보내세요"**처럼 실행 가능한 권고를 제안합니다.

즉, ML이 "이곳은 90% 차있고 유동인구가 많아 우선순위 1위야"라고 DB에 써놓으면, LLM이 그걸 해석해 사람이 이해하기 쉬운 액션으로 전달하는 구조입니다.

---

## 2. Tailscale 접속 정보

연식님의 5090 서버(vLLM)에 접속하려면:

1. `.env` 파일에 아래 변수를 설정하세요.
2. **Tailscale 가상 IP**와 **API Key**를 동료에게 받아 입력합니다.

```env
VLLM_BASE_URL=http://100.x.x.x:8000/v1
VLLM_API_KEY=your-api-key-if-required
VLLM_MODEL=meta-llama/Llama-3-70b-instruct
```

- `100.x.x.x`는 Tailscale이 부여한 사무실 서버의 가상 IP입니다.
- 반드시 Tailscale 네트워크에 접속한 상태에서만 vLLM 서버에 연결됩니다.

---

## 3. DB 스키마 공유

통계학과(ML) 팀과 **컬럼명을 미리 맞춰야** LLM이 정확한 데이터를 읽어올 수 있습니다.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `location_id` | str | 빗물받이 고유 ID |
| `volume_L` | float | 부피 (L) |
| `max_height_mm` | float | 최대 높이 (mm) |
| `priority_score` | int | 우선순위 (1=최우선) |
| `risk_reason` | str | 위험 사유 |
| `flood_probability` | float | 침수 확률 (0~1) |
| `cri` | int | 위험지수 CRI |

ML 팀이 위 컬럼명으로 분석 결과를 DB에 저장하면, LLM Orchestrator가 자동으로 조회해 사용자 질문에 반영합니다.
