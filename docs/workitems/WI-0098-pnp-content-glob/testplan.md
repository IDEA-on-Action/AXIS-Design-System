# WI-0098: Yarn PnP 의 Tailwind 3 content 판정 테스트 계획

> PRD: [prd.md](./prd.md) | 작성일: 2026-10-28 | 상태: 구현 뒤 측정 반영(2026-10-28). 「구판」 값은 조사 · 반박 검증 단계와 구현 뒤 재측정(발행본 cli 1.7.6 · mcp 1.4.5)에서, 「신판(측정)」 값은 worktree 빌드(cli · mcp dist)로 같은 fixture 를 다시 잰 것이에요. 결과는 4절 표와 8절에 있어요
> 일차 판정은 `tailwind.content` 항목의 severity · 문구예요. check 전체 rc 는 다른 항목이 모두 PASS 인 fixture(globals.css · lib/utils.ts 있음)에서만 기록해요

## 1. fixture

### 1.1 실설치 fixture (측정 전용, 커밋하지 않음)

출처는 이 세션 scratchpad 예요. `S=/tmp/claude-1000/-home-sinclair-work-idea-on-action-AXIS-Design-System/7a29a557-9ebc-48a8-a772-89e5ee57e773/scratchpad`

| 이름 | 경로 | 구성 | 쓰는 AC |
|---|---|---|---|
| P1 | `$S/WI-0098/P1` | Yarn 4.5.3 `nodeLinker: pnp`, 루트 `git init`, 프로젝트 밖 `cacheFolder`(`$S/WI-0098/yarn-cache`), `apps/web` 에 ui-react 1.8.2 등 앱 선언 | AC1 · AC2 · AC3 |
| P2 | `$S/WI-0098/P2` | 같은 의존성, `nodeLinker: node-modules`(설치본은 `../../node_modules`). 빌드 정답 대조군(P2-up 429) | AC8 · 정답 |
| P3 | `$S/WI-0098/P3` | P1 + `dependenciesMeta` unplugged(`.yarn/unplugged/@axis-ds-ui-react-virtual-96ae3e6711`) | AC4 |
| P4 | `$S/WI-0098/P4` | PnP, content 에 ui-react 없음(theme add · zip 상대 경로 행) | AC3 · AC7 |
| Q1 | `$S/WI-0098-verify/Q1` | Yarn 4.5.3 pnp, 프로젝트 안 `.yarn/cache`, `git init`, globals.css · lib/utils.ts 있음 | AC1 · AC2 · AC3 · AC5 |
| Q2 | `$S/WI-0098-verify/Q2` | node-modules 링커 대조군(C-up 429 · C-none · C-broad) | AC8 · 정답 |
| Q3 | `$S/WI-0098-verify/Q3` | Q1 + unplugged | AC4 · AC5 |
| Q4 | `$S/WI-0098-verify/Q4` | ui-react 를 루트 `package.json` 에만 선언(첫 단계에서 unplugged 를 더한 변형도 씀) | AC6 |
| TA1-nm · TA1-none | `$S/WI-0098-verify/TA1-nm` · `TA1-none` | PnP, theme add 전용(content 에 `./node_modules` glob · 없음) | AC7 |
| 드라이버 | `$S/WI-0098-verify/run.sh <proj> <tag> <content-js-expr> [prelude]` | `tailwind.config.js` 를 쓰고 `yarn tailwindcss -i util.css` 빌드 → 규칙 수(`grep -c '{'`, 숫자 가드) → cli check → MCP(`$S/WI-0098/mcp-call.mjs`) | 전부 |
| 발행본 | `$S/WI-0098/tools/node_modules/@axis-ds/{cli,mcp}` | cli 1.7.6 · mcp 1.4.5 | 구판 |

- 드라이버는 cli 경로가 `T=` 에 박혀 있어요. 신판 측정 때는 `T` 를 worktree `packages/axis-cli/dist` · `packages/axis-mcp/dist` 로 바꾼 사본을 써요(구판 · 신판을 같은 스크립트로 돌려 조건을 맞춤).
- 비 PnP 매트릭스(npm workspaces · pnpm 기본 · pnpm hoisted · 단일 · 설치본 없음)의 WI-0080 · WI-0090 실설치 fixture 는 이전 세션 scratchpad(`69d8f408-…/scratchpad/w6bimpl/WI-0080/` 등)에 있었지만 지금 남아 있는지 확인하지 않았어요. 착수 때 `[ -d ]` 로 먼저 보고, 없으면 WI-0090 testplan 의 측정 절차(앱마다 content 변형을 쓰고 Tailwind 3.4.19 CLI 를 앱 cwd 에서 실행)로 다시 만들어요. 「없음」을 「차이 없음」으로 읽지 않도록 행 수를 함께 기록해요.

### 1.2 단위 테스트 fixture (구현 때 테스트 코드로 옮길 형태)

실설치의 zip · virtual 동작은 스텁으로 재현하지 못해요. 단위 테스트는 **판정 입력(파일 존재 · 버전 · 선언 위치)만** 고정하고, 빌드 정답은 1.1 측정으로만 판정해요.

| 레이아웃(가칭) | 스텁 구성 | 출처(실설치) |
|---|---|---|
| `pnp` | 기존 `app("pnp")`(`template-check.test.ts:2137-2149`): 루트 `workspaces` + 빈 `.pnp.cjs` + 루트 `node_modules` ui-react 1.8.1 스텁(가드 불변식용), 앱 선언 `^1.8.0` | P1 · Q1 |
| `pnpUnplugged` | `pnp` + 루트 `.yarn/unplugged/@axis-ds-ui-react-virtual-0000000000/node_modules/@axis-ds/ui-react/{package.json(1.8.1), dist/index.js}` | P3 · Q3 |
| `pnpUnpluggedOther` | `pnp` + 같은 위치에 버전 1.7.0(앱 범위 `^1.8.0` 밖) 디렉터리만 | 실설치 없음(미측정) |
| `pnpRootOnly` | `pnp` 에서 ui-react 를 루트 `package.json` 에만 선언, 앱에는 없음 | Q4 |
| mcp | `template.test.ts:640` `pnpApp(rootDeps, appDeps, files, config)` 재사용, unplugged 디렉터리는 `files` 대신 루트에 직접 씀 | Q1 · Q3 · Q4 |
| theme add | `theme-add.test.ts:906-935` `wsApp({ pnp: true, … })` + Tailwind 3 설정 | TA1 · P4 |

변형(content 문자열): `nm` = `./node_modules/@axis-ds/ui-react/dist/**/*.{js,mjs}`, `broad` = `./**/*.{js,mjs}`, `none` = 패키지 glob 없음, `dyn` = `path.join(...)` 요소(정적으로 못 읽음), `unplugRel` = `../../.yarn/unplugged/*/node_modules/@axis-ds/ui-react/dist/**/*.{js,mjs}`, `unplugAbs` = 스텁 실경로 절대 glob.

## 2. 측정 명령

```bash
S=/tmp/claude-1000/-home-sinclair-work-idea-on-action-AXIS-Design-System/7a29a557-9ebc-48a8-a772-89e5ee57e773/scratchpad
V=$S/WI-0098-verify
# 구판(발행본) · 신판(worktree dist) 각각
bash $V/run.sh $V/Q1 Q-nm '["./app/**/*.{ts,tsx}","./components/**/*.{ts,tsx}","./node_modules/@axis-ds/ui-react/dist/**/*.{js,mjs}"]'
# 정답: 출력 CSS 를 node-modules 대조군과 바이트 비교 (cmp rc 0 = 429 와 같음)
cmp $V/out/Q-nm.css $V/out/C-up.css; echo "cmp_rc=$?"
# 비교 전 대조군 존재 확인(없으면 cmp 가 stderr 만 내고 rc 2)
[ -f $V/out/C-up.css ] || echo "대조군 없음: 측정 무효"
# theme add
node <cli dist>/index.js theme add ontology --dir $V/TA1-nm/apps/web > out.txt 2>&1; rc=$?
# MCP
node $S/WI-0098/mcp-call.mjs <mcp dist>/index.js <앱 디렉터리>
```

- rc 는 `out=$(cmd 2>&1); rc=$?` 로 받아요(파이프 rc 가림 방지).
- 단위 테스트: cli `cd packages/axis-cli && npx vitest run src/template/template-check.test.ts src/theme/theme-add.test.ts`, mcp `cd packages/axis-mcp && npx vitest run src/tools/template.test.ts`, 마지막에 전체.
- A/B: 판정 소스(`tailwind-core.ts` · `project.ts` · `theme-add.ts` · `theme/index.ts`)만 `git show HEAD:<path>` 로 바꾸고 새 테스트를 돌려 빨강 건수를 기록한 뒤, sha256 으로 원복을 확인해요.

## 3. 확정 문구 (사용자 결정 Q30 절차 · Q44 · Q45 · Q47 로 확정, 2026-10-28)

| 자리 | 확정 문구 |
|---|---|
| 안내(`contentPnpNote(names, unplugged)`, Q31 · Q44 · Q45) | `Plug'n'Play 에는 node_modules 가 없습니다. content 에 path.join(path.dirname(require.resolve("<패키지>")), "..", "dist/**/*.{js,mjs}") 처럼 실제 위치를 넣으세요(정적으로 확인할 수 없어 WARN 으로 남습니다). 정적 경로를 쓰려면 package.json 의 dependenciesMeta 에 "<설정 패키지>": { "unplugged": true } 를 두고 yarn install 뒤 .yarn/unplugged 경로를 넣으세요`. `<패키지>` 는 덮지 않은 PnP 대상(루트 전용 제외)의 이름으로 채워요. 둘 이상이면 동적 형태와 dependenciesMeta 항목을 `, ` 로 이어 패키지마다 나열해요. `<설정 패키지>` 는 그 가운데 unplugged 디렉터리가 없는 패키지만이에요(Q45) |
| 안내, 대상이 모두 unplugged(Q45) | `Plug'n'Play 에는 node_modules 가 없습니다. content 에 path.join(path.dirname(require.resolve("@axis-ds/ui-react")), "..", "dist/**/*.{js,mjs}") 처럼 실제 위치를 넣으세요(정적으로 확인할 수 없어 WARN 으로 남습니다).` 설정 안내 문장이 없고, 정적 경로 제안은 목록 항목 `@axis-ds/ui-react → "../../.yarn/unplugged/*/node_modules/@axis-ds/ui-react/dist/**/*.{js,mjs}"` 에 남아요(theme add 는 「넣으세요: "…"」 줄) |
| 안내, 일부만 unplugged(Q45, ui-react 만 unplugged) | 동적 형태는 `@axis-ds/ui-react` · `@axis-ds/agentic-ui` 둘 다, 설정 안내는 `dependenciesMeta 에 "@axis-ds/agentic-ui": { "unplugged": true } 를 두고 …` 만 |
| WARN(종전 덮음) | `tailwind.config.js의 content 가 Plug'n'Play 에서 스캔되지 않는 경로로 @axis-ds/ui-react 를 덮습니다(node_modules 경로 · ./** 는 스캔되지 않음) (<안내 상수>)` |
| FAIL 목록 항목(기본 PnP) | `@axis-ds/ui-react(Plug'n'Play 라 node_modules 경로가 없음)` + 끝에 ` (<안내 상수>)` |
| 루트 전용 | `@axis-ds/ui-react 가 워크스페이스 루트에만 선언돼 Plug'n'Play 에서 앱이 해석하지 못합니다 → 앱 package.json 에 선언하세요` |
| theme add | 대상 줄 `! content 가 @axis-ds/ui-react 를 Plug'n'Play 에서 스캔되는 경로로 덮지 않습니다` + 회색 줄 `    <안내 상수>` |
| 상위 경로 안내(`CONTENT_PARENT_PATH_NOTE`, WI-0080 D4 · Q47) | `상위 경로는 Tailwind 3 가 빌드를 실행한 디렉터리 기준으로 풀립니다. 모노레포 루트 등 앱 디렉터리 밖에서 빌드하면 content: { relative: true, files: [...] } 로 설정 파일 기준으로 바꾸세요`. `../` 로 시작하는 제안이 있을 때 check · MCP 는 ` (<이 문구>)` 로, theme add 는 회색 줄로 붙여요(PnP unplugged 제안 포함) |

- 사용자 결정 Q31(2026-10-28): `<패키지>` 자리는 실제 패키지 이름(`@axis-ds/ui-react` · `@axis-ds/agentic-ui`)으로 채워요. AC5 측정은 `run.sh` 의 prelude 인자로 `const path = require("path");` 를 넣고, 나머지 글자는 문구에서 바꾸지 않고 그대로 복사해요(Q31 반영 뒤 측정: Q1 · P1 빌드 429 · WARN rc 0, `WI-0098impl/q33/ac5.sh`).
- 사용자 결정 Q44(2026-10-28): 안내 문구를 기존 check 문구와 같은 합니다체로 통일했어요(「없어요」 → 「없습니다」, 「남아요」 → 「남습니다」). 인자 · 경로 · 코드 조각은 글자 그대로예요. WARN · FAIL 목록 항목 · 루트 전용 · theme add 대상 줄은 이미 합니다체 · 명사형이라 그대로예요.
- 사용자 결정 Q45(2026-10-28): unplugged 디렉터리가 이미 있는 패키지(대상 상태 `unplugged`)는 설정 안내에서 빼요. 확정 문구로 AC5 를 다시 쟀어요(Q1 · P1 동적 형태 빌드 429 WARN rc 0, Q3 · P3 제안 glob 빌드 429 PASS, check 와 theme add 안내 문자열 같음 Q1 312자 · Q3 179자, `WI-0098impl/q44/ac5.sh`).
- 사용자 결정 Q47(2026-10-28): WI-0080 때부터 있던 상위 경로 안내 상수도 합니다체로 맞췄어요(「…기준으로 풀려요.」 → 「…기준으로 풀립니다.」). 경로 · 코드 조각 · 명령형 「바꾸세요」는 그대로예요(Q44 의 「넣으세요」 와 같은 처리). 이 상수는 비 PnP 레이아웃 출력에도 나오므로 AC8 은 「이 문구 외 바이트 불변」으로 봐요.
- ESM(`tailwind.config.mjs`) · `.ts` 설정에는 `require` 가 없어 이 동적 형태가 그대로는 동작하지 않을 수 있어요(미측정, prd 7절).
- 동적 형태는 조사 때 측정한 형태(`path.resolve(path.dirname(require.resolve("@axis-ds/ui-react")), "..")` 뒤 `path.join(ui, "dist/**/*.{js,mjs}")`, 빌드 429)와 글자가 달라서, 확정 문구의 동적 형태를 글자 그대로 넣어 AC5 에서 다시 쟀어요(빌드 429).
- Windows 경로 구분자에서 동적 형태가 동작하는지는 미측정이에요.

## 4. 기대값 (실설치 fixture)

「구판」 · 「신판(측정)」은 측정값, 「신판 기대」는 착수 때 정한 목표값이에요. 신판 측정은 2026-10-28 구현 뒤 51행 재측정(`compare.tsv`)이고, 빌드 열은 같은 측정의 규칙 수예요(=4 · =429 는 대조군과 cmp 같음). 빌드 규칙 429 는 cmp 기록이 있는 행(조사 V2-dyn · V4-zipabs · P3-unplugrel, 반박 검증 Q-ziprel · Q-zipabs · U-rel · Q-dyn)에서만 대조군과 `cmp` 같음이에요. 「cmp 미기록」을 붙인 행은 규칙 수만 같아요.

| 행 | 빌드 정답(측정) | 구판 check(측정) | 신판 기대 | 신판(측정) | AC |
|---|---|---|---|---|---|
| Q1 · P1 nm | 4 | PASS | WARN, PnP 안내, `./node_modules` 제안 0 | WARN rc 0, 빌드 4 | AC1 |
| Q1 · P1 broad | 4 | PASS | WARN | WARN rc 0, 빌드 4 | AC2 |
| Q1 · P1 none | 4 | FAIL(제안 `./node_modules`) | FAIL, PnP 안내 | FAIL rc 1, 빌드 4 | AC3 |
| Q1 · P1 dyn | 429 | WARN(제안 `./node_modules`) | WARN, PnP 안내 | WARN rc 0, 빌드 429 | AC3 |
| Q1 zipabs · ziprel, P1 V4-zipabs | 429 | FAIL | FAIL, PnP 안내(잔여 오차) | FAIL rc 1, 빌드 429 | AC3 |
| P4-ziprel | 429(규칙 수, cmp 미기록) | FAIL | FAIL, PnP 안내(잔여 오차) | FAIL rc 1, 빌드 429 | AC3 |
| Q1 zipwild · P4-ziprelwild | 4 | 기록 없음(미측정) | FAIL, PnP 안내 | FAIL rc 1, 빌드 4(구판도 FAIL rc 1 로 이번에 측정) | AC3 |
| P1 V6-virtualrel | 4(조사 단계 값만, 반박 검증 미재현) | 기록 없음(미측정) | FAIL, PnP 안내 | Q1 · P1 virtualrel FAIL rc 1, 빌드 4(구판도 FAIL rc 1 로 이번에 측정) | AC3 |
| Q3 · P3 unplugRel | 429 | FAIL | PASS | PASS rc 0, 빌드 429 | AC4 |
| P3 unplugAbs | 429(규칙 수, cmp 미기록) | FAIL | PASS | Q3 · P3 PASS rc 0, 빌드 429 | AC4 |
| Q3 · P3 none | 미측정 | 미측정 | FAIL, 제안 unplugged 상대 glob + cwd 안내 | FAIL rc 1, 빌드 4(구판 FAIL rc 1) | AC4 |
| Q3 · P3 nm | 미측정(산출물 `P3-nm.css` 는 있으나 조사 자료에 값 없음) | 미측정 | WARN(C2) | WARN rc 0, 빌드 4(구판 PASS rc 0) | AC4 |
| Q3 · P3 dyn(Q32 확정) | 429 | WARN(제안 `./node_modules`) | WARN + unplugged 상대 glob + 상위 경로 안내 + PnP 안내 | WARN rc 0, 빌드 429(cmp 같음) | AC3 · AC4 |
| S1(PnP 루트 앱 + unplugged) broad · `./*/**` · 절대 broad(Q33) | 4 · 4 · 4(cmp 같음) | broad PASS(1.7.6) | WARN | Q33 반영 전 신판 broad · `./*/**` PASS, 반영 뒤 셋 다 WARN rc 0 | AC2 · AC4 |
| S1 unplugRel · unplugAbs · `./.yarn/**`(Q33) | 429 · 429 · 435 | unplugRel FAIL(1.7.6) | PASS | 반영 뒤 PASS rc 0(셋 다) | AC4 |
| S1 none · nm | 4 · 4 | none FAIL(1.7.6) | FAIL · WARN | 반영 뒤 FAIL rc 1 · WARN rc 0 | AC4 |
| Q4 dyn(R-dyn) | 빌드 rc 1 | WARN, rc 0(제안 문자열은 미기록, 코드상 `./node_modules/...` 추정, 첫 단계에서 재기록) | 루트 전용 문구, WARN(content 를 정적으로 다 읽지 못함, AC6 의 dynamic 조항 · C3 예외) | WARN rc 0, 빌드 산출물 없음(구판 WARN rc 0) | AC6 |
| Q4 nm · none | 미측정(구현 첫 단계) | 미측정 | nm → WARN 루트 전용 문구, none → FAIL 루트 전용 문구 | nm WARN rc 0 · none FAIL rc 1, 빌드 4 · 4(구판 PASS · FAIL). broad 도 WARN rc 0, 빌드 4(구판 PASS) | AC6 |
| Q4 + unplugged, unplugRel | 미측정(구현 첫 단계, 429 가 날 수 있음, 추정) | 미측정 | FAIL 루트 전용 문구(C3, 인정하지 않음). 429 이면 prd 7절의 알려진 한계 | Q4u unplugRel · unplugAbs FAIL rc 1, 빌드 429(구판 FAIL) - prd 7절 알려진 한계 후보. Q4u nm WARN rc 0 · none FAIL rc 1 · dyn WARN rc 0 | AC6 |
| TA1-nm(theme add) | - | content 안내 0줄, rc 0 | PnP 안내 줄, rc 0 | PnP 안내 줄 + 안내 상수 줄(`TA-TA1-nm.txt`, rc 미기록) | AC7 |
| TA1-none · P4(theme add) | - | 「넣으세요: "./node_modules/..."」, rc 0 | PnP 안내 줄, rc 0 | PnP 안내 줄 + 안내 상수 줄, `./node_modules` 제안 0(`TA-TA1-none` · `TA-P4-none` · `TA-P4-ziprel`, rc 미기록) | AC7 |
| Q2 · P2 up · none · broad 등 | 429 · 4 · 4 | PASS · FAIL · FAIL | 구판과 바이트 같음(Q47 뒤에는 `CONTENT_PARENT_PATH_NOTE` 문구 외) | Yarn node-modules 14행(Q2 · P2 의 up · none · broad · local · abs · relobj · dyn) check · MCP 출력 바이트 같음. theme add 3개(Q2 up · none · local) 바이트 같음. npm · pnpm 기본 · hoisted · 단일은 실설치 재측정 안 함(단위 테스트 회귀 가드만) | AC8 |
| 안내 적용: Q1 none + 확정 동적 형태 | 429 기대 | - | WARN, rc 0 | 초안 문구 기준 Q1 · P1 빌드 429, WARN. Q31 반영 뒤(이름 채움, 자리 바꿈 없이 복사) Q1 · P1 빌드 429(cmp 같음) · WARN rc 0. Q44 · Q45 확정 문구로 다시 재서 Q1 · P1 빌드 429(cmp 같음) · WARN rc 0 | AC5 |
| 안내 적용: Q3 none + 확정 unplugged 제안 | 429 기대 | - | PASS | 초안 문구 기준 Q3 · P3 빌드 429, PASS. Q44 · Q45 확정 문구로 다시 재서 Q3 · P3 빌드 429(cmp 같음) · PASS rc 0 | AC5 |

check 전체 rc(다른 항목 PASS 조건, 측정): Q-nm · Q-broad 0, Q-none · Q-ziprel 1. 신판 기대는 prd 5절 표예요.

## 5. 변이 테스트 계획 (적용 → cli template-check · theme-add · mcp template 실행 → sha256 원복 확인)

| 변이 | 내용 | 빨개져야 할 테스트 |
|---|---|---|
| MT1 | `packageContentTarget` PnP 분기 제거(종전 `node_modules` 표본 · 제안) | AC1 nm · AC2 broad · AC3 none · dyn 행 |
| MT2 | unplugged 탐색 헬퍼가 늘 빈 목록 | AC4 unplugRel · unplugAbs |
| MT3 | 버전 범위 필터 제거 | AC4 `pnpUnpluggedOther` 행 |
| MT4 | 루트 전용 분기 제거 | AC6 행 |
| MT5 | `legacyCovered` 대상을 FAIL 로 올림 | AC1 · AC2 의 severity(0 → 1 가드) |
| MT6 | `theme/index.ts` PnP 안내 줄 제거 | AC7 nm · none |
| MT7 | `theme-add.ts` 에서 PnP 대상을 `contentMissing` 에서 뺌(종전 침묵) | AC7 nm |
| MT8 | 비교기 양성 대조: CLI · MCP 비교 스크립트에서 MCP 쪽 한 줄 문자를 바꿈 | AC9 비교 결과 불일치 1 이상 |
| MT9 | 비 PnP 양성 대조: 같은 diff 드라이버를 Q1 nm 에 돌림 | AC8 드라이버가 diff 를 냄 |

MT1 ~ MT7 은 단위 테스트에서 빨강 건수를 cli · mcp 로 나눠 적어요. 변이가 0건을 잡으면 그 축은 미검증으로 적고 테스트를 보강해요.

## 6. CLI · MCP 대조

- 행: Q1 · Q3 · Q4 · P1 · P3 의 모든 변형 × 구판 · 신판.
- 비교 단위: `tailwind.content` 줄의 severity + 문구(바이트). 행 수와 비교한 줄 수를 함께 적어 「0 불일치」가 0행 비교가 아님을 보여요.
- 단위 테스트: mcp 새 3행의 기대 문자열을 cli 새 행과 같은 상수에서 만들지 않고 리터럴로 적어, 한쪽 코어 변경이 두 테스트를 같이 바꾸지 않게 해요.

## 7. 게이트 (수정 뒤, 캐시 우회)

| 게이트 | 명령 | 기준 |
|---|---|---|
| build | `pnpm exec turbo run build --force` | rc 0, Cached 0 |
| type-check | `pnpm exec turbo run type-check --force` | rc 0, Cached 0 |
| lint | `pnpm exec turbo run lint --force` | rc 0, Cached 0 |
| test | cli · mcp `npx vitest run` | 기준선 + 새 행, 실패 0. mcp `tokens-sync` 는 빌드 뒤 실제 실행 건수 확인 |
| changeset | `pnpm check-changeset-mcp-tokens` | rc 0, cli · mcp 올림 확인 |

`pnpm build -- --force` 는 `--force` 가 패키지 스크립트로 넘어가 실패하므로 turbo 를 직접 불러요(WI-0091 선례).

## 8. 결과 (2026-10-28, 구현 뒤 측정)

측정 원자료는 세션 scratchpad `WI-0098impl/`(`out-new/compare.tsv` · `ab/mutations.json` · `gates/*.txt`)에 있고 저장소에는 커밋하지 않아요. 아래는 그 값을 옮긴 것이에요.

| 항목 | 결과 |
|---|---|
| 실설치 재측정 | 51행 비교(`rows=51`), CLI · MCP 문구 불일치 0(행마다 비교 줄 1/1), 비 PnP 바이트 같음 14행(Yarn node-modules). 0 → 1 은 0행 |
| 전이 | PASS → WARN 11행(Q1 · P1 · Q3 · P3 · Q4 의 nm · broad, Q4u nm), FAIL → PASS 4행(Q3 · P3 unplugRel · unplugAbs), 나머지 severity · rc 그대로 |
| 단위 테스트 기준선(HEAD) | cli 946 통과, mcp 177 통과 + 실패 파일 1(`tokens-sync`, 빌드 전 실행이라 0건 - 계측 실패로 분류) |
| 단위 테스트 수정 뒤 | cli 960 통과(21 파일), mcp 200 통과(9 파일, 빌드 뒤 실행) |
| A/B(판정 소스만 HEAD 로) | 새 테스트 cli 15 · mcp 3 빨강, sha256 원복 확인 |
| 변이(cli · mcp 빨강 건수) | MT1 13 · 3, MT2 4 · 1, MT3 2 · 0, MT4 2 · 1, MT5 7 · 1, MT6 2 · 0, MT6b 3 · 0, MT7 2 · 0, 무변이 0 · 0. 전부 sha256 원복 확인. MT3 · MT6 · MT7 은 mcp 쪽 0 이라 그 축은 cli 테스트로만 지켜져요 |
| 안내 적용(AC5) | 초안 문구 기준 AC5-Q1-dyn · P1-dyn 빌드 429 WARN, AC5-Q3-sugg · P3-sugg 빌드 429 PASS. Q44 · Q45 확정 문구로 다시 재도 같아요(`q44/ac5`) |
| 검증 단계 추가 측정 | PnP 루트가 앱이고 unplugged 가 있는 S1: `./**/*.{js,mjs}` 는 빌드에서 컴포넌트 클래스 0(`bg-` 0, unplugged 명시 경로는 67)인데 신판 · 1.7.6 모두 PASS(사용자 결정 Q33 으로 고침, 아래 행). 범위 선언 앱 + 범위 안 다른 버전 unplugged(합성 M2)는 PASS(사용자 결정 Q34 로 현행 유지 · 한계로 기록) |
| Q31 · Q33 반영 뒤 재측정(2026-10-28) | 같은 51행을 반영 뒤 dist 로 다시 재서 직전 신판(`out-new`)과 비교: 27행 바이트 같음, 24행(check · MCP 48개 파일)은 `<패키지>` 자리가 `@axis-ds/ui-react` 로 채워진 것만 다름, 그 밖 차이 0, 빌드 · rc 열 차이 0(`q33/cmp-post.py`). theme add 12개: 6개 같음 · 6개 자리 채움만 다름, check 줄과 theme add 안내 같음. S1 단일 PnP 프로젝트(새 fixture `WI-0098impl/fx/S1`) 반영 전 6행 · 반영 뒤 8행 · 1.7.6 3행, 반영 뒤 8행이 빌드 정답과 모두 맞음 |
| Q31 · Q33 단위 테스트 · 변이 | 새 테스트: cli `Q33` 2건(PnP 루트 앱 9 glob 행 · 음성 대조), mcp `Q33` 1건, 기존 WI-0098 리터럴 갱신(cli 2건은 두 패키지 나열 리터럴 `WI0098_PNP_NOTE_BOTH`). 변이: noDot 끔 → cli 1 · mcp 1 빨강, `**/` 점 조건 제거 → cli 2, 이름 첫 개만 → cli 2, 자리표시 되돌림 → cli 12. 판정 소스를 HEAD 로 → cli 47 빨강(theme-add 는 새 import 로 실패 포함). 전부 sha256 원복 확인 |
| Q31 · Q33 반영 뒤 게이트(2026-10-28, `pnpm --filter` registry-core · cli · mcp) | build · type-check · lint rc 0 · 0 · 0, cli vitest 962 통과(21 파일) · mcp vitest 201 통과(9 파일, tokens-sync 20건 실행), `pnpm check-changeset-mcp-tokens` rc 0(19/19). turbo `--force` 게이트는 이 단계에서 돌리지 않았어요 |
| Q44 · Q45 반영 뒤 재측정(2026-10-28) | 같은 51행 · theme add 12개를 반영 뒤 dist 로 다시 재서 Q31 · Q33 반영본(`q33/out-post`)과 비교(`q44/cmp.py`): 빌드 rc · 규칙 수 · cmp · check rc · 비교 줄 수 열 차이 0행. check · MCP 102개 파일은 54개 바이트 같음, 32개는 합니다체 바뀜만(Q44), 16개(Q3 · P3 의 none · nm · broad · dyn)는 합니다체 + ui-react 설정 안내 문장 삭제만(Q45), 그 밖 차이 0. theme add 12개는 6개 같음 · 4개 Q44 만 · 2개(TA-Q3-none · TA-Q3-nm) Q44 + Q45 만. 비 PnP 31건(Yarn node-modules Q2 · P2 의 check · MCP 28개 + theme add 3개)은 발행본 1.7.6 · 1.4.5 출력과 바이트 같음, 같은 비교기로 Q1-nm 은 차이 검출(양성 대조). CLI · MCP 문구 51행 모두 같음 |
| Q44 · Q45 단위 테스트 · 변이 | 새 테스트: cli `Q45`(일부 unplugged 면 없는 패키지만 · 모두 unplugged 면 설정 문장 없음) 1건, mcp `Q45` 1건, 기존 WI-0098 리터럴을 합니다체로 · unplugged 행(`pnpUnplugged` nm · broad · none · dyn, `./.yarn/unplugged` 제안 · Q33 WARN, mcp Q33, theme add unplugged none)의 기대를 설정 문장 없는 안내로 갱신. 변이: `needsSetup` 의 unplugged 조건 제거 → cli 5 · mcp 2 빨강, `contentPnpNoteFor` 가 unplugged 를 넘기지 않음 → cli 5 · mcp 2, theme add 만 unplugged 를 무시 → cli 1 · mcp 0, 해요체로 되돌림 → cli 13 · mcp 3, 무변이 0 · 0. sha256 원복 확인. theme add 축은 cli 테스트로만 지켜져요 |
| Q44 · Q45 반영 뒤 게이트(2026-10-28, `pnpm --filter` registry-core · cli · mcp) | type-check · lint rc 0(3 패키지 모두), cli · mcp build rc 0, cli vitest 963 통과(21 파일) · mcp vitest 202 통과(9 파일, tokens-sync 20건 실행), `pnpm check-changeset-mcp-tokens` rc 0(19/19). turbo `--force` 게이트는 이 단계에서 돌리지 않았어요 |
| Q47 반영 뒤 재측정(2026-10-28) | 같은 51행 · theme add 12개를 반영 뒤 dist(cli · mcp dist 에 새 문구 1건 · 옛 문구 0건 확인, tsup 이 한글을 \uXXXX 로 내보내므로 이스케이프 형태로 셈. 원문 grep 은 양쪽 모두 0건이 나와요)로 다시 재서 Q44 · Q45 반영본(`q44/out-post`)과 비교(`q47/cmp.py`, 결과 `q47/cmp.out`): `results.tsv` 51행은 옛 문구를 새 문구로 치환하고 Tailwind 빌드 stderr 의 소요 시간(`Done in Nms`)을 가린 뒤 차이 0, 빌드 rc · 규칙 수 · cmp · check rc · 비교 줄 수 · CLI==MCP · 요약 열 차이 0행. check · MCP 102개 파일은 70개 바이트 같음 · 32개는 치환 뒤 같음(치환 32회), 그 밖 차이 0. theme add 12개는 8개 같음 · 4개(TA-Q2-none · TA-Q2-local · TA-Q3-none · TA-Q3-nm) 치환 뒤 같음. 빌드 CSS 49개 바이트 같음(Q4-dyn · Q4u-dyn 은 빌드 rc 1 이라 양쪽 다 산출물 없음). 비 PnP 31건(Yarn node-modules Q2 · P2 의 check · MCP 28개 + theme add 3개)은 발행본 1.7.6 · 1.4.5 출력과 비교해 13개 바이트 같음 · 18개(check · MCP 16개 · theme add 2개) 치환 뒤 같음, 그 밖 차이 0. 같은 비교기로 PnP 행 Q1-nm 은 발행본 대비 2개 모두 차이 검출(양성 대조). CLI · MCP 문구 51행 모두 같음 |
| Q47 단위 테스트 · 변이 | 이 문자열을 리터럴로 단언하던 기존 테스트 4곳(cli `template-check.test.ts:1887` · `theme-add.test.ts:868` · `:904`, mcp `template.test.ts:552`)의 기대만 새 문구로 바꿨어요(plan 5.1, 사유 Q47). 새 테스트는 없어요. 변이: 상수만 「풀려요」로 되돌림 → cli 12 빨강(`template-check` · `theme-add`) · mcp 1 빨강(`template`), sha256 원복 확인 |
| Q47 반영 뒤 게이트(2026-10-28, `pnpm --filter` registry-core · cli · mcp) | type-check · lint rc 0(3 패키지 모두), cli · mcp build rc 0, cli vitest 963 통과(21 파일) · mcp vitest 202 통과(9 파일, tokens-sync 20건 실행), `pnpm check-changeset-mcp-tokens` rc 0(19/19). turbo `--force` 게이트는 이 단계에서 돌리지 않았어요 |
| main ce04f02(WI-0100a #250 머지) 위로 옮긴 뒤 재측정(2026-10-28) | 충돌 2곳(README `tailwind.content` · `animation` 줄, `tailwind-core.ts` import)은 양쪽 보존. 테스트 cli 966 → 983 · mcp 201 → 206(+17 · +5, 이름 대조로 사라진 테스트 0). 51행 · theme add 12개는 옮기기 전 출력과 바이트 같음(빌드 stderr 소요 시간만 다름), 비 PnP 31건은 발행본 대비 Q47 어미 치환 외 차이 0, CLI · MCP 51/51 같음. 두 WI 판정 겹침 fixture P1g(globalCss `styles/theme.css` + PnP content)에서 0100a PASS 와 이 WI 의 PnP WARN 이 함께 나와요 |
| 옮긴 뒤 A/B · 변이 | 판정 소스 3개만 origin/main 으로 바꾼 사본에서 새 테스트 cli 18/18 · mcp 5/5 빨강(Q47 어미를 맞추면 기존 테스트 빨강 0). 변이 MT1 15 · 5, MT2 6 · 3, MT3 2 · 0, MT4 2 · 1, MT5 8 · 2, MT6 2 · 0, MT7 2 · 0(cli · mcp), MT6b 는 리팩터로 변이 자리 0건(미측정). 위쪽 초기 차수 값은 이 행으로 대체해요 |
