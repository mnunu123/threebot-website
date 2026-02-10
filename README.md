# 빗물받이 현황 (쓰리봇 웹사이트)

Next.js 기반 빗물받이 현황 화면입니다.  
**왼쪽 리스트 | 중앙 네이버 지도 | 오른쪽 상세** 구조로 되어 있으며, 리스트에서 항목을 클릭하면 해당 좌표로 지도가 부드럽게 이동(flyTo)합니다.

## 구조

- **왼쪽**: 빗물받이 목록 (상태별 색 점, 이름/주소)
- **중앙**: 네이버 지도 – "빗물받이 현황" 지도, 마커 클릭 시 오른쪽 상세 연동
- **오른쪽**: 선택한 빗물받이 상세 정보

---

## 웹 실행에 필요한 라이브러리 (의존성)

아래 패키지들은 `npm install` 한 번으로 모두 설치됩니다. 클라우드 서버에서 웹을 열기 전 참고용으로 정리했습니다.

### 런타임 의존성 (dependencies)

| 패키지 | 버전 | 용도 |
|--------|------|------|
| `next` | ^14.2.0 | Next.js 프레임워크 |
| `react` | ^18.2.0 | React |
| `react-dom` | ^18.2.0 | React DOM |
| `framer-motion` | ^12.33.0 | 애니메이션 (채팅·사이드바·Dock 등) |
| `lucide-react` | ^0.563.0 | 아이콘 (검색, 설정, 대시보드 등) |
| `class-variance-authority` | ^0.7.1 | 버튼/컴포넌트 variant 스타일 |
| `clsx` | ^2.1.1 | className 조건부 결합 |
| `tailwind-merge` | ^3.4.0 | Tailwind 클래스 병합 |
| `@radix-ui/react-tooltip` | ^1.2.8 | 툴팁 UI (Dock 등) |
| `leaflet` | ^1.9.4 | 지도 (시군구 경계 등) |
| `react-leaflet` | ^4.2.1 | React용 Leaflet 래퍼 |
| `recharts` | ^3.7.0 | 차트 (대시보드·리포트) |
| `@types/leaflet` | ^1.9.21 | Leaflet 타입 정의 |

### 개발·빌드 의존성 (devDependencies)

| 패키지 | 버전 | 용도 |
|--------|------|------|
| `typescript` | ^5.0.0 | TypeScript |
| `@types/node` | ^20.0.0 | Node.js 타입 정의 |
| `@types/react` | ^18.2.0 | React 타입 정의 |
| `@types/react-dom` | ^18.2.0 | React DOM 타입 정의 |
| `tailwindcss` | ^3.4.0 | Tailwind CSS |
| `postcss` | ^8.4.0 | PostCSS |
| `autoprefixer` | ^10.4.0 | CSS 벤더 프리픽스 |
| `eslint` | ^8.0.0 | 린트 |
| `eslint-config-next` | ^14.2.0 | Next.js ESLint 설정 |

### 한 번에 설치

```bash
npm install
```

---

## 실행 방법

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정 (`.env.local`)

프로젝트 루트에 `.env.local` 파일을 만들고 아래 항목을 설정합니다.

- **네이버 지도**  
  - [NCP 콘솔](https://www.ncloud.com/product/applicationService/maps)에서 Maps API 사용 신청 후 **Client ID** 발급  
  - **웹 서비스 URL(Referrer)** 에 `http://localhost:3000`(개발), 배포 시에는 실제 도메인(예: `https://your-domain.com`) 등록  
  - `.env.local` 예시:

  ```env
  NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=발급받은_Client_ID
  ```

- **LLM API (채팅 NOVA)**  
  - 선택 사항. 설정하지 않으면 코드 내 기본 URL(ngrok 등) 사용  
  - 다른 서버를 쓰려면:

  ```env
  NEXT_PUBLIC_LLM_API_URL=https://your-llm-api.example.com
  ```

  참고: `.env.example` 에 예시가 있습니다.

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 접속.

### 4. 클라우드 서버에서 프로덕션 빌드 후 실행

```bash
npm run build
npm start
```

`npm start` 는 기본적으로 포트 3000에서 서버를 띄웁니다. 다른 포트가 필요하면 `PORT=8080 npm start` 처럼 환경 변수로 지정할 수 있습니다.

---

## API 연동

- 현재는 `src/data/mock-storm-drains.ts` 목업 데이터를 사용합니다.
- 실제 백엔드 API가 있으면 해당 목록을 API 호출 결과로 교체하면 됩니다.
