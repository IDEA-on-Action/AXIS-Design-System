# WI-0100: check 의 전역 CSS 파일 선택이 고정 후보만 보고 axis.config globalCss 를 쓰지 않음 PRD

> 작성일: 2026-10-28 | 버전: v1.0 | 작성자: Sinclair Seo | WI: WI-0100 | GitHub: #244 | 우선순위: P3 | 상태: Approved (2026-10-28 사용자 결정 Q24 · Q25 · Q27 · Q35 · Q36 · Q37 · Q38, 나머지는 선례)
> 기준: `main` 18d0357 (linked 1.8.2 · cli 1.7.6 · mcp 1.4.5 발행됨, `git diff --stat ffc0383 HEAD -- packages` 결과 비어 있음). 같은 발행: WI-0097(#241) · WI-0098(#242) → cli 1.7.7 · mcp 1.4.6 patch
> 구현 순서: **WI-0100a**(파일 선택 헬퍼, 펼침 없음) → WI-0097(해석 게이트) → **WI-0100b**(상대 `@import` 펼침이 게이트를 거침). WI-0098 은 병렬
> 표기: **측정**(조사 · 반박 검증에서 발행본 cli 1.7.6 · mcp 1.4.5 로 실행해 얻은 값) · **추정**(실행하지 않음) · **미측정**(아직 재지 않아 구현 첫 단계에서 잼)

---

## 1. 개요

### 1.1 문제 (측정, 발행본 cli 1.7.6 · mcp 1.4.5, CLI · MCP 출력 동일)

`axis check` · MCP `axis.check_project` 에서 전역 CSS 를 읽는 판정 3항목(Tailwind 4 의 `tailwind.config` · `globals.css` · Tailwind 4 의 `animation`)은 고정 목록 `TAILWIND_CSS_CANDIDATES`(루트 `globals.css` → `app/` → `src/app/` → `src/globals.css` → `styles/`)에서 처음 있는 파일 하나만 읽어요(`tailwind-core.ts:260-266` · `:355` · `:868` · `:1443`). `axis.config.json` 의 `globalCss` 는 읽지 않아요. 같은 실행에서 `brand` 항목만 `findGlobalCss`(globalCss → `GLOBAL_CSS_CANDIDATES`, `brand-core.ts:218-235`)를 써서 항목마다 다른 파일을 판정해요. 또 상대 경로 `@import` 로 들여온 하위 CSS 는 따라가지 않아요.

| fixture | 레이아웃 | 발행본 check | 기대 |
|---|---|---|---|
| C0 (대조군) | TW4, `app/globals.css` 에 `tailwindcss` + tokens 진입점, globalCss=`./app/globals.css` | 5 pass / 0 warn / 0 fail, rc 0 | 같음 |
| R1 | C0 + 루트에 낡은 `globals.css`(`body{margin:0}`) | WARN 「Tailwind 4: globals.css에 @import "tailwindcss" 가 없습니다」 · WARN 「globals.css에 AXIS CSS 변수가 없습니다」, rc 0 | PASS 2건 |
| R2 | CSS 가 `src/styles/globals.css`(TAILWIND 후보 밖), globalCss 가 그 파일 | WARN 「… 확인할 CSS 파일을 찾지 못했습니다」 · FAIL 「globals.css 파일을 찾을 수 없습니다」, **rc 1** | PASS 2건, rc 0 |
| R3 | 후보 밖 이름 `styles/app.css`, globalCss 가 그 파일 | R2 와 같음, **rc 1** | PASS 2건, rc 0 |
| R4 · R4n | `app/globals.css` 가 `@import "./axis.css"`, R4 는 `axis.css` 에 tokens 진입점 · R4n 은 빈 파일 | 둘 다 같은 WARN 2건, rc 0 | R4 만 PASS 2건(R4n 은 WARN 그대로) |
| R5 · R5c | ui-react + tw-animate-css 설치. R5 는 `tw-animate-css` 줄이 하위 `animate.css`, R5c 는 globals 에 직접 | R5 WARN 「애니메이션 플러그인이 없습니다」 / R5c PASS | R5 도 PASS |
| R6 | R1 + `brand: ontology`(import 는 `app/globals.css`) | globals.css 는 루트로 WARN, brand 는 「PASS … app/globals.css에 있습니다」(한 실행에서 두 파일) | 모든 CSS 항목이 `app/globals.css` |
| R7 · R7c | TW3 preset, `app/globals.css` 에 `@import "@axis-ds/tokens/css"`, R7 만 루트 낡은 파일 | R7 WARN 「globals.css에 AXIS CSS 변수가 없습니다」 / R7c PASS | R7 도 PASS(globals.css 항목만 해당) |
| R8 | R1 과 같은 CSS 를 Yarn PnP(`.git` + 빈 `.pnp.cjs`)로 | R1 과 같은 WARN 2건, rc 0(PnP 판정 자체는 dependencies 문구로 확인) | PASS 2건 |
| R9 (반대 방향) | 루트 `globals.css` 에 내용, globalCss=`./app/globals.css` 는 `body{}` 뿐 | PASS 3건, rc 0 | WARN(rc 0 그대로, 결정 D1 의 대가) |
| I1 | config 없음, CSS 는 `src/styles/globals.css` 만 → `init -y` 뒤 check | init rc 0 · globalCss=`./src/styles/globals.css` 기록, check FAIL, **rc 1** | PASS, rc 0 |
| I2 | config 없음, 루트 낡은 파일 + `app/globals.css` → `init -y` 뒤 check | init 은 `./app/globals.css` 기록, check 는 루트로 WARN 2건 | 같은 파일로 PASS |
| mono/app1 | globalCss=`../shared/globals.css`(프로젝트 밖), `brand: ontology`. ui-react 미선언 · componentsDir 비어 있어 animation 항목은 나오지 않음(`tailwind-core.ts:1429-1430`) | CSS 2항목(TW4 `tailwind.config` WARN · `globals.css` FAIL), **rc 1**. brand 는 「PASS … ../shared/globals.css에 있습니다」 | CSS 2항목도 밖 파일을 읽음(Q25), rc 0. 밖 경로의 animation 판정은 새 fixture mono/app2(testplan 1절, 미측정)로 잼 |
| x2 | globalCss=`./nope.css`(없음) + 루트 `globals.css` 완전 | PASS, 표기 없음 | PASS + 「(globalCss ./nope.css 없음)」 |
| x3 | globalCss=`./nope.css` + CSS 전무 | FAIL, rc 1 | FAIL + 표기, rc 1 그대로 |
| x4 | `app/layout.tsx` 가 `import "@axis-ds/tokens/css"`, CSS 에는 근거 없음 | 「PASS globals.css에 AXIS CSS 변수가 있습니다 (app/layout.tsx의 @axis-ds/tokens/css import)」(루트 후보 이름) | 같은 심각도 · 같은 폴백, 파일명만 globalCss 파일 |
| x5 | 진입 파일에 진입점, 하위 `base.css` 에 create-next-app `:root` 색값 · `body` Arial | PASS 2건 | PASS 2건 그대로(하위 파일 결함은 판정하지 않음, D9) |

측정 근거 정정(반박 검증):
- 조사의 「저장소 dist 가 낡음」 근거 중 한글 문구 grep 0건은 계측 실패예요(번들러가 한글을 `\uXXXX` 로 바꿔 발행본에서도 0건). 결론은 `pluginProblem` 0건(발행본 2774행에는 있음)과 dist 빌드 뒤 커밋 8개로 다시 확인했어요. 기준선은 저장소 dist 가 아니라 **발행본 1.7.6 · 1.4.5** 예요(npm integrity 일치 확인). 발행본과 main 소스의 바이트 동일성은 재빌드로 대조하지 않았어요(미측정).
- 「`globalCss` grep 0건」은 없는 경로(`packages/registry-core`)에서 잰 값이었어요. 올바른 경로 `packages/axis-registry-core/src/template` 에서 다시 재도 0줄(rc 1)이라 결론은 같아요.
- 「registry-core 테스트에 케이스 추가」는 틀렸어요. registry-core 에는 `*.test.ts` 가 없고, 판정 테스트는 `packages/axis-cli/src/template/template-check.test.ts` · `packages/axis-mcp/src/tools/template.test.ts` 예요.
- 「WI-0099 와 init 기존 줄 침묵을 묶음」은 틀렸어요. WI-0099 는 「다른 애니메이션 패키지만 설치된 경우」 안내 문제예요.
- init 은 CSS 내용을 읽지 않아요. I1 의 `init -y` 출력은 이미 있는 두 줄을 「맨 위에 다음 줄을 넣으세요」로 다시 안내해요(측정). 이 결함은 이번 범위 밖이에요(Q24, WI-0095).

### 1.2 결정

사용자 결정(2026-10-28):

| # | 결정 |
|---|---|
| Q24 | init 의 Tailwind 4 안내(`init.ts:324-332`)는 고치지 않고 WI-0095(#239)로 보내요. 이 WI 의 init 은 「init 이 기록한 globalCss 를 check 가 같은 파일로 판정하는지」 측정까지만이에요(AC13). init 코드는 바꾸지 않아요 |
| Q25 | globalCss 가 프로젝트 밖 경로를 가리키면 **읽기만** 허용해요(쓰기 없음). brand 항목과 결론이 같아지고 종료 코드는 1 → 0 으로만 바뀌어요. theme add 의 쓰기 거절(`css-outside-project`, `theme-add.ts:425-431`)은 그대로예요 |
| Q27 | 문서는 `packages/axis-cli/README.md` 를 필수로 고쳐요. troubleshooting 가이드에 PnP 한 줄을 더해요. ontology-console 템플릿의 content 는 별도 WI(Master 판단, 범위 밖). (PnP 한 줄을 WI-0097 · 0098 이 맡고 이 WI 는 더하지 않는다는 담당 배정은 사용자 결정이 아니라 경계 보고서 소유 원칙에 따른 해석이에요. 0097 · 0098 PRD 와 대조 필요) |
| Q35 | 기존 cli T4-1 `app-init` 2건(`template-check.test.ts` 「runCheck 출력이 정정 전과 줄 단위로 같음」 · 「collectCheckResults 의 이름 · severity · 문구」)의 기대 기준선에 globals.css 항목 표기 한 줄 「(globalCss ./src/app/globals.css 없음)」을 반영해요(plan 4절 목록에 추가) |
| Q36 | D10 · AC3 표기 문구를 확정해요. 「 (globalCss <값> 없음)」 · 「 (globalCss <값>: .css 파일이 아님)」, 항목 문구 맨 끝, 세 CSS 항목의 모든 심각도와 brand 에 붙여요 |
| Q37 | 프로젝트 밖 진입 파일(Q25)의 패키지 import 가 그 파일 위치 기준으로 해석되지 않을 때의 거짓 PASS 는 WI-0097 2부의 해석 게이트가 WARN 으로 처리해요. 0100a 코드는 바꾸지 않아요(4절 · plan 「WI-0097 넘김 메모」) |
| Q38 | 심볼릭 링크로 연 앱에서 globalCss 가 밖 상대 경로일 때 brand 와 CSS 항목의 기준이 어긋날 수 있는 점은 잔여로 둬요(4절, release-notes 한계) |
| Q22 · Q21 · Q23 · Q26 | 이 WI 판정에는 직접 해당하지 않아요. 펼친 하위 파일의 패키지 경로 줄은 WI-0097 게이트(Q21 · Q22)를 그대로 거쳐요(D8) |

선례 · 코드로 정해진 항목(사용자 결정 아님, 경계 보고서 3절 표). D4(조사 decisions 4, 프로젝트 밖 globalCss 처리)는 사용자 결정 Q25 로 대체돼 이 표에서 뺐어요:

| # | 결정 | 근거(선례) |
|---|---|---|
| D1 | globalCss 우선. 가리키는 파일이 없으면 종전 후보로 넘어가고 「(globalCss <값> 없음)」을 붙여요. R9 는 PASS → WARN(rc 불변) | WI-0028 FR-2 · A1, `findGlobalCss`(`brand-core.ts:218-235`) |
| D2 | 후보 목록 두 개(`TAILWIND_CSS_CANDIDATES` · `GLOBAL_CSS_CANDIDATES`)는 그대로 둬요. globalCss 키가 없는 프로젝트는 종전 순서 | WI-0049 D6-범위(`WI-0049 prd.md:23`) |
| D3 | `@import` 는 프로젝트 안 **상대 경로** CSS 만 따라가요. 패키지 경로 줄은 펼치지 않고 WI-0097 헬퍼에 넘겨요. 순환 방지 · 깊이 제한 | 경계 보고서 1-2 소유 원칙 3, `realPathInside` 경계 |
| D5 | brand 항목도 같은 선택 · 펼침을 써요(cli · mcp `brand-core.ts` 두 사본 동시) | 경계 보고서 3절, `brand-core.test.ts:6-15` |
| D6 | 하위 파일에서 근거를 찾으면 진입 파일 문구 끝에 「(app/axis.css 의 import)」 형식 접미사. 하위 파일이 없으면 종전 문구 바이트 그대로 | `tailwind-core.ts:362` · `:366` 의 「(… import)」 접미사 |
| D7 | WI-0097 · 0098 과 한 발행(cli 1.7.7 · mcp 1.4.6 patch). linked 4패키지는 1.8.2 그대로 | 2026-10-28 묶음 지시, registry-core 변경이라 cli · mcp 둘 다(`check-changeset-mcp-tokens`) |
| D8 | 펼친 하위 파일의 내용은 **근거**(있어야 할 줄)에만 써요. 근거는 두 갈래예요. ① **게이트 대상**: `tailwindcss` · tokens 진입점 · tokens CSS · `tw-animate-css` · `@plugin` · 컴포넌트 `tailwind.css`. 진입 파일에 있을 때 WI-0097 게이트를 거치는 줄은 하위 파일에 있어도 같은 게이트를 거쳐요(진입 파일보다 엄격하게도 느슨하게도 하지 않음, Q21 · Q22). ② **게이트 비대상**: 브랜드 import(`@axis-ds/tokens/css/brands/<name>`, `brand-core.ts:244`). 0097 게이트는 brand 항목에 걸리지 않으므로(선례 「0097 D4 = globals.css 만」, WI-0091 Q6) 하위 파일의 브랜드 import 도 진입 파일과 같은 규칙으로 위치만 펼친 근거에서 찾아요. 하위 파일의 컴포넌트 `tailwind.css` 는 `tailwind4Issues`(`tailwind-core.ts:818-850`)의 B1(누락) · 버전 판정에 함께 들어가요(3절 전이) | 경계 보고서 1-3, 「없을 때 종전 동작」 |
| D9 | 결함 판정(create-next-app 기본 정의 · TW3 Arial)은 진입 파일만 봐요(x5 PASS 유지) | AC 회귀 가드, 반박 검증 extra 2 |
| D10 | globalCss 가 `.css` 가 아닌 **일반 파일**(예: `package.json`)을 가리키면 check 는 그 값을 버리고 후보로 넘어가며 `configuredRejected` 표기를 붙여요. **디렉터리**는 종전 `findGlobalCss` 처럼 `isFile` false 라 `configuredMissing`(「(globalCss ./app 없음)」) 그대로예요(`brand-core.ts:222-225`, `template-check.ts:181`). 그래서 brand 출력 바이트는 N2(디렉터리)에서 바뀌지 않고 N1(일반 파일)에서만 바뀌어요(plan 4절). **check 경로에서만** 켜요. theme add 의 `css-not-stylesheet` 거절(`theme-add.ts:71` · `:433-438`)은 종전 선택 규칙 그대로라 출력 바이트가 바뀌지 않아요 | `isStylesheet`(`theme-add.ts:309`), 경계 보고서 3절. 디렉터리 · 일반 파일 구분은 선례 유추(종전 `isFile`), 구현 뒤 Master 확인 |
| D11 | 레이아웃 JS 의 tokens CSS import 폴백(`findLayoutTokensCssImport`)은 선택된 파일에 근거가 없을 때만 지금처럼 써요. 문구 틀 그대로(파일명만 선택된 파일). 파일이 하나도 없으면 종전처럼 FAIL | `tailwind-core.ts:364-366` · `:389`, WI-0070 |
| D12 | 공용 헬퍼는 registry-core 에 둬요(MCP 가 cli 코드를 쓸 수 없음) | WI-0093 Q14 |

구현 세부:
- **확정(Q36)**: 「 (globalCss <값> 없음)」 표기는 brand(`template-check.ts:181`)처럼 **세 항목의 모든 심각도**(PASS · WARN · FAIL)와 brand 에 붙여요. 자리는 항목 문구 맨 끝이에요. x2 처럼 종전 PASS 문구에 표기가 새로 붙는 부류는 회귀 가드(AC11)의 「바이트 그대로」 대상에서 빠져요.
- **확정(Q36)**: D10 의 표기 문구는 「 (globalCss <값>: .css 파일이 아님)」이에요(예: 「 (globalCss ./package.json: .css 파일이 아님)」, `project.ts` `globalCssSelectionNote`). 같은 자리 · 같은 범위(세 CSS 항목 모든 심각도 + brand)예요.
- 펼침 깊이 한도(5 단계 안)는 0100b 구현이 정하고 구현 뒤 확정해요(WI-0091 A1 과 같은 절차, 미확정).

### 1.3 목표

1. 세 항목이 globalCss 가 가리키는 파일(없으면 종전 후보)을 판정해요. 한 실행 안에서 brand 와 판정 파일이 어긋나지 않아요.
2. init · theme add 가 기록한 globalCss 를 check 가 못 찾아 FAIL(rc 1)하는 경우를 없애요.
3. 상대 경로 `@import` 로 들여온 프로젝트 안 CSS 의 근거 줄을 인정해요(패키지 경로 근거는 WI-0097 게이트 통과 시에만).
4. globalCss 키가 없는 기존 프로젝트의 출력은 바이트 그대로예요.

### 1.4 범위

- 포함
  - registry-core `project.ts`: 전역 CSS 선택 헬퍼(globalCss 우선 · 후보 목록 인자 · `configuredMissing` · 프로젝트 밖 읽기 허용 · check 용 `.css` 확인 옵션)
  - registry-core `tailwind-core.ts`: `checkGlobalsCss` · `checkTailwindSetup`(TW4) · `checkAnimationPlugin`(TW4)가 헬퍼를 씀, 상대 `@import` 펼침 헬퍼(근거 문자열과 진입 문자열 분리), 레이아웃 폴백 위치, 표기
  - Tailwind 3 의 `globals.css` 항목도 같은 선택 · 펼침(R7)
  - cli · mcp `brand-core.ts`: `inspectBrandImport` 가 헬퍼 · 펼침을 씀. `findGlobalCss` 는 theme add 용 종전 규칙을 유지(헬퍼 위 얇은 래퍼)
  - 머리 주석 · docstring(`tailwind-core.ts:1-33` 머리 주석의 globals 서술 · `:259` · `:343` · `:853`, `project.ts:370-372`, `brand-core.ts:211-217` · `:290-292`(cli · mcp 사본 동시)) 서술 갱신
  - 문서 `packages/axis-cli/README.md:98` · `:109` · `:116`(Q27)
  - changeset: `@axis-ds/cli` patch + `@axis-ds/mcp` patch
- 제외(행선지)
  - 패키지 경로 CSS import 의 해석 여부 판정 · TW4 B1 게이트 · PnP 루트 전용 안내: WI-0097(#241)
  - init 의 Tailwind 4 안내(이미 있는 줄 다시 안내 포함, `init.ts:324-332`): WI-0095(#239, Q24)
  - PnP content glob · theme add content 안내: WI-0098(#242)
  - npm 워크스페이스 루트 안내: WI-0096(#240)
  - Tailwind 3 preset ESM · `.ts` 의 tokens 미선언 PASS: WI-0101(#248, Q26)
  - ontology-console 템플릿 content: 별도 WI(Master 판단, Q27)
  - theme add 의 쓰기 대상 · 거절 규칙 변경, 후보 목록 통합(D2), tsconfig · 패키지 alias(`@/` · `~/`) `@import` 해석, 루트 레이아웃 JS 로 진입 CSS 를 추정하는 것(D11 의 tokens 폴백은 유지)
  - troubleshooting 가이드 PnP 줄(WI-0097 · 0098)

## 2. 수용 기준

각 AC 의 「음성 대조」는 고치기 전(발행본 1.7.6 · 1.4.5, 또는 HEAD 소스)에서 실패가 재현되는지예요. **회귀 가드**는 수정 없이도 통과하므로 변이 테스트(testplan 5절)로만 유효성을 확인해요.

| AC | 기준 | 측정 방법 | 음성 대조 |
|---|---|---|---|
| **AC1** | globalCss 파일이 실재하면 그 파일을 판정해요. R1: TW4 `tailwind.config` · `globals.css` PASS. R6: `globals.css` · brand 가 같은 `app/globals.css`. R7: TW3 `globals.css` PASS. R8(PnP): R1 과 같은 PASS. TW4 animation: 새 fixture A1(R1 + ui-react · `tw-animate-css` 줄은 `app/globals.css`)에서 PASS | 새 dist 로 check, 항목 줄 · rc 기록. 같은 fixture 를 발행본과 A/B | 발행본: R1 · R6 · R7 · R8 WARN(측정). A1 은 미측정이라 구현 첫 단계에서 발행본으로 WARN 재현을 먼저 확인 |
| **AC2** | TAILWIND 후보 밖 파일을 globalCss 로 지정하면 FAIL 이 사라져요(R2 · R3 · I1: FAIL 0건, rc 1 → 0) | `out=$(...); rc=$?` 로 rc 를 따로 받음 | 발행본 R2 · R3 · I1 rc 1(측정) |
| **AC3** | globalCss 가 없는 파일이면 종전 후보로 넘어가고 세 항목 모든 심각도에 「(globalCss <값> 없음)」. x2: PASS + 표기. x3: FAIL + 표기, rc 1 그대로 | x2 · x3 출력 · rc | 발행본 x2 는 표기 없음(측정). x3 rc 1(측정, 바뀌지 않아야 함) |
| **AC4** | 상대 `@import` 를 따라가 하위 파일 근거를 인정해요. R4 PASS 2건(접미사 「(app/axis.css 의 import)」 형식), R5 animation PASS | R4 · R4n · R5 · R5c | 발행본 R4 · R4n 이 같은 WARN 2건, R5 WARN(측정). 고친 뒤 R4n 은 WARN 그대로여야 추적이 실제로 동작한 것 |
| **AC5** | 펼침 경계: ① `../` 로 프로젝트를 벗어나는 import ② 밖을 가리키는 심볼릭 링크 ③ 순환 a → b → a ④ 깊이 한도 초과 ⑤ 없는 파일. 예외 · 무한 루프 없이 끝나고, **방문한 파일의 줄만** 인정해요(③ 에서 b 에 근거가 있으면 PASS, ①②④⑤ 너머 줄은 불인정) | 경계 fixture 5종, rc · stderr · 소요 시간 기록 | ③ 은 발행본 WARN(추적 없음, 미측정). ①②④⑤ 는 발행본도 불인정이라 **회귀 가드**(변이 M3 · M4 로 확인) |
| **AC6** | 한 실행 안에서 brand 와 CSS 항목이 같은 파일을 판정해요(R6 · mono/app1 · N1 에서 판정 파일 집합이 1개) | **각 항목 줄이 가리키는 판정 파일**의 집합 크기(testplan 2절 정의). CSS 판정 항목(TW4 `tailwind.config` · `globals.css` · TW4 animation · brand import) 줄마다 「<파일>에」의 파일, 「찾지 못했습니다 · 찾을 수 없습니다」면 「(없음)」으로 세고, 둘 다 아닌 줄은 「식별 불가」로 따로 적어요 | 발행본 R6 2개(`app/globals.css` · `globals.css`), mono/app1 2개(「(없음)」 · `../shared/globals.css`), N1 2개(`app/globals.css` · `package.json`). 셋 다 정정한 지표로 저장 출력에서 다시 셈(H4) |
| **AC7** | globalCss 가 프로젝트 밖이면 읽기만 해요(Q25). mono/app1: CSS 2항목(TW4 `tailwind.config` · `globals.css`)이 `../shared/globals.css` 를 판정, FAIL 0건, rc 1 → 0. brand PASS 그대로. mono/app2(ui-react 선언 · 설치, shared CSS 에 `tw-animate-css` 줄): animation 도 밖 파일을 판정. theme add 는 종전대로 `css-outside-project` | mono/app1 · mono/app2 check · rc, `theme-add.test.ts:310` 통과 | 발행본 mono/app1 rc 1, 출력 2항목(측정). mono/app2 는 미측정 |
| **AC8** | globalCss 가 `.css` 가 아닌 일반 파일(N1 `package.json`)이면 check 세 항목 · brand 가 그 값을 버리고 후보 + `configuredRejected` 표기(D10). 디렉터리(N2 `./app`)면 세 항목 · brand 모두 「(globalCss ./app 없음)」 표기로 후보를 판정하고, brand 문구는 발행본과 바이트 그대로예요. theme add 는 `css-not-stylesheet` 그대로 | 새 fixture N1 · N2, `theme-add.test.ts:353` · `:368` 통과 | 발행본 N1 의 brand 는 package.json 을 고름, N2 의 brand 는 「없음」 표기(코드 근거 `brand-core.ts:222-225` · `template-check.ts:181`, 출력 미측정) |
| **AC9** | 레이아웃 폴백(D11): x4 에서 심각도 PASS · 「(app/layout.tsx의 @axis-ds/tokens/css import)」 그대로, 파일명만 `app/globals.css`. 파일이 하나도 없으면 종전 FAIL | x4 · x3 출력 | 발행본 x4 는 루트 이름 `globals.css`(측정) |
| **AC10** | 펼친 내용은 근거에만(D8 · D9). ① x5: PASS 2건 그대로(**회귀 가드**, M5) ② 하위 파일의 게이트 대상 줄은 진입 파일에 같은 줄이 있을 때와 같은 판정이에요(0100b 통합). G1: tokens 진입점이 루트 선언 · 미설치면 PASS 가 아님. G2: 앱 선언 · 미설치면 게이트로 막지 않음(Q21, 진입 파일에 같은 줄이 있는 대조 fixture 와 TW4 `tailwind.config` · `globals.css` 판정 동일, 미설치는 dependencies WARN 이 알림). G3: PnP 루트 전용이면 PNP_ROOT_ONLY_NOTE 계열 안내(Q22). 브랜드 import(게이트 비대상)는 하위 파일에 있어도 진입 파일과 같은 규칙으로 인정 ③ 하위 파일의 컴포넌트 `@axis-ds/ui-react/tailwind.css` import 는 B1 · 버전 판정에 들어가요. K1(ui-react 선언, 설치본 1.4.0 이상): TW4 `tailwind.config` 가 진입 파일에 같은 줄이 있을 때와 같은 PASS. K2(설치본 1.4.0 미만 또는 미설치): 진입 파일에 같은 줄이 있을 때와 같은 버전 확인 WARN(PASS → WARN 전이가 생길 수 있음, 3절) | x5 · 새 fixture G1 · G2 · G3 · K1 · K2(각각 진입 파일에 같은 줄을 둔 대조 fixture 와 나란히) | ① 발행본 PASS 2건(측정) ② G1 은 펼침 전에는 하위 줄을 아예 못 봐서 WARN 이라 수정 없이 통과해요(**회귀 가드**). 펼친 줄이 게이트를 건너뛰는 변이 M8 이 거짓 PASS 를, 펼친 줄에 더 엄격한 게이트를 쓰는 변이 M13 이 G2 거짓 WARN 을 내는지로 확인. G1 · G2 · G3 은 미측정 ③ K1 · K2 발행본 출력은 미측정(하위 줄을 못 봐서 B1 누락 WARN 또는 PASS 로 추정) |
| **AC11** | **회귀 가드**: globalCss 키가 없거나 globalCss 와 첫 후보가 같은 파일인 프로젝트(C0 · c0n · 루트 단독 · x5)의 출력은 바이트 그대로. 기존 cli `template-check.test.ts` · mcp `template.test.ts` 는 plan 4절 목록만 기대가 바뀌어요(N1 의 brand 문구 전이는 예외 목록에 있음, N2 는 예외 아님). theme add 출력 바이트 불변(`theme-add.test.ts` · `brand-core.test.ts` 기대 변경 0) | 출력 diff 의 기준선은 단계별로 달라요(testplan 3절). 0100a 는 HEAD 18d0357 소스 빌드(또는 발행본 1.7.6), 0100b 는 WI-0097 머지 직후 HEAD(0100b 직전 커밋 SHA) 빌드와 비교해요. 발행본 1.7.6 과의 대조는 세 WI 를 합친 최종 재측정에만 써요. vitest 통과 수 | 수정 없이 통과. 변이 M1 · M5 · M7 이 이 가드를 빨갛게 만드는지로 유효성 확인 |
| **AC12** | CLI 와 MCP 가 같은 항목 · 심각도 · 문구 | 전 fixture 에서 CLI 항목 줄과 `mcp-call.mjs` 출력 정규화 diff 0 | 발행본도 동일(측정), 그래서 이 AC 는 신판에서 갈라지지 않는지를 봄 |
| **AC13** | init 이 기록한 globalCss 를 check 가 같은 파일로 판정(I1 · I2). init 코드는 바꾸지 않음(Q24) | `init -y` rc 와 config 의 globalCss, 이어서 check 판정 파일명 비교 | 발행본 I1 check rc 1 · I2 다른 파일(측정) |
| **AC14** | 문서: README `:98` · `:109` · `:116` 이 새 선택 규칙(globalCss 우선 · 상대 `@import` · 밖 경로 읽기)을 적어요. 소스의 판정 범위 서술(`tailwind-core.ts:1-33` 머리 주석의 globals 서술 · `:259` · `:343` · `:853` 「CSS 후보에서 처음 찾은 파일」, `project.ts:370-372`, `brand-core.ts:211-217` · `:290-292` 「findGlobalCss(FR-2 순서)로 고르므로」(cli · mcp 사본)) 갱신 | 범위 서술 문장을 전 트리 grep 해 낡은 문장 0 | 현재 README `:98` · `:109` 가 「처음 찾은 파일 하나」(읽어서 확인) |

## 3. 종료 코드 변화

- **1 → 0**: CSS 가 TAILWIND 후보 밖(`src/styles/globals.css` · 임의 이름)에만 있고 globalCss 가 그 파일을 가리키는 프로젝트(R2 · R3 · I1 측정 rc 1), globalCss 가 프로젝트 밖 파일인 프로젝트(mono/app1 측정 rc 1, Q25). init 이 `src/styles/globals.css` 를 기록한 프로젝트가 여기에 들어요.
- **0 → 1**: 없어요(추정). FAIL 은 「선택할 파일이 하나도 없음」뿐이고 헬퍼는 종전 후보를 그대로 뒤에 둬요(`tailwind-core.ts:389`). D10 은 globalCss 를 버리고 종전 후보로 가므로 종전과 같은 결과예요. AC3 · AC8 로 확인해요.
- **심각도만 바뀜(rc 불변)**: WARN → PASS(R1 · R4 · R5 · R6 · R7 · R8 · I2, 그리고 하위 파일에 컴포넌트 `tailwind.css` import 가 있어 B1 누락이 풀리는 K1 부류, 추정), PASS → WARN(R9, `template-check.test.ts:356` 류, 그리고 하위 파일의 컴포넌트 `tailwind.css` import 가 새로 버전 판정(`tailwind-core.ts:843-847`)에 걸리는 K2 부류, 추정 · 미측정). 표기만 붙음(x2). x4 는 파일명만 바뀜. brand 문구는 N1(`.css` 아닌 일반 파일)에서 바뀌고 N2(디렉터리)에서는 그대로(D10).

## 4. 잔여 오차

- globalCss 키가 없으면 두 후보 목록(D2)이 그대로라, 루트 `globals.css` 와 `app/globals.css` 가 함께 있는 프로젝트는 brand(app 우선)와 CSS 항목(루트 우선)이 계속 갈려요. globalCss 가 없는 파일을 가리킬 때도 같아요.
- 프로젝트 밖 진입 파일(Q25)의 상대 `@import` 는 프로젝트 경계(D3) 밖이라 펼치지 않아요. 모노레포 공유 CSS 가 다시 하위 파일을 import 하면 그 줄은 인정되지 않아요.
- 밖 진입 파일 안의 패키지 경로 줄(`@axis-ds/tokens/css/tailwind4` · brands)은 빌드 도구가 그 파일 위치(`shared/`) 기준으로 해석해요(착수 측정의 mono/app1 형태 실빌드: 설치본이 앱 아래에만 있으면 빌드 실패, 상위로 호이스팅하면 성공). 그래서 0100a 는 설치본이 앱 아래에만 있는 mono 형태에서 PASS 를 내도 실빌드는 깨지는 거짓 PASS 가 남아요. **WI-0097 2부로 이관(Q37)**: 그 파일 위치 기준 해석 게이트가 WARN 으로 처리해요. 0100a 코드는 바꾸지 않아요. 넘길 측정은 plan 「WI-0097 넘김 메모」예요.
- 심볼릭 링크로 연 앱(`--dir` 가 링크)에서 globalCss 가 밖 상대 경로(`../shared/globals.css` 류)이면 brand 와 CSS 항목의 판정 기준이 어긋날 수 있어요(앞 단계 검증이 넘긴 항목, 이번 단계에서 다시 재지 않음). 잔여로 둬요(Q38, release-notes 한계).
- 하위 파일의 create-next-app 기본 정의 · Arial 은 판정하지 않아요(D9, 거짓 초록 유지).
- `layer()` · `supports()` · media 조건이 붙은 `@import` 도 무조건 들어오는 것으로 봐요. alias(`@/` · `~/`) · CSS Modules 는 따라가지 않아요.
- Tailwind 4 · Next.js 가 상대 `@import` 를 실제로 펼쳐 토큰 · `tw-animate-css` 가 적용되는지, Tailwind 3 + Next 에서 postcss-import 없이 처리되는지는 미측정이에요. 구현 첫 단계에서 실빌드로 1회 재요(testplan 4절). 결과가 「적용 안 됨」이면 펼침(0100b)은 그 조합에서 근거로 쓰지 않도록 범위를 다시 정해요.
- 실제 사용자 프로젝트에서 루트 · app 두 파일이 공존하는 빈도는 데이터가 없어요.
