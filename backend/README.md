# Nova Robotics - 빗물받이 관리 플랫폼 Backend

휴대폰 포인트 클라우드 기반 빗물받이 쓰레기 관리 및 침수 위험 예측 플랫폼의 백엔드 서비스.

## 아키텍처 개요

```
[모바일 앱] → Data Ingestion API → [DB] ← ML Pipeline (Stats Team)
                                       ↑
[사용자 질문] → Chat API → LLM Orchestrator → vLLM (Tailscale)
                    ↓
              Intent Routing → Context Retrieval → Prompt Synthesis
                    ↓
              Tool Calling (get_drainage_data, generate_risk_chart, send_admin_alert)
```

**핵심 개념**: "ML은 수치를 만들고, LLM은 그 수치를 해석한다"
- ML: `priority_score`, `risk_reason`, `flood_probability` 등을 DB에 저장
- LLM: 해당 수치를 읽고 사용자에게 "매우 위험하니 당장 청소팀을 보내세요"처럼 실행 가능한 권고 제공

---

## File Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI 앱 진입점
│   ├── config.py            # 환경 변수
│   ├── database.py          # 비동기 DB 연결
│   ├── models.py            # DrainageData 모델 (원본 + ML)
│   ├── schemas.py           # Pydantic 스키마
│   ├── api/
│   │   ├── ingestion.py     # POST /ingestion/drainage
│   │   ├── chat.py          # POST /chat/query
│   │   └── health.py        # GET /health
│   ├── services/
│   │   ├── ml_pipeline.py   # ML 분석 트리거
│   │   ├── llm_orchestrator.py  # Intent → Context → vLLM
│   │   └── tools.py         # Function Calling 정의
│   └── core/
│       └── fallback.py      # LLM/ML 실패 시 기본 답변
├── requirements.txt
├── .env.example
└── README.md
```

---

## 설치 및 실행

### 1. 가상환경 및 의존성

```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
```

### 2. 환경 변수 (.env)

`.env.example`을 복사해 `.env`를 만들고 값을 채웁니다.

**필수**:
- `VLLM_BASE_URL`: 사무실 5090 서버의 Tailscale IP (예: `http://100.x.x.x:8000/v1`)
- `VLLM_API_KEY`: vLLM 서버에서 API 키를 요구할 경우

**Tailscale 접속 정보**: 연식님 5090 서버에 접속하기 위한 API Key와 가상 IP를 동료의 `.env`에 세팅하세요.

### 3. 실행

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

- API 문서: http://localhost:8001/docs
- Health: http://localhost:8001/health

---

## API 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| POST | `/ingestion/drainage` | 모바일 앱 → `location_id`, `volume_L`, `max_height_mm` 수신 |
| POST | `/chat/query` | 사용자 질문 → LLM 조율 → 답변 반환 |
| GET | `/health` | 서비스 상태 확인 |

---

## DB 스키마 협의

통계학과(ML) 팀과 **컬럼명을 미리 맞춰야** LLM이 정확한 데이터를 읽어옵니다.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `location_id` | str | 빗물받이 고유 ID |
| `volume_L` | float | 부피 (L) |
| `max_height_mm` | float | 최대 높이 (mm) |
| `priority_score` | int | 우선순위 (1=최우선) |
| `risk_reason` | str | 위험 사유 |
| `flood_probability` | float | 침수 확률 (0~1) |
| `cri` | int | 위험지수 CRI |

---

## Fault Tolerance

- **LLM 타임아웃/오류**: `fallback_enabled=true` 시 기본 안내 문구 반환
- **ML 데이터 미준비**: `ml_no_data` Fallback 및 기본값(`priority_score=0` 등) 사용

---

## 라이선스

Nova Robotics Internal
