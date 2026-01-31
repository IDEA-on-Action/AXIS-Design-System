# PRD — CLI Template 명령어 구현

> 작성일: 2026-01-31 | WI: WI-0008 | GitHub: #52 | 상태: Draft

---

## 1. 개요

### 1.1 배경
- 템플릿 시스템 기반(WI-0007) 위에 CLI 인터페이스 필요
- 개발자가 명령줄에서 템플릿을 탐색, 적용, 관리

### 1.2 목표
- `axis template` 하위 명령어 구현 (list, info, apply, init, diff)
- `axis check` 프로젝트 상태 검증 명령어
- postInstall patch 시스템

### 1.3 범위
- 포함: template 명령어 5종, check 명령어, 샘플 템플릿
- 제외: MCP 연동 (WI-0009)

---

## 2. 요구사항

### 2.1 기능 요구사항
- FR1: `axis template list` — 사용 가능한 템플릿 목록
- FR2: `axis template info <name>` — 템플릿 상세 정보
- FR3: `axis template apply <name>` — 프로젝트에 템플릿 적용
- FR4: `axis template init` — 새 프로젝트 초기화
- FR5: `axis template diff` — 현재 프로젝트와 템플릿 차이점
- FR6: `axis check` — 프로젝트 설정 검증

### 2.2 비기능 요구사항
- UX: 명확한 CLI 출력 및 에러 메시지
- 안전성: apply 전 diff 확인 프롬프트

---

## 3. 수용 기준 (Acceptance Criteria)

- AC1: 6개 명령어 모두 동작
- AC2: 샘플 템플릿 3종 이상 제공
- AC3: 타입 체크, 린트, 빌드 통과
