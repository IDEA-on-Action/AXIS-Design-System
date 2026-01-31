# PRD — 템플릿 시스템 기반 구축

> 작성일: 2026-01-31 | WI: WI-0007 | GitHub: #51 | 상태: Draft

---

## 1. 개요

### 1.1 배경
- AXIS DS 컴포넌트를 조합한 페이지 템플릿 시스템 부재
- 사용자가 빠르게 프로젝트를 시작할 수 있는 스캐폴딩 필요

### 1.2 목표
- templates/ 디렉토리 구조 및 스키마 정의
- 최소 템플릿 1개(Theme-only) 구현
- 템플릿 갤러리 UI 기본 구현

### 1.3 범위
- 포함: 템플릿 구조 설계, template.json 스키마, 갤러리 UI
- 제외: CLI template 명령어 (WI-0008), MCP 연동 (WI-0009)

---

## 2. 요구사항

### 2.1 기능 요구사항
- FR1: templates/ 디렉토리 구조 설계
- FR2: template.json 스키마 정의
- FR3: Theme-only 최소 템플릿 구현
- FR4: 템플릿 갤러리 UI 기본 구현

### 2.2 비기능 요구사항
- 확장성: 새 템플릿 추가가 용이한 구조
- 호환성: Next.js 15, React 19 기반

---

## 3. 수용 기준 (Acceptance Criteria)

- AC1: template.json 스키마가 정의되고 검증 가능
- AC2: Theme-only 템플릿이 적용 가능
- AC3: 갤러리 UI에서 템플릿 목록 확인 가능
