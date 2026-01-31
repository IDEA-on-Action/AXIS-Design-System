# TODO — WI-0007 템플릿 시스템 기반 구축

> WI: WI-0007 | GitHub: #51 | PRD: [prd.md](prd.md)

---

## Phase 4 작업 항목

### 1. 타입 정의
- [x] `apps/web/src/lib/template-types.ts` 생성
- [x] TemplateMetadata, TemplateDetail, TemplateIndex 인터페이스 정의
- [x] TemplateCategory 타입 정의
- [x] templateCategories 상수 정의

### 2. 템플릿 소스 구현
- [x] `apps/web/templates/theme-only/template.json` 생성
- [x] `apps/web/templates/theme-only/files/` 디렉토리 구성
  - [x] layout.tsx
  - [x] page.tsx
  - [x] theme-toggle.tsx
  - [x] globals.css
  - [x] package.json
  - [x] tailwind.config.ts
  - [x] tsconfig.json
- [x] `apps/web/templates/theme-only/README.md` 작성

### 3. 빌드 스크립트
- [x] `apps/web/scripts/build-template-index.mjs` 생성 (ESM)
- [x] templates/ 폴더 순회 → template.json 읽기 → files/ 수집
- [x] `public/templates/index.json` 인덱스 생성
- [x] `public/templates/{slug}.json` 상세 생성
- [x] `apps/web/package.json` build:templates 스크립트 추가

### 4. 갤러리 UI
- [x] `apps/web/src/app/templates/page.tsx` 목록 페이지
  - [x] 검색 + 카테고리 필터 + 카드 그리드
  - [x] `/templates/index.json` client-side fetch
- [x] `apps/web/src/app/templates/[slug]/page.tsx` 상세 라우트 (SSG)
- [x] `apps/web/src/app/templates/[slug]/_components/template-detail-content.tsx`
  - [x] Overview / Files / Setup 탭
  - [x] 파일별 코드 표시, 의존성, 기능 목록
- [x] `apps/web/src/components/site-header.tsx` Templates 네비게이션 추가

### 5. 검증
- [x] `pnpm type-check` 통과
- [x] `pnpm build` 성공 (SSG 포함)

---

## Definition of Done

- [x] 타입 체크 통과
- [x] 빌드 성공
- [x] 갤러리 UI 동작 확인 (빌드 출력에서 /templates, /templates/theme-only 확인)
- [x] 관련 문서 업데이트

---

완료일: 2026-02-01
