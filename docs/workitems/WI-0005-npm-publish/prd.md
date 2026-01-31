# PRD — npm 배포 준비

> 작성일: 2026-01-31 | WI: WI-0005 | GitHub: #43 | 상태: Done

---

## 1. 개요

### 1.1 배경
- 패키지가 로컬에서만 사용 가능
- npm 레지스트리 배포를 통한 외부 사용 지원 필요

### 1.2 목표
- @axis-ds/* 패키지 npm 배포 파이프라인 구축
- 버전 관리 및 CHANGELOG 자동화
- 배포 품질 게이트 설정

### 1.3 범위
- 포함: npm publish 설정, CI/CD 배포 파이프라인, 버전 관리
- 제외: private registry 구축

---

## 2. 요구사항

### 2.1 기능 요구사항
- FR1: package.json 배포 설정 (files, main, exports)
- FR2: changesets 기반 버전 관리
- FR3: GitHub Actions 배포 워크플로우

### 2.2 비기능 요구사항
- 보안: npm 토큰 안전 관리
- 품질: 배포 전 빌드/테스트 게이트
- 문서: 패키지별 README 작성

---

## 3. 수용 기준 (Acceptance Criteria)

- AC1: `npm publish` 또는 CI를 통해 패키지 배포 가능
- AC2: 버전 관리 워크플로우 동작
- AC3: 배포 전 품질 게이트 (타입체크, 린트, 빌드) 통과 필수
