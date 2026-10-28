# WI-0097: check 의 CSS import 해석 가능성 판정 테스트 계획

> PRD: [prd.md](./prd.md) | 작성일: 2026-10-28 | 상태: 1부 측정(2026-10-28, 2절 Q22 · 4.1 · 4.2 중간 측정 · 5절 1부 변이, Q39 반영 재측정, 4.4 B1 문구 확정(Q43)). 1절의 「발행본」 열은 착수 조사 · 반박 검증의 **측정** 값이고, 2부(globals 게이트) 결과 칸은 0100a 머지 뒤 채워요
> 조사 scratchpad(세션 임시 경로, 구현 때 사라질 수 있음): `/tmp/claude-1000/-home-sinclair-work-idea-on-action-AXIS-Design-System/7a29a557-9ebc-48a8-a772-89e5ee57e773/scratchpad/` 아래 `WI-0097/`(조사, ui-react) · `WI-0097-verify/`(검증, agentic-ui). 이하 `$S` 로 줄여요
> 비교 기준 두 축: ① 문제 재현(음성 대조)은 1절 「발행본 1.7.6」 측정값 ② 「수정 전후 불변」(AC7 · AC9 · AC12, 4.2)은 **WI-0100a 머지 직후 HEAD 빌드 사본** 대 수정본이에요. 0100a 의 `globalCss` 우선 변경이 한 diff 에 섞이지 않게 해요. 기준 커밋 SHA: 1부(0100a 와 겹치지 않는 부분, 2026-10-28)는 c0dcc14 빌드 사본으로 중간 측정했고(4절), 2부 착수 때 0100a 머지 직후 SHA 를 여기에 기록해요

## 1. fixture

출처 열은 scratchpad 경로이고, 「테스트 fixture 형태」는 구현 때 `template-check.test.ts` 새 describe 「WI-0097」의 헬퍼로 옮길 모양이에요. 설치 stub 은 `writeInstalledStub`(package.json) 에 필요하면 `tailwind.css` · `dist/` 를 더해요. PnP 는 WI-0091 의 `pnpWs`(루트 `workspaces` · `yarn.lock` · `.yarnrc.yml` nodeLinker pnp · `.pnp.cjs` · node_modules 없음)를 써요.

| id | 출처 | 테스트 fixture 형태 | 발행본 1.7.6 tailwind.config / globals (측정) | 기대(수정본) | AC |
|---|---|---|---|---|---|
| F1 root-notinst | `$S/WI-0097/fx/root-notinst` · `$S/WI-0097-verify/fx/root-notinst` | npm 워크스페이스, 루트 `dependencies` 에 ui-react(또는 agentic-ui), 설치 stub 없음, 앱 TW4 | B1 줄 안내 WARN / PASS, rc 0 | B1 설치 안내 WARN(줄 바로 안내 없음), rc 0 | AC1 |
| F2 root-inst-css | 두 폴더 `root-inst-css` | F1 + 루트 node_modules 설치 stub 1.8.2 + `tailwind.css` | B1 줄 안내 / PASS | 발행본과 바이트 같음 | AC7 가드 |
| F3 root-inst-nofile | 검증 `root-inst-nofile` | F1 + 설치 stub 1.8.2, `tailwind.css` 없음 | B1 줄 안내 | 다시 설치 안내 WARN | AC2 |
| F4 root-inst-old | 두 폴더 `root-inst-old` | F1 + 설치 stub 1.3.0 | B1 줄 안내 + 버전 꼬리 | 1.4.0 이상 올림 안내 WARN | AC2 |
| F4u root-inst-unknown(새로 만듦) | - | F1 + 버전을 읽지 못하는 설치 stub(`installedVersion` 이 `"?"` 가 되는 조건은 착수 때 코드로 확인, version 필드 없음으로 추정) | 미측정 | 1.4.0 이상 올림 안내 WARN(「버전 모름」 표기) | AC2 |
| F5 pnp-root | 두 폴더 `pnp-root` | `pnpWs` + 루트에만 선언 | B1 줄 안내 | `PNP_ROOT_ONLY_NOTE` 계열 WARN | AC3 |
| F5c pnp-root 양성 대조 | F5 에서 `.pnp.cjs` 를 지운 사본(새로 만듦) | - | 미측정 | F1 과 같은 갈래 | AC3 |
| F6 applock-root | 조사 `applock-root` | F1 + 앱 `package-lock.json` | B1 줄 안내 | 그 패키지를 요구하지 않음 | AC4 |
| F6i applock-root-installed(새로 만듦, 보정 단계) | - | F6 + 루트 node_modules 설치 stub 1.8.2 + `tailwind.css` | 미측정 | 종전 PASS(P2 경계가 설치본 확인보다 먼저라 줄을 권하지 않음) | AC4 · M8 |
| F6w applock-root-withline(새로 만듦) | - | F6 + 줄 | 미측정 | 종전 PASS(판정하지 않음) | AC4 · M8 |
| F7 appdecl-notinst | 두 폴더 `appdecl-notinst` | 앱 `dependencies` 에 선언, 설치 stub 없음 | B1 줄 안내 | 발행본과 같음(Q21) | AC7 가드 |
| F8 pnp-appdecl | 검증 `pnp-appdecl` | `pnpWs` + 앱 선언 | B1 줄 안내 | 발행본과 같음 | AC7 가드 |
| F9 root-notinst-withline | 두 폴더 | F1 + `@import "<pkg>/tailwind.css";` | **PASS** | 해석 불가 WARN | AC5 |
| F10 root-inst-nofile-withline | 검증 | F3 + 줄 | **PASS** | 해석 불가 WARN | AC5 |
| F11 pnp-root-withline | 두 폴더 | F5 + 줄 | **PASS** | PnP 틀 WARN | AC5 |
| F12 root-inst-old-withline | 두 폴더 | F4 + 줄 | 버전 WARN(`:843-847`) | 발행본과 같음 | AC5(가드 성격) |
| F4uw root-inst-unknown-withline(새로 만듦) | `$S/WI-0097impl/fx/<pkg>/root-inst-unknown-withline` | F4u + 줄 | PASS(c0dcc14 사본으로 측정, 발행본 소스와 같음) | 해석 불가 WARN「설치본(버전 모름)에 tailwind.css 가 없어 해석되지 않습니다 → 1.4.0 이상으로 올리세요」(사용자 결정 Q39, 문구 확정(Q43)) | AC5 |
| F13 root-inst-css-withline | 검증 | F2 + 줄 | PASS | PASS 그대로 | AC7 가드 |
| F14 appdecl-notinst-withline | 검증 | F7 + 줄 | PASS | PASS 그대로(Q21) | AC7 가드 |
| F15 mixed(새로 만듦) | - | 앱 선언 ui-react(설치 · 파일 있음) + 루트 agentic-ui 미설치 | 미측정 | agentic-ui 만 알림, 줄 있음 · 없음 두 변형 | AC5 |
| G1 | 조사 `g1-tw3-undeclared` · 검증 `g1` | TW3 `.ts`, tokens 미선언 · 미설치, `@import "@axis-ds/tokens/css"` | globals PASS | globals WARN | AC6 |
| G2 | 조사 `g2-tw4-declared-notinst` · 검증 `g2` | TW4, tokens 앱 선언 · 미설치 | tailwind.config PASS · globals PASS | tailwind.config PASS 그대로 · globals PASS 그대로(Q28) | AC7 가드 · M6 |
| G7 root-decl-notinst(새로 만듦) | - | npm 워크스페이스, tokens 루트 `dependencies` 에만 선언 · 설치 stub 없음, 앱 TW4 + tokens CSS import | 미측정 | globals WARN(설치 안내), tailwind.config PASS 그대로(D4) | AC6 |
| G3 | 조사 `g3-pnp-app`(stub) | `pnpWs` + tokens 앱 선언 | **미기록**(조사 · 검증 결과에 check 출력 없음, 착수 때 재측정) | globals PASS | AC7 가드 · M11 |
| pnp-app(실빌드 근거) | `$S/WI-0097/pnp-app`(Yarn 4.5.3 실설치, G3 와 다른 디렉터리) | - | check 재지 않음, 실빌드 rc 0(측정) | - | G3 근거 |
| G4 | 조사 `g4-pnp-root` · 검증 `g4` | `pnpWs` + tokens 루트 전용 | 두 항목 PASS | globals PnP 틀 WARN, tailwind.config PASS 그대로(D4) | AC6 |
| G5 | 조사 `g5-tw3-layout` · 검증 `g5` | TW3, `app/layout.tsx` 에 `import "@axis-ds/tokens/css"`, 미설치 | globals PASS(rc 1 은 tailwind.config 없음) | globals WARN, rc 1 그대로 | AC6 · AC12 |
| G6(새로 만듦) | - | tokens 설치 stub(package.json 만) + import | 미측정 | PASS 그대로(디렉터리 기준, M9 대상) | AC7 가드 |
| W1 저장소 `apps/web` | 저장소 자체 | workspace 링크, `layout.tsx:7`, tokens dist 있음 · 없음 두 상태 | 미측정 | 두 상태 모두 PASS | AC7 가드 |
| C1 g1cjs(참고) | 검증 `g1cjs` | TW3 CJS preset | WARN「버전을 확인하지 못했습니다」 | 이 WI 범위 밖(WI-0101 대조용) | - |

## 2. 착수 게이트 실빌드 (Q22, 2026-10-28 측정)

조건: corepack 으로 고정한 yarn@4.5.3(`--version` 4.5.3), 앱 dependencies 의 `@tailwindcss/cli` · `tailwindcss` 4.1.14(빌드 배너 「tailwindcss v4.1.14」), 발행본 `@axis-ds/ui-react` · `agentic-ui` · `tokens` 1.8.2 를 npm 레지스트리에서 실설치, node v22.22.0. 루트 package.json 은 `workspaces: ["apps/*"]` · `packageManager: yarn@4.5.3` · dependencies 에 AXIS 세 패키지. `.yarnrc.yml` 은 `nodeLinker: pnp` · `enableGlobalCache: false` · `enableMirror: false` · `cacheFolder: ./.yarn/cache`. 빌드는 `cd apps/web; out=$(corepack yarn@4.5.3 tailwindcss -i <f>.css -o <f>.out.css 2>&1); rc=$?`. 입력 `u.css` = `@import "tailwindcss";` + `@import "@axis-ds/ui-react/tailwind.css";`, `g.css` = agentic-ui 같은 꼴, `t.css` = `@import "@axis-ds/tokens/css/tailwind4";`. 재현 스크립트는 `$S/WI-0097impl/scripts/q22.sh <새 디렉터리> root|app`, 산출물은 `$S/WI-0097impl/q22/`.

| 측정 | 명령 | 기대 | 결과(측정) |
|---|---|---|---|
| PnP 루트 전용 `@axis-ds/ui-react/tailwind.css` | 앱 package.json 은 `@tailwindcss/cli` · `tailwindcss` 만, `-i u.css` | rc 1 `Can't resolve` | install rc 0, 빌드 **rc 1** 「Error: Can't resolve '@axis-ds/ui-react/tailwind.css' in '<app>'」. `g.css`(agentic-ui)도 rc 1 같은 문구 |
| PnP 루트 전용 `@axis-ds/tokens/css/tailwind4` | 같은 워크스페이스, `-i t.css` | rc 1 | **rc 1** 「Can't resolve '@axis-ds/tokens/css/tailwind4'」 |
| 계측 대조(설치돼 있는지) | 같은 워크스페이스에서 `node -r ./.pnp.cjs` 로 `require.resolve` | 루트 issuer 성공 · 앱 issuer 실패 | 루트 issuer 는 세 spec 모두 rc 0(`.yarn/cache` zip 안 경로, tokens 는 `dist/css/tailwind4.css`), 앱 issuer 는 MODULE_NOT_FOUND 「Your application tried to access @axis-ds/ui-react, but it isn't declared in your dependencies」. 그래서 위 rc 1 은 「미설치」가 아니라 「루트에만 선언」 조건의 값이에요(조사 D6 정정 사항을 실측으로 메움) |
| 양성 대조 | 앱에도 세 패키지 선언 · install 뒤 같은 세 명령 | rc 0, 산출물에 `--axis-` 줄 | install rc 0, `u.css` · `g.css` · `t.css` 모두 **rc 0** 「Done」. `t.out.css` 는 `--axis-` 572줄(28,674 B) |
| 재현 | 새 디렉터리에서 스크립트로 루트 전용 · 앱 선언을 다시 잼(`q22/rerun-root` · `rerun-app`) | 같은 값 | 두 번 모두 같은 rc · 문구 |
| (선택) G5 근거 | tokens 미설치 앱의 `app/layout.tsx` `import "@axis-ds/tokens/css"` 를 `next build` 또는 esbuild 로 1회 | rc 비0 · 해석 실패 | **미측정**(2부에서 정함, 재지 않으면 g5 는 prd 5절 잔여) |

- 판정: 두 측정 모두 rc 1, 양성 대조 rc 0 이라 착수 게이트를 통과했어요. AC3 · AC5(PnP 행) · AC6(G4)의 근거가 `project.ts:174-175` 주석의 주장에서 이 실측으로 바뀌어요
- 전역 Yarn 캐시(`~/.yarn/berry/cache`)는 지우거나 고치지 않았어요. 첫 설치에서 `enableMirror` 를 끄지 않아 전역 미러에 `@axis-ds-agentic-ui-npm-1.8.2` zip 이 한 개 새로 생겼을 수 있어요(시각이 겹치지만 이 설치가 쓴 것인지는 판별하지 못함). 두 번째 측정부터는 `enableMirror: false` 로 쟀고 그 뒤 새로 생긴 파일은 0건이에요(`find -newer` 확인)
- 부수 관찰(이 WI 결정 밖, 사용자 결정 Q40 으로 **WI-0102(#249)로 이관**, 이 WI 코드 변경 없음): 양성 대조의 `u.out.css` · `g.out.css`(4,455 ~ 4,534 B)는 `@import "tailwindcss"` 하나만 넣은 빌드와 바이트가 같고 컴포넌트 클래스 `axis-button-bg-default` 가 0건이에요. 같은 `u.css` 를 npm 설치본(node_modules, ui-react 1.8.2)으로 빌드하면 rc 0 · 47,858 B · 그 클래스 2건이에요. PnP 에서는 `tailwind.css` 의 `@source "./dist"` 가 zip 안을 가리켜 스캔되지 않는다고 추정해요(unplug 대조는 하지 않음). 앱에 선언하면 import 는 해석되지만(rc 0) 효과가 없다는 뜻이라 WI-0102(#249)에서 다뤄요(Q40)
- 미측정: `pnpFallbackMode: all`(prd 5절 잔여), `next build` 경유 빌드, 위 (선택) G5 행

## 3. 측정 명령

- CLI: `$S/WI-0097/scripts/run.sh <fixture 앱 디렉터리>` 와 같은 모양. 수정본은 `C=` 를 worktree `packages/axis-cli/dist/index.js` 로 바꿔요. rc 는 `out=$(node "$C" check --dir "$1" 2>&1); rc=$?` 로 받아요(파이프 rc 가림 회피)
- MCP: 발행본 `$S/WI-0097-verify/pkg` 의 mcp `dist/index.js` · 수정본 `packages/axis-mcp/dist/index.js` 에 stdio JSON-RPC `initialize` → `tools/call axis.check_project {targetDir}`
- theme add A/B(AC9): F1 · F3 · F4 · F5 · F6 사본에 `axis theme add <brand> --dir …` 를 발행본 · 수정본으로 돌려 stdout · 바뀐 파일 diff
- 실빌드: `@tailwindcss/cli` 4.1.14, `$S/WI-0097/build` · `$S/WI-0097-verify/build` · `build2` 와 같은 구성
- 게이트: `pnpm exec turbo run build --force` · `type-check --force` · `lint --force`(Cached 0 확인), cli · mcp `npx vitest run`, `pnpm check-changeset-mcp-tokens`

## 4. 결과 표 (구현 때 채움)

### 4.1 테스트 수

1부(B1 양방향 · 해석 상태 헬퍼 · DEC-2 이전) 기준이에요. 기준선은 c0dcc14(WI-0100a 머지 전, 1부는 0100a 와 겹치지 않는 부분만 먼저 해서 이 SHA 위에서 잼)이고, 2부는 0100a 머지 직후 HEAD 로 다시 재요.

| 패키지 · 파일 | HEAD 기준선(c0dcc14) | 1부 수정 뒤 | 기존 기대 변경(plan 4절 목록과 대조) |
|---|---|---|---|
| cli 전체 | 21 파일 · 946 통과 | 21 파일 · 978 통과(+32). Q39 반영 뒤(2026-10-28) 982 통과 | 1건, 목록 안(`template-check.test.ts` WI-0086 「AC2 Tailwind 4 설치 앱」, 아래) |
| cli `template-check.test.ts` · `theme-add.test.ts` | 199 · 73 | 230 · 74. Q39 반영 뒤 두 파일 합계 308 | 위 1건만. `theme-add.test.ts` 기존 73건은 기대 변경 0(AC9) |
| mcp 전체(빌드 뒤 실행) · `template.test.ts` | 9 파일 · 197 · 43 | 9 파일 · 208 · 54. Q39 반영 뒤 209 · 55 | 0건 |
| registry-core | 테스트 없음(type-check · lint 만, 새 헬퍼 단위 테스트는 cli `template-check.test.ts` 「WI-0097」 describe) | - | - |

- plan 4절 첫 행(`template-check.test.ts` WI-0086 「AC2 Tailwind 4 설치 앱」, 루트 ui-react 1.8.1 설치본 stub 에 `tailwind.css` 없음)은 1부 수정에서 실제로 B1 줄 안내 → 「설치본(1.8.1)에 tailwind.css 가 없습니다 … 다시 설치」로 바뀌었어요. 테스트 의도가 「루트 선언 인정」이라 **stub 보강**으로 처리했어요(설치본에 실제 배포본처럼 `tailwind.css` 를 두고 기대는 그대로)
- 같은 describe 의 「AC3 미설치 루트 선언」(루트 ui-react `^1.3.0` 미설치 + 줄 있음)은 문구가 「버전 확인이 필요합니다」에서 「import 가 있지만 … 설치되지 않아 해석되지 않습니다」로 바뀌지만, 단언이 severity warn · 끝의 버전 안내 `toContain` · fail 0 이라 기대 변경 없이 통과해요
- globals PASS 후보(cli 9건 · mcp 4건)는 1부에 globals 게이트가 없어 전이 0 이에요(2부에서 다시 봐요). 앱 선언 B1(cli `:917-941` · `:1118-1140` · `:1194`, mcp `:329` · `:358` · `:406`)과 TW4 진입점 PASS 는 전이 0 이에요
- 새 테스트를 c0dcc14 소스(수정한 소스 4개만 HEAD 사본으로 바꿈, 테스트 파일은 새 것)에 돌리면 cli 24 빨강 · 280 초록, mcp 7 빨강 · 47 초록이에요. 빨강은 AC1 ~ AC5 행 · 헬퍼 · DEC-2 이전 행이고, 초록으로 남은 새 행은 회귀 가드(F2 · F7 · F8 · F6w · F13 · F14 · F12 · `@source` 가드)예요. 원복은 sha256 대조(4/4 OK)

### 4.2 fixture A/B (1절 전부, CLI · MCP)

| id | 발행본 rc(음성 대조) | 0100a HEAD 사본 rc | 수정본 rc | 바뀐 항목 · 문구(0100a HEAD 사본 대비) | CLI = MCP(severity · message) |
|---|---|---|---|---|---|

**1부 중간 측정(2026-10-28, tailwind.config 항목만, 기준은 c0dcc14 빌드 사본)**: 이 표의 정식 기준(0100a 머지 직후 HEAD)이 아직 없어 c0dcc14 사본(`$S/WI-0097impl/headbuild`, cli · mcp dist)과 1부 수정본 dist 를 F 계열 fixture 40개(`$S/WI-0097impl/fx`, ui-react · agentic-ui 각 19 + mixed 2)에 돌렸어요. 측정 스크립트 `$S/WI-0097impl/scripts/measure.sh`, 출력 `$S/WI-0097impl/out/measure-mod.txt`. 2부에서 0100a 머지 직후 HEAD 사본으로 다시 재요.

- 수행 증명: 40개 모두 CLI · MCP(stdio `axis.check_project`) 응답이 있고 MCP 호출 rc 0 이 40/40(HEAD 사본 · 수정본 양쪽). HEAD 사본의 tailwind.config 줄은 발행본 1.7.6 측정(`out/published-1.7.6.txt`)과 40/40 같아요(c0dcc14 = 발행본 소스)
- CLI rc 는 40/40 이 HEAD 사본과 수정본에서 같아요(모두 0, AC12 1부 범위). 수정본 CLI = MCP(severity · message)는 40/40 이에요(AC8)
- (Q39 전 집계) 바뀐 fixture 22개(패키지마다 10 + mixed 2): root-notinst · pnp-root-nopnp(설치 안내), root-inst-nofile(다시 설치), root-inst-old · root-inst-unknown(1.4.0 올림, 버전 모름 표기), pnp-root(PnP 문구), applock-root(WARN → PASS, AC4), root-notinst-withline · root-inst-nofile-withline · pnp-root-withline(PASS → WARN, AC5), mixed · mixed-withline(agentic-ui 만). 문구는 1절 기대와 같고, 확정 문구는 `template-check.test.ts` 「WI-0097」 describe 에 있어요
- (Q39 전 집계) 바뀌지 않은 fixture 18개(가드): appdecl-notinst(+withline), pnp-appdecl(+withline), root-inst-css(+withline), applock-root-withline, root-inst-old-withline(종전 버전 WARN), root-inst-unknown-withline(종전 PASS). 마지막 것은 아래 Q39 반영으로 바뀐 쪽으로 옮겼어요
- **Q39 반영 뒤 재측정(2026-10-28)**: 같은 스크립트로 40개를 다시 쟀어요(출력 `$S/WI-0097impl/out/measure-mod.txt`, 반영 전 사본 `$S/WI-0097impl/q39/measure-mod.before-q39.txt`). 「fixture 40, 바뀜 24, CLI rc 같음 40/40, CLI=MCP(수정본) 40/40, MCP 호출 rc 0(양쪽) 40/40」. 반영 전과 다른 줄은 root-inst-unknown-withline 두 개(ui-react · agentic-ui)의 PASS → WARN 뿐이고 CLI rc 는 c0dcc14 사본 · 수정본 모두 0 이에요(종료 코드 불변). 바뀌지 않은 가드는 16개예요
- Q39 변이(`root-old` 줄 있음 갈래를 끔, sha256 대조 원복 OK): cli `template-check.test.ts` + `theme-add.test.ts` 308건 중 2 빨강(F4uw 두 패키지), mcp `template.test.ts` 55건 중 1 빨강(출력 `$S/WI-0097impl/q39/mut-*.txt`)

**theme add A/B(AC9, 1부)**: 같은 경로에 fixture 를 새로 만들어 c0dcc14 사본과 수정본으로 `axis theme add ontology --dir <app>` 를 돌리고 stdout+stderr · rc · 바뀐 파일 sha256 을 비교했어요(`scripts/themeab.sh`, 출력 `$S/WI-0097impl/themeab/out`). 10 레이아웃(root-notinst · root-inst-css · root-inst-nofile · root-inst-old · root-inst-unknown · pnp-root · applock-root · appdecl-notinst · mixed · root-notinst-withline) × 2 패키지 = 20개가 모두 같아요. Q39 반영 뒤 다시 빌드한 dist 로 다시 재도 「합계 20, 같음 20, 다름 0」이에요(2026-10-28, cli `index.js` sha256 앞 16자 c0dcc14 사본 37a47ceae6a0dc95 · 수정본 7551e7bfe2c3673e). DEC-2 의 세 문장(미설치 · 손상 · 1.4.0 미만/버전 모름)이 10개 출력에 실제로 나와 그 경로가 실행됐음을 확인했고, 두 dist 의 `index.js` sha256 은 달라요(비교 대상이 서로 다른 빌드)

### 4.3 실빌드 대조

| 경우 | 줄 | rc |
|---|---|---|
| F1 안내대로 설치 · 줄 추가 | 있음 | 기대 0 |
| F9 그대로 | 있음 | 측정 1(조사 · 검증), 재확인 |
| F11 그대로 | 있음 | 2절 결과 |

### 4.4 B1 확정 문구 (사용자 결정 Q43, 2026-10-28)

TW4 B1 의 새 안내 문구 8개를 1부 구현 그대로 확정했어요(코드 변경 없음). 「코드 문자열」 칸은 `packages/axis-registry-core/src/template/tailwind-core.ts` 의 템플릿 리터럴 본문을 글자 그대로 옮겼고(`${...}` 자리는 실행 때 채워짐), 「측정 출력」 칸은 `$S/WI-0097impl/out/measure-mod.txt` 의 ui-react 수정본(`mod`) 줄에서 `Tailwind 4: app/globals.css에 ` 뒤를 옮겼어요. 두 칸 모두 grep -F 로 원본과 대조했어요(표 아래).

줄 없음 방향(`componentCssMissingIssue`):

| # | 갈래 | 코드 문자열 | 측정 출력(fixture) |
|---|---|---|---|
| M-1 | 루트 선언 미설치 | `${name} 가 워크스페이스 루트에 선언됐지만 설치되지 않았습니다 → 설치(${componentInstallPhrase(baseDir, name, r.range)}) 뒤 ${line}` | `@axis-ds/ui-react 가 워크스페이스 루트에 선언됐지만 설치되지 않았습니다 → 설치(pnpm install) 뒤 @import "@axis-ds/ui-react/tailwind.css";`(root-notinst) |
| M-2 | PnP 루트 전용 | `${name} 가 ${PNP_ROOT_ONLY_NOTE} → 앱 package.json 에 선언한 뒤 ${line}` | `@axis-ds/ui-react 가 워크스페이스 루트에만 선언돼 Plug'n'Play 에서 앱이 해석하지 못합니다 → 앱 package.json 에 선언한 뒤 @import "@axis-ds/ui-react/tailwind.css";`(pnp-root) |
| M-3 | 설치본 파일 없음(손상) | `워크스페이스 루트에 선언된 ${name} 의 설치본(${r.installedVersion})에 tailwind.css 가 없습니다(설치가 손상됐을 수 있음) → 다시 설치(${componentInstallPhrase(baseDir, name, r.range)}) 뒤 ${line}` | `워크스페이스 루트에 선언된 @axis-ds/ui-react 의 설치본(1.8.2)에 tailwind.css 가 없습니다(설치가 손상됐을 수 있음) → 다시 설치(pnpm install) 뒤 @import "@axis-ds/ui-react/tailwind.css";`(root-inst-nofile) |
| M-4 | 1.4.0 미만/버전 모름 | `워크스페이스 루트에 선언된 ${name} 의 설치본(${r.installedVersion === "?" ? "버전 모름" : r.installedVersion})에 tailwind.css 가 없습니다(${TAILWIND4_MIN_AXIS_VERSION} 부터 제공) → ${TAILWIND4_MIN_AXIS_VERSION} 이상으로 올린 뒤 ${line}` | `워크스페이스 루트에 선언된 @axis-ds/ui-react 의 설치본(1.3.0)에 tailwind.css 가 없습니다(1.4.0 부터 제공) → 1.4.0 이상으로 올린 뒤 @import "@axis-ds/ui-react/tailwind.css";`(root-inst-old, 뒤에 종전 버전 꼬리가 붙음) · `워크스페이스 루트에 선언된 @axis-ds/ui-react 의 설치본(버전 모름)에 tailwind.css 가 없습니다(1.4.0 부터 제공) → 1.4.0 이상으로 올린 뒤 @import "@axis-ds/ui-react/tailwind.css";`(root-inst-unknown) |

줄 있음 방향(`componentCssPresentIssue`, 앞머리 `head` 는 `${name}/tailwind.css import 가 있지만`):

| # | 갈래 | 코드 문자열 | 측정 출력(fixture) |
|---|---|---|---|
| P-1 | 미설치 | `${head} ${name} 가 설치되지 않아 해석되지 않습니다 → 설치(${componentInstallPhrase(baseDir, name, r.range)})` | `@axis-ds/ui-react/tailwind.css import 가 있지만 @axis-ds/ui-react 가 설치되지 않아 해석되지 않습니다 → 설치(pnpm install)`(root-notinst-withline) |
| P-2 | PnP 루트 전용 | `${head} ${name} 가 ${PNP_ROOT_ONLY_NOTE} → 앱 package.json 에 선언하세요` | `@axis-ds/ui-react/tailwind.css import 가 있지만 @axis-ds/ui-react 가 워크스페이스 루트에만 선언돼 Plug'n'Play 에서 앱이 해석하지 못합니다 → 앱 package.json 에 선언하세요`(pnp-root-withline) |
| P-3 | 설치본 파일 없음 | `${head} ${name} 설치본(${r.installedVersion})에 tailwind.css 가 없어 해석되지 않습니다 → 다시 설치(${componentInstallPhrase(baseDir, name, r.range)})` | `@axis-ds/ui-react/tailwind.css import 가 있지만 @axis-ds/ui-react 설치본(1.8.2)에 tailwind.css 가 없어 해석되지 않습니다 → 다시 설치(pnpm install)`(root-inst-nofile-withline) |
| P-4 | 버전 모름 | `${head} ${name} 설치본(버전 모름)에 tailwind.css 가 없어 해석되지 않습니다 → ${TAILWIND4_MIN_AXIS_VERSION} 이상으로 올리세요` | `@axis-ds/ui-react/tailwind.css import 가 있지만 @axis-ds/ui-react 설치본(버전 모름)에 tailwind.css 가 없어 해석되지 않습니다 → 1.4.0 이상으로 올리세요`(root-inst-unknown-withline) |

- `PNP_ROOT_ONLY_NOTE` 는 `packages/axis-registry-core/src/project.ts:219` 의 「워크스페이스 루트에만 선언돼 Plug'n'Play 에서 앱이 해석하지 못합니다」, `TAILWIND4_MIN_AXIS_VERSION` 은 1.4.0 이에요. 줄 있음 1.4.0 미만(root-inst-old-withline)은 새 문구가 아니라 종전 버전 WARN 그대로라 8개에 들지 않아요
- 설치 명령 구절(`componentInstallPhrase`)은 선언 출처를 따라요(위 측정은 pnpm 워크스페이스, pnp-root-nopnp 는 `yarn install`, npm 루트는 「워크스페이스 루트에서 npm install」. H4 잔여는 prd 5절)
- 대조 기록(2026-10-28): 이 절의 표 행을 awk 로 뽑아 「코드 문자열」 칸을 `tailwind-core.ts` 에 `grep -F` 하니 8/8 일치, 「측정 출력」 칸 9개(M-4 는 2개)를 `measure-mod.txt` 의 `mod : WARN Tailwind 4: app/globals.css에 ` 접두와 붙여 `grep -F` 하니 9/9 일치예요. `head` 정의(`tailwind-core.ts:922`) · `PNP_ROOT_ONLY_NOTE`(`project.ts:219`) · `TAILWIND4_MIN_AXIS_VERSION = "1.4.0"`(`project.ts:546`)도 각 1건이에요. 음성 대조로 M-1 끝을 「않았어요」로 바꾼 문자열은 0건이었어요. `measure-mod.txt` 를 만든 수정본 cli `index.js` sha256 앞 16자 7551e7bfe2c3673e 는 이번에 다시 빌드한 dist 와 같아요(4.2 theme add A/B 와 같은 값)

## 5. 변이 계획 (AC11)

변이마다 적용 → cli `template-check.test.ts` · `theme-add.test.ts` · mcp `template.test.ts` 실행 → sha256 대조로 원복해요. 새 테스트는 먼저 HEAD 소스에 돌려 AC1 ~ AC6 행 빨강 · AC7 가드 행 초록을 확인해요(WI-0091 testplan 3.1 방식).

| 변이 | 잡아야 할 행 |
|---|---|
| M1 B1 해석 게이트 제거(`declaredRange` 로 되돌림) | F1 · F3 · F4 · F4u · F6 |
| M2 PnP 루트 전용 갈래 제거 | F5 · F11 · G4 |
| M3 `tailwind.css` 파일 존재 검사 제거 | F3 · F10 |
| M4 globals tokens 게이트 제거 | G1 · G4 · G5 · G7 |
| M5a 1.4 표 1번 ↔ 3번(PnP 루트 전용 ↔ 미설치) | F5 · F11(PnP 문구 대신 설치 안내로 감) |
| M5b 1.4 표 4번 ↔ 5번(1.4.0 미만 ↔ 파일 없음) | F4 · F4u(1.4.0 올림 대신 재설치 안내로 감) |
| M6 B1 · globals 게이트를 앱 선언에도 적용 | F7 · F14(Q21 가드) · G2(Q28 가드) |
| M7 줄 있음 방향 게이트 제거 | F9 · F10 · F11 |
| M8 P2 갈래 제거 | F6 · F6w |
| M9 tokens 판정을 exports 대상 파일 존재로 바꿈 | G6 · W1(dist 없음) |
| M10 파일이 있어도 해석 불가로 판정 | F2 · F13 |
| M11 PnP 에서 앱 선언도 불인정 | F8 · G3 |
| M12 tailwind.config TW4 진입점에도 tokens 게이트 | G2 · G4 의 tailwind.config PASS(D4 가드) |

- 미설치(3번)와 1.4.0 미만(4번)의 순서 바꿈은 두 갈래가 동시에 성립하지 않아 동치 변이라 넣지 않아요
- 대응 변이가 없는 가드(단일 앱)는 출력 diff 0 으로만 확인해요

변이마다 cli · mcp 빨강 수를 표로 남겨요. mcp 에 해당 행이 없어 0 이면 그 사실을 적어요(WI-0091 M1 · M9 선례).

**1부 측정(2026-10-28)**: B1 · 헬퍼에 걸리는 변이만 넣었어요(M4 · M9 · M12 와 M6 · M11 의 globals 쪽은 2부). 적용은 `scripts/mut.py`(저장한 수정본에서 문자열 1곳 치환, 1곳이 아니면 중단), 실행은 cli `template-check.test.ts` + `theme-add.test.ts`(304건) · mcp `template.test.ts`(54건), 원복은 매번 sha256 4/4 OK. 출력 `$S/WI-0097impl/out/mut/`.

| 변이 | cli 빨강 | mcp 빨강 | 잡은 행(요약) |
|---|---|---|---|
| M1 B1 해석 게이트 제거 | 15 | 5 | F1 · F3 · F4 · F4u · F5 · F6(두 패키지), F15, theme add 결론 대조 |
| M2 PnP 루트 전용 갈래 제거 | 5 | 2 | F5 · F11, 헬퍼 |
| M3 파일 존재 검사 제거 | 12 | 2 | F3 · F4 · F4u · F10, theme add DEC-2 기존 2건 · 결론 대조, 헬퍼 |
| M5a 1번 ↔ 3번 | 6 | 2 | F5 · F11, theme add P1 기존 1건, 헬퍼 |
| M5b 4번 ↔ 5번 | 7 | 1 | F4 · F4u · F12, 헬퍼 |
| M6 B1 게이트를 앱 선언에도 | 22 | 7 | F7 · F14 가드(묶음 행), 앱 선언 B1 기존 테스트 다수, theme add 결론 대조, 헬퍼 |
| M7 줄 있음 방향 게이트 제거 | 7 | 2 | F9 · F10 · F11, F15 줄 있음 |
| M8 P2 갈래 제거 | 6 | 1 | F6 · F6w, theme add P2 기존 1건, 헬퍼 |
| M10 파일이 있어도 해석 불가 | 8 | 2 | F2 · F13 가드, WI-0086 AC2(stub 보강 행), theme add 기존 1건 · 결론 대조 |
| M11 PnP 앱 선언도 불인정(B1 쪽) | 3 | **0** | F8 가드(F2 · F7 · F8 묶음 행, 두 패키지), 헬퍼. pnp-appdecl-withline 은 이 변이에서도 PASS(미선언 + 줄 = 종전 판정)라 잡지 못하는 동치 행이에요. mcp 「WI-0097」 describe 에 PnP 앱 선언 행이 없어 0 이에요(G3 는 2부) |

## 6. CLI · MCP 대조

- 비교 단위는 항목 이름 · severity · message 예요. 출력 접두(`PASS ` · `[PASS]`)는 빼요
- 두 호출지가 같은 코어 함수를 불러서(cli `template-check.ts:41 · 44`, mcp `template.ts:409 · 412`) 이 대조는 배선 회귀만 잡아요. 판정의 옳음은 4.3 실빌드와 5절 변이로 봐요
- 측정 대상은 1절 전부(발행본 · 수정본 각각)예요. 줄 수 합계와 불일치 0 을 함께 적어요
