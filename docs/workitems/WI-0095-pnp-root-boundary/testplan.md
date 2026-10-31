# WI-0095: Plug'n'Play 루트 선언 경계를 init · add 로 넓힘 테스트 계획 · 결과

> PRD: [prd.md](./prd.md) | 실행일: 2026-10-31 | 기준: `main` e4d89ae 빌드(종전) · worktree 빌드(수정) | 측정 스크립트는 prd 6절

## 1. fixture (Yarn 4.5.3 실설치, 저장소 밖 scratchpad)

| 이름 | 레이아웃 | 루트 선언 | 앱(apps/web) 선언 |
|---|---|---|---|
| R4 | PnP, Tailwind 4 | tailwindcss 4.1.14 · clsx · tailwind-merge ^3.3.1 · tw-animate-css · @axis-ds/tokens · @axis-ds/ui-react | 없음(`@tailwindcss/cli` 4.1.14 만) |
| U4 | R4 + 루트 `dependenciesMeta` unplugged(tailwindcss · clsx · tailwind-merge · tw-animate-css) | R4 와 같음 | R4 와 같음 |
| M4 | PnP, Tailwind 4 혼합 | tw-animate-css · tokens · ui-react | tailwindcss · clsx · tailwind-merge |
| A4 | PnP, Tailwind 4 앱 선언(양성 대조) | 없음 | R4 의 루트 선언 전부 |
| N4 | PnP 미선언 | 없음 | 없음 |
| R3 · A3 | PnP, Tailwind 3 루트 전용 · 앱 선언 | tailwindcss ^3.4.19 · clsx · tailwind-merge ^2.6.0 · tailwindcss-animate · tokens · ui-react | (A3 는 앱에) |
| R4nm | yarn node-modules, R4 와 같은 선언(음성 대조) | R4 | 없음 |
| R4npm | npm 워크스페이스, R4 와 같은 선언(음성 대조) | R4 | 없음 |

Tailwind 4 앱의 globals.css 는 `@import "tailwindcss"; @import "tw-animate-css";`(WI-0099 의 `pnp-root-Ltwa-Itwa` 칸), Tailwind 3 앱은 `@tailwind` 세 줄 + `tailwind.config.js`(plugins 에 tailwindcss-animate).

## 2. 착수 측정 (main e4d89ae)

### 2.1 앱 issuer 해석 · 빌드

| fixture | `require.resolve`(앱 issuer) | `yarn tailwindcss` 빌드(init 이 안내한 줄 + tw-animate-css) | check(init 전) |
|---|---|---|---|
| R4 | tailwindcss · clsx · tailwind-merge · tw-animate-css · tokens · ui-react 모두 MODULE_NOT_FOUND | rc 1 `Can't resolve 'tailwindcss'` | 0/4/2 rc 1 |
| U4 | R4 와 같음(루트 unplugged 도 앱은 해석 못함) | rc 1 `Can't resolve 'tailwindcss'` | 0/4/2 rc 1 |
| M4 | tailwindcss · clsx · tailwind-merge OK, tw-animate-css · tokens · ui-react MODULE_NOT_FOUND | rc 1 `Can't resolve '@axis-ds/tokens/css/tailwind4'` | 0/5/1 rc 1 |
| A4 | 모두 해석됨(exports 없는 subpath 는 ERR_PACKAGE_PATH_NOT_EXPORTED, 패키지는 있음) | rc 0 | 2/3/1 rc 1(axis.config 없음) |
| R3 | 모두 MODULE_NOT_FOUND | (Tailwind 3, CLI 빌드 없음) | 0/4/3 rc 1 |

- 처음 `@tailwindcss/cli` `^4.1.14`(4.3.3 으로 풀림)는 A4 도 `Some options passed to require() aren't supported by PnP yet (conditions)` 로 실패해 계측이 성립하지 않았어요. 4.1.14 로 고정해 A4 rc 0(양성 대조)을 확인한 뒤의 값이에요.

### 2.2 명령별 종전 동작 (rc 는 36칸 모두 0)

| 명령 | R4 · U4 | M4 | R3 | A4 · A3 · N4 · R4nm · R4npm | 판정 |
|---|---|---|---|---|---|
| init utils | 「이미 있습니다(… 워크스페이스 루트에 선언: clsx, tailwind-merge)」, 앱 package.json 그대로 | 앱 선언이라 이미 있음(정상) | R4 와 같음 | 정상(N4 는 추가, nm · npm 은 루트 인정) | **결함** |
| init tailwindcss | 침묵(check FAIL) | 앱 선언(정상) | 침묵(check FAIL) | 정상 | **어긋남** |
| init Tailwind 4 안내 | `@import "@axis-ds/ui-react/tailwind.css";` 줄, tokens 설치 줄 없음 | 같음 | (Tailwind 3) | 정상 | **결함** |
| init 애니메이션 | 「… 플러그인이 필요합니다. yarn add tw-animate-css 뒤 전역 CSS 에 @import … 넣으세요」(줄 있음) | 같음 | 「yarn add tailwindcss-animate 뒤 plugins …」 | 정상 | **어긋남**(Tailwind 4), Tailwind 3 은 잔여 |
| init Tailwind 분기 | Tailwind 4(루트 선언) | Tailwind 4 | Tailwind 3 | 정상 | 결함 없음(Q155) |
| theme add ontology | tokens 를 앱에 추가, ui-react 줄 넣지 않음, Tailwind 4 CSS | 같음 | tokens 앱 추가, Tailwind 3 CSS, content 안내에 「@axis-ds/ui-react 가 워크스페이스 루트에만 …」 | 정상 | 측정상 결함 없음 |
| add button | `yarn add @radix-ui/react-slot class-variance-authority`(clsx · tailwind-merge 빠짐) | 앱 선언(정상) | 같음(빠짐) | 정상(N4 는 포함) | **결함** |
| template apply dashboard --dry-run | 「템플릿은 Tailwind 3 기준인데 이 프로젝트는 Tailwind 4(4.1.14)」 | 같음 | 경고 없음 | A4 와 같은 경고 | 측정상 결함 없음 |
| MCP install_component button(R4) | 의존성 명령에서 clsx · tailwind-merge 빠짐 | - | - | - | **결함**(CLI 와 같음) |

## 3. 수정 뒤 측정 (worktree 빌드)

### 3.1 차이 전수 (`diff -r` 종전 · 수정 결과 디렉터리)

| fixture | 바뀐 산출물 | 내용 |
|---|---|---|
| R4 · U4 | init.log · init package.json · init 쓴 파일 sha · add.log | utils 「package.json dependencies 에 추가: clsx@^2.1.1, tailwind-merge@^3.4.0」 + 사유 줄 + 범위 기준 줄, tailwindcss 줄, 애니메이션 루트 전용 사유, ui-react 「! … 선언한 뒤 @import …」, tokens 설치 줄 + 사유. add 명령에 `"clsx@^2.1.1" "tailwind-merge@^3.4.0"` |
| R3 | init.log · init package.json · sha · add.log | utils 추가(`tailwind-merge@^2.6.0`) + 사유, tailwindcss 줄. add 명령에 clsx · tailwind-merge. 애니메이션은 종전 ① 그대로(Tailwind 3, 2.2 잔여) |
| M4 | init.log | 애니메이션 루트 전용 사유, ui-react 「! …」, tokens 설치 줄 + 사유(utils · tailwindcss 는 앱 선언이라 그대로) |
| A4 · A3 · N4 · R4nm · R4npm | 없음 | 모든 로그 · 쓴 파일 바이트 같음(음성 대조) |
| 전부 | theme · tpl · check 로그 | 바이트 같음 |

- 종료 코드: 36칸(9 × init · theme add · add · template apply) 모두 0 으로 종전과 같음.
- 쓴 파일: 차이는 R4 · U4 · R3 의 앱 package.json 뿐(init). 다른 칸의 쓴 파일 sha256 같음.

### 3.2 MCP stdio `axis.install_component`(button)

| fixture | 종전 | 수정 |
|---|---|---|
| R4 | `yarn add @radix-ui/react-slot class-variance-authority` | `yarn add @radix-ui/react-slot class-variance-authority "clsx@^2.1.1" "tailwind-merge@^3.4.0"`(CLI `axis add` 와 같은 명령) |
| R4nm(음성 대조) | - | `yarn add @radix-ui/react-slot class-variance-authority`(종전과 같은 규칙) |

### 3.3 스모크: init 안내대로 고친 뒤 check · 해석 · 빌드(R4)

| | 따른 안내 | check | 앱 issuer 해석 | Tailwind 4 빌드 |
|---|---|---|---|---|
| 종전 init | `yarn add tw-animate-css`(애니메이션 줄) · `yarn install` · 안내한 import 줄 | 3/2/1 rc 1(tailwindcss FAIL, tokens · ui-react WARN) | tailwindcss · clsx · tailwind-merge FAIL | rc 1 `Can't resolve '@axis-ds/tokens/css/tailwind4'` |
| 수정 init | init 이 쓴 clsx · tailwind-merge + 안내대로 `yarn add tailwindcss@4.1.14 tw-animate-css "@axis-ds/tokens@^1.4.0" "@axis-ds/ui-react@^1.8.2"` · 안내한 import 줄 | 5/1/0 rc 0 | 모두 OK | rc 0 |

수정본의 남은 WARN 1건은 ui-react `tailwind.css` 의 `@source` 가 `.yarn/cache` zip 을 가리킨다는 WI-0102 판정이에요(앱 선언 A4 와 같은 상태, 이 WI 범위 밖).

## 4. 회귀 테스트 · 음성 대조 · 변이

### 4.1 새 테스트

| 파일 | 건수 | 내용 |
|---|---|---|
| `packages/axis-cli/src/wi-0095-pnp-root-boundary.test.ts` | 20 | init utils(PnP 루트 전용 · 한쪽만 · 앱 선언 · nm/npm/pnpm 음성 대조 3), tailwindcss 줄(+ check 문구 대조, 분기 유지), Tailwind 4 안내(루트 전용 · 앱 선언 · 미선언 · 음성 대조 3), 애니메이션(루트 전용 · nm 음성 대조), registry-core `missingDependencies`(PnP · 음성 대조 3) |
| `packages/axis-mcp/src/tools/registry-tools.test.ts` | +2 | install_component PnP 루트 전용 · yarn node-modules 음성 대조 |

fixture 는 WI-0091 `pnpWs` 와 같은 실제 PnP 표지(루트 workspaces · yarn.lock · `.yarnrc.yml` nodeLinker: pnp · `.pnp.cjs`, node_modules 없음)와 `.git` 경계예요.

### 4.2 바뀐 기존 테스트 (1건)

- `packages/axis-cli/src/wi-0099-init-animation-css.test.ts` 「PnP 루트에만 선언 · 줄 twa」: 기대를 종전 ① 줄에서 루트 전용 사유 「… 애니메이션 줄을 쓸 수 없습니다(tw-animate-css 가 워크스페이스 루트에만 선언돼 Plug'n'Play 에서 앱이 해석하지 못합니다). 설치하세요: yarn add tw-animate-css」로 바꿨어요(Q154, WI-0099 이 이 WI 로 넘긴 칸).

### 4.3 음성 대조 (수정 전 소스: init.ts · add.ts 를 `git show HEAD:` 로 되돌리고 테스트는 새것, 끝나고 sha256 3/3 OK 로 원복)

| 실행 | 결과 |
|---|---|
| cli 새 파일 20 + WI-0099 28 | 8 빨강 · 40 초록. 빨강은 새 파일의 PnP 루트 전용 행 7건 전부 + 바뀐 WI-0099 1건. 초록 13건은 음성 · 양성 대조(설계대로) |
| mcp `registry-tools.test.ts` 24 | 1 빨강(PnP 루트 전용) · 23 초록(nm 음성 대조 포함) |

처음 돌렸을 때 음성 대조 4건이 새 필드 `pnpRootOnly` 를 기대해 수정 전 코드에서 빨개졌어요(필드 없음). 대조 행이 수정 전에도 초록이어야 하므로 `?? []` 로 고쳐 다시 쟀어요.

### 4.4 변이 (적용 → 테스트 → 원복, 끝에 sha256 3/3 OK)

| 변이 | cli(48) 빨강 | mcp(24) 빨강 |
|---|---|---|
| M1 init utils 의 `appOnlyInPnp` 제거 | 2 | 0 |
| M2 add `missingDependencies` 의 `appOnlyInPnp` 제거 | 1 | 1 |
| M3 애니메이션 `pnpRootOnly` 제외 복원 | 2 | 0 |
| M4 Tailwind 4 안내의 `appOnlyInPnp` 제거 | 1 | 0 |
| M5 tailwindcss 줄을 출력하지 않음 | 1 | 0 |

## 5. 검증 (turbo `--force`, Cached 0)

| 명령 | rc | 결과 |
|---|---|---|
| `pnpm turbo type-check lint --filter=@axis-ds/cli --filter=@axis-ds/mcp --filter=@axis-ds/registry-core --force` | 0 | 7/7 task, Cached 0 |
| `pnpm turbo test --filter=@axis-ds/cli --force` | 0 | 1286 / 1286(27 파일). 기준 1266 + 새 20 |
| `pnpm turbo test --filter=@axis-ds/mcp --force` | 0 | 253 / 253(10 파일). 기준 251 + 새 2 |
| `pnpm check-changeset-mcp-tokens` | 0 | registry-core → cli · mcp 통과, node --test 19/19 |

- 첫 cli · mcp 동시 실행에서 cli `guidance.test.ts` 1건이 5초 타임아웃으로 빨강이었어요(머신 load average 32, 8코어). 단독 실행 4/4 초록(2.9초), cli 만 다시 돌린 전체 실행 1286/1286 초록이라 부하로 인한 타임아웃으로 봐요. 이 WI 가 그 테스트가 훑는 파일에 금지 문구를 넣지 않았다는 것은 단독 초록으로 확인했어요.
- registry-core 에는 test 스크립트가 없어서 공용 판정(`missingDependencies`)은 cli 새 테스트에서 봐요.
