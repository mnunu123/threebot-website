# 빗물받이 DB 연동 및 실제 데이터 입력 가이드

## 개요

- **백엔드**: FastAPI + SQLAlchemy. 실시간 관리를 위해 **Master / Session / Analytics** 3분류 스키마 반영.
- **프론트**: Next.js `/api/drainage`로 백엔드 목록/상세 프록시. `BACKEND_API_URL` 미설정 시 **목업** 사용.
- **실시간 흐름**: 앱 스캔 → POST /ingestion/drainage (즉시 응답) → 백그라운드에서 CRI·AI 분석 → 웹에서 고위험 지역 시각화.

## 1. DB 스키마 (3분류)

| 분류 | 필드 | 설명 |
|------|------|------|
| **Master** | location_id(mgmt_id), address, elevation_type, max_height_mm, name | 변하지 않는 기준 데이터. `elevation_type`: highland / lowland (CRI 저지대 가중치용) |
| **Session** | lat, lng, **last_measured_lat**, **last_measured_lng**, cleaned_at, defect_status | 스캔 시마다 생성. **GPS 우선**: 앱에서 보낸 좌표로 last_measured_* 갱신 |
| **Analytics** | trash_vol_L, cycle_days, cri, risk_reason(AI 권장조치) | 포인트 클라우드·산출값. CRI는 저지대일 때 가중치 적용 |

- **위치 동기화**: DB 기존 좌표보다 앱에서 수집한 GPS를 우선해 `last_measured_lat/lng` 갱신.
- **부실공사 유무**: 앱에서 `defect_status`(none / crack / subsidence / other) 체크리스트로 전송해 신뢰도 확보.

## 2. 환경 설정

### 백엔드 (backend/)

- `backend/.env`에 DB URL (기본 SQLite)
  ```env
  DATABASE_URL=sqlite+aiosqlite:///./storm_drain.db
  ```
- **스키마 변경 시**: 기존 DB가 있으면 테이블 재생성 또는 마이그레이션 필요. 새로 쓸 경우 `init_db()`가 새 컬럼까지 생성. (이전 단일 테이블 스키마를 쓰던 DB는 `storm_drain.db` 삭제 후 재실행하거나, ALTER TABLE로 새 컬럼 추가.)

### 프론트엔드 (Next.js)

- 루트 `.env.local`에 백엔드 주소 (서버 전용)
  ```env
  BACKEND_API_URL=http://localhost:8001
  ```

## 3. 실시간 Ingestion (앱 → 백엔드 → 웹)

### 프로세스

1. **현장 스캔 (Before)** → 청소 수행 → **현장 스캔 (After)**
2. **데이터 산출**: After 부피 - Before 부피 = 쓰레기 부피(trash_vol_L). 앱에서 계산해 보내거나, 서버에 before/after만 보내도 됨.
3. **POST /ingestion/drainage** 로 모든 값(GPS 포함) 전송.
4. **위치 동기화**: 전송된 GPS로 `last_measured_lat/lng` 갱신.
5. **실시간성**: 응답 즉시 반환. CRI·AI 권장조치는 **BackgroundTasks**로 백그라운드 처리.
6. **웹**: Next.js 대시보드에서 CRI가 높은 지역 즉시 시각화 (last_measured 좌표 우선 표시).

### Ingestion 요청 예시

**Before/After로 쓰레기 부피 서버 산출**

```bash
curl -X POST http://localhost:8001/ingestion/drainage \
  -H "Content-Type: application/json" \
  -d '{
    "location_id": "SD-2024-001",
    "before_volume_L": 80.0,
    "after_volume_L": 45.2,
    "max_height_mm": 120,
    "lat": 37.5012,
    "lng": 127.0396,
    "cleaned_at": "2025-02-10T14:00:00",
    "defect_status": "none",
    "address": "서울시 강남구 테헤란로 123",
    "elevation_type": "lowland"
  }'
```

**단일 부피만 전송 (기존 호환)**

```bash
curl -X POST http://localhost:8001/ingestion/drainage \
  -H "Content-Type: application/json" \
  -d '{
    "location_id": "SD-2024-001",
    "volume_L": 120.5,
    "max_height_mm": 45.2
  }'
```

- **필수**: `before_volume_L`+`after_volume_L` **또는** `volume_L` 중 하나.
- **GPS 우선**: `lat`, `lng` 보내면 해당 스캔의 실측 좌표로 저장.
- **defect_status**: 구조적 결함 체크리스트 값 (none | crack | subsidence | other).
- **elevation_type**: lowland 시 CRI에 저지대 가중치 적용 (저지대 + 쓰레기 많음 = CRI 최고점).

## 4. 시드 스크립트 (테스트용)

```bash
cd backend
python -c "
import asyncio
from app.database import async_session, init_db
from app.models import DrainageData

async def seed():
    await init_db()
    async with async_session() as session:
        samples = [
            {
                'location_id': 'SD-2024-001',
                'name': '빗물받이 #1',
                'address': '서울시 강남구 테헤란로 123',
                'lat': 37.5012, 'lng': 127.0396,
                'last_measured_lat': 37.5012, 'last_measured_lng': 127.0396,
                'elevation_type': 'lowland',
                'volume_L': 120.5, 'max_height_mm': 45.2, 'trash_vol_L': 30.0,
                'cri': 97, 'risk_reason': '집중호우 예보와 겹칠 즉시 방문 권장.',
            },
            {
                'location_id': 'SD-2024-002',
                'name': '빗물받이 #2',
                'address': '서울시 강남구 역삼동 456',
                'lat': 37.4989, 'lng': 127.0378,
                'last_measured_lat': 37.4989, 'last_measured_lng': 127.0378,
                'elevation_type': 'highland',
                'volume_L': 80.0, 'max_height_mm': 30.0, 'trash_vol_L': 12.0,
                'cri': 72, 'risk_reason': '다음 강수 전 점검 권장합니다.',
            },
        ]
        for s in samples:
            session.add(DrainageData(**s))
        await session.commit()
    print('Seed done.')

asyncio.run(seed())
"
```

## 5. 동작 확인

1. 백엔드: `cd backend && python run.py` (port 8001)
2. Next.js: 루트에서 `npm run dev`
3. `.env.local`에 `BACKEND_API_URL=http://localhost:8001` 설정
4. 대시보드 접속 → 지도에 DB 빗물받이 표시 (location_id당 최신 1건, last_measured 좌표 우선)
5. ingestion 호출 후 웹 새로고침 시 CRI·위치 반영 확인

## 6. 필드 매핑 요약

| 백엔드 | 프론트 |
|--------|--------|
| location_id | id, manageNo |
| last_measured_lat/lng (우선) → lat/lng | 지도 좌표 |
| name, address, elevation_type, max_height_mm | 동일/상세 |
| cleaned_at, defect_status | lastCleaned, defectiveConstruction |
| trash_vol_L, cycle_days | 수거량·권장 주기 |
| cri (저지대 가중치 반영) | CRI, status |
| risk_reason | aiRecommendation |
