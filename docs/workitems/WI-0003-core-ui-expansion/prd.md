# PRD — Core UI 컴포넌트 확장

> 작성일: 2026-01-31 | WI: WI-0003 | GitHub: #39 | 상태: Draft

---

## 1. 개요

### 1.1 배경
- 현재 Core UI 컴포넌트 6개 완성 (Button, Input, Avatar, Badge, Card, Alert)
- 30개 목표 대비 추가 컴포넌트 확장 필요

### 1.2 목표
- Core UI 컴포넌트를 30개까지 확장
- 일관된 API 및 디자인 토큰 기반 스타일링
- 접근성(WCAG 2.1 AA) 준수

### 1.3 범위
- 포함: Dialog, Dropdown, Tabs, Toast, Tooltip 등 추가 컴포넌트
- 제외: Agentic UI 컴포넌트 (WI-0004)

---

## 2. 요구사항

### 2.1 기능 요구사항
- FR1: 추가 컴포넌트 24개 설계 및 구현
- FR2: 디자인 토큰 기반 스타일링
- FR3: 컴포넌트별 문서 및 예제

### 2.2 비기능 요구사항
- 접근성: WCAG 2.1 AA
- 성능: 번들 사이즈 최적화 (tree-shaking)
- 반응형: mobile-first

---

## 3. 수용 기준 (Acceptance Criteria)

- AC1: 30개 Core UI 컴포넌트 구현 완료
- AC2: 모든 컴포넌트 타입 체크, 린트, 빌드 통과
- AC3: 각 컴포넌트에 Props 문서 및 사용 예제 포함
