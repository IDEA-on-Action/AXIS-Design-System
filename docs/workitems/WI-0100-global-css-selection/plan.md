# WI-0100: check 의 전역 CSS 파일 선택 구현 계획

> PRD: [prd.md](./prd.md) | 같은 발행: WI-0097 · WI-0098 (cli 1.7.7 · mcp 1.4.6) | 순서: **0100a** → 0097 → **0100b**, 0098 병렬
> 줄 번호는 `main` 18d0357 기준이에요(`tailwind-core.ts` 1566줄). 앞 단계가 머지되면 줄이 밀리므로 착수 때 함수 이름으로 다시 찾아요.

## 1. 소유 원칙 (경계 보고서 1-2)

1. **0100 은 「어느 파일을 읽나」를 맡아요.** 진입 파일 선택과 상대 `@import` 펼침을 registry-core 공용 헬퍼로 만들어요.
2. 0097 은 「그 줄이 이 앱에서 해석되나」를 맡아요. 0100 은 해석 판정을 직접 하지 않고 0097 헬퍼를 불러요.
3. 0100 은 **상대 경로만** 펼쳐요. 패키지 경로 줄은 펼치지 않고 0097 헬퍼에 넘겨요.
4. 0098 은 content(`:1079-1354`)만 고쳐서 판정 코드가 겹치지 않아요. TW4 에서는 `inspectTailwindContent` 가 `null` 이에요.

## 2. 고칠 지점

### 2.1 0100a (파일 선택, 펼침 없음)

| 파일:줄 | 변경 |
|---|---|
| `packages/axis-registry-core/src/project.ts:374` 옆 | 새 헬퍼(예: `selectGlobalCss(baseDir, configured, candidates, { requireStylesheet })`). globalCss 우선(실재하는 일반 파일), 없으면 `candidates` 순, `configuredMissing` · `configuredRejected`(D10) 반환. 프로젝트 밖 경로는 읽기 허용(Q25). `requireStylesheet` 는 check 경로만 켬 |
| `project.ts:370-372` 주석 | 「brand 항목이 이 한 목록을 씀」 서술을 새 규칙으로 |
| `packages/axis-registry-core/src/template/tailwind-core.ts:950` `readAxisConfigLike` | globalCss 를 읽는 데 재사용(지금은 componentsDir 만, `:1427-1429`) |
| `tailwind-core.ts:353-389` `checkGlobalsCss` | `:355` 후보 루프를 헬퍼 결과 하나로. `:364-366` 레이아웃 폴백은 선택된 파일에 근거가 없을 때만(D11), FAIL(`:389`)은 선택 결과가 없을 때만. 표기 접미사. docstring `:341-352` · `:343` 갱신 |
| `tailwind-core.ts:862-897` `checkTailwindSetup` TW4 분기 | `:868` 루프를 헬퍼로. 표기 접미사. 문구 본문(`:891-895` pass)은 0097 소유라 0100a 는 파일명 · 접미사 자리만 바꿈 |
| `tailwind-core.ts:1424-1460` `checkAnimationPlugin` TW4 분기 | `:1443` `find` 를 헬퍼로. `pluginProblem`(`:1434-1440`)은 그대로 |
| `tailwind-core.ts:259` docstring | 「globals.css 항목과 같은 후보 · 순서」를 「globalCss 다음 후보」로 |
| `tailwind-core.ts:853` `checkTailwindSetup` docstring | 「CSS 후보에서 처음 찾은 파일」을 「선택 헬퍼가 고른 파일(globalCss 다음 후보)」로 |
| `tailwind-core.ts:1-33` 머리 주석의 globals 서술(`:21` · `:23` 부근) | 경계 보고서 1-1 표에서 0100 몫. 전역 CSS 선택 규칙(globalCss 우선 · 밖 경로 읽기 · 0100b 의 상대 `@import` 근거)을 한 줄로 더함. 0097 · 0098 도 같은 주석을 고치므로 3절 충돌 규칙을 따름 |
| `packages/axis-cli/src/theme/brand-core.ts:211-235` `findGlobalCss` | 헬퍼 위 얇은 래퍼(`GLOBAL_CSS_CANDIDATES`, `requireStylesheet` 끔). theme add(`theme-add.ts:424`) 동작 · `brand-core.test.ts:276-296` 기대 불변 |
| `brand-core.ts:294-300` `inspectBrandImport` | 헬퍼를 `requireStylesheet` 켜고 부름(D10 · AC8). 표기는 `configuredMissing` 그대로 + `configuredRejected`(`.css` 아닌 일반 파일만, 디렉터리는 종전 `configuredMissing`) |
| `brand-core.ts:290-292` `inspectBrandImport` docstring | 「`findGlobalCss`(FR-2 순서)로 고르므로 `axis theme add` 가 실제로 쓴 파일을 봅니다」는 헬퍼 전환 · D10 뒤에 거짓이 되므로 새 선택 규칙으로. cli · mcp 사본 동시 |
| `packages/axis-mcp/src/tools/brand-core.ts` | cli 원본을 `cp`(바이트 동일성 `brand-core.test.ts:6-15`) |
| `packages/axis-cli/src/template/template-check.ts:181` · `packages/axis-mcp/src/tools/template.ts:321` | `configuredRejected` 표기 갈래(brand). 세 CSS 항목의 표기는 코어 결과 문구에 들어가므로 호출지(`template-check.ts:41` · `:44` · `:65`, `template.ts:409` · `:412` · `:459`)는 시그니처가 같으면 변경 없음 |
| `packages/axis-mcp/src/tools/brand.ts:29` (변경 없음) | 경계 보고서 5절의 미확인 호출지. 읽어서 확인한 결과 `brand.ts:18-29` 는 `KEY_TOKENS` · `getBrand` · `listBrands` 등만 import 하고 `findGlobalCss` · `inspectBrandImport` 는 쓰지 않아요. 영향 없음. MCP 의 사용처는 `template.ts:451` `inspectBrandImport` 하나뿐이에요 |

### 2.2 0100b (상대 `@import` 펼침, 0097 머지 뒤)

| 파일:줄 | 변경 |
|---|---|
| `tailwind-core.ts:283-305` 옆 | 상대 `@import` 정규식(`"./x.css"` · `'../x.css'`, 주석 제외. 계획 당시의 `url(...)` · 뒤의 `layer()` · `supports()` 허용은 사용자 결정 Q50 · Q51 로 제외, 공백 없음 · 확장자 없음 · 다른 따옴표가 든 이름은 Q56 으로 포함)과 펼침 헬퍼. 프로젝트 안(실경로 기준) · 방문 집합 · 깊이 한도. 반환은 `{ entry, evidence, files, packageLines }`(근거 문자열과 진입 문자열 분리, 패키지 경로 줄은 출처 파일과 함께) |
| `tailwind-core.ts:297-305` · `:324-338` | 정규식은 0100, 해석(spec 가 앱에서 풀리는지)은 0097 헬퍼 호출 |
| `tailwind-core.ts:818-850` `tailwind4Issues` | 0097 단독 소유. 0100b 는 진입 문자열(결함 판정, D9)과 근거 문자열(있어야 할 줄, D8 ① 게이트 대상)을 나눠 넘기기만 함. 인자 모양은 0097 PR 에서 미리 합의. 근거 문자열에 하위 파일의 컴포넌트 `tailwind.css` import 가 들어가면 B1 누락(`:827-835`) · 버전 판정(`:843-847`)이 그 줄을 보므로 K1 · K2 전이(4절)가 생겨요 |
| `checkGlobalsCss` `:358-372` | tokens CSS import · `--axis-*` 근거는 근거 문자열, `:371` Arial 판정은 진입 문자열만. 하위 파일 근거면 D6 접미사 |
| `checkTailwindSetup` `:871-893` | `hasTailwindImport` 는 근거 문자열, `tailwind4Issues` 에 두 문자열 |
| `checkAnimationPlugin` `:1444-1447` | 줄 판정은 근거 문자열(`pluginProblem` 이 이미 설치를 게이트함) |
| `brand-core.ts:241` `findBrandImports` 호출(`:300` 이하) | 브랜드 import 도 펼친 근거에서(D5). 브랜드 import 는 **게이트 비대상**(D8 ②)이라 0097 해석 게이트를 부르지 않고, 진입 파일과 같은 규칙으로 위치만 펼친 근거에서 찾음. cli · mcp 사본 동시 |

### 2.3 문서 (0100a · 0100b 마지막 커밋)

- `packages/axis-cli/README.md:98` · `:109` · `:116`: 「처음 찾은 파일 하나」 · 후보 순서 서술을 「globalCss(프로젝트 밖도 읽기만) → 후보, 상대 `@import` 근거 인정」으로. `:109` 는 0097 도 고쳐서 마지막에 머지하는 쪽이 전체를 다시 읽어요. `:49` · `:86` 은 목록을 통합하지 않으므로(D2) 그대로예요.
- 범위를 서술한 문장을 고치기 전에 전 트리를 grep 해요(`처음 찾은`, `같은 후보`, `TAILWIND_CSS_CANDIDATES`, `이 한 목록`, `FR-2 순서`, `실제로 쓴 파일`). 2.1 의 docstring 행(`tailwind-core.ts:1-33` · `:259` · `:343` · `:853`, `project.ts:370-372`, `brand-core.ts:211-217` · `:290-292`)이 최소 대상이에요.
- `packages/axis-cli/src/theme/index.ts:353` 하드코딩 후보 안내는 목록을 통합하지 않으므로 고치지 않아요.

## 3. 다른 WI 와의 순서 · 충돌 지점

| 단계 | 내용 | 이유 |
|---|---|---|
| 1 | 0100a | 0097 이 쓸 입력 구조(선택된 파일 하나 + 표기)를 먼저 고정해요 |
| 2 | 0097 | 해석 게이트 · B1 양방향 · globals 게이트. 0100a 의 폴백 위치 위에 게이트를 붙여요(경계 보고서 1-3) |
| 3 | 0100b | 게이트 없이 펼치면 하위 파일의 패키지 줄이 해석 여부 없이 PASS 가 돼요(거짓 PASS) |
| 병렬 | 0098 | 별도 worktree, 2단계 뒤 rebase |
| 뒤 | WI-0095 | 이 묶음 발행 뒤(init 안내, Q24) |

텍스트 충돌이 남는 자리:
- `tailwind-core.ts` 머리 주석 `:1-33`(0097 `:12-14` · `:24-26`, 0098 `:28-31`). 각자 고치고 마지막에 머지하는 쪽이 전체를 다시 읽어요.
- `project.ts`(0097 해석 상태 헬퍼, 0098 unplugged 헬퍼)와 함수는 갈리지만 import 블록 · 인접 줄 충돌이 나요.
- `packages/axis-cli/src/template/template-check.test.ts`: 0100 `:230-410`, 0097 `:922-940` · `:1122-1134` · `:2572-2586`, 0098 `:2129-2214`.
- `packages/axis-cli/src/theme/theme-add.ts` import 블록(`:35-45`)을 0097 · 0098 이 고쳐요. 0100 은 theme-add.ts 를 고치지 않아요(래퍼가 `findGlobalCss` 이름을 유지).
- changeset: 이 검사(`scripts/check-changeset-mcp-tokens.mjs:131-139`)는 미발행 changeset 전체를 세므로, PR 마다 자기 changeset 이 있는지는 리뷰에서 따로 봐요.

## 4. 바뀔 기존 테스트 (착수 전 고정)

조사 · 검증이 준 후보예요. 구현 첫 단계에서 A/B probe(같은 테스트 fixture 에 HEAD 사본과 수정본의 `checkGlobalsCss` · `checkTailwindSetup` · `checkAnimationPlugin` · `inspectBrandImport` 를 함께 돌림)로 전이를 전수 기록하고, 이 목록 밖 전이가 나오면 구현을 멈추고 근거를 적어요.

| 테스트 | 예상 전이 | 근거 |
|---|---|---|
| `packages/axis-cli/src/template/template-check.test.ts:356` 「탐색은 FR-2 순서 … 기존 globals.css 항목은 루트 우선 그대로」 | `results[2]` 가 루트 PASS → `app/globals.css` 자체 변수 WARN. 제목의 「루트 우선 그대로」도 바뀜 | 코드 읽기(D1, R9 부류) |
| 같은 파일 `:347` 「globalCss 가 없는 파일 … 다른 후보도 없음」 | brand 만 단언. globals.css FAIL 에 표기가 붙지만 단언 밖이면 기대 불변 | 착수 때 확인 |
| 같은 파일 `:368` · `:386` app-init(globalCss `./src/app/globals.css` 없음) | `results[5]` · `[6]` 만 단언. 세 항목에 표기가 붙지만 단언 밖이면 기대 불변 | 착수 때 확인 |
| 같은 파일 T4-1 「app-init: runCheck 출력이 정정 전과 줄 단위로 같음(의도한 변경 제외)」(`INTENDED["app-init"]`, 0100a 브랜치 `:127-134`) | globals.css 줄 끝에 「 (globalCss ./src/app/globals.css 없음)」. 기대 기준선(`INTENDED`)에 그 한 줄을 반영 | **사유: Q35**(사용자 결정, 2026-10-28). 동결 기준선 fixture 의 globalCss 가 없는 파일이라 AC3 표기가 붙음 |
| 같은 파일 T4-1 「app-init: collectCheckResults 의 이름 · severity · 문구가 기대 출력 줄과 같음」 | 위와 같은 한 줄(같은 `INTENDED` 를 씀) | **사유: Q35** |
| 같은 파일 `:62` · `:230-347` (globalCss=`./app/globals.css` + 같은 파일) | 전이 없음(첫 후보와 같은 파일) | 회귀 가드 |
| `packages/axis-mcp/src/tools/template.test.ts:150` · `:162` (globalCss `./src/app/globals.css` 없음) | brand 만 단언, 표기는 단언 밖 | 착수 때 확인 |
| `template.test.ts:41` (globalCss=`./globals.css` + 루트 파일) | 전이 없음 | 회귀 가드 |
| `packages/axis-cli/src/theme/brand-core.test.ts:276-296` `findGlobalCss` | 전이 없음(래퍼가 종전 규칙) | AC11 |
| `packages/axis-cli/src/theme/theme-add.test.ts:176` · `:310` · `:353` · `:368` | 전이 없음(theme add 바이트 불변) | AC7 · AC8 · AC11 |
| 새 fixture N1 의 brand(globalCss=`./package.json`) | 종전 `package.json` 을 골라 판정 → 후보 `app/globals.css` + `configuredRejected` 표기. 기존 테스트에는 이 형태가 없어 기대 변경은 0, AC11 예외 목록에만 올림 | D10 |
| (기존 테스트 없음) globalCss 키 없음 + 후보 이름의 디렉터리(루트 `globals.css/`) | CSS 3항목: 예외(`EISDIR`, check 중단) → 그 후보를 건너뛰고 다음 후보 판정. 기존 테스트에는 이 형태가 없어 기대 변경은 0, AC11 예외 목록에만 올림. 회귀 테스트 1건 추가(cli 「WI-0100a 전역 CSS 선택」) | 구현 검증에서 발견(후보 판정 `existsSync` → 일반 파일 확인), fixture d-rootdir · verify-dirfx 실측 |
| 새 fixture N2 의 brand(globalCss=`./app`) | 전이 없음(종전 「(globalCss ./app 없음)」 그대로) | D10 |
| 새 fixture K1 · K2(하위 파일의 `@axis-ds/ui-react/tailwind.css` import, 0100b) | K1: B1 누락 WARN → PASS 가능. K2: PASS 또는 B1 누락 WARN → 버전 확인 WARN(PASS → WARN 가능) | 코드 읽기(`tailwind-core.ts:827-847`), 추정 · 미측정 |

## 4-1. WI-0097 넘김 메모 (Q37)

프로젝트 밖 진입 파일(Q25)의 패키지 import 가 그 파일 위치 기준으로 해석되지 않을 때의 거짓 PASS 는 WI-0097 2부의 해석 게이트가 WARN 으로 처리해요. 0100a 코드는 바꾸지 않아요. WI-0097 이 이어받을 측정:

| 형태 | 실빌드 결과 | 0100a check |
|---|---|---|
| mono/app1 형태: 앱 `app1/` 의 globalCss=`../shared/globals.css`, shared CSS 가 `@axis-ds/tokens/css/tailwind4` · brands 를 import, 설치본은 `app1/node_modules` 에만(`shared/node_modules` 없음) | 빌드 실패(패키지 import 를 `shared/` 기준으로 풂) | PASS(거짓 PASS, 0097 게이트가 WARN 으로 바꿀 대상) |
| 같은 CSS, 설치본을 상위(`mono/node_modules`)로 호이스팅 | 빌드 성공 | PASS |

- 출처: 0100a 착수 측정의 실빌드(작업 디렉터리 `$S/WI-0100a/build/mono` · `build/mono-hoist`, 산출 CSS 는 양성 대조군(진입 CSS 가 앱 안)의 `build/out-inside.css` 와 호이스팅 경우의 `build/out-hoist.css` 이고, 실패한 밖 진입 파일 경우는 산출물이 없어요. 측정 조건은 next build 가 아니라 앱의 `@tailwindcss/postcss` 를 `scripts/pcss.cjs` 로 직접 부른 것이에요. WI-0097 2부도 같은 방법으로 A/B 해요). 이 문서를 고친 단계에서 다시 빌드하지 않았어요(넘김용 기록).
- 게이트가 볼 기준: 패키지 줄의 해석 기준 디렉터리는 앱(baseDir)이 아니라 **진입 CSS 파일이 있는 디렉터리**예요. 0097 은 밖 진입 파일에서 이 기준으로 해석을 판정해 위 첫 행을 WARN, 둘째 행을 PASS 로 가르는지 A/B 로 확인해요.

## 5. 구현 단계

1. 착수 측정: 4절 A/B probe 로 기준선 고정, 발행본으로 A1 · E1~E5 · N1 · N2 fixture 의 고치기 전 출력 재현, 실빌드 1회(testplan 4절, mono/app1 형태 포함).
   - 기준선은 단계별이에요(testplan 3절). 0100a 는 HEAD 18d0357 소스 빌드(또는 발행본 1.7.6)와, 0100b 는 WI-0097 머지 직후 HEAD(0100b 직전 커밋 SHA) 빌드와 비교해요. 0100b 착수 때 그 SHA 를 testplan 7절에 적어요.
2. 0100a 헬퍼 · 세 항목 · brand 래퍼 · `cp` · 표기. 새 테스트를 HEAD 소스에 돌려 빨강 확인.
3. 0100a PR(changeset 1개: cli patch + mcp patch). 머지.
4. 0097 머지 뒤 0100b 펼침 · 근거 분리 · 0097 게이트 호출. 새 테스트 빨강 확인 · 변이.
5. 0100b PR(changeset 1개, 같은 두 패키지). README · docstring.
6. 세 WI 머지 뒤 Version PR 하나로 cli 1.7.7 · mcp 1.4.6 발행(Master). 발행본으로 전 fixture 재측정 · CLI · MCP 대조.
