# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
