# WI-0094: dependencies 의 @axis-ds/* 루트 대상 테스트 계획 · 결과

> PRD: [prd.md](./prd.md) | 실행일: 2026-10-27 | 기준선 · 게이트 · probe 방법은 [WI-0091 testplan](../WI-0091-check-pnp-root-deps/testplan.md) 1 · 2 · 3 · 5절과 같아요

## 1. 새 테스트 (cli `template-check.test.ts` 「WI-0094」 5건 · mcp `template.test.ts` 1건)

| 테스트 | AC | HEAD 소스 |
|---|---|---|
| 루트 전용 · 미설치 → WARN 루트 문구 · 출처 표시, dependencies fail 0 | AC1 | 빨강 |
| 루트 전용 · 설치 → PASS 「5개 확인」 | AC2 | 빨강 |
| 앱 · 루트 둘 다 → 앱 출처 종전 문구, 루트 `@axis-ds/cli` 도 대상 | AC3 | 빨강 |
| 앱 lockfile(P2)이 있어도 루트 선언 셈 | AC3 | 빨강 |
| 음성 대조 N1(워크스페이스 아님) · N2(`.git` 너머) → PASS 「3개 확인」 | AC4 | 초록(설계대로) |
| MCP: 루트 전용 · 미설치 WARN 같은 문구 | AC5 | (새 행) |

PnP 루트 전용 `@axis-ds/*` 는 WI-0091 「권장만 루트 전용」 테스트가 대상에 넣지 않음을 함께 봐요. 추가 결정 A3 뒤에는 같은 테스트와 새 「A3(M7)」 테스트가 전용 문구 WARN 을 함께 봐요(WI-0091 testplan 6절).

조사 단계의 음성 대조 R9(필수 누락 FAIL 이 먼저 return 돼 대상을 계산하지 않음)는 판별력이 없어서 쓰지 않고 N1 · N2 를 썼어요.

## 2. 변이

| 변이 | cli 빨강 | mcp 빨강 |
|---|---|---|
| M3 루트 `@axis-ds` 대상 제거 | 4 / 197 | 1 / 42 |
| M4 루트 출처 미설치를 종전 문구로 합침 | 3 / 197 | 1 / 42 |
| M9 PnP 에서도 루트 `@axis-ds` 를 대상에 넣음 | 1 / 197 | 0 / 42 |
| M9 재측정(A3 반영 뒤) | 2 / 199 | 1 / 43 |
| MA3 PnP 루트 `@axis-ds` 전용 WARN 제거(A3) | 2 / 199 | 1 / 43 |

## 3. 루트에 `@axis-ds/*` 를 선언한 기존 fixture 의 dependencies 전이 (A/B probe, 실제 실행)

기존 기대값을 바꾼 테스트는 0건이에요(이 fixture 들은 dependencies 의 문구를 단언하지 않거나 같은 심각도). 결과 문자열은 아래처럼 바뀌어요.

| fixture(테스트) | 수정 전 | 수정 후 |
|---|---|---|
| WI-0086 AC1 npm · pnpm(TW3_ROOT 설치) | PASS 3개 확인 | PASS 5개 확인 · 출처에 tokens · ui-react |
| WI-0086 AC2 animation(TW3_ROOT 설치) | PASS 3개 | PASS 5개 |
| WI-0086 AC2 Tailwind 4(2553, 루트 tokens · ui-react 설치) | WARN 권장 누락 | WARN 같음 · 출처에 tokens · ui-react |
| WI-0086 AC3(2573, 루트 tokens · ui-react ^1.3.0 미설치) | WARN 권장 누락 / tailwindcss 미설치 | 같음 + 「워크스페이스 루트에 선언돼 있지만 설치되지 않았습니다: @axis-ds/tokens, @axis-ds/ui-react」 |
| WI-0086 AC3(2592, 루트 tokens 미설치) | 같은 꼴 | 같음 + 루트 미설치 @axis-ds/tokens |
| WI-0086 음성 대조의 워크스페이스 앱 행 | PASS 4개 | PASS 5개 · 출처에 tokens |
| WI-0086 AC5 npm · pnpm(링크 · 실경로 2행씩) | PASS 3개 · 4개 | PASS 5개 |
| WI-0086 AC6 pnpm 기본 | WARN 권장 누락 | WARN 같음 · 출처에 tokens |
| WI-0081 2317(pnpm-workspace 루트 · 앱 둘 다 ui-react) | 바뀌지 않음(앱 출처) | |
| WI-0086 2599 · 2602(theme 게이트) | `packageVersionGate` 직접 단언이라 dependencies 를 부르지 않음 | |
| MCP `template.test.ts:594` | 단언한 부분 그대로(테스트 통과) | |

조사 단계의 「AC3 은 PASS 에서 WARN 으로 바뀐다」는 정적 대조였는데, 실제 실행에서는 AC3 이 수정 전에도 WARN(루트 `tailwindcss` 미설치)이었고 문구만 늘어요.

## 4. 실제 설치 fixture 재측정 (발행본 cli 1.7.5 · mcp 1.4.4 → worktree dist, `WI-0094/fx` 13 · `real` 4)

| fixture | 수정 전 dependencies | 수정 후 | rc |
|---|---|---|---|
| R1 · R8(앱 lockfile) · C1 · R10(agentic-ui) · R6(@axis-ds/cli) 루트 전용 미설치 | PASS 3 · 4개 | WARN 루트 문구 | 그대로 |
| R8b(워크스페이스 멤버가 아닌 앱 + 앱 lockfile) | PASS 3개 | WARN 루트 문구 | 그대로. Q19 가 받아들인 과탐(WI-0081 D1 잔여) |
| R2 · C2 · real npm · real pnpm 루트 전용 설치 | PASS 3개 | PASS 4 · 5개 | 그대로 |
| R3 · R4 · R5(앱 선언) · R9(워크스페이스 아님) · real yarnpnp-app(앱 선언 PnP) | 같음 | 같음 | 그대로 |
| R7 · real yarnpnp(PnP 루트 전용) | PASS | FAIL(WI-0091) | 1 유지(다른 FAIL 이 이미 있음). A3 반영 뒤에도 같음(필수 FAIL 이 먼저 나옴) |
| WI-0091 M5 · M6 · M7(PnP, `@axis-ds/*` 하나만 루트 전용) | PASS | A3 반영 뒤 WARN 「<이름> 가 워크스페이스 루트에만 선언돼 Plug'n'Play 에서 앱이 해석하지 못합니다 → 앱 package.json 에 선언하세요」 | 그대로 |

CLI · MCP 줄 대조: 17 앱 × 수정 전 · 후 = 34 쌍, 202줄 모두 같음.
