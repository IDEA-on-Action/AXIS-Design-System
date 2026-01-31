# PRD — Agentic UI 추가 구현

> 작성일: 2026-01-31 | WI: WI-0004 | GitHub: #40 | 상태: Draft

---

## 1. 개요

### 1.1 배경
- 현재 Agentic UI 기본 컴포넌트 7개 완성
- AI/Agent 워크플로우를 위한 추가 컴포넌트 필요

### 1.2 목표
- Agentic UI 컴포넌트 라인업 확장
- AI 에이전트 인터페이스에 특화된 UX 패턴 제공

### 1.3 범위
- 포함: 추가 Agentic 컴포넌트, 복합 패턴
- 제외: Core UI 컴포넌트 (WI-0003)

---

## 2. 요구사항

### 2.1 기능 요구사항
- FR1: 추가 Agentic UI 컴포넌트 설계 및 구현
- FR2: 에이전트 대화 흐름 패턴
- FR3: 도구 실행 결과 표시 패턴

### 2.2 비기능 요구사항
- 접근성: WCAG 2.1 AA
- 성능: 실시간 업데이트 최적화
- 애니메이션: 부드러운 상태 전환

---

## 3. 수용 기준 (Acceptance Criteria)

- AC1: 8개 추가 컴포넌트 구현 완료 (MessageBubble, CodeBlock, FeedbackButtons, TokenUsageIndicator, PlanCard, AttachmentCard, ContextPanel, DiffViewer)
- AC2: 타입 체크(`pnpm type-check`), 빌드(`pnpm build`) 통과
- AC3: 기존 컴포넌트 패턴 준수 (cn(), CSS 변수, a11y, JSDoc)
- AC4: package.json exports 서브패스 등록
- AC5: src/index.ts에서 모든 컴포넌트 및 타입 re-export
