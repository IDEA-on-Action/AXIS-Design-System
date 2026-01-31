# ax-wi-start

WI 작업 착수 전 SSDD 산출물 준비 상태를 점검하고, 부족한 것을 생성/안내합니다.

## 사용법

```
/ax-wi-start           # WI ID를 대화로 확인
/ax-wi-start WI-0003   # WI ID 직접 지정
```

---

## 수행 작업

### 1. WI 식별

- 인자로 WI ID가 전달되면 사용
- 없으면 사용자에게 WI ID 확인 (project-todo.md에서 🔄 상태 WI 목록 제시)

### 2. WI 폴더 존재 여부 확인

```bash
ls docs/workitems/WI-NNNN-*/
```

- 폴더가 없으면 → **scaffolding 제안** (사용자 확인 후 생성)
- 생성 시 구조:

```
docs/workitems/WI-NNNN-slug/
├── prd.md
├── todo.md
├── plan.md
├── testplan.md
└── release-notes.md
```

### 3. 필수 산출물 점검 (Gate 검증)

#### Gate 1: PRD 검증

1. `prd.md` 파일 존재 여부
2. AC(수용 기준) 섹션 정의 여부 확인
3. 미비 시 → 템플릿(`docs/templates/component-prd.md`) 기반 초안 생성 제안

#### Gate 2: TODO 검증

1. `todo.md` 파일 존재 여부
2. PRD 기반으로 생성되었는지 확인 (AC 항목 매핑)
3. 미비 시 → PRD의 AC 기반 TODO 생성 제안

### 4. project-todo.md 상태 확인

1. 해당 WI ID의 상태가 🔄(진행 중)인지 확인
2. 상태가 다르면 🔄로 갱신 제안

### 5. 작업 컨텍스트 요약 출력

아래 형식으로 출력합니다.

---

## 출력 형식

```
## WI 작업 시작: WI-NNNN-slug

### WI 정보
- **WI ID**: WI-NNNN
- **제목**: [WI 제목]
- **상태**: 🔄 진행 중

### SSDD 산출물 상태
| 산출물 | 상태 | 비고 |
|--------|------|------|
| prd.md | ✅ 존재 / ❌ 미비 | AC N개 정의 |
| todo.md | ✅ 존재 / ❌ 미비 | N/M 완료 |
| plan.md | ✅ / ⬜ 선택 | - |
| testplan.md | ✅ / ⬜ 선택 | - |
| release-notes.md | ⬜ 미작성 | 릴리스 시 작성 |

### Gate 검증 결과
- Gate 1 (PRD + AC): ✅ 통과 / ❌ 미충족 — [사유]
- Gate 2 (TODO + PRD 연결): ✅ 통과 / ❌ 미충족 — [사유]

### PRD 핵심 요약
- **목표**: [PRD 목표 요약]
- **범위**: [범위 요약]
- **수용 기준 (AC)**:
  1. [AC-1]
  2. [AC-2]
  ...

### TODO 진행 상황
- 전체: N개 / 완료: M개 / 남은: K개
- 다음 수행할 Task:
  - [ ] [다음 Task 설명]
  - [ ] [그 다음 Task 설명]

---
작업 시작: [현재 시간 KST]
```

---

## 산출물 미비 시 자동 조치

| 상황 | 조치 |
|------|------|
| WI 폴더 없음 | 생성 여부 확인 후 scaffolding |
| prd.md 없음 | 템플릿 기반 초안 생성 제안 |
| prd.md AC 미정의 | AC 섹션 추가 안내 |
| todo.md 없음 | PRD AC 기반 TODO 생성 제안 |
| project-todo.md 미등록 | 항목 추가 제안 |

---

## 주의사항

- Gate 미충족 시 작업 진행 여부를 사용자에게 확인
- 산출물 자동 생성 전 반드시 사용자 승인
- PRD 없이 TODO 생성 금지 (SSDD 원칙)
