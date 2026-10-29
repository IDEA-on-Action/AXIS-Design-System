# WI-0103: exports 를 보는 패키지 CSS import 해석 구현 계획

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | 기준: `main` e103d43 | 상태: 초안(사용자 결정 Q70 ~ Q79 권장안 기준, 결정 뒤 고침)
> 줄 번호는 e103d43 기준이에요. 배치 9 의 다른 WI 가 먼저 머지되면 착수 때 다시 읽어요

## 1. 해석 모델 (실빌드 기준, testplan 2.2 측정)

Tailwind 4 의 CSS 해석기(`@tailwindcss/node` 4.1.14 → enhanced-resolve 5.26.0, `conditionNames: ["style"]` · `mainFields: ["style"]` · `extensions: [".css"]`)를 따라 아래 순서로 풀어요. `spec` 은 `@axis-ds/tokens/css/tailwind4` · `@axis-ds/<ui-react|agentic-ui>/tailwind.css` 처럼 이름과 subpath 로 나눠요.

1. 시작 디렉터리(그 줄이 있는 CSS 파일의 실경로 디렉터리)부터 루트까지 올라가며 `<dir>/node_modules/<name>` 이 디렉터리인지 봐요
2. 디렉터리가 아니면 다음 상위로
3. `package.json` 을 읽어 `exports` 가 있으면(`undefined` 가 아니면) **그 설치본에서 끝나요**
   - subpath 키(`./css/tailwind4`)를 찾아요. 문자열 단축형(`"exports": "./x.css"`)은 `"."` 만 가진 것으로 봐요
   - 값이 문자열이면 그 대상, 객체면 키 순서대로 `style` · `default`(Q70) 가운데 처음 맞는 키의 값(중첩 객체면 같은 규칙으로 다시), 배열이면 앞에서부터 처음 풀리는 값, `null` 이면 미노출
   - 키가 없거나 맞는 조건이 없으면 **미노출**(`not-exported`)
   - 대상 파일이 없으면 **대상 파일 없음**(`target-missing`)
   - 있으면 **해석됨**(`resolved`, 그 파일)
4. `exports` 가 없거나 `package.json` 이 없으면 `<pkgDir>/<subpath>` 와 `.css` 를 붙인 이름을 파일로 봐요. 있으면 **해석됨**(그 설치본에서 끝), 없으면 **건너뛰고 상위로**(Q71)
5. 루트까지 못 찾으면 **없음**(`not-found`)
6. Plug'n'Play(`isPnpProject`)는 판정하지 않음(`unknown`, 종전)

측정과의 대응(testplan 2.2): n0 · np0 → 4 의 건너뜀, nf · np → 4 의 해석됨, es · cs · cd → 3 의 해석됨, em → 대상 파일 없음, ex · ex0 · ci → 미노출. 패턴 키(`./css/*`)는 발행된 AXIS 패키지에 없어(측정) 지원하지 않고 「미노출」로 보지 않게 **판정 안 함(`unknown`)** 으로 돌려요(보수적 기본값). 디렉터리 subpath(`style` 필드 · `index.css`)도 같은 이유로 `unknown` 이에요.

### 1.1 check 판정으로 옮기는 규칙

해석 결과 `r`(줄 위치 기준)과 앱 기준 설치본 `app = findInstalledPackage(baseDir, name)` 을 함께 봐요.

| r | 조건 | 판정 | 결정 |
|---|---|---|---|
| `resolved` | - | 해석됨(종전 다음 판정으로) | - |
| `not-exported` · `target-missing` | 잡힌 설치본 실경로 ≠ `app` 실경로(또는 `app` 없음) = 그림자 | **해석 불가 WARN**(그림자 문구) | Q72 (a) |
| `not-exported` · `target-missing` | 잡힌 설치본이 `app` 과 같음 | 종전(판정하지 않음. 1.4.0 미만은 버전 WARN 이 알림, dist 미빌드 workspace 링크 보호) | Q72 (a) |
| `not-found` | `app` 있음 · 줄 파일이 프로젝트 밖 | 종전 Q37 문구 WARN(바이트 그대로) | Q37 |
| `not-found` | `app` 있음 · 줄 파일이 프로젝트 안 | 해석 불가 WARN(「이 위치에서 보이지 않음」 문구). 측정 147칸에서는 나오지 않는 경우(앱 안 파일은 늘 앱 루트 `node_modules` 를 지나감) | - |
| `not-found` | `app` 없음 · 같은 패키지가 다른 줄 위치(진입 파일 디렉터리 · 다른 하위 파일 디렉터리)에서는 `resolved` | 해석 불가 WARN(z5, 「이 위치에서 보이지 않음」 문구) | Q74 (a) |
| `not-found` | 그 밖 | 종전(판정하지 않음, Q28) | Q28 |
| `unknown` | - | 종전 | - |

해석 시작 디렉터리는 하위 파일이면 그 파일 디렉터리(Q54 그대로), 진입 파일이면 프로젝트 밖은 그 디렉터리(Q37 그대로) · **앱 안은 진입 파일 디렉터리**(Q73)예요.

## 2. 고칠 지점

| 파일:줄 | 변경 |
|---|---|
| `packages/axis-registry-core/src/project.ts:739-744` `outsideCssPackageResolution` | 새 해석기 `resolveCssPackageImport(fromDir, spec)`(1절 1 ~ 6, 결과에 잡힌 설치본 디렉터리 · 버전 · subpath 를 담음)를 옆에 두고, 이 함수는 1.1 표를 돌려주는 래퍼로 바꿈. 이름 · 반환 타입은 구현 때 확정(`OutsideCssResolution` 에 그림자 갈래를 더하거나 새 타입). 호출지 3곳은 아래 |
| `project.ts:575-595` `findInstalledPackage` | 바꾸지 않음(설치 여부 판정용 호출지 7곳: `init.ts:241` · `dependencies-core.ts:114` · `tailwind-core.ts:265` · `:923` · `:1203` · `:1814` · `:2138`, 그리고 `componentCssResolution` `:672` · `tokensCssResolution` `:718`). 그림자 판정의 「앱 기준 설치본」으로만 같이 씀 |
| `project.ts:659-690` `componentCssResolution` · `:709-720` `tokensCssResolution` | 바꾸지 않음(theme add `theme-add.ts:398` 이 같은 함수를 씀, Q78) |
| `packages/axis-registry-core/src/template/tailwind-core.ts:504-559` `expandGlobalCss` | `CssPackageLine` · `ExpandedCssFile` 에 해석 시작 디렉터리(가칭 `resolveDir`)를 더함: 하위 파일은 그 디렉터리, 진입 파일은 `entryCssDir ?? dirname(entryReal)`. `cssDir`(프로젝트 밖 표지)는 뜻을 바꾸지 않아 `template-check.test.ts:1516` 기대 불변 |
| `tailwind-core.ts:630-634` `packageLineCssDir` | `resolveDir` 를 돌려주는 짝 함수를 더함. 프로젝트 밖 여부는 종전 `cssDir` 로 가름 |
| `tailwind-core.ts:693-695` `outsideCssUnresolvedIssue` | 그대로(Q37 문구). 옆에 그림자 문구 함수(3절)를 더함 |
| `tailwind-core.ts:710-727` `tokensCssUnresolvedIssue` | `:722` 의 `cssDir !== undefined && …` 를 1.1 표로 바꿈. 앱 기준 갈래(`:716-721`)는 그대로. 호출지 `:785`(하위 · 진입 파일 줄)만 새 시작 디렉터리를 넘기고, `:796`(레이아웃 JS import)은 앱 기준 그대로(번들러가 풀어서 이 모델 밖) |
| `tailwind-core.ts:1268-1316` `tailwind4Issues` | `:1308-1313` 컴포넌트 줄 있음 방향의 위치 판정을 1.1 표로. `:1279` `tailwindcss` 줄은 종전(Q78). `Tailwind4CssInput.cssDirOf`(`:1319-1326`)에 시작 디렉터리 조회를 더함 |
| `tailwind-core.ts:1387-1420` `checkTailwindSetup` · `:747-765` `checkGlobalsCss` | 호출 인자만(`:1419` 에 시작 디렉터리 조회 전달). Tailwind 3 감지 프로젝트는 종전 경로(Q79) |
| `tailwind-core.ts:1-60` 머리 주석 · `:1255-1267` `tailwind4Issues` docstring · `:703-709` · `project.ts:724-738` 주석 | 「처음 만난 설치본 · 파일 존재만」 서술을 새 모델로. 범위를 바꾸는 커밋에서 같이 고치고 전 트리 grep 대조(「이 파일 위치에서」 · 「중첩 node_modules」 · 「Q54」) |
| `packages/axis-cli/README.md:107` | 하위 파일 · 앱 안 진입 파일의 그림자 판정 한 문장(AC11) |
| `.changeset/` | `@axis-ds/cli` patch + `@axis-ds/mcp` patch(registry-core 변경) |
| `packages/axis-cli/src/template/template-check.ts:41 · 44`, `packages/axis-mcp/src/tools/template.ts:412 · 415` | 변경 없음(같은 코어 함수를 부름, CLI = MCP) |

## 3. 안내 문구 초안 (Q76, 결정 전)

앞머리 `<spec> import 가 있지만` 과 끝의 출처 접미사 「(<하위 파일> 의 import)」 자리는 종전 틀 그대로예요. `<shadow>` 는 잡힌 설치본의 앱 상대 경로, `<ver>` 는 그 package.json 버전(못 읽으면 「버전 모름」)이에요.

| 원인 | 문구 |
|---|---|
| 미노출 | `<spec> import 가 있지만 이 파일 위치에서 먼저 잡히는 <shadow>(<ver>)가 <subpath> 를 내보내지 않아 해석되지 않습니다 → 그 중첩 node_modules 의 <name> 을 지우거나 1.4.0 이상으로 맞추세요` |
| 대상 파일 없음 | `<spec> import 가 있지만 이 파일 위치에서 먼저 잡히는 <shadow>(<ver>)에 내보낸 파일(<target>)이 없어 해석되지 않습니다 → 그 중첩 node_modules 의 <name> 을 지우거나 다시 설치하세요` |
| 이 위치에서 안 보임(z5) | `<spec> import 가 있지만 이 파일 위치에서 <name> 를 찾지 못해 해석되지 않습니다(설치본이 <다른 위치>/node_modules 에만 있음) → 앱 또는 워크스페이스 루트에 설치하거나 이 줄을 <그 위치의 파일> 로 옮기세요` |

- 「1.4.0 이상」은 `TAILWIND4_MIN_AXIS_VERSION` 을 써요(문구에 리터럴을 두지 않음)
- 프로젝트 밖 진입 파일(Q37)은 `outsideCssUnresolvedIssue` 그대로예요(AC7)

## 4. 회귀 범위 · 바뀔 기존 테스트

| 대상 | 예상 | 확인 방법 |
|---|---|---|
| WI-0100b Q54 `template-check.test.ts:1502` s5 | 판정 WARN 그대로, 문구가 「미노출」 그림자 문구로 바뀜(기대 변경) | 새 기대로 고치고 변경 사유를 testplan 7절에 |
| WI-0100b Q54 `:1511` s3c · s6 | s6(exports 없음 · 파일 있음)은 그림자 파일로 해석 → PASS 그대로. `nested` 헬퍼에 s3(n0) 행을 더하면 WARN → PASS(새 테스트) | 불변 · 새 행 |
| `:1516` expandGlobalCss cssDir | 불변(2절, `resolveDir` 를 따로 둠) | 그대로 통과 |
| WI-0097 Q37 행(cli `template-check.test.ts:4981-5012` · mcp `template.test.ts:1188`) | 불변(밖 진입 파일 문구 · 판정). `:5001`「globalCss 가 앱 안 파일이면 앱 기준 그대로 PASS」는 Q73 뒤에도 진입 파일 디렉터리에서 앱 루트 설치본으로 풀려 PASS 그대로 | 바이트 대조 |
| WI-0097 1부 · 2부 describe, `componentCssResolution` · `tokensCssResolution` 단위 테스트 | 불변 | A/B probe |
| theme add(`theme-add.ts:398`) · 브랜드(`brand-core.ts:314`, cli · mcp) | 불변(Q78) | 4.2 의 theme add A/B, 브랜드 항목 줄 대조 |
| dependencies · init · content 판정(`findInstalledPackage` 호출지) | 불변(함수를 바꾸지 않음) | A/B probe |

- A/B probe: WI-0100b 와 같은 방법(기존 테스트 코퍼스 2554 항목의 check 결과를 기준선 빌드 · 수정본 빌드로 각각 모아 비교, `$S/WI-0100b/probe`). 기대 전이는 위 표의 s5 문구 1건뿐이에요. 양성 대조는 그림자 갈래를 끈 변이 빌드로 probe 가 전이를 잡는지 확인해요(계측이 살아 있다는 증거)
- 기준선은 **착수 직전 HEAD 빌드 사본**이에요(배치 9 다른 WI 의 변경이 섞이지 않게 SHA 를 testplan 7절에 기록). 발행본 1.7.7 · 1.4.6 은 문제 재현(음성 대조) 기준으로만 써요

## 5. 단계

| 단계 | 내용 |
|---|---|
| 0 | 사용자 결정 Q70 ~ Q79 반영(prd 7절 · 이 문서 · testplan 기대값) |
| 1 | 미측정 축 측정: Next 15 대표 4칸, pnpm 심볼릭 링크 레이아웃 1칸(prd 4절). 결과가 1절과 다르면 모델을 고친 뒤 진행 |
| 2 | 기준선 HEAD 빌드 사본 · SHA · cli/mcp vitest 파일별 통과 수 고정 |
| 3 | `resolveCssPackageImport` + 단위 테스트(11상태 × 조건부 · 배열 · 문자열 단축형 · 패턴 `unknown`), cli `template-check.test.ts` 새 describe 「WI-0103」(registry-core 는 테스트 스크립트가 없음) |
| 4 | 1.1 표 래퍼 · `expandGlobalCss` 시작 디렉터리 · `tokensCssUnresolvedIssue` · `tailwind4Issues` 연결, 문구 함수 |
| 5 | 새 테스트를 HEAD 소스에 돌려 빨강, 수정본 초록. testplan 2절 147칸을 수정본 CLI · MCP 로 재측정 |
| 6 | 변이(testplan 5절) · A/B probe · theme add A/B · `pnpm turbo run build type-check lint --force` |
| 7 | 주석 · README · changeset, 범위 서술 grep 대조 |
