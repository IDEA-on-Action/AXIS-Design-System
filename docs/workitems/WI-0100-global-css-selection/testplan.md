# WI-0100: check 의 전역 CSS 파일 선택 테스트 계획

> PRD: [prd.md](./prd.md) | 작성일: 2026-10-28 | 상태: 0100a 측정 반영(2026-10-28, A1 · A1b · mono/app2 · mono/app2b 등), 0100b 행은 계획
> 기준선은 저장소 dist 가 아니라 **npm 발행본 cli 1.7.6 · mcp 1.4.5** 예요(저장소 `packages/axis-cli/dist` 는 2026-10-25 빌드로 낡음, `pluginProblem` 0건). 「발행본」 열은 조사 · 반박 검증의 측정값이고, 「미측정」은 구현 첫 단계에서 재요.

## 1. fixture

출처(조사 scratchpad, 저장소 밖):
- `S=/tmp/claude-1000/-home-sinclair-work-idea-on-action-AXIS-Design-System/7a29a557-9ebc-48a8-a772-89e5ee57e773/scratchpad`
- 조사: `$S/WI-0100/fx/<이름>`, 생성 스크립트 `$S/WI-0100/scripts/mk.sh <dir> <3|4> [ui]`
- 반박 검증: `$S/WI-0100-verify/fx/<이름>`, 생성 · 실행 `$S/WI-0100-verify/scripts/fx.sh` · `run.sh`(CLI · MCP 동시, `MCPON=1`) · `mcp-call.mjs`
- 공통 모양: 가짜 설치본 `node_modules/<pkg>/package.json`, `.git` 디렉터리, `lib/utils.ts`, `package.json`(tokens ^1.8.2 · clsx · tailwind-merge · tailwindcss ^4.1.14 또는 ^3.4.17)

구현 때 옮길 형태: `packages/axis-cli/src/template/template-check.test.ts` 에 새 describe 「WI-0100 전역 CSS 선택」을 두고, 기존 `writeAllPassProject` 와 같은 tmp 디렉터리 헬퍼로 아래 파일만 써요(scratchpad 경로를 테스트가 참조하지 않음). MCP 는 `packages/axis-mcp/src/tools/template.test.ts` 에 대표 4건(R1 · R2 · R4 · mono)을 둬요. 실제 설치(npm pack)는 vitest 가 아니라 4절 · 6절의 수동 측정에서만 써요.

| 이름 | 출처 | 핵심 파일 | AC | 발행본 결과 |
|---|---|---|---|---|
| C0 | 조사 | `app/globals.css`(tailwindcss + tokens 진입점), globalCss=`./app/globals.css` | AC11 | 5/0/0, rc 0 (측정) |
| c0n | 검증 | C0 에서 globalCss 키 없음 | AC11 | 미측정(fixture 만 있음) |
| R1 | 조사 · 검증 | C0 + 루트 `globals.css`=`body{margin:0}` | AC1 | WARN 2건, rc 0 (측정) |
| A1 | 새로 | R1 + ui-react 선언 · 설치 + `tw-animate-css` 설치, `@import "tw-animate-css";` 는 `app/globals.css`(컴포넌트 `tailwind.css` 줄 없음) | AC1 | WARN 3건(TW4 `tailwind.config` · `globals.css` · animation), rc 0 (측정, 착수 측정 `WI-0100a/out/summary.tsv`) |
| A1b | 새로(H3) | A1 + `app/globals.css` 에 `@import "@axis-ds/ui-react/tailwind.css";` | AC1 | A1 과 같은 WARN 3건, rc 0 (측정, 같은 표) |
| R2 | 조사 · 검증 | `src/styles/globals.css` 만, globalCss 가 그 파일 | AC2 | WARN + FAIL, rc 1 (측정) |
| R3 | 조사 · 검증 | `styles/app.css` 만, globalCss 가 그 파일 | AC2 | WARN + FAIL, rc 1 (측정) |
| R4 / R4n | 조사 / 검증 | `app/globals.css`=`@import "tailwindcss"; @import "./axis.css";`, `app/axis.css`=tokens 진입점 / 빈 파일 | AC4 | 둘 다 같은 WARN 2건 (측정) |
| R5 / R5c | 조사 · 검증 | ui-react · tw-animate-css 설치, 줄이 `app/animate.css` / globals 직접 | AC4 · AC11 | R5 WARN / R5c PASS (측정) |
| R6 | 조사 · 검증 | R1 + `brand: ontology`(import 는 app) | AC1 · AC6 | 판정 파일 2개 (측정) |
| R7 / R7c | 조사 · 검증 | TW3 preset, `app/globals.css` 에 `@import "@axis-ds/tokens/css"`, R7 만 루트 낡은 파일 | AC1 | R7 globals WARN / R7c PASS (측정). 검증 fixture 는 content 가 componentsDir 를 덮지 않아 content FAIL 로 rc 1 이었음(옮길 때 content 를 맞춤) |
| R8 | 조사 · 검증 | R1 의 CSS + `.git` + 빈 `.pnp.cjs`, node_modules 없음 | AC1 | R1 과 같은 WARN 2건 (측정) |
| R9 | 조사 · 검증 | 루트 `globals.css` 완전, `app/globals.css`=`body { margin: 0; }`, globalCss=app | 3절 전이 | PASS 3건 (측정) |
| I1 | 조사 · 검증 | config 없음, `src/styles/globals.css` 만 → `init -y` | AC2 · AC13 | init rc 0, check FAIL rc 1 (측정) |
| I2 | 조사 · 검증 | config 없음, 루트 낡은 파일 + `app/globals.css` → `init -y` | AC13 | init 은 app 기록, check 는 루트 WARN 2건 (측정) |
| mono/app1 | 검증 | `app1/axis.config.json` globalCss=`../shared/globals.css` · brand ontology, `shared/globals.css` 완전(tailwindcss · tokens 진입점 · ontology), `app1/package.json` 에 ui-react 선언 없음 · componentsDir 비어 있음(animation 항목 없음), 설치본은 `app1/node_modules` 에만 | AC6 · AC7 | CSS 2항목(TW4 `tailwind.config` WARN · `globals.css` FAIL) rc 1, brand PASS (측정) |
| mono/app2 | 새로 | mono/app1 + `app2/package.json` 에 ui-react 선언 · 설치, `tw-animate-css` 설치, 밖 CSS(fixture 는 `shared2/globals.css`)에 `@import "tw-animate-css";`(컴포넌트 `tailwind.css` 줄 없음) | AC7 | TW4 `tailwind.config` WARN · `globals.css` FAIL · animation WARN, brand PASS, rc 1 (측정, 착수 측정 `WI-0100a/out/summary.tsv`) |
| mono/app2b | 새로(H3) | mono/app2 + 밖 CSS(`shared2b/globals.css`)에 `@import "@axis-ds/ui-react/tailwind.css";` | AC7 | mono/app2 와 같음, rc 1 (측정, 같은 표) |
| x2 | 검증 | globalCss=`./nope.css`, 루트 `globals.css` 완전 | AC3 | PASS, 표기 없음 (측정) |
| x3 | 검증 | globalCss=`./nope.css`, CSS 없음 | AC3 · AC9 | FAIL rc 1 (측정) |
| x4 | 검증 | TW3, `app/layout.tsx` 가 `import "@axis-ds/tokens/css"`, 루트 · app CSS 는 `body{margin:0}` | AC9 | PASS 「globals.css에 … (app/layout.tsx의 @axis-ds/tokens/css import)」 (측정) |
| x5 | 검증 | `app/globals.css`=tailwindcss + `./base.css` + tokens 진입점, `app/base.css`=`:root` 색값 · `body` Arial | AC10 · AC11 | PASS 2건 (측정) |
| E1~E5 | 새로 | 경계(이름은 0097 의 「TW4 B1 게이트」와 겹치지 않게 E): E1 `@import "../../outside.css"` E2 밖을 가리키는 심볼릭 링크 E3 a → b → a(b 에 tokens 진입점) E4 깊이 한도 + 1 단계에 진입점 E5 `@import "./missing.css"` | AC5 | 미측정(전부 WARN 예상, 신판에서는 E3 만 PASS) |
| N1 / N2 | 새로 | globalCss=`./package.json` / `./app`(디렉터리), `app/globals.css` 완전 + brand | AC8 | 미측정(코드상 check 는 후보 판정, brand 는 N1 에서 package.json 을 고름) |
| G1 | 새로(0100b) | 하위 `app/axis.css` 에 tokens 진입점, tokens 는 워크스페이스 루트에만 선언 · 미설치 | AC10 ② | 미측정(0097 머지 뒤) |
| G2 | 새로(0100b) | 하위 `app/axis.css` 에 tokens 진입점, tokens 는 앱에 선언 · 미설치. 대조 G2c 는 같은 줄을 `app/globals.css` 에 직접 | AC10 ②(Q21) | 미측정 |
| G3 | 새로(0100b) | 하위 `app/axis.css` 에 tokens 진입점, `.git` + 빈 `.pnp.cjs`, tokens 는 워크스페이스 루트에만 선언(PnP 루트 전용). 대조 G3c 는 같은 줄을 진입 파일에 직접 | AC10 ②(Q22) | 미측정 |
| K1 | 새로(0100b) | ui-react 선언 · 설치본 1.4.0 이상, `app/globals.css`=tailwindcss + tokens 진입점 + `@import "./components.css"`, `app/components.css`=`@import "@axis-ds/ui-react/tailwind.css";`. 대조 K1c 는 같은 줄을 진입 파일에 직접 | AC10 ③ | 미측정(발행본은 하위 줄을 못 봐서 B1 누락 WARN 으로 추정) |
| K2 | 새로(0100b) | K1 과 같은 CSS, ui-react 설치본 1.4.0 미만(또는 미설치). 대조 K2c 는 같은 줄을 진입 파일에 직접 | AC10 ③ | 미측정 |

## 2. 측정 명령

```bash
S=/tmp/claude-1000/-home-sinclair-work-idea-on-action-AXIS-Design-System/7a29a557-9ebc-48a8-a772-89e5ee57e773/scratchpad
OLD=$S/WI-0100-verify/run/node_modules/@axis-ds      # 발행본 1.7.6 · 1.4.5 (npm integrity 일치)
NEW=<worktree>/packages                               # 수정본 dist (turbo build --force 뒤)
# rc 는 파이프에 물리지 않고 따로 받음
out=$(NO_COLOR=1 node $OLD/cli/dist/index.js check --dir "$d" 2>&1); rc=$?
out=$(NO_COLOR=1 node $NEW/axis-cli/dist/index.js check --dir "$d" 2>&1); rc=$?
node $S/WI-0100-verify/scripts/mcp-call.mjs $NEW/axis-mcp/dist/index.js "$d"   # MCP axis.check_project
# init (I1 · I2): out=$(node <cli> init -y 2>&1); rc=$?  뒤 cat axis.config.json, 이어서 check
```

- 판정 파일 집합(AC6, H4 정정): **각 항목 줄이 가리키는 판정 파일**의 집합 크기예요. CSS 판정 항목 줄(TW4 `tailwind.config` · `globals.css` · TW4 animation · brand import, 브랜드 켜기 코드 WARN 은 제외)마다 「<파일>에」의 파일(확장자를 가리지 않음, `package.json` 도 셈)을 하나 정하고, 「찾지 못했습니다 · 찾을 수 없습니다」면 「(없음)」, 둘 다 아니면 「식별 불가」로 따로 세요. 스크립트 `$S/WI-0100a/h4/judged.sh <출력 파일>`(출력 `items=<항목 수> set=<집합 크기> unidentified=<식별 불가 수>`). 항목 수가 0 이면 계측 실패로 보고 원출력을 다시 봐요.
  - 정정 이유: 종전 정의(`([^ ]+\.css)에` 를 `sort -u | wc -l`)는 파일명이 없는 항목(「… 확인할 CSS 파일을 찾지 못했습니다」 · 「globals.css 파일을 찾을 수 없습니다」)과 `.css` 가 아닌 파일명(N1 brand 의 `package.json`)을 세지 못했어요. 같은 저장 출력에 두 정의를 적용한 값(발행본): R6 2 / 2, mono/app1 **1** / 2, N1 **1** / 2(종전 / 정정). 신판(WIP 3325190 빌드 출력)은 R6 · mono/app1 · mono/app2 · mono/app2b · N1 · N2 · R1 · A1 · A1b 모두 정정 지표 1, 식별 불가 0이에요. 발행본의 식별 불가는 파일명 없는 animation WARN(mono/app2 · mono/app2b · A1 · A1b 각 1건)이에요.
- vitest: `pnpm --filter @axis-ds/cli test` · `pnpm --filter @axis-ds/mcp test`, 파일별 통과 수를 기준선과 나란히 적어요. mcp `registry/tokens-sync.test.ts` 는 빌드 전 0건 실행이라 빌드 뒤 수만 셈해요.
- 품질 게이트: `pnpm turbo run build type-check lint --force`(캐시 우회).

## 3. 기대값

**기준선은 단계별이에요.** 같은 표에 놓는 값은 같은 기준선으로 잰 값이어야 해요.

| 단계 | 비교 대상(구판) | 쓰는 곳 |
|---|---|---|
| 0100a | HEAD 18d0357 소스 빌드, 또는 발행본 1.7.6 · 1.4.5(같은 소스로 추정, 바이트 동일성은 미측정) | 0100a PR 의 A/B · 회귀 가드 |
| 0100b | WI-0097 머지 직후 HEAD(0100b 직전 커밋 SHA, 착수 때 7절에 기록) 빌드 | 0100b PR 의 A/B · 회귀 가드. 0097 변경(TW4 pass 문구 · B1 게이트)이 섞이지 않게 함 |
| 최종 | 발행본 1.7.6 · 1.4.5 | 세 WI 를 합친 1.7.7 · 1.4.6 재측정에만. 이 diff 에는 0097 · 0098 변경이 함께 들어가므로 0100 단독 판정에 쓰지 않음 |

아래 「바이트 동일」은 그 단계의 구판 대비예요. 0097 이 소유한 문구(`tailwind-core.ts:891-895` TW4 pass · B1 게이트 문구)는 본문을 단언하지 않고 **파일명 · 접미사 자리만** 단언해요. 0100a 시점 문구는 HEAD 문구 틀 그대로이고, 0097 머지 뒤 문구는 0097 testplan 을 따라요.

| fixture | 신판 기대 | rc 발행본 → 신판 |
|---|---|---|
| C0 · c0n · x5 · R5c | 그 단계 구판과 바이트 동일 | 0 → 0 |
| R1 · R8 | TW4 `tailwind.config` PASS(파일명 자리 `app/globals.css`, 0100a 시점 문구는 HEAD 틀 「Tailwind 4: app/globals.css에 @import "tailwindcss" 와 AXIS 토큰 진입점이 있습니다」, 0097 머지 뒤는 파일명 · 접미사만 단언) · globals.css PASS 「app/globals.css에 AXIS CSS 변수가 있습니다 (@axis-ds/tokens/css/tailwind4 import)」(globals 게이트가 붙은 뒤는 파일명 · 접미사만 단언) | 0 → 0 |
| A1 | animation PASS, 파일명 자리 `app/globals.css`(0100a 시점 HEAD 틀 「app/globals.css에 애니메이션 플러그인이 있습니다」) · `globals.css` PASS. TW4 `tailwind.config` 는 **B1 WARN 이 남아요**(「app/globals.css에 컴포넌트 스캔 경로(tailwind.css)가 없습니다」, ui-react 선언인데 컴포넌트 `tailwind.css` 줄이 없음, H3 정정) | 0 → 0 |
| A1b | CSS 3항목 PASS(파일명 `app/globals.css`, TW4 `tailwind.config` 는 HEAD 틀 「Tailwind 4: app/globals.css에 @import "tailwindcss" 와 AXIS 토큰 진입점이 있습니다」) | 0 → 0 |
| R2 · R3 · I1 | PASS 2건(파일명 `src/styles/globals.css` · `styles/app.css`), FAIL 0 | **1 → 0** |
| R4 | PASS 2건, 근거 접미사 「(app/axis.css 의 import)」 형식 | 0 → 0 |
| R4n | WARN 2건 그대로(파일명 `app/globals.css`) | 0 → 0 |
| R5 | animation PASS(하위 파일 접미사) | 0 → 0 |
| R6 | 판정 파일명 집합 1개(`app/globals.css`) | 0 → 0 |
| R7 | globals.css PASS 「app/globals.css에 …」 | fixture content 를 맞춘 뒤 0 → 0 |
| R9 | WARN(`app/globals.css` 기준). rc 불변 | 0 → 0 |
| I2 | config 의 `./app/globals.css` 와 판정 파일명 같음 | 0 → 0 |
| mono/app1 | CSS 2항목(TW4 `tailwind.config` · `globals.css`)이 `../shared/globals.css` 로 PASS, animation 항목 없음(종전과 같음), brand PASS 그대로, 집합 1개 | **1 → 0** |
| mono/app2 | CSS 3항목(animation 포함)이 밖 파일(`../shared2/globals.css`)을 판정, `globals.css` · animation PASS, TW4 `tailwind.config` 는 **B1 WARN 이 남아요**(H3 정정), 집합 1개 | **1 → 0** |
| mono/app2b | CSS 3항목 모두 `../shared2b/globals.css` 로 PASS, brand PASS, 집합 1개 | **1 → 0** |
| x2 | PASS + 「(globalCss ./nope.css 없음)」 | 0 → 0 |
| x3 | FAIL 「globals.css 파일을 찾을 수 없습니다 (globalCss ./nope.css 없음)」, TW4 항목 WARN 에도 표기 | 1 → 1 |
| x4 | PASS 「app/globals.css에 AXIS CSS 변수가 있습니다 (app/layout.tsx의 @axis-ds/tokens/css import)」 | 0 → 0 |
| E1 · E2 · E4 · E5 | WARN 그대로, 예외 · stderr 없음, 2초 안에 끝남 | 0 → 0 |
| E3 | PASS(b 의 근거 인정), 무한 루프 없음 | 0 → 0 |
| N1 | 세 항목 · brand 가 `app/globals.css`, `configuredRejected` 표기 「 (globalCss ./package.json: .css 파일이 아님)」(Q36 확정, brand 문구 전이, AC11 예외), 집합 1개(발행본 2개). `planThemeAdd` 는 `css-not-stylesheet` 그대로 | 0 → 0 |
| N2 | 세 항목 · brand 가 `app/globals.css`, 「(globalCss ./app 없음)」 표기. brand 문구는 발행본과 바이트 동일 | 0 → 0 |
| G1 | PASS 아님(0097 게이트 문구) | 0 → 0 |
| G2 | TW4 `tailwind.config` · `globals.css` 판정이 G2c 와 같음(게이트로 막지 않음, Q21). 미설치는 dependencies WARN | 0 → 0 |
| G3 | PNP_ROOT_ONLY_NOTE 계열 안내, 판정이 G3c 와 같음(Q22) | 0097 testplan 을 따름 |
| K1 | TW4 `tailwind.config` 가 K1c 와 같은 PASS(B1 누락 해소, WARN → PASS 가능) | 0 → 0 |
| K2 | K1c 아닌 K2c 와 같은 버전 확인 WARN(PASS 였다면 PASS → WARN, 3절 전이 · release-notes 에 반영) | 0 → 0 |

## 4. 착수 전 실빌드 1회 (미측정 축 확정)

- Tailwind 4(`@tailwindcss/postcss`) + Next.js 15 에서 `app/globals.css` 가 `@import "./axis.css"`(R4) · `@import "./animate.css"`(R5)를 펼쳐 `--color-primary` 류 변수 · `animate-in` 유틸리티가 산출 CSS 에 들어가는지 봐요. 산출 CSS 에서 변수 · 유틸리티 이름을 grep 하고, 같은 줄을 진입 파일에 둔 R5c 형태를 양성 대조로 함께 빌드해요.
- Tailwind 3 + Next.js 에서 postcss-import 없이 `@import "./x.css"` 가 처리되는지 같은 방법으로 봐요.
- 프로젝트 밖 진입 파일의 패키지 import 해석 기준(PRD 4절): mono/app1 형태(앱 `app1/` 의 globalCss=`../shared/globals.css`, shared CSS 가 `@axis-ds/tokens/css/tailwind4` · brands 를 import, 설치본은 `app1/node_modules` 에만, `shared/node_modules` 없음)를 1건 빌드해 성공 여부와 산출 CSS 의 토큰 변수를 봐요. 결과가 「해석 실패」이면 밖 진입 파일의 근거를 어떻게 다룰지 Master 확인 항목으로 올려요.
- 도구 버전은 lockfile 에서 읽어 고정하고 기록해요. 결과가 「펼치지 않음」이면 그 조합은 펼침 근거를 쓰지 않도록 PRD 범위를 고친 뒤 진행해요.

## 5. 변이 테스트 (적용 → cli template-check · mcp template 실행 → sha256 대조 원복)

| 변이 | 잡아야 할 AC | 기대 |
|---|---|---|
| M1 globalCss 를 무시하고 종전 후보 루프 | AC1 · AC2 · AC6 · AC7 | 빨강 |
| M2 펼침 제거(진입 파일만) | AC4 · E3 | 빨강 |
| M3 프로젝트 경계 검사 제거 | AC5 ① ② | 빨강 |
| M4 방문 집합 제거(깊이 한도만) / 깊이 한도 제거(방문 집합만) | AC5 ③ ④ | 빨강(시간 초과도 빨강으로 셈) |
| M5 결함 판정에 근거 문자열을 넘김 | AC10 ① (x5) · AC11 | 빨강 |
| M6 check 경로에서 `requireStylesheet` 끔 | AC8 | 빨강 |
| M7 레이아웃 폴백 제거 | AC9 · AC11 | 빨강 |
| M8 펼친 패키지 줄이 0097 게이트를 건너뜀 | AC10 ② (G1 · G3) | 빨강 |
| M13 펼친 줄에 진입 파일보다 엄격한 게이트를 씀(앱 선언 · 미설치도 막음, M8 의 반대 방향) | AC10 ② (G2, Q21 과잉 차단) | 빨강 |
| M14 하위 파일의 컴포넌트 `tailwind.css` import 를 근거 문자열에서 뺌 | AC10 ③ (K1 · K2) | 빨강 |
| M9 brand 가 헬퍼 대신 종전 `findGlobalCss` | AC6 · AC8 | 빨강 |
| M10 프로젝트 밖 globalCss 를 거절 | AC7 | 빨강 |
| M11 표기 접미사 제거 | AC3 | 빨강 |
| M12 theme add 래퍼에서 `requireStylesheet` 켬 | AC11(theme-add.test `:353` · `:368`) | 빨강 |

새 테스트는 HEAD 소스(판정 소스를 `git show HEAD:` 로 바꿈)에 먼저 돌려 빨강을 확인해요. 회귀 가드(AC5 ①②④⑤ · AC10 · AC11)는 HEAD 에서도 초록이 설계대로이고, 그 유효성은 이 표의 변이로만 판정해요.

## 6. CLI · MCP 대조

1절 전 fixture 에서 신판 CLI 항목 줄과 `mcp-call.mjs` 의 `- [` 줄을 정규화(색 코드 · 앞머리 기호 제거)해 diff 해요. 기대는 diff 0 이에요. 대조 줄 수가 0 이면 계측 실패로 보고 원출력을 다시 봐요(발행본 대조에서는 r1 ~ r9 · mono/app1 · x2 ~ x5 가 동일했음, 측정).

## 7. 결과 (구현 뒤 채움)

| 항목 | 기준선 | 수정 뒤 | 비고 |
|---|---|---|---|
| cli 전체 · `template-check.test.ts` | | | |
| mcp 전체 · `template.test.ts` · `brand-core.test.ts` | | | |
| A/B probe 전이(plan 4절 목록 대비) | | | |
| 실빌드(4절) | | | |
| 0100b 기준선 SHA(WI-0097 머지 직후 HEAD) | | | 3절 단계별 기준선 |
| 변이 M1 ~ M14 | | | |
| 발행본 재측정(1.7.7 · 1.4.6) | | | |
