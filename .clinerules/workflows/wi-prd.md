# WI: PRD 작성/갱신

## Usage

```
/wi-prd.md WI-0001 button "Button 컴포넌트 개발"
```

## Steps

1. AGENTS.md를 읽고 프로젝트 실행/테스트 명령을 파악한다.

2. WI 폴더 `docs/workitems/<WI_ID>-<slug>/` 가 없으면 생성한다.

3. docs/templates/component-prd.md 또는 docs/templates/prd.md 템플릿 기반으로 prd.md를 작성한다.

4. 결과물에 반드시 포함:
   - Problem/Goal
   - Non-goals (범위 제외)
   - MVP 범위
   - Acceptance Criteria (AC)
   - Assumptions (가정)
   - Risks / Open questions

5. 마지막에 다음 추천 커맨드 안내:
   - `/wi-todo.md <WI_ID> <slug>`

---

## SSDD Gate 1 체크

PRD 작성 완료 전 아래 항목을 확인합니다:

- [ ] PRD 템플릿(`docs/templates/prd.md` 또는 `component-prd.md`) 기반 작성
- [ ] AC(수용 기준) 정의됨
- [ ] 범위(MVP) 명확화
- [ ] 가정(Assumptions) 명시

---

## 현행화

PRD 작성 완료 후 수행:

### 1. project-todo.md 업데이트

새 WI 항목을 project-todo.md에 추가:

```markdown
| # | 항목 | WI ID | Phase | 우선순위 | 상태 |
|---|------|-------|-------|----------|------|
| N | [항목명] | WI-NNNN | P1 | P1 | 🔲 |
```

### 2. WI 폴더 생성 확인

```
docs/workitems/<WI_ID>-<slug>/
└── prd.md  ✅ 작성됨
```
