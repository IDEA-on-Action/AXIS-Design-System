# PRD — axis-cli 기능 확장

> 작성일: 2026-01-31 | WI: WI-0001 | GitHub: #42 | 상태: In Review

---

## 1. 개요

### 1.1 배경
- 현재 axis-cli는 기본 `add` 명령어만 지원
- 프로젝트 동기화(sync), 상태 확인 등 추가 기능 필요

### 1.2 목표
- CLI 명령어 확장으로 개발자 경험 향상
- GitHub 프로젝트 동기화 기능 추가
- 컴포넌트 관리 워크플로우 자동화

### 1.3 범위
- 포함: sync 명령어, 프로젝트 상태 확인, GitHub 연동
- 제외: template 명령어 (WI-0008에서 별도 진행)

---

## 2. 사용자 및 사용 사례

### 2.1 대상 사용자
- 개발자: AXIS DS를 사용하는 프론트엔드 개발자
- 관리자: 프로젝트 작업 항목을 관리하는 팀 리드

### 2.2 핵심 사용 시나리오
1. `axis sync` 명령으로 GitHub Issue ↔ project-todo.md 동기화
2. `axis status` 명령으로 프로젝트 진행 상황 확인

---

## 3. 요구사항

### 3.1 기능 요구사항
- FR1: `axis sync` — GitHub Issue와 로컬 TODO 동기화
- FR2: `axis status` — 프로젝트 상태 요약 출력
- FR3: GitHub API 연동 (Octokit 기반)

### 3.2 비기능 요구사항
- 성능: 동기화 작업 10초 이내
- 안정성: API 실패 시 graceful error handling
- 보안: GitHub 토큰 안전한 처리

---

## 4. API 설계 (초안)

```bash
# 동기화
axis sync [--dry-run] [--force]

# 상태 확인
axis status [--verbose]
```

---

## 5. MVP 범위

### 5.1 Phase 1 (MVP)
- [ ] sync 명령어 기본 구현
- [ ] GitHub API 클라이언트 구현
- [ ] WI 매핑 파서 구현

### 5.2 Phase 2 (확장)
- [ ] status 명령어
- [ ] dry-run 모드
- [ ] 양방향 동기화

---

## 6. 수용 기준 (Acceptance Criteria)

- AC1: `axis sync` 실행 시 GitHub Issue 상태가 project-todo.md에 반영됨
- AC2: 매핑 파일(.github/wi-mapping.json)을 기반으로 WI ↔ Issue 매핑됨
- AC3: 타입 체크, 린트, 빌드 모두 통과

---

## 7. 가정 (Assumptions)

- A1: GitHub Personal Access Token이 환경변수로 제공됨
- A2: wi-mapping.json 구조가 안정적

---

## 8. 리스크

| 리스크 | 영향 | 완화 방안 |
|--------|------|-----------|
| GitHub API Rate Limit | 동기화 실패 | 캐싱 및 incremental sync |
| 토큰 노출 위험 | 보안 사고 | .env 관리 + .gitignore 검증 |

---

## 9. 열린 질문

- Q1: 양방향 동기화 시 충돌 해결 전략?
- Q2: CI/CD에서 자동 동기화 실행 여부?
