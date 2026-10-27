# WI-0091: check 의 Plug'n'Play 루트 선언 판정 구현 계획

> PRD: [prd.md](./prd.md) | 같은 PR: WI-0094 · WI-0092 | 순서: 0091 규칙 확정 → 0094 → 0092(사용자 결정 Q4)

## 1. 바꾸는 곳

| 파일 · 함수 | 변경 |
|---|---|
| `registry-core/src/project.ts` `isPnpProject` | 층마다 표지(`.pnp.cjs` · `.pnp.js`)를 먼저 보고, 없이 `.git` 이 나오면 거짓(Q3) |
| 같은 파일 `declaredDependency` | 5번째 인자 `options.appOnlyInPnp`. 켜면 PnP 에서 루트 선언을 돌려주지 않음(Q1 · Q2). 기본값은 종전 동작 |
| 같은 파일 `pnpRootOnlyDependency` · `PNP_ROOT_ONLY_NOTE` | 새 헬퍼 · 문구 상수. 「누락」과 「루트 전용이라 해석 불가」를 가르는 데 씀(Q5 · Q7) |
| `dependencies-core.ts` `checkDependencies` | 선언 판정에 `appOnlyInPnp`. 필수 루트 전용 → FAIL 전용 문구, 권장 루트 전용 → WARN 전용 문구 |
| `tailwind-core.ts` `packageVersionGate` | 옵션 `appOnlyInPnp`, 루트 전용이면 `status: "unresolved"`. `versionGateLabel` 은 「워크스페이스 루트 선언 <범위>」 |
| 같은 파일 `checkTailwindSetup` tokens CJS 게이트 | 옵션을 켜고 `unresolved` 전용 WARN |
| 같은 파일 `checkAnimationPlugin` | 플러그인 선언 판정을 `declaredRangeForCheck`(옵션 켬)로, 사유는 `pluginProblem` 한 곳에서(WI-0092 와 공용) |
| cli · mcp `brand-core.ts` `inspectBrandActivation` | theme 게이트에 옵션(두 바이트 사본 같게) |
| cli `template-check.ts` · mcp `template.ts` `brandActivationResult` | `unresolved` 전용 WARN |

## 2. 바꾸지 않는 곳(Q2 · Q6 · Q7)

- `detectTailwind`, B1(`tailwind4Issues`), 1.4.0(`axisPackagesBelowTailwind4`), content 대상(`inspectTailwindContent`), animation 의 ui-react 사용 판정은 `declaredRange`(옵션 없음) 그대로
- init · theme add · add · template apply 의 호출은 옵션을 넘기지 않음(WI-0095)

## 3. 검증 순서

1. HEAD 기준선(파일별 통과 수) 고정
2. 수정 뒤 기존 테스트에서 바뀐 기대를 확인하고, A/B probe(같은 테스트 fixture 에 HEAD 사본과 수정본을 함께 돌림)로 전이를 전수 기록
3. 새 테스트를 HEAD 소스에 돌려 빨강 확인(A/B), 변이로 축마다 잡히는지 확인
4. 실제 설치 fixture(A · B · C · D · E · G · GN · refute-stray C)를 발행본 · 수정본 CLI · MCP 로 다시 재고 CLI · MCP 줄 대조
