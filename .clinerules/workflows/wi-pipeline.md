# WI Pipeline: PRD → TODO → Implement → Test → Release Notes

## Usage

```
/wi-pipeline.md WI-0001 button "Button 컴포넌트 개발"
```

## Goal

Work Item 폴더를 만들고, PRD/TODO/PLAN/TESTPLAN/RELEASE-NOTES까지 순차적으로 생성/갱신한다.
단계마다 사용자에게 "진행/수정/중단" 선택지를 제공한다.

---

## SSDD 체크포인트

각 단계에서 게이트를 통과해야 다음 단계로 진행할 수 있습니다.

### Gate 1: PRD 체크
- [ ] PRD 템플릿(`docs/templates/prd.md`) 기반 작성
- [ ] AC(수용 기준) 정의됨
- [ ] 범위(MVP) 명확화

### Gate 2: TODO 체크
- [ ] PRD 기반 생성 (PRD 없이 TODO 금지)
- [ ] 각 항목에 AC 링크
- [ ] 의존성/리스크 명시

### Gate 3: 테스트 체크
- [ ] testplan.md 작성됨
- [ ] 모든 테스트 통과
- [ ] 품질 게이트 통과 (`pnpm type-check && pnpm lint && pnpm build`)

### Gate 4: 릴리스 체크
- [ ] release-notes.md 작성됨
- [ ] Breaking change 여부 명시
- [ ] 검증 방법 포함

---

## 1) Bootstrap

1. AGENTS.md 읽어서 프로젝트 명령(Install/Test/Lint/Build/Dev)을 확인한다.
2. docs/templates/*.md 가 없으면 생성한다.
3. WI 폴더 `docs/workitems/<WI_ID>-<slug>/` 가 없으면 생성하고, 아래 5개 파일을 만든다:
   - prd.md, todo.md, plan.md, testplan.md, release-notes.md

---

## 2) PRD Draft

- docs/templates/prd.md 또는 docs/templates/component-prd.md 템플릿을 기반으로 WI의 prd.md를 작성한다.
- "가정(Assumptions)"을 명시하고, 성공지표/AC/범위(MVP)를 분리한다.

```xml
<ask_followup_question>
  <question>PRD 초안을 작성했어. 다음 단계로 TODO를 생성할까?</question>
  <options>["Proceed to TODO", "Revise PRD", "Stop"]</options>
</ask_followup_question>
```

---

## 3) TODO (Executable)

- prd.md를 읽고, todo.md에 체크박스 형태의 실행 가능한 작업 목록을 만든다.
- 각 TODO에는 최소한 아래를 포함:
  - 목적/완료조건(AC), 영향 파일/모듈, 테스트 항목, 의존성/리스크

```xml
<ask_followup_question>
  <question>TODO 초안을 만들었어. 구현(Implementation)로 진행할까?</question>
  <options>["Proceed to Implement", "Revise TODO", "Stop"]</options>
</ask_followup_question>
```

---

## 4) Implement

- todo.md의 작업을 우선순위대로 구현한다.
- 구현 전 plan.md에 "기술 접근/파일 변경 계획/마이그레이션/롤아웃/리스크"를 정리한다.
- 구현하면서 todo.md 체크 상태를 갱신한다.
- 중간에 테스트/린트를 실행하고 실패하면 수정한다.

```xml
<ask_followup_question>
  <question>구현을 진행했어. 테스트 단계로 넘어갈까?</question>
  <options>["Proceed to Test", "Continue Implement", "Stop"]</options>
</ask_followup_question>
```

---

## 5) Test

- testplan.md에 케이스(단위/통합/e2e/수동)를 정리한다.
- 필요한 자동화 테스트를 추가하고, AGENTS.md의 테스트 명령을 실행한다.
- 실패 시 수정 후 재실행, 통과하면 todo.md에 반영한다.

```xml
<ask_followup_question>
  <question>테스트가 통과했어. 릴리즈노트 생성으로 넘어갈까?</question>
  <options>["Proceed to Release Notes", "Revise Tests", "Stop"]</options>
</ask_followup_question>
```

---

## 6) Release Notes

- WI의 prd/todo/plan/testplan + git 변경 내역을 참고해 release-notes.md를 작성한다.

최종 출력:
- 사용자 영향 요약 (무엇이 달라졌나)
- Breaking change 여부
- 검증 방법 (How to verify)
- 롤백 가이드 (있으면)

---

## 7) 현행화 (Synchronization)

파이프라인 완료 후 반드시 실행합니다.

### 7.1 project-todo.md 업데이트

1. 해당 WI 항목의 상태를 ✅ 완료로 변경
2. 완료일 기록 (YYYY-MM-DD 형식)
3. Phase 진행률 재계산

```markdown
# 변경 전
| WI-0001 | Button 컴포넌트 | P1 | 🔄 | - |

# 변경 후
| WI-0001 | Button 컴포넌트 | P1 | ✅ | 2025-01-26 |
```

### 7.2 WI 산출물 최종 점검

모든 산출물이 완성되었는지 확인:

```
docs/workitems/<WI_ID>-<slug>/
├── prd.md           ✅ AC 정의됨
├── todo.md          ✅ 모든 항목 체크됨
├── plan.md          ✅ 작성됨
├── testplan.md      ✅ 테스트 통과
└── release-notes.md ✅ 작성됨
```

### 7.3 검증

```xml
<ask_followup_question>
  <question>현행화를 완료했어. 다음 WI 작업을 시작할까?</question>
  <options>["다음 WI 시작", "현재 WI 수정", "종료"]</options>
</ask_followup_question>
```

### 7.4 다음 WI 제안

project-todo.md를 읽고 다음 우선순위 작업을 제안:

```
### 다음 작업 제안
| 우선순위 | WI ID | 항목 | 상태 |
|----------|-------|------|------|
| P1 | WI-0002 | Card 컴포넌트 | 🔲 |
```
