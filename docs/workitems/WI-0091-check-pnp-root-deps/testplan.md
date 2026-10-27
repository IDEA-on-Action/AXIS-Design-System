# WI-0091: check 의 Plug'n'Play 루트 선언 판정 테스트 계획 · 결과

> PRD: [prd.md](./prd.md) | 실행일: 2026-10-27 | 같은 PR 의 공통 측정(기준선 · 게이트 · probe · 변이)은 이 문서에 두고, WI-0094 · WI-0092 testplan 은 자기 행만 적어요

## 1. 기준선 (HEAD ffbda57 소스, worktree 에서 `pnpm install --frozen-lockfile` 뒤)

| 패키지 · 파일 | 통과 / 전체 | 실패 |
|---|---|---|
| cli 전체 | 912 / 912 (191 suite) | 0 |
| cli `template-check.test.ts` | 180 | 0 |
| cli `theme-add.test.ts` · `theme-commands.test.ts` · `init.test.ts` · `workspace-root.test.ts` · `theme/brand-core.test.ts` | 73 · 11 · 180 · 32 · 29 | 0 |
| mcp 전체 | 161 / 161 | 0, 단 `registry/tokens-sync.test.ts` 는 파일 로드 실패(`@axis-ds/tokens/dist/json/tokens.json` 없음, 빌드 전이라 0건 실행) |
| mcp `template.test.ts` · `brand.test.ts` · `brand-core.test.ts` | 39 · 16 · 1 | 0 |

tokens-sync 의 0건은 계측 실패(빌드 전 dist 없음)이지 통과가 아니에요. 빌드 뒤 수정본에서는 20/20 이 실제로 돌았어요(2절).

## 2. 수정 뒤 (같은 worktree, turbo build `--force` 뒤)

| 패키지 · 파일 | 통과 / 전체 | 늘어난 건 |
|---|---|---|
| cli 전체 | 929 / 929 (195 suite) | +17(새 describe 「WI-0091 · 0094 · 0092」) |
| cli `template-check.test.ts` | 197 | 180 + 17. 기존 기대 변경 4건(이 WI 1건, WI-0092 3건) |
| mcp 전체 | 184 / 184 | +3(새 describe) · tokens-sync 20 이 빌드 뒤 실행 |
| mcp `template.test.ts` | 42 | 39 + 3. 기존 기대 변경 1건(WI-0092) |
| 나머지 cli 파일(theme-add · theme-commands · init · workspace-root · brand-core) | 기준선과 같은 수 | 0 |

이 WI 의 테스트: 기존 「Plug'n'Play 워크스페이스: 선언 기준 PASS 문구에도 출처 표시」(template-check 2437)를 새 규칙 FAIL 로 바꿨어요(Q8). 빈 `.pnp.cjs` 표지 `template-check.test.ts:1710`(앱 선언)은 새 규칙에서도 결과가 같아 그대로예요. `theme-add.test.ts:935` 의 `wsApp({ pnp: true })` 는 theme add(check 밖, Q2) 경로라 기대가 바뀌지 않아요. 새 fixture `pnpWs` 는 루트 `workspaces` · `yarn.lock` · `.yarnrc.yml`(nodeLinker: pnp) · `.pnp.cjs`(Yarn 머리 주석) · node_modules 없음으로 실제 PnP 레이아웃을 고정해요.

| 새 테스트 | AC |
|---|---|
| A(TW3 루트 전용): dependencies FAIL · tokens 게이트 WARN · animation 전용 사유 · rc 1, 같은 레이아웃 앱 선언(B)은 PASS | AC1 · AC2 · AC3 · AC6 |
| 권장만 루트 전용 WARN, 루트 `@axis-ds` 는 대상 아님 | AC1 |
| G(TW4 루트 전용): `detectTailwind` 는 TW4, dependencies FAIL | AC4 |
| theme 게이트 brand.activation WARN, `packageVersionGate` 옵션 유무 | AC2 |
| 음성 대조: node-modules 워크스페이스 루트 선언 PASS | AC6 |
| `isPnpProject` `.git` 경계(상위 `.pnp.cjs` + `.git` 저장소 거짓, `.git` 없으면 참, 같은 층 `.git` + `.pnp.cjs` 참) | AC5 |
| MCP: PnP dependencies FAIL · brand.activation `unresolved` 문구(MCP 자체 `brandActivationResult`) | AC6 |

## 3. A/B

### 3.1 새 테스트를 HEAD 소스에 (판정 소스 7개를 `git show HEAD:` 로 바꾸고 테스트는 새것, 끝나고 sha256 7/7 OK 로 원복)

- cli `template-check.test.ts`: 197 중 18 빨강. 이 WI 행은 6 중 5 빨강, 초록 1건은 음성 대조(node-modules 루트 선언)라 설계대로예요
- mcp `template.test.ts`(새 3건 추가 전): 39 중 1 빨강(WI-0092 h 행)

### 3.2 기존 테스트 전체의 전이 (A/B probe)

vitest setup 에서 `checkDependencies` · `checkAnimationPlugin` · `checkTailwindSetup` 를 감싸, 테스트가 만드는 모든 fixture 에 HEAD 사본과 수정본을 함께 돌렸어요(양성 대조: setup 실행 표지 파일 생성 · 호출 361회씩 기록). 첫 시도는 bare specifier mock 이 scratch 경로 기준으로 풀려 0줄이었고(계측 실패), 절대 경로로 고친 뒤 기록됐어요.

| 함수 | 호출 | 바뀜 |
|---|---|---|
| `checkTailwindSetup` | 361 | 0 |
| `checkDependencies` | 361 | 36(테스트 · 결과 쌍으로 중복을 빼면 13개) |
| `checkAnimationPlugin` | 361 | 3(WI-0092) |

이 WI 의 전이는 `checkDependencies` 1개(2437, PASS → FAIL)예요. 나머지 12개는 WI-0094 전이(그 testplan 3절).

### 3.3 변이 (적용 → cli template-check · mcp template 실행 → sha 대조 원복)

| 변이 | cli 빨강 | mcp 빨강 |
|---|---|---|
| M1 `isPnpProject` `.git` 경계 제거 | 1 / 197 | 0 / 42 |
| M2 `appOnlyInPnp` 무시 | 4 / 197 | 1 / 42 |
| M7 버전 게이트 `unresolved` 갈래 제거 | 2 / 197 | 1 / 42 |
| M8 PnP 필수 루트 전용을 「누락」 문구로 | 3 / 197 | 1 / 42 |
| M9 PnP 에서 루트 `@axis-ds` 를 대상에 넣음 | 1 / 197 | 0 / 42 |

M1 · M9 는 MCP 에 해당 행이 없어 cli 에서만 잡혀요(같은 코어 번들이라 판정은 같음, 4절 줄 대조).

## 4. 실제 설치 fixture 재측정 (발행본 cli 1.7.5 · mcp 1.4.4 → worktree dist)

조사 단계 fixture(Yarn 4.5.3 실설치, 다시 만들지 않고 그대로 사용)에 CLI `check --dir` 와 MCP stdio `axis.check_project` 를 돌렸어요.

| fixture | 수정 전 | 수정 후 | 바뀐 항목 |
|---|---|---|---|
| A(TW3 PnP 루트 전용) | 9/0/0 rc 0 | 5/3/1 rc 1 | tailwind.config(tokens 게이트) WARN · dependencies FAIL · brand.activation WARN · animation WARN |
| B(PnP 앱 선언, 양성 대조) | 같음 | 같음 | 0 |
| C(node-modules 루트 선언, 음성 대조) | PASS 「3개 확인」 | PASS 「6개 확인」 + 루트 `@axis-ds` 3개 표시 | dependencies 문구만(WI-0094) |
| D(`pnpFallbackMode: all`) | 9/0/0 rc 0 | 5/3/1 rc 1 | A 와 같음. **Q1 이 받아들인 거짓 FAIL 을 수정본으로 측정**(조사 단계에서는 추론이었음) |
| E(loose) | 9/0/0 rc 0 | 5/3/1 rc 1 | A 와 같음 |
| G(TW4 PnP 루트 전용) | 8/0/0 rc 0 | 5/2/1 rc 1 | dependencies FAIL · brand.activation WARN · animation WARN(WI-0092 와 함께). tailwind.config 는 TW4 PASS 그대로(Q6) |
| GN(PnP 선언 없음) | 같음 | 같음 | 0 |
| refute-stray-1/outer/C(상위 빈 `.pnp.cjs` + `.git`) | 9/0/0 rc 0(PnP 오인) | 8/0/1 rc 1 | PnP 가 아니게 되어 같은 레이아웃 대조군 C 와 9줄이 같아짐. 새 FAIL 은 content(`./node_modules/@axis-ds/ui-react` 는 앱에 없고 루트 설치본)로, C 는 1.7.5 에서도 같은 FAIL 이었어요 |

CLI · MCP 줄 대조: 8 fixture × 수정 전 · 후 = 16 쌍, 138줄 모두 같음(심각도 + 문구).

## 5. 게이트 (수정 뒤, 캐시 우회)

| 게이트 | 명령 | 결과 |
|---|---|---|
| build | `pnpm exec turbo run build --force` | rc 0, 8/8, Cached 0 |
| type-check | `pnpm exec turbo run type-check --force` | rc 0, 11/11, Cached 0 |
| lint | `pnpm exec turbo run lint --force` | rc 0, 7/7, Cached 0 |
| test | cli `npx vitest run` · mcp `npx vitest run` | 929/929 · 184/184 |
| changeset | `pnpm check-changeset-mcp-tokens` | rc 0, registry-core 3파일 감지 → cli · mcp 올림 확인, 자체 테스트 19/19 |

`pnpm build -- --force` 는 `--force` 가 패키지 스크립트로 넘어가 tokens 빌드가 실패해서(rc 1) turbo 를 직접 불렀어요. 빌드가 다시 만든 `apps/web/public/templates/*.json` 6개는 커밋 전에 되돌렸어요.
