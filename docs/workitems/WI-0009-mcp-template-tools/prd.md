# PRD — MCP 템플릿 Tools 구현

> 작성일: 2026-01-31 | WI: WI-0009 | GitHub: #53 | 상태: Done

---

## 1. 개요

### 1.1 배경
- MCP 서버에 템플릿 관련 도구 부재
- AI 에이전트가 템플릿을 활용할 수 있는 인터페이스 필요

### 1.2 목표
- MCP 서버에 템플릿 관련 tool 5종 추가
- AI 에이전트를 통한 템플릿 워크플로우 자동화
- IDE/Claude Code 통합 문서화

### 1.3 범위
- 포함: MCP tool 5종, 워크플로우 문서
- 제외: CLI 명령어 (WI-0008)

---

## 2. 요구사항

### 2.1 기능 요구사항
- FR1: `list_templates` MCP tool
- FR2: `get_template` MCP tool
- FR3: `apply_template` MCP tool
- FR4: `diff_template` MCP tool
- FR5: `check_project` MCP tool

### 2.2 비기능 요구사항
- 호환성: MCP 프로토콜 준수
- 보안: 파일 시스템 접근 제한

---

## 3. 수용 기준 (Acceptance Criteria)

- AC1: 5개 MCP tool 모두 등록 및 동작
- AC2: Claude Code에서 tool 호출 가능
- AC3: 워크플로우 문서 작성 완료
