# WI-0098: Yarn PnP 의 Tailwind 3 content 판정 테스트 계획

> PRD: [prd.md](./prd.md) | 작성일: 2026-10-28 | 상태: 계획(실행 전). 아래 「측정」 값은 조사 · 반박 검증 단계(2026-10-28, 발행본 cli 1.7.6 · mcp 1.4.5)에서 잰 것이고, 신판 값은 전부 미측정이에요
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

## 3. 문구 초안 (착수 단계에서 Master 확인 뒤 확정)

| 자리 | 초안 |
|---|---|
| 안내 상수(가칭 `CONTENT_PNP_NOTE`) | `Plug'n'Play 에는 node_modules 가 없어요. content 에 path.join(path.dirname(require.resolve("<패키지>")), "..", "dist/**/*.{js,mjs}") 처럼 실제 위치를 넣으세요(정적으로 확인할 수 없어 WARN 으로 남아요). 정적 경로를 쓰려면 package.json 의 dependenciesMeta 에 "<패키지>": { "unplugged": true } 를 두고 yarn install 뒤 .yarn/unplugged 경로를 넣으세요` |
| WARN(종전 덮음) | `tailwind.config.js의 content 가 Plug'n'Play 에서 스캔되지 않는 경로로 @axis-ds/ui-react 를 덮습니다(node_modules 경로 · ./** 는 스캔되지 않음) (<안내 상수>)` |
| FAIL 목록 항목(기본 PnP) | `@axis-ds/ui-react(Plug'n'Play 라 node_modules 경로가 없음)` + 끝에 ` (<안내 상수>)` |
| 루트 전용 | `@axis-ds/ui-react 가 워크스페이스 루트에만 선언돼 Plug'n'Play 에서 앱이 해석하지 못합니다 → 앱 package.json 에 선언하세요` |
| theme add | 대상 줄 `! content 가 @axis-ds/ui-react 를 Plug'n'Play 에서 스캔되는 경로로 덮지 않습니다` + 회색 줄 `    <안내 상수>` |

- 안내 상수가 `<패키지>` 자리에 실제 패키지 이름(`@axis-ds/ui-react` · `@axis-ds/agentic-ui`)을 채우는지, 고정 placeholder 로 두는지는 문구 고정 때 여기서 정해요. AC5 측정은 `run.sh` 의 prelude 인자로 `const path = require("path");` 를 넣고, 나머지 글자는 문구에서 그대로 복사해요(placeholder 면 그 자리만 바꿨다고 기록).
- ESM(`tailwind.config.mjs`) · `.ts` 설정에는 `require` 가 없어 이 동적 형태가 그대로는 동작하지 않을 수 있어요(미측정, prd 7절).
- 동적 형태는 측정한 형태(`path.resolve(path.dirname(require.resolve("@axis-ds/ui-react")), "..")` 뒤 `path.join(ui, "dist/**/*.{js,mjs}")`, 빌드 429)와 글자가 달라요. 확정 문구는 AC5 에서 글자 그대로 넣어 다시 재요.
- Windows 경로 구분자에서 동적 형태가 동작하는지는 미측정이에요.

## 4. 기대값 (실설치 fixture)

「구판」은 측정값, 「신판 기대」는 이 WI 의 목표값(미측정)이에요. 빌드 규칙 429 는 cmp 기록이 있는 행(조사 V2-dyn · V4-zipabs · P3-unplugrel, 반박 검증 Q-ziprel · Q-zipabs · U-rel · Q-dyn)에서만 대조군과 `cmp` 같음이에요. 「cmp 미기록」을 붙인 행은 규칙 수만 같아요.

| 행 | 빌드 정답(측정) | 구판 check(측정) | 신판 기대 | AC |
|---|---|---|---|---|
| Q1 · P1 nm | 4 | PASS | WARN, PnP 안내, `./node_modules` 제안 0 | AC1 |
| Q1 · P1 broad | 4 | PASS | WARN | AC2 |
| Q1 · P1 none | 4 | FAIL(제안 `./node_modules`) | FAIL, PnP 안내 | AC3 |
| Q1 · P1 dyn | 429 | WARN(제안 `./node_modules`) | WARN, PnP 안내 | AC3 |
| Q1 zipabs · ziprel, P1 V4-zipabs | 429 | FAIL | FAIL, PnP 안내(잔여 오차) | AC3 |
| P4-ziprel | 429(규칙 수, cmp 미기록) | FAIL | FAIL, PnP 안내(잔여 오차) | AC3 |
| Q1 zipwild · P4-ziprelwild | 4 | 기록 없음(미측정) | FAIL, PnP 안내 | AC3 |
| P1 V6-virtualrel | 4(조사 단계 값만, 반박 검증 미재현) | 기록 없음(미측정) | FAIL, PnP 안내 | AC3 |
| Q3 · P3 unplugRel | 429 | FAIL | PASS | AC4 |
| P3 unplugAbs | 429(규칙 수, cmp 미기록) | FAIL | PASS | AC4 |
| Q3 · P3 none | 미측정 | 미측정 | FAIL, 제안 unplugged 상대 glob + cwd 안내 | AC4 |
| Q3 · P3 nm | 미측정(산출물 `P3-nm.css` 는 있으나 조사 자료에 값 없음) | 미측정 | WARN(C2) | AC4 |
| Q4 dyn(R-dyn) | 빌드 rc 1 | WARN, rc 0(제안 문자열은 미기록, 코드상 `./node_modules/...` 추정, 첫 단계에서 재기록) | 루트 전용 문구, WARN(content 를 정적으로 다 읽지 못함, AC6 의 dynamic 조항 · C3 예외) | AC6 |
| Q4 nm · none | 미측정(구현 첫 단계) | 미측정 | nm → WARN 루트 전용 문구, none → FAIL 루트 전용 문구 | AC6 |
| Q4 + unplugged, unplugRel | 미측정(구현 첫 단계, 429 가 날 수 있음, 추정) | 미측정 | FAIL 루트 전용 문구(C3, 인정하지 않음). 429 이면 prd 7절의 알려진 한계 | AC6 |
| TA1-nm(theme add) | - | content 안내 0줄, rc 0 | PnP 안내 줄, rc 0 | AC7 |
| TA1-none · P4(theme add) | - | 「넣으세요: "./node_modules/..."」, rc 0 | PnP 안내 줄, rc 0 | AC7 |
| Q2 · P2 up · none · broad 등 | 429 · 4 · 4 | PASS · FAIL · FAIL | 구판과 바이트 같음 | AC8 |
| 안내 적용: Q1 none + 확정 동적 형태 | 429 기대 | - | WARN, rc 0 | AC5 |
| 안내 적용: Q3 none + 확정 unplugged 제안 | 429 기대 | - | PASS | AC5 |

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
