# 빗물받이 현황 (쓰리봇 웹사이트)

Next.js 기반 빗물받이 현황 화면입니다.  
**왼쪽 리스트 | 중앙 네이버 지도 | 오른쪽 상세** 구조로 되어 있으며, 리스트에서 항목을 클릭하면 해당 좌표로 지도가 부드럽게 이동(flyTo)합니다.

## 구조

- **왼쪽**: 빗물받이 목록 (상태별 색 점, 이름/주소)
- **중앙**: 네이버 지도 – "빗물받이 현황" 지도, 마커 클릭 시 오른쪽 상세 연동
- **오른쪽**: 선택한 빗물받이 상세 정보

## 실행 방법

1. 의존성 설치  
   `npm install`

2. 네이버 지도 API 키 설정  
   - [NCP 콘솔](https://www.ncloud.com/product/applicationService/maps)에서 Maps API 사용 신청 후 **Client ID(또는 API 키)** 발급  
   - **웹 서비스 URL(Referrer) 필수**: NCP 콘솔 → Application → 해당 애플리케이션 → **웹 서비스 URL**에 아래를 등록해야 인증이 됩니다.  
     - `http://localhost:3000` (개발용)  
     - 배포 시 실제 도메인 추가 (예: `https://your-domain.com`)  
   - 프로젝트 루트에 `.env.local` 생성 후 아래 추가:

   ```env
   NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=발급받은_Client_ID
   ```

3. 개발 서버 실행  
   `npm run dev`

4. 브라우저에서 `http://localhost:3000` 접속

## API 연동

- 현재는 `src/data/mock-storm-drains.ts` 목업 데이터를 사용합니다.
- 실제 백엔드 API가 있으면 해당 목록을 API 호출 결과로 교체하면 됩니다.
