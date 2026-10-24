# WI-0039: cli · mcp · registry-core 품질 게이트(type-check · lint) PRD

> 작성일: 2026-10-24 | WI: WI-0039 | GitHub: #125 | 기준: main bd54e91 (linked 4패키지 1.6.0 · cli 1.5.4 · mcp 1.3.2) | 상태: Approved (2026-10-24 결정 반영)
> 선행: WI-0034(루트 공용 ESLint 설정) | 후속: theme type-check · lint(아래 Non-goals)

---

## 1. 개요

### 1.1 배경
- WI-0034 가 라이브러리 패키지(tokens · ui-react · agentic-ui)에 lint · type-check 를 넣었고, theme · cli · mcp 는 범위 밖(WI-0034 D3)으로 남았어요.
- CI(`frontend.yml`)는 `pnpm lint` · `pnpm type-check`(둘 다 `turbo run`)를 부르므로, 패키지에 스크립트가 없으면 그 패키지는 검사되지 않아요.
- 배치 계획(2026-10-24)에서 이 WI 가 뒤 cli WI 들의 lint · type-check 게이트가 돼요.

### 1.2 원인 (실측, bd54e91)
| # | 내용 | 실측 |
|---|---|---|
| C1 | cli 에 `type-check` · `lint` 스크립트가 없어요 | `turbo run type-check --dry=json` · `lint --dry=json` 에서 cli 태스크 없음(스크립트 부재) |
| C2 | mcp · registry-core 에 `lint` 스크립트가 없어요(type-check 는 있음) | 같은 dry-run |
| C3 | cli `tsc --noEmit` 오류 19건: `src/library/index.test.ts` 8 · `publisher.test.ts` 10 · `src/template/template-apply.ts` 1 | rc 2, `error TS` 19줄 |
| C4 | 루트 설정으로 `eslint .` 를 돌리면 cli 25 · mcp 11 · registry-core 1건 | 셋 다 rc 1 |
| C5 | 이슈 등록 때 수치(cli tsc 20 · eslint 2)는 당시 측정이라 지금과 달라요. 이번 PRD 는 위 C3 · C4 재측정값을 기준으로 해요 | |

### 1.3 목표
1. cli 의 type-check · lint, mcp · registry-core 의 lint 가 turbo 파이프라인(CI 가 부르는 것)에 실제로 잡혀요.
2. 도입 시점에 위반 0건으로 시작해요. 규칙 강등 · 기준선 고정 · disable 주석으로 남기지 않아요.
3. 동작을 바꾸지 않아요. dist 실코드가 바뀌는 곳은 목록으로 남겨요(release-notes).

### 1.4 확정 결정 (2026-10-24, 사용자)
| # | 결정 | 내용 |
|---|---|---|
| D1 | 범위 | cli · mcp + registry-core(lint 1건). theme 은 제외해요 |
| D2 | cli 테스트 타입 오류 | tsconfig 에서 테스트를 빼지 않고, 테스트를 실제 타입에 맞게 고쳐요 |
| D3 | changeset | 동작 변화가 없으니 changeset 을 두지 않아요(배포 없음) |
| D4 | 정리 방식 | 미사용 제거, 타입 좁히기, 정규식 이스케이프 동치 변환. 루트 ESLint 규칙 옵션은 바꾸지 않아요 |

---

## 2. Non-goals
- theme type-check(12건, WI-0034 D3 제외분) · theme lint
- 루트 ESLint 규칙 변경(`argsIgnorePattern` 등). 밑줄 접두 인자도 지금 규칙대로 정리해요
- CI workflow 수정: 이미 `pnpm lint` · `pnpm type-check` 를 실행해요

## 3. 요구사항
- FR-1: cli `package.json` 에 `"lint": "eslint ."` · `"type-check": "tsc --noEmit"`, mcp · registry-core 에 `"lint": "eslint ."` 를 넣어요.
- FR-2: C3 · C4 의 오류를 모두 0 으로 만들어요. 고치는 도중 드러나는 가려진 오류도 함께 0 으로 만들어요.
- FR-3: 루트 `eslint.config.mjs` 머리 주석의 대상 목록을 현재 범위로 고쳐요.

## 4. 수용 기준 (AC)
- AC1: `turbo run lint --dry=json` 에 cli · mcp · registry-core 의 `eslint .`, `turbo run type-check --dry=json` 에 cli 의 `tsc --noEmit` 이 있어요.
- AC2: 세 패키지 `eslint .` · cli `tsc --noEmit` 오류 0, 그리고 그 0 이 계측 실패가 아님을 보여요(검사 파일 수 = 대상 파일 수).
- AC3: 양성 대조. 일부러 넣은 타입 오류 1건 · lint 위반 1건씩으로 새 스크립트 4개가 모두 rc 비0, 원복 뒤 sha256 일치.
- AC4: `pnpm turbo run type-check lint test build --force` 전체 rc 0, Cached 0, cli 661 · mcp 138 테스트 수 유지.
- AC5: dist 를 정리 전과 비교해 바뀐 실코드를 목록으로 적고, 정규식 변환은 동치를 보여요.
