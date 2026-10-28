# WI-0097: check 의 CSS import 해석 가능성 판정 테스트 계획

> PRD: [prd.md](./prd.md) | 작성일: 2026-10-28 | 상태: 계획(수정본 미측정). 1절의 「발행본」 열만 착수 조사 · 반박 검증의 **측정** 값이고, 나머지 결과 칸은 구현 때 채워요
> 조사 scratchpad(세션 임시 경로, 구현 때 사라질 수 있음): `/tmp/claude-1000/-home-sinclair-work-idea-on-action-AXIS-Design-System/7a29a557-9ebc-48a8-a772-89e5ee57e773/scratchpad/` 아래 `WI-0097/`(조사, ui-react) · `WI-0097-verify/`(검증, agentic-ui). 이하 `$S` 로 줄여요
> 비교 기준 두 축: ① 문제 재현(음성 대조)은 1절 「발행본 1.7.6」 측정값 ② 「수정 전후 불변」(AC7 · AC9 · AC12, 4.2)은 **WI-0100a 머지 직후 HEAD 빌드 사본** 대 수정본이에요. 0100a 의 `globalCss` 우선 변경이 한 diff 에 섞이지 않게 해요. 기준 커밋 SHA: (착수 때 기록)

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
| F6w applock-root-withline(새로 만듦) | - | F6 + 줄 | 미측정 | 종전 PASS(판정하지 않음) | AC4 · M8 |
| F7 appdecl-notinst | 두 폴더 `appdecl-notinst` | 앱 `dependencies` 에 선언, 설치 stub 없음 | B1 줄 안내 | 발행본과 같음(Q21) | AC7 가드 |
| F8 pnp-appdecl | 검증 `pnp-appdecl` | `pnpWs` + 앱 선언 | B1 줄 안내 | 발행본과 같음 | AC7 가드 |
| F9 root-notinst-withline | 두 폴더 | F1 + `@import "<pkg>/tailwind.css";` | **PASS** | 해석 불가 WARN | AC5 |
| F10 root-inst-nofile-withline | 검증 | F3 + 줄 | **PASS** | 해석 불가 WARN | AC5 |
| F11 pnp-root-withline | 두 폴더 | F5 + 줄 | **PASS** | PnP 틀 WARN | AC5 |
| F12 root-inst-old-withline | 두 폴더 | F4 + 줄 | 버전 WARN(`:843-847`) | 발행본과 같음 | AC5(가드 성격) |
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

## 2. 착수 게이트 실빌드 (Q22, 미측정)

| 측정 | 명령(초안) | 기대 | 결과 |
|---|---|---|---|
| PnP 루트 전용 `@axis-ds/ui-react/tailwind.css` | Yarn 4.5.3 워크스페이스(루트에만 ui-react 1.8.2 · 앱 tailwindcss 선언) 앱에서 `corepack yarn tailwindcss -i b.css -o b.out.css` | rc 1 `Can't resolve` | |
| PnP 루트 전용 `@axis-ds/tokens/css/tailwind4` | 같은 워크스페이스, tokens 루트 전용, `-i a.css` | rc 1 | |
| 양성 대조 | 같은 워크스페이스에서 앱에도 선언 · `yarn install` 뒤 같은 두 명령 | rc 0, 산출물에 `--axis-` 줄 | |
| (선택) G5 근거 | tokens 미설치 앱의 `app/layout.tsx` `import "@axis-ds/tokens/css"` 를 `next build` 또는 esbuild 로 1회 | rc 비0 · 해석 실패 | |

- 전역 Yarn 캐시(`~/.yarn/berry/cache`)를 지우거나 고치지 않아요. `YARN_CACHE_FOLDER` 를 fixture 안으로 지정해 격리해요
- (선택) 행을 재지 않으면 AC6 의 g5 는 추정 근거로 남기고 prd 5절 잔여에 적어요
- 두 측정 중 하나라도 rc 0 이면 AC3 · AC5(PnP 행) · AC6(G4)의 근거가 무너져요. 구현을 멈추고 Master 에 보고해요

## 3. 측정 명령

- CLI: `$S/WI-0097/scripts/run.sh <fixture 앱 디렉터리>` 와 같은 모양. 수정본은 `C=` 를 worktree `packages/axis-cli/dist/index.js` 로 바꿔요. rc 는 `out=$(node "$C" check --dir "$1" 2>&1); rc=$?` 로 받아요(파이프 rc 가림 회피)
- MCP: 발행본 `$S/WI-0097-verify/pkg` 의 mcp `dist/index.js` · 수정본 `packages/axis-mcp/dist/index.js` 에 stdio JSON-RPC `initialize` → `tools/call axis.check_project {targetDir}`
- theme add A/B(AC9): F1 · F3 · F4 · F5 · F6 사본에 `axis theme add <brand> --dir …` 를 발행본 · 수정본으로 돌려 stdout · 바뀐 파일 diff
- 실빌드: `@tailwindcss/cli` 4.1.14, `$S/WI-0097/build` · `$S/WI-0097-verify/build` · `build2` 와 같은 구성
- 게이트: `pnpm exec turbo run build --force` · `type-check --force` · `lint --force`(Cached 0 확인), cli · mcp `npx vitest run`, `pnpm check-changeset-mcp-tokens`

## 4. 결과 표 (구현 때 채움)

### 4.1 테스트 수

| 패키지 · 파일 | HEAD 기준선 | 수정 뒤 | 기존 기대 변경(plan 4절 목록과 대조) |
|---|---|---|---|
| cli 전체 | | | |
| cli `template-check.test.ts` · `theme-add.test.ts` | | | |
| mcp 전체(tokens-sync 빌드 뒤 실행 확인) · `template.test.ts` | | | |
| registry-core | 테스트 없음(type-check · lint 만, 새 헬퍼 단위 테스트는 cli `template-check.test.ts` 「WI-0097」 describe) | - | - |

### 4.2 fixture A/B (1절 전부, CLI · MCP)

| id | 발행본 rc(음성 대조) | 0100a HEAD 사본 rc | 수정본 rc | 바뀐 항목 · 문구(0100a HEAD 사본 대비) | CLI = MCP(severity · message) |
|---|---|---|---|---|---|

### 4.3 실빌드 대조

| 경우 | 줄 | rc |
|---|---|---|
| F1 안내대로 설치 · 줄 추가 | 있음 | 기대 0 |
| F9 그대로 | 있음 | 측정 1(조사 · 검증), 재확인 |
| F11 그대로 | 있음 | 2절 결과 |

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

## 6. CLI · MCP 대조

- 비교 단위는 항목 이름 · severity · message 예요. 출력 접두(`PASS ` · `[PASS]`)는 빼요
- 두 호출지가 같은 코어 함수를 불러서(cli `template-check.ts:41 · 44`, mcp `template.ts:409 · 412`) 이 대조는 배선 회귀만 잡아요. 판정의 옳음은 4.3 실빌드와 5절 변이로 봐요
- 측정 대상은 1절 전부(발행본 · 수정본 각각)예요. 줄 수 합계와 불일치 0 을 함께 적어요
