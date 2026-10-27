# WI-0093: 테스트 계획 · 결과

> PRD: [prd.md](./prd.md) | 측정일: 2026-10-27 | 기준 ffbda57 위 worktree 작업 트리
> 표기: **측정**(이번에 실행해 얻은 값) · **계산** · **추정**(실행하지 않음)

## 1. 기준선 (측정, HEAD ffbda57 소스)

| 범위 | 통과 / 전체 |
|---|---|
| cli `src/theme/theme-commands.test.ts` | 11 / 11 |
| cli `src/theme/theme-add.test.ts` | 73 / 73 |
| cli `src/theme/brand-core.test.ts` · `theme-add-rollback.test.ts` | 29 / 29 · 1 / 1 |
| cli `src/workspace-root.test.ts` · `src/guidance.test.ts` | 32 / 32 · 4 / 4 |
| mcp `src/tools/brand.test.ts` · `brand-core.test.ts` | 16 / 16 · 1 / 1 |
| cli 전체 vitest(21 파일) | 912 / 912 |
| mcp 전체 vitest(8 파일) | 181 / 181 |

전체 기준선은 바뀐 파일을 HEAD 내용으로 잠시 되돌려 잰 값이에요(스크립트 `trackB-headbase.py`, 끝난 뒤 복원 diff 확인).

## 2. 단위 테스트 (측정)

| 파일 | 추가 · 변경 | 수정 전 소스 + 새 테스트 | 수정 후 |
|---|---|---|---|
| cli `theme-commands.test.ts` | WI-0093 describe 13건 추가 | 10 빨강 · 3 초록 | 24 / 24 |
| cli `theme-add.test.ts` | WI-0087 「루트 선언 · tokens 미설치 …」의 앱 선언 음성 대조 기대를 「설치 줄 없음」에서 「`설치: <pm> install`, 범위 붙은 명령 아님」으로 바꿈(Q17, WI-0087 DEC-1 재오픈) | 1 빨강 | 73 / 73 |
| mcp `brand.test.ts` | WI-0093 describe 10건 추가(CLI 헬퍼 · 문장 대조) | 10 빨강 | 26 / 26 |

- 수정 전 소스에서 초록인 cli 3건은 종전 동작 고정 대조예요: 선언 없음(add), P2 앱 lockfile(add), PnP 루트 선언만(add, P1).
- mcp 10건이 수정 전에 모두 빨강인 것은 새 export(`tokensInstallGuideFor` · cli `tokensInstallGuide`)가 없어서예요. 선언 없음 행의 빨강은 동작 차이가 아니라 이 이유예요.
- 수정 후 전체: cli 925 / 925(기준 912 + 13, 계산과 측정 일치), mcp 191 / 191(181 + 10).

### 2.1 구현 후 추가 결정 B1 ~ B4 (측정)

| 파일 | 추가 | 수정 후 |
|---|---|---|
| cli `theme-commands.test.ts` | B1: PnP 앱 선언(yarn 워크스페이스 + `.pnp.cjs`) × tokens 미설치 · 빌드 전(`1.3-unbuilt`) · 미지원(`1.2`)에서 theme add 가 앱 선언 줄 다음에 PnP 한 줄 · PnP 줄 1개 · 설치 / 재설치 / 업그레이드 줄 없음, theme list 도 같은 한 줄. 양성 대조로 `.pnp.cjs` 없는 같은 레이아웃 미지원은 `업그레이드: yarn add "@axis-ds/tokens@^1.6.0"` | 1건 |
| cli `theme-commands.test.ts` | B2 · B3: npm 루트 선언 빌드 전 → 「워크스페이스면 npm run build -w @axis-ds/tokens, 아니면 재설치: 워크스페이스 루트에서 npm install」, pnpm · npm 앱 선언 빌드 전 → 「… 재설치: pnpm install」 · 「… 재설치: npm install」, npm 루트 선언 미설치 → 「설치: npm install」(종전 그대로, WI-0096 대조). 네 경우 모두 앱 package.json 바이트 불변 | 1건 |
| mcp `index-brand-wiring.test.ts`(새 파일) | B4: SDK `McpServer` · `StdioServerTransport` 를 대역으로 바꾸고 `src/index.ts` 를 불러 등록된 처리기를 실행. npm 루트 선언 미설치 → 두 도구 모두 「설치: 워크스페이스 루트에서 `npm install`」 · `@axis-ds/tokens@` 없음, PnP 앱 선언 → 두 도구 모두 PnP 한 줄 · 「설치: `」 없음 | 2건 |

- 수정 후 cli `src/theme/` 129 / 129, cli 전체 927 / 927(925 + 2), mcp 전체 193 / 193(191 + 2, 9 파일).
- 이 브랜치 dist 로 PnP 앱 선언(tokens 미설치) 픽스처에 `theme add sample` 을 실행한 출력(측정, rc 0): 「- package.json: @axis-ds/tokens ^1.8.0 가 이미 있어 범위를 바꾸지 않음」 다음 줄이 「    @axis-ds/tokens ^1.8.0 가 package.json 에 선언돼 있지만 Plug'n'Play 설치라 설치본을 판정하지 못해 브랜드를 읽을 수 없습니다.」, 「설치:」로 시작하는 tokens 줄 없음. 「! @axis-ds/tokens 를 읽을 수 없어(not-installed) 이름 규칙만 확인했습니다 …」 줄과 `ThemeProvider 를 쓰면 @axis-ds/theme 설치: yarn add "@axis-ds/theme@^1.3.0"` 줄은 종전 그대로 나와요(B1 범위 밖).

## 3. 변이 (측정, `trackB-mut.py`, 한 번에 하나씩 넣고 복원)

| 변이 | cli `src/theme/` 실패 | mcp `brand.test.ts` 실패 |
|---|---|---|
| m1 헬퍼가 항상 add(수정 전 동작) | 9 | 7 |
| m2 npm 루트 `install-at-root` 제거 | 2 | 2 |
| m3 P2 앱 lockfile 무시 | 2 | 1 |
| m4 PnP 분기 제거 | 1 | 1 |
| m5 앱 선언을 install 로 보지 않음 | 5 | 1 |
| m6 CLI 미지원 루트 DEC-8 문구 제거 | 1 | 1 |
| m7 theme add 앱 선언 설치 줄 제거 | 2 | 0 |
| m8 theme add 루트 빌드 전 재설치 줄 제거 | 1 | 0 |
| m9 MCP 빌드 전 재설치를 add 로 | 0 | 3 |

모두 빨강 1건 이상이에요. 끝난 뒤 `git diff --stat` 로 원래 변경만 남은 것을 확인했어요.

### 3.1 추가 결정 변이 (측정, `trackB-mut2.py` · MCP 등록부 sed, 한 번에 하나씩 넣고 복원)

| 변이 | 실패 |
|---|---|
| M1 B1 미지원에서 업그레이드 줄 억제(`!pnpTokens`) 제거 | cli `src/theme/` 1 / 129 |
| M2 B1 PnP 판정을 끔(`pnpTokens = false`) | cli `src/theme/` 1 / 129 |
| M3 B2 루트 빌드 전 재설치 줄을 종전 `plan.installCommand` 문구로 | cli `src/theme/` 1 / 129 |
| M4 B3 앱 선언 빌드 전 재설치 줄 제거 | cli `src/theme/` 1 / 129 |
| M5 B4 `axis.list_brands` 호출지를 종전 `tokensInstallCommandFor` 로 | mcp `index-brand-wiring.test.ts` 2 / 2 |
| M6 B4 `axis.get_brand` 호출지에서 안내 인자를 뺌(종전 pnpm 기본값) | mcp `index-brand-wiring.test.ts` 2 / 2 |

끝난 뒤 `git diff --stat` 로 원래 변경만 남은 것을 확인했어요.

## 4. 실제 매니저 (측정, `trackB-pm/measure.sh`)

레이아웃: 루트 `apps/*` 워크스페이스, tokens 선언 `^1.8.0`. 처음 상태는 정상 lockfile · 설치본 없음(pnpm `install --lockfile-only`, npm `install --package-lock-only`, yarn `install --mode update-lockfile`). Yarn PnP 는 처음에 `yarn install` 까지 해서 `.pnp.cjs` 가 있는 상태예요. P2 는 루트 선언 + 앱 디렉터리에 같은 매니저의 빈 lockfile. 안내 줄을 그대로 실행하고(「워크스페이스 루트에서」면 루트에서), 앱에서 `require.resolve("@axis-ds/tokens")`(bare specifier, PnP 는 `yarn node`)로 해석을 봤어요. 매니저는 pnpm 9.15.4 · npm 10.9.4 · yarn 4.5.3(corepack), 실제 npm 레지스트리의 tokens 1.8.2 를 받았어요. 수정 전은 발행본 cli 1.7.5, 수정 후는 이 브랜치 dist(`pnpm build --force` rc 0)예요.

| 매니저 / 선언 | 수정 전 안내 → 앱 선언 변화 | 수정 후 안내 → 앱 선언 변화 | 실행 전 해석 | 수정 후 실행 뒤 해석 · 다시 list |
|---|---|---|---|---|
| pnpm / 루트 | `pnpm add "…@^1.6.0"` → `{}`→`^1.6.0` | `pnpm install` → 없음 | 못 함 | 해석됨 · 브랜드 1개 |
| pnpm / 앱 | 같은 add → `^1.8.0`→`^1.8.2` | `pnpm install` → 없음 | 못 함 | 해석됨 · 브랜드 1개 |
| pnpm / 미선언 | add → `^1.6.0` 생김 | 같음(종전) | 못 함 | 해석됨 · 브랜드 1개 |
| pnpm / P2 | add → `^1.6.0` 생김 | 같음(종전) | 못 함 | 해석됨 · 브랜드 1개 |
| npm / 루트 | `npm install "…@^1.6.0"` → `{}`→`^1.8.2` | 「워크스페이스 루트에서 npm install」 → 없음 | 못 함 | 해석됨 · 브랜드 1개 |
| npm / 앱 | 같은 명령 → `^1.8.0`→`^1.8.2` | `npm install`(앱 디렉터리) → 없음 | 못 함 | 해석됨 · 브랜드 1개 |
| npm / 미선언 · P2 | `npm install "…"` → `^1.8.2` 생김 | 같음(종전) | 못 함 | 해석됨 · 브랜드 1개 |
| yarn nm / 루트 | `yarn add "…"` → `^1.6.0` 생김 | `yarn install` → 없음 | 못 함 | 해석됨 · 브랜드 1개 |
| yarn nm / 앱 | `yarn add "…"` → `^1.8.0`→`^1.6.0`(범위가 낮아짐) | `yarn install` → 없음 | 못 함 | 해석됨 · 브랜드 1개 |
| yarn nm / 미선언 · P2 | add → `^1.6.0` 생김 | 같음(종전) | 못 함 | 해석됨 · 브랜드 1개 |
| yarn PnP / 루트 | `yarn add "…"` → `^1.6.0` 생김, 다시 list 「설치돼 있지 않아」 | 같은 add(P1) → `^1.6.0` 생김, 다시 list PnP 한 줄 | **못 함**(루트 선언 · 설치됐는데 앱에서 해석 불가, Q1 근거) | 해석됨 · PnP 한 줄 |
| yarn PnP / 앱 | `yarn add "…"` → `^1.8.0`→`^1.6.0`, 다시 list 「설치돼 있지 않아」 | PnP 한 줄, 실행할 명령 없음 → 없음 | 해석됨 | 해석됨 · PnP 한 줄 |
| yarn PnP / 미선언 · P2 | add → `^1.6.0` 생김, 다시 list 「설치돼 있지 않아」 | 같은 add → 생김, 다시 list PnP 한 줄 | 못 함 | 해석됨 · PnP 한 줄 |

- 16건 모두 안내 실행 rc 0, 실행 뒤 앱에서 tokens 가 해석돼요(수정 전 · 후 모두). 차이는 **앱 package.json 이 바뀌는지**예요. 선언이 있던 8건(루트 4 · 앱 4)은 수정 전 8건 모두 바뀌었고 수정 후 0건이에요.
- 실행 전 해석 「못 함」은 양성 · 음성 대조예요: 안내 전에는 해석되지 않다가 안내 뒤 해석돼요. PnP 앱 선언만 처음부터 해석돼요(설치된 상태에서 시작).
- PnP 는 안내를 따른 뒤에도 list 가 브랜드를 읽지 못해요(brand-core 가 node_modules 만 봄, Q13 범위 밖). 수정 후에는 「설치돼 있지 않아」 대신 판정하지 못했다는 한 줄이라 add 를 다시 권하지 않아요.
- PnP P2(앱에 빈 `yarn.lock`)는 yarn 이 앱을 별도 프로젝트로 다뤄 `apps/web/.yarn` 아래에 설치했어요. 실행 전 해석은 yarn 오류(설치 안 된 프로젝트)였어요.

## 5. MCP stdio (측정)

이 브랜치 `packages/axis-mcp/dist/index.js` 를 stdio 로 띄워 조사 단계 픽스처(`WI-0093/fx`)에서 `axis.list_brands` · `axis.get_brand` 를 불렀어요(같은 픽스처를 발행본 mcp 1.4.4 로도).

| 픽스처 | 1.4.4 | 수정 후 |
|---|---|---|
| c1 선언 없음 | `pnpm add "…@^1.6.0"` | 같음 |
| c2 앱 선언 | `pnpm add "…"` | `pnpm install` |
| c3 pnpm 루트 | `pnpm add "…"` | `pnpm install` |
| c4 npm 루트 | `npm install "…"` | 워크스페이스 루트에서 `npm install` |
| c5 yarn 루트 | `yarn add "…"` | `yarn install` |
| c6 루트 선언 · 1.2(미지원) | 업그레이드 `pnpm add "…"` | DEC-8 문구 |
| c7 루트 선언 · 빌드 전 | 재설치 `pnpm add "…"` | 재설치 `pnpm install` |
| c9 P2(앱 빈 package-lock) | `npm install "…"` | 같음(P2) |
| c11 앱 선언 · 1.2 | 업그레이드 `pnpm add "…"` | 같음(범위를 올려야 함) |

두 도구의 안내 줄이 같고 `isError` 는 모두 false 예요.

## 6. 품질 게이트 (측정, 캐시 우회)

| 명령 | 결과 |
|---|---|
| `pnpm exec turbo run type-check --force` | rc 0, 11/11, Cached 0 |
| `pnpm exec turbo run lint --force` | rc 0, 7/7, Cached 0 |
| `pnpm exec turbo run build --force` | rc 0, 8/8, Cached 0(빌드가 다시 만든 `apps/web/public/templates/*.json` 은 커밋 전에 되돌림) |
| cli `npx vitest run`(전체) | rc 0, 21 파일 927 / 927 |
| mcp `npx vitest run`(전체) | rc 0, 9 파일 193 / 193 |

추가 결정 B1 ~ B4 를 반영한 뒤 다시 잰 값이에요(처음 구현 때는 cli 925 · mcp 191).

registry-core 는 테스트 파일이 없고 헬퍼는 cli · mcp 테스트가 덮어요.

## 7. 재지 못한 것

- yarn 1 워크스페이스, bun lockfile 만 있는 멤버 앱(`APP_LOCKFILES` 에는 bun 이 있어 P2 로 add, `LOCKFILE_COMMANDS` 에 bun 이 없어 매니저는 pnpm 기본값).
- npm 7 ~ 9 에서 앱 디렉터리 `npm install` 이 앱 선언을 설치하는지(npm 10.9.4 만 잼).
- npm 에서 루트 · 앱 범위가 서로 다를 때.
- MCP `targetDir` 생략(서버 cwd), 실제 MCP 클라이언트 표시.
- 실제 레지스트리의 1.2.x 설치본 · 빌드 전 설치본에서 새 안내를 실행한 결과(단위 · stdio 픽스처로만 확인).
