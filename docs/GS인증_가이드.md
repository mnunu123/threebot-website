# GS 인증(우수소프트웨어 인증) 대비 가이드

## 1. 개요

본 프로젝트는 **GS 인증(소프트웨어 품질 인증)** 대비를 위해 ISO/IEC 25023, 25051, 25041 기반 품질 특성을 반영하여 구조화되어 있습니다.

## 2. 반영된 품질 특성 및 구현

| 품질 특성 | 반영 내용 |
|----------|----------|
| **사용성(접근성)** | WCAG 2.1 기반 스킵 링크, `lang="ko"`, 키보드 포커스 시각화(`:focus-visible`), `aria-label`·`role` 적용 |
| **유지보수성** | 환경 설정 중앙화(`src/config/env.ts`), 입력 검증 모듈(`src/lib/validation.ts`), 에러 바운더리(`ErrorBoundary`) |
| **보안성** | 배수구 코드 입력 검증(`isValidDrainCode`), 검색어 길이 제한·정제(`sanitizeSearchInput`) |
| **신뢰성** | 예기치 않은 오류 시 복구 UI 제공(ErrorBoundary), 입력 검증으로 잘못된 요청 방지 |
| **문서 요구사항** | README, 기획안, 본 GS 인증 가이드 |

## 3. 파일별 역할

### 접근성
- `src/app/layout.tsx`: 스킵 링크(`#main-content`), `lang="ko"`
- `src/app/globals.css`: `:focus-visible` 포커스 링 스타일
- `src/components/StormDrainLayout.tsx`: `#main-content`, `role="application"`, `aria-label`
- `src/components/SidebarNav.tsx`: `role="navigation"`, `aria-label="메인 메뉴"`

### 설정·검증
- `src/config/env.ts`: 환경 변수 로드·검증, `getEnvConfig()`, `isNaverMapAvailable()`
- `src/lib/validation.ts`: `isValidDrainCode()`, `sanitizeSearchInput()`

### 신뢰성
- `src/components/ErrorBoundary.tsx`: 오류 발생 시 사용자 안내·다시 시도 버튼

## 4. 추가 권장 사항

- **성능**: Lighthouse·Core Web Vitals 점검
- **접근성**: axe, WAVE 등 자동 검사 도구 활용
- **테스트**: 단위·통합 테스트 보강
- **보안**: API 호출 시 HTTPS, 인증·인가 체계 구축(실서비스 배포 시)
