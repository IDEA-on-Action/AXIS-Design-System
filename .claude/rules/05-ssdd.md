# SSDD (Single Source of Design Document) 원칙

## 정의

**모든 작업은 문서에서 시작하고 문서로 끝난다.**

SSDD는 설계 문서를 단일 소스로 삼아 코드, 테스트, 릴리스까지 일관성을 유지하는 원칙입니다.

---

## 파이프라인

```
PRD → TODO → 구현 → 테스트 → Release Notes
```

| 단계 | 산출물 | 게이트 |
|------|--------|--------|
| 1. PRD | prd.md | AC(수용 기준) 정의됨 |
| 2. TODO | todo.md | PRD 기반 생성, AC 링크 |
| 3. 구현 | 코드 | 타입/린트 통과 |
| 4. 테스트 | testplan.md | 모든 테스트 통과 |
| 5. 릴리스 | release-notes.md | 문서 작성 완료 |

---

## 핵심 규칙

1. **PRD 우선**: 코드 작성 전 PRD 작성/확인
2. **TODO 기반**: PRD 없는 TODO 금지
3. **테스트 필수**: 테스트 없이 "완료" 불가
4. **릴리스 강제**: 머지/배포 전 릴리스 노트 필수

---

## 산출물 위치

모든 WI 산출물은 아래 구조로 관리합니다:

```
docs/workitems/<WI_ID>-<slug>/
├── prd.md           # 요구사항 정의
├── todo.md          # 실행 체크리스트
├── plan.md          # 구현 계획
├── testplan.md      # 테스트 계획
└── release-notes.md # 릴리스 노트
```

---

## WI ID 체계

| 형식 | 예시 |
|------|------|
| `WI-NNNN-slug` | `WI-0001-button` |
| 번호 | 4자리 (0001~9999) |
| slug | kebab-case |

---

## project-todo.md 연동

진행 중인 작업은 `project-todo.md`에서 WI ID로 추적합니다:

```markdown
| # | 항목 | WI ID | Phase | 우선순위 | 상태 |
|---|------|-------|-------|----------|------|
| 1 | 컴포넌트 문서화 | WI-0001 | P3 | P1 | 🔄 |
```

---

## 참고

- AGENTS.md: 공용 규칙 단일 소스
- .claude/rules/: Claude Code 규칙
- .clinerules/: Cline 규칙
