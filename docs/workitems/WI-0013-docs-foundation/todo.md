# WI-0013: 문서 사이트 기반 인프라

## Phase 1: 기반 인프라

### 1-1. 다크모드 토글
- [x] next-themes 패키지 설치
- [x] ThemeProvider 래핑 (providers.tsx)
- [x] theme-toggle.tsx 컴포넌트 생성 (system/light/dark)
- [x] site-header.tsx에 테마 토글 통합

### 1-2. 네비게이션 데이터 구조
- [x] config/docs.ts 생성 (NavItem, NavGroup, DocsConfig 타입)
- [x] docsConfig 데이터 (Getting Started / Core UI 30개 / Agentic UI 18개)
- [x] getDocPagerLinks() 헬퍼 함수

### 1-3. 레이아웃 시스템 재설계
- [x] (marketing)/ Route Group 생성 — 마케팅 레이아웃
- [x] (docs)/ Route Group 생성 — 3단 레이아웃
- [x] sidebar-nav.tsx — 좌측 사이드바 (collapsible, 하이라이트)
- [x] mobile-nav.tsx — Sheet 오프캔버스 사이드바
- [x] toc.tsx — 우측 TOC (IntersectionObserver 스크롤 스파이)
- [x] doc-pager.tsx — 이전/다음 문서 네비게이션
- [x] site-footer.tsx — 분리된 푸터
- [x] site-header.tsx 수정 — MobileNav 통합
- [x] 기존 페이지 Route Group으로 이동 (URL 유지)

## Definition of Done
- [x] 타입 체크 통과
- [x] 빌드 성공
- [x] 기존 URL 깨짐 없음
