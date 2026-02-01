# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-02-01

### 개요

AXIS Design System v1.0.0 최초 안정 릴리스.
Phase 0~8을 거쳐 디자인 토큰, Core UI 30개, Agentic UI 16개, 테마 시스템,
CLI, MCP 서버, 문서 사이트를 완성한 첫 정식 버전입니다.

### Added

- **Phase 4: 템플릿 시스템**
  - 템플릿 갤러리 UI (Dashboard, Landing Page, Theme Only)
  - `/templates/[slug]` 상세 페이지

- **Phase 5: Template Engine + CLI**
  - CLI `template` 명령어 구현
  - DiffViewer, PlanCard, ContextPanel, TokenUsageIndicator, AttachmentCard 추가

- **Phase 6: MCP 연동 고도화**
  - MCP 템플릿 도구 5종 (list, get, apply, diff, check)
  - Claude Code 워크플로 가이드 문서화

- **Phase 7: 외부 DS 연합형 확장**
  - shadcn/monet 외부 블록 연동
  - 기여 가이드(Contribute 페이지) 및 라이선스 자동화

- **Phase 8: v1.0 안정화**
  - ui-react 80건, agentic-ui 54건, theme 21건, cli 58건 — 총 213건 단위 테스트 추가
  - Vitest + Testing Library 테스트 인프라 구축
  - 문서 사이트 전수 검사 (60+ 페이지) 및 깨진 링크 2건 수정
  - npm dry-run 배포 검증 (5개 패키지)
  - CHANGELOG v1.0.0 작성

### Changed

- 전 패키지 버전 0.1.0 → 1.0.0으로 범핑
- `workspace:*` 내부 의존성 정합성 확인 완료

### Fixed

- 문서 사이트 `/onboarding` 깨진 링크 제거
- 홈페이지 `/agentic/approval-card` → `/agentic/approval-dialog` 경로 수정

### Breaking Changes

- 해당 없음 (최초 정식 릴리스)

---

## [0.7.1] - 2026-01-24

### Added

- **Core UI 컴포넌트 5개 추가** (`@axis-ds/ui-react`)
  - Avatar: 이미지/이니셜 아바타, 4개 크기 지원
  - Tooltip: Radix UI 기반 툴팁
  - Skeleton: 로딩 상태 플레이스홀더
  - Alert: 5개 variant (default, info, success, warning, destructive)
  - Progress: 진행 바, 3개 크기, 4개 색상

- **Agentic UI 문서 6개 추가** (`apps/web`)
  - RunProgress, StepTimeline, SourcePanel
  - RecoveryBanner, AgentAvatar, ThinkingIndicator

- **Core UI 문서 5개 추가** (`apps/web`)
  - Avatar, Tooltip, Skeleton, Alert, Progress

### Changed

- **네비게이션 업데이트**
  - `/components` 페이지: 15개 컴포넌트로 확장
  - `/agentic` 페이지: 10개 실제 구현 컴포넌트로 수정

### Metrics

- 총 컴포넌트: 20개 → **25개**
- 문서 완성도: 56% → **100%**

---

## [0.7.0] - 2026-01-23

### Changed

- **프로젝트 정리**: Discovery Portal 관련 내용 제거, Design System 전용 프로젝트로 정리
  - Claude agents/commands/skills 삭제
  - Backend (FastAPI) 삭제
  - packages/shared, packages/ui 삭제
  - 문서 정리 및 재작성

### Added

- **Library 페이지 UI**
  - `/library` - 메인 페이지 (카테고리 탭, 소스 필터, 검색)
  - `/library/[category]` - 카테고리별 목록
  - `/library/[category]/[slug]` - 컴포넌트 상세 페이지

- **Claude Code 확장 기능 (SSDD)**
  - Skills 8개: `/ax-health`, `/ax-build`, `/ax-component`, `/ax-wrap-up`, `/ax-dev`, `/ax-library`, `/ax-mcp`, `/ax-release`
  - Hooks 3개: Pre-commit 타입체크, Post-edit 컴포넌트 타입체크, Post-edit 레지스트리 빌드
  - Custom Commands 4개: `/status`, `/components`, `/registry`, `/clean`
  - Agents 3개: `component-dev`, `docs-writer`, `code-reviewer`

---

## [0.6.2] - 2026-01-23

### Added

- **AXIS Design System 사이트 구현**
  - 메인 페이지: Hero 섹션, Core UI/Agentic UI 컴포넌트 갤러리
  - `/components`: 10개 기본 UI 컴포넌트 목록 및 상세 페이지
  - `/agentic`: 10개 Agentic UI 컴포넌트 목록 및 상세 페이지
  - `/docs`: 설치 가이드 페이지

- **프로덕션 배포**
  - Frontend: https://ds.minu.best (Cloudflare Pages)

---

## [0.6.1] - 2026-01-23

### Added

- **디자인 시스템 리소스 연동**
  - shadcn/ui MCP 서버 연동
  - AXIS Registry 구축 (20개 컴포넌트)
  - Monet CLI 클라이언트
  - V0.dev 프롬프트 연동

---

## [0.6.0] - 2026-01-22

### Added

- **Monorepo 구조 설정**
  - pnpm workspace + Turborepo
  - Next.js 15 웹앱

- **Design System 패키지**
  - `@axis-ds/tokens`: 디자인 토큰
  - `@axis-ds/ui-react`: React 컴포넌트
  - `@axis-ds/agentic-ui`: AI/Agent UI 컴포넌트
  - `@axis-ds/theme`: 테마 시스템
  - `@axis-ds/cli`: CLI 도구
  - `@axis-ds/mcp`: MCP 서버
