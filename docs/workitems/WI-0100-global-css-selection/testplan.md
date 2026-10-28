# WI-0100: check 의 전역 CSS 파일 선택 테스트 계획

> PRD: [prd.md](./prd.md) | 작성일: 2026-10-28 | 상태: 0100a 측정 반영(2026-10-28, A1 · A1b · mono/app2 · mono/app2b 등), 0100b 측정 반영(2026-10-28), 0100b 사용자 결정 Q50 ~ Q56 반영(2026-10-29, 4-1절 · 7절), Q57 ~ Q60 반영(2026-10-29, 4-2절 · 7절)
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
| E1~E5 | 새로 | 경계(이름은 0097 의 「TW4 B1 게이트」와 겹치지 않게 E): E1 `@import "../../outside.css"` E2 밖을 가리키는 심볼릭 링크 E3 a → b → a(b 에 tokens 진입점) E4 깊이 한도(32, Q53) + 1 단계에 진입점 E5 `@import "./missing.css"` | AC5 | 0100b 측정: 전부 WARN. E3 은 Q52 로 globals.css 순환 WARN(초안의 「E3 만 PASS」를 바꿈) |
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
| E3 | globals.css WARN 「app/globals.css에 AXIS CSS 변수가 없습니다 / app/globals.css · app/b.css 이 서로 @import 해 빌드가 순환으로 실패합니다 → 순환하는 @import 를 없애세요」(진입 파일 판정 + 「 / 」 + 순환 문구, Q59), tailwind.config 는 진입 파일만으로 WARN(b 의 근거 불인정, Q52), 무한 루프 없음 | 0 → 0 |
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

## 4-1. 0100b 사용자 결정 Q50 ~ Q56 실빌드 대응 (2026-10-29)

실빌드는 앱의 `@tailwindcss/postcss` 4.1.14 를 `pcss.cjs` 로 직접 불렀고(0100a 와 같은 방법), Next 15 실빌드(`buildnext-q.sh`)로 Tailwind 4 · 3 을 한 번 더 봤어요. check 는 같은 CSS 를 0100b base.sh 골격(설치본 stub)에 얹은 fixture 로, WIP 커밋 972b837 소스와 수정본 소스를 같은 runner(`judge.mjs`, cli `collectCheckResults`)로 돌렸어요. 「토큰 변수」는 산출 CSS 의 `--axis-` 줄 수예요. 기록: scratchpad `WI-0100b/q50/build-q56.tsv` · `build-q54.tsv` · `next-q.tsv` · `judge-wip.tsv` · `judge-new.tsv`.

| 결정 | fixture | 실빌드 rc · 토큰 변수 | check(972b837) TW4 tailwind.config / globals.css | check(수정본) | 대응 |
|---|---|---|---|---|---|
| Q50 | u1 `@import url("./axis.css")` | rc 0 · 0(`@import` 그대로 남음, Next 도 0) | warn / warn | warn / warn | 맞음(구현 그대로 확정) |
| Q51 | l1 `layer(base)` · l2 `supports()` · l3 media 조건식 | rc 1 「`@custom-variant` cannot be nested」(Next TW4 는 l1 형태로 재서 같음) | pass / pass | warn / warn | 거짓 PASS 해소 |
| Q51 | n1b `@import"./axis.css"layer(base);` | rc 0 · 0(펼치지 않음) | warn / warn | warn / warn | 맞음 |
| Q52 | c1 a → b → a · c2 자기 import · c3 b ↔ c · c4 형제 사이 순환 | 넷 다 rc 1 「Exceeded maximum recursion depth」(Next 는 c1 형태만 재서 TW4 · TW3 모두 rc 1) | pass / pass | c2 만 pass / warn, 나머지 warn / warn(globals.css 는 순환 WARN) | 거짓 PASS 해소 |
| Q52 대조 | dia 다이아몬드(같은 파일을 두 갈래로) | rc 0 · 1138 | pass / pass | pass / pass | 순환으로 보지 않음 |
| Q53 | ch32 · ch33 사슬 | 둘 다 rc 0 · 570 | warn / warn(초안 한도 5) | ch32 pass / pass, ch33 warn / warn | ch32 맞음, ch33 은 결정한 거짓 WARN(Next TW3 3c33 도 rc 0) |
| Q54 | s5 하위 디렉터리 그림자 ui-react 1.3.0(`exports` 에 `./tailwind.css` 없음) | rc 1 「is not exported」 | pass / pass | warn(해석 불가) / pass | 거짓 PASS 해소 |
| Q54 | s3 그림자 ui-react 1.3.0(`exports` 없음 · 파일 없음) | rc 0 · 806(실빌드는 그림자를 건너뛰고 앱 설치본으로 풂) | pass / pass | warn / pass | **거짓 WARN 이 새로 생김**(held) |
| Q54 | s3c 그림자 없음 · s6 그림자에 tailwind.css 있음 | rc 0 · 806 / rc 0 · 570(s6 은 그림자 파일을 씀) | pass / pass | pass / pass | 같음 |
| Q54 | s7 tokens 그림자(`exports` 에 `./css/tailwind4` 없음) · s9 tokens 그림자(내용 다름) | s7 rc 1 / s9 rc 0 · 0 | pass / pass | pass / pass | 거짓 PASS 잔존(held, tokens 줄은 설치본 안 파일을 보지 않음) |
| Q54 | s8 tokens 그림자(`exports` 없음 · 파일 없음) | rc 0 · 570 | pass / pass | pass / pass | 맞음 |
| Q56 | n1 `@import"./axis.css"` · n2 `"./axis"` → `axis.css` · n2e `"./axis.css"` → `axis.css.css` · n3 `"./it's.css"` · n3b `'./say"hi.css'` | 모두 rc 0 · 570(Next TW4 · TW3 도 n1 · n2 · n3 펼침) | warn / warn | pass / pass | 거짓 WARN 해소 |
| Q56 | n2b `axis`(빈 파일)와 `axis.css` 가 함께 | rc 0 · 0(적힌 이름 `axis` 를 먼저 씀) | warn / warn | warn / warn | 맞음(적힌 이름 먼저) |
| Q56 | n2c 확장자 없는 파일 `axis` 만 | rc 0 · 570 | pass / pass | pass / pass | 같음 |
| Q56 | n2d `axis/index.css` · n2f `axis/package.json` 의 `style` | rc 0 · 570 | warn / warn | warn / warn | 거짓 WARN 잔존(디렉터리는 따라가지 않음, held) |
| Q56 | z4c `@import "./axis/"`(끝 슬래시, `app/axis.css` 만 있음) | rc 1 「Can't resolve './axis/'」(검증 실측) | warn / warn | warn / warn | 검증 보정: 끝이 `/` 인 경로는 따라가지 않음(보정 전 거짓 PASS), 테스트 z4c(CLI · MCP) |
| (조건 없음 대조) | n4 세미콜론 없는 마지막 줄 · n5 세미콜론 앞 공백 | rc 0 · 570 | pass / pass | pass / pass | 같음 |

- check 종료 코드는 31개 fixture 모두 0 → 0 이에요(순환 WARN 도 fail 이 아님).
- Tailwind 3 + Next 15: `@import "./axis.css" layer(base);`(3layer)는 rc 0 · 토큰 변수 556 으로 펼쳐져요. Q51 을 Tailwind 3 에도 적용하므로 이 형태는 거짓 WARN 이에요(held). 순환(3cycle)은 rc 1 로 실패해 Q52 와 맞아요.
- 접미사(Q55)는 문구 · 자리를 바꾸지 않았어요. 순환 WARN 은 접미사 없이 「(globalCss <값> 없음)」 표기만 붙어요.

## 4-2. 0100b 사용자 결정 Q57 ~ Q60 실빌드 대응 (2026-10-29)

fixture 는 `scratchpad/WI-0100b/q57/fx.sh`(q50-verify-correctness 의 fx.sh 에 z2e · z2f · z2g · z7 을 더한 사본)로 check 용(`cfx`, 가짜 설치본) · 빌드용(`bfx`, `build/tw4/node_modules` 심볼릭 링크) 두 벌을 새로 만들었어요. 실빌드는 `scripts/pcss.cjs`(앱의 `@tailwindcss/postcss` 4.1.14), check 는 Q57 전 dist(`q57/olddist2`, q50-verify-correctness 의 dist 사본) · 수정본 dist 를 같은 사본에 돌렸어요(`q57/table.sh` → `q57/table.tsv`). Q57 전 출력은 q50-verify-correctness `cout` 과 12/12 바이트 같아요(계측 대조군). CLI = MCP 항목 줄 16/16, check rc 는 모두 0 → 0 이에요.

| fixture | 모양 | 실빌드 rc · `--axis-` | Q57 전 tailwind.config / globals.css | 수정본 tailwind.config / globals.css | 판정 |
|---|---|---|---|---|---|
| z2 | 40 단계 사슬, d5 에 진입점, d40 → d1 | rc 1 「Exceeded maximum recursion depth」 | pass / pass(d5 근거) | warn / warn(없음 / d1 ~ d40 순환) | 거짓 PASS 해소(Q57) |
| z2b | 33 단계, d33 → d1 | rc 1 | pass / pass | warn / warn(d1 ~ d33 순환) | 거짓 PASS 해소(Q57) |
| z2d | 33 단계, d33 → 진입 파일 | rc 1 | pass / pass | warn / warn(globals · d1 ~ d33 순환) | 거짓 PASS 해소(Q57) |
| z2c | 32 단계, d32 → d1(양성 대조) | rc 1 | warn / warn(종전 순환 문구만) | warn / warn(없음 / 순환) | 문구만 Q59 형태 |
| z2e | 100 단계, d100 → d1(경계 안) | rc 1 | pass / pass | warn / warn(d1 ~ d100 순환) | 거짓 PASS 해소(Q57 한도 끝) |
| z2f | 101 단계, d101 → d1(경계 밖) | rc 1 | pass / pass | pass / pass | 거짓 PASS 잔존(held, 100 단계 밖) |
| z2g | 순환 없는 102 단계 | rc 1(d101 의 import 가 `t>100` 에 걸림) | pass / pass | pass / pass | 거짓 PASS 잔존(held, 순환이 아니어도 101 단계 import 는 빌드 실패) |
| z2n | 순환 없는 40 단계(대조) | rc 0 · 570 | pass / pass(d5) | pass / pass(d5) | 같음(Q53 그대로) |
| z3a | 진입 → b `layer(base)`, b → 진입 | rc 1 | warn / warn(없음) | warn / warn(없음 / 순환) | 순환 문구 추가(Q57, 조건 import 로만 닿는 b 도 읽음) |
| z3b | 진입 → b, b → 진입 `layer(base)` | rc 1 | pass / pass(b 근거) | warn / warn(없음 / 순환) | 거짓 PASS 해소(Q57) |
| z3c | 진입 → b, b → 진입 `screen` | rc 1 | pass / pass | warn / warn(없음 / 순환) | 거짓 PASS 해소(Q57) |
| z3d | b → 진입 `url("./globals.css")`(대조) | rc 0 · 570 | pass / pass(b) | pass / pass(b) | 같음(Q50, url() 은 펼치지 않음) |
| z3e | 진입 → b, b → b `supports(display:grid)` | rc 1 | pass / pass(b) | warn / warn(없음 / 「app/b.css 이 자기 자신을 @import」) | 거짓 PASS 해소(Q57 · Q60 ①) |
| z1 · z7 | 진입 파일에 진입점 + 자기 import | rc 1 | pass / warn(종전 「app/globals.css 이 서로 @import」) | pass / warn(「…있습니다 (… import) / app/globals.css 이 자기 자신을 @import …」) | Q59 · Q60 ① 문구 |
| z1b | 진입 → b, b → b | rc 1 | warn / warn(종전 순환) | warn / warn(없음 / 「app/b.css 이 자기 자신을 @import」) | Q60 ① 문구 |

- 다른 항목(axis.config · utils · dependencies) 줄은 16/16 Q57 전과 같고, 순환 문구는 globals.css 한 줄에만 나와요(Q59).
- Q60 ②(`'./say"hi.css'` 같은 대칭 형태)는 Q56 측정 n3b 그대로이고 코드 · 테스트를 바꾸지 않았어요. Q60 ③ 은 README 서술만이에요.

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
| cli 전체 · `template-check.test.ts` | 0100b 기준선 2d12ae2: 1036 · 284 | 1067 · 315 → Q50 ~ Q56 반영 1088 · 336 | 0100b 새 describe 「WI-0100b 상대 @import 펼침」 31건 → 52건(Q51 형태 f4 · f5 · f6 을 「따라가지 않음」으로 옮기고 l2 · l3 · n1b 추가, Q56 n1 · n2 · n2e · n3 · n3b · n4 · n5 · n2b/n2c · n2d/n2f, Q52 E3 · E3s · c3/c4 · dia · 표기 · E4c · E7/E7c, Q53 E4 32/33, Q54 3건). 0100b 가 만든 테스트 기대만 바꿈(E3 · E4 · E7 · f4 ~ f6), 그 밖의 기존 테스트 기대 변경 0 |
| mcp 전체 · `template.test.ts` · `brand-core.test.ts` | 0100b 기준선: 222 · 68 · 1 | 226 · 72 · 1 → Q50 ~ Q56 반영 227 · 73 · 1 | 0100b 대표(R4 · R4n · E3 · K1 · G2 · BR2), E3 을 Q52 순환 WARN 으로 바꾸고 Q51 · Q56 1건 추가 |
| A/B probe 전이(plan 4절 목록 대비) | 0100b: head2.json(2554 항목) | 변경 0 (compared=2554 changed=0). Q50 ~ Q56 반영 뒤 다시 돌림(`probe/q50.json`): head2 대비 · WIP(final2) 대비 모두 changed=0, sameAsCaptured 2554/2554 | 양성 대조 mut2.json 은 16건을 잡음. 기존 테스트 코퍼스에 하위 import 가 근거인 형태가 없어 plan 4절 K1 · K2 행은 새 fixture 에서만 전이(K1 WARN → PASS, K2 · K2u WARN → WARN 문구 변경) |
| 실빌드(4절) | 0100b 착수 측정(Master): `build/build4.tsv` · `build4b.tsv` · `next4.tsv` · `next3.tsv` | 재빌드 안 함 | 따옴표 상대 경로 펼침 · `url()` 미펼침 · layer/supports/media 에 토큰 진입점이면 빌드 실패 · 순환 빌드 실패(E3 · E3s) · 50 단계 성공 100 단계 실패 |
| 0100b 기준선 SHA(WI-0097 머지 직후 HEAD) | `2d12ae2711689425ddaf6ca25f5077026ab7fe61` | fixture 53개: 25개 판정 변경 · 28개 바이트 동일, rc 53/53 같음(전부 0), CLI = MCP 53/53, 최대 165ms(E7) · stderr 0 | 3절 단계별 기준선. theme add 출력 · 파일 트리 51/51 기준선 빌드와 같음 |
| 변이(Q50 ~ Q56 되돌림) | | 14종 모두 cli 빨강(`q50/mutants.tsv` · `mutants-q50.tsv`): Q50 url() 따라감(조건 판정에 가려지지 않게 닫는 괄호까지 허용) · Q51 조건부도 따라감 · Q52a 순환 판정 없음 · Q52b 다시 방문을 순환으로(다이아몬드) · Q52c 순환이어도 펼친 근거 · Q52d 순환 WARN 안 냄 · Q53 비교 off-by-one · Q53 한도 5 · Q54 하위 파일 cssDir 없음 · Q55 접미사 끔 · Q56a 공백 필수 · Q56b .css 안 붙임 · Q56c 다른 따옴표 금지 · Q56d .css 먼저. 적용 뒤 sha256 대조로 원복 확인 | mcp 는 7종 빨강(대표 테스트만 있음) |
| theme add A/B(Q50 ~ Q56 반영 뒤) | 기준선 2d12ae2 dist | 착수 fixture 53/53 · q50 fixture 31/31 출력 · 파일 트리 같음 | n3 · n3b 는 파일명의 따옴표로 트리 해시 일부를 못 셈(양쪽 같은 조건) |
| Q57 ~ Q60 테스트 | Q56 반영 뒤 | cli 전체 1096(`template-check.test.ts` 344, describe 「WI-0100b」 60) · mcp 전체 231(`template.test.ts` 77, describe 9) | 새 테스트: cli z2 · z2b · z2d · Q57 경계(100 / 101, 한도 값을 리터럴로 고정) · z2n · z3b/z3c · z3e · z3a, mcp Q59 · Q60 ① · z2/z2n · z3b/z3e. 기존 기대는 순환 문구 5건(E3 · E3s · c3/c4 · 표기 · E7c)과 mcp E3 만 Q59 · Q60 ① 형태로 바꿈 |
| 변이(Q57 ~ Q60 되돌림, `q57/mut.sh` · `mut.out` · `mut-boundary.out`) | | 9종 모두 cli 빨강: Q57a 순환 한도 32(2건) · Q57a' 순환 한도 101(경계 2건) · Q57b 순환 간선에서 조건 import 뺌(4건) · Q57c 근거에 조건 import 넣음(7건, Q51 형태 가드) · Q57d 근거 한도 100(E4 · z2n) · Q59a 순환 문구만(10건) · Q59b 표기를 「 / 」 앞에(1건) · Q59c 진입 파일 PASS 면 PASS(E3s) · Q60 자기 자신 문구 끔(3건). 적용 뒤 sha256 대조로 원복 확인 | mcp 는 6종 빨강(Q57a · Q57b · Q57c · Q59a · Q59c · Q60), 101 · 근거 한도 · 표기 순서는 cli 만 |
| theme add A/B(Q57 ~ Q60 반영 뒤) | 기준선 2d12ae2 dist · Q57 전 dist | 착수 fixture 53/53, q57 fixture 16/16 출력 · 파일 트리 같음(두 기준선 모두) | `q57/themeadd-ab.sh`(원본에 OLD · OUT · SRC 를 바꿀 수 있게 한 사본). 원본 스크립트에 `../` 상대 이름을 넘기면 old · new 가 같은 디렉터리를 써서 거짓 DIFF 가 나요(첫 시도 13건, 측정 무효로 버림) |
| A/B probe(Q57 ~ Q60 반영 뒤) | Q57 전 작업 트리(`q57/pre.json`, `probe/q50.json` 과 changed=0) | `q57/new.json`: compared=2554 changed=0, sameAsCaptured 2554/2554 | 기존 테스트 코퍼스에 순환 · 조건 import 순환 형태가 없어 전이 0 이 설계대로(양성 대조 mut2.json 16건은 계측이 살아 있음을 보임) |
| 변이 M1 ~ M14 | | 0100b 몫 12종 모두 빨강: M2 펼침 끔 · M4a 방문 집합 제거(시간 초과 rc 124) · M4b 깊이 한도 제거 · M3 경계 제거 · M8 하위 줄 게이트 없음 · M13 하위 줄 엄격 게이트 · M5 결함에 근거 · M5b 근거에 진입 · M14 하위 컴포넌트 줄 제외 · 기준 디렉터리를 진입 파일로 · M9b brand 펼침 없음 · M11 접미사 끔 | 적용 뒤 sha256 대조로 원복 확인 |
| 발행본 재측정(1.7.7 · 1.4.6) | | | |
