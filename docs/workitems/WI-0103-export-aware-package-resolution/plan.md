# WI-0103: exports 를 보는 패키지 CSS import 해석 구현 계획

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | 기준: `main` e103d43 | 상태: 사용자 결정 Q70 ~ Q79 반영 · 구현 반영(2026-10-29, 반박 검증 보정 포함)
> 줄 번호는 e103d43 기준이에요(2절 「구현」 열은 구현 뒤 함수 이름으로 적었어요). 배치 9 의 다른 WI 가 먼저 머지되면 다시 읽어요

## 1. 해석 모델 (실빌드 기준, testplan 2.2 측정)

Tailwind 4 의 CSS 해석기(`@tailwindcss/node` 4.1.14 → enhanced-resolve 5.26.0, `conditionNames: ["style"]` · `mainFields: ["style"]` · `extensions: [".css"]`)를 따라 아래 순서로 풀어요(`resolveCssPackageImport`). `spec` 은 `@axis-ds/tokens/css/tailwind4` · `@axis-ds/<ui-react|agentic-ui>/tailwind.css` 처럼 이름과 subpath 로 나눠요.

1. 시작 디렉터리(그 줄이 있는 CSS 파일의 실경로 디렉터리)부터 루트까지 올라가며 `<dir>/node_modules/<name>` 이 디렉터리인지 봐요
2. 디렉터리가 아니면 다음 상위로
3. `package.json` 을 읽어 `exports` 가 **참 값**이면 **그 설치본에서 끝나요**(`null` · `false` · `""` 는 exports 없음으로 봐요, enhanced-resolve `exportsField ? … : null`, 반박 검증 c01 ~ c03b)
   - subpath 키(`./css/tailwind4`)를 찾아요. 문자열 단축형 · 배열 · 조건 객체(키가 `.` 로 시작하지 않음)는 `"."` 만 가진 것으로 봐요
   - 값이 문자열이면 그 대상, 객체면 키 순서대로 `style` · `default`(Q70) 가운데 처음 맞는 키의 값(중첩 객체면 같은 규칙으로 다시, **맞는 키의 값이 `null` 이면 거기서 미노출**, 반박 검증 c22), 배열이면 앞에서부터 처음 풀리는 값, `null` 이면 미노출
   - 키가 없거나 맞는 조건이 없으면 **미노출**(`not-exported`)
   - 대상 · 대상에 `.css` 를 붙인 이름 · 대상 디렉터리의 `index.css` 가운데 파일이 없으면 **대상 파일 없음**(`target-missing`, 반박 검증 c07 · c08)
   - 있으면 **해석됨**(`resolved`, 그 파일)
4. `exports` 가 없거나 `package.json` 이 없으면 `<pkgDir>/<subpath>` · `.css` 를 붙인 이름 · 그 디렉터리의 `index.css` 를 파일로 봐요. 있으면 **해석됨**(그 설치본에서 끝), 없으면 **건너뛰고 상위로**(Q71)
5. 루트까지 못 찾으면 **없음**(`not-found`)
6. Plug'n'Play 는 해석기가 아니라 판정 쪽(`cssPackageLineResolution`)에서 `ok` 로 돌려요(종전처럼 판정하지 않음)

측정과의 대응(testplan 2.2): n0 · np0 → 4 의 건너뜀, nf · np → 4 의 해석됨, es · cs · cd → 3 의 해석됨, em → 대상 파일 없음, ex · ex0 · ci → 미노출. 패턴 키(`./css/*`) · 폴더 매핑(`./css/`) · `*` 가 든 대상 · `./` 로 시작하지 않는 대상은 발행된 AXIS 패키지에 없어(측정) 지원하지 않고 **판정 안 함(`unknown`)** 으로 돌려요(보수적 기본값, 실빌드가 실패하는 모양도 PASS 로 남는 한계, testplan 4절).

### 1.1 check 판정으로 옮기는 규칙 (`cssPackageLineResolution`)

해석 결과 `r`(줄 위치 기준)과 앱 기준 설치본 `app = findInstalledPackage(baseDir, name)` 을 함께 봐요. 프로젝트 밖 진입 파일의 줄은 이 표를 쓰지 않고 종전 `outsideCssPackageResolution`(Q37) 그대로예요.

| r | 조건 | 판정 | 결정 |
|---|---|---|---|
| `resolved` · `unknown` | - | `ok`(종전 다음 판정으로) | - |
| `not-exported` · `target-missing` | 잡힌 설치본 실경로 ≠ `app` 실경로(또는 `app` 없음) = 그림자 | **해석 불가 WARN**(그림자 문구) | Q72 (a) |
| `not-exported` · `target-missing` | 잡힌 설치본이 `app` 과 같은 실경로(pnpm 링크 포함) | `ok`(종전. 1.4.0 미만은 버전 WARN 이 알림, dist 미빌드 workspace 링크 보호) | Q72 (a) |
| `not-found` | `app` 있음 | `ok`(종전. 앱 안 파일은 늘 `app` 을 지나가므로 `app` 에 exports 도 파일도 없을 때(손상 · stub)뿐이에요. 구현 중 A/B 에서 stub fixture 거짓 WARN 으로 드러나 바꿨어요) | - |
| `not-found` | `app` 없음 · 같은 전역 CSS 의 다른 파일 디렉터리에서는 `resolved` | **해석 불가 WARN**(z5, 「설치본이 <경로> 에만 있음」) | Q74 (a) |
| `not-found` | 그 밖 | `ok`(Q28) | Q28 |
| Plug'n'Play | - | `ok` | - |

해석 시작 디렉터리는 그 줄이 있는 파일의 실경로 디렉터리예요. 하위 파일은 그 파일 디렉터리(Q54 와 같음), 앱 안 진입 파일은 진입 파일 디렉터리(Q73)이고, `cssDir`(프로젝트 밖 표지)의 뜻은 바꾸지 않았어요.

## 2. 고친 지점 (구현)

| 파일 · 함수 | 변경 |
|---|---|
| `packages/axis-registry-core/src/project.ts` `resolveCssPackageImport` · `cssPackageLineResolution`(새 export) | 1절 해석기와 1.1 표. 보조 `splitPackageSpec` · `resolveExportTarget` · `exportsTarget` · `cssFileCandidates` · `sameRealDir`(내부) |
| `project.ts` `outsideCssPackageResolution` | 동작 그대로, 주석만(이제 밖 진입 파일 · `tailwindcss` 줄 · Tailwind 3 에만 씀) |
| `project.ts` `findInstalledPackage` · `componentCssResolution` · `tokensCssResolution` | 바꾸지 않음(시그니처 · 동작 모두). theme add(`theme-add.ts:398`)가 쓰는 판정이 그대로예요(Q78) |
| `packages/axis-registry-core/src/template/tailwind-core.ts` `packageLineShadowIssue` · `isOutsideEntry` · `packageNameOfSpec` · `displayRel`(새 내부 함수) | 그림자 문구 3갈래(3절). 다른 파일 디렉터리 목록은 `expanded.files` 의 실경로 디렉터리 |
| `tailwind-core.ts` `tokensCssUnresolvedIssue`(내부) | 마지막 인자 `lineIssue` 콜백을 더함. 앱 기준 갈래 · `cssDir` 갈래는 그대로이고 둘을 통과하면 `lineIssue` 를 불러요 |
| `tailwind-core.ts` `judgeGlobalsCss` | Tailwind 4 이고 tokens 근거의 출처가 앱 안 파일이면 `lineIssue` 를 넘김, 그 밖(밖 진입 파일 · Tailwind 3)은 종전 호출. 레이아웃 JS import 갈래는 그대로 |
| `tailwind-core.ts` `tailwind4Issues` · `Tailwind4CssInput.lineIssue` | 컴포넌트 줄 있음 방향(5번 자리)에서 `lineIssue` 가 `false` 가 아니면 그 결과를, `false` 면 종전 `cssDirOf` 판정을 써요. `tailwindcss` 줄은 종전 |
| `tailwind-core.ts` `checkTailwindSetup` | `lineIssue` 클로저 전달(처음 나온 줄의 출처 파일이 앱 안이면 `packageLineShadowIssue`) |
| `expandGlobalCss` · `packageLineCssDir` | 바꾸지 않음(별도 필드 없이 `origin.path` 의 디렉터리를 씀, `template-check.test.ts:1516` 기대 불변) |
| 주석 | `tailwind-core.ts` 머리 주석 · `ExpandedCssFile.cssDir` · `tokensCssUnresolvedIssue` · `judgeGlobalsCss` · `tailwind4Issues` docstring, `project.ts` `outsideCssPackageResolution` |
| `packages/axis-cli/README.md` | 상대 `@import` 펼침 단락 · 5번 항목에 한 문장씩, 새 bullet 「중첩 설치본(그림자, 1.7.8 부터)」 |
| `.changeset/wi-0103-export-aware-package-resolution.md` | `@axis-ds/cli` patch + `@axis-ds/mcp` patch, 머리에 판정 전이 목록 |
| `packages/axis-cli/src/template/template-check.ts` · `packages/axis-mcp/src/tools/template.ts` | 변경 없음(같은 코어 함수를 부름, CLI = MCP) |

## 3. 안내 문구 (Q76, 구현)

앞머리 `<spec> import 가 있지만` 과 끝의 출처 접미사 「(<하위 파일> 의 import)」 · globalCss 표기 자리는 종전 틀 그대로예요. `<shadow>` 는 잡힌 설치본의 앱 상대 경로(pnpm 이면 스토어가 아니라 링크 경로), `<ver>` 는 그 package.json 버전(못 읽으면 「버전 모름」, WI-0097 문구와 같은 표현)이에요. 「이 파일」이 앞머리 진입 파일로 읽히지 않게 「그 줄이 있는 파일 위치에서」라고 적어요(반박 검증 1-b).

| 원인 | 문구 |
|---|---|
| 미노출 | `<spec> import 가 있지만 그 줄이 있는 파일 위치에서 먼저 잡히는 <shadow>(<ver>)가 <subpath> 를 내보내지 않아 해석되지 않습니다 → 그 중첩 node_modules 의 <name> 를 지우거나 1.4.0 이상으로 맞추세요`(그림자가 이미 1.4.0 이상이면 끝이 「… 를 지우거나 다시 설치하세요」, 반박 검증 1-a) |
| 대상 파일 없음 | `<spec> import 가 있지만 그 줄이 있는 파일 위치에서 먼저 잡히는 <shadow>(<ver>)에 내보낸 파일(<target>)이 없어 해석되지 않습니다 → 그 중첩 node_modules 의 <name> 를 지우거나 다시 설치하세요` |
| 이 위치에서 안 보임(z5) | `<spec> import 가 있지만 그 줄이 있는 파일 위치에서 <name> 를 찾지 못해 해석되지 않습니다(설치본이 <다른 위치>/node_modules/<name> 에만 있음) → 앱 또는 워크스페이스 루트에 설치하거나 이 줄(<그 줄이 있는 파일>)을 <설치본이 보이는 파일> 로 옮기세요` |

- 「1.4.0 이상」은 `TAILWIND4_MIN_AXIS_VERSION` 을 써요(문구에 리터럴을 두지 않음)
- 프로젝트 밖 진입 파일(Q37)은 `outsideCssUnresolvedIssue` 그대로예요(AC7)

## 4. 회귀 범위 · 바뀐 기존 테스트

| 대상 | 결과 | 확인 방법 |
|---|---|---|
| WI-0100b Q54 `template-check.test.ts:1502` s5 | 판정 WARN 그대로, 문구가 「미노출」 그림자 문구로 바뀜(기대 변경 1건, 계획한 유일한 전이) | 새 기대 |
| WI-0100b Q54 `:1511` s3c · s6 · `:1516` expandGlobalCss cssDir | 불변 | 그대로 통과 |
| WI-0097 Q37 행(cli `template-check.test.ts:4981-5012` · mcp `template.test.ts:1188`) | 불변 | 그대로 통과 |
| WI-0097 1부 · 2부 describe, 해석 헬퍼 단위 테스트 | 불변 | 그대로 통과 |
| theme add · 브랜드 | 불변(Q78) | testplan 7절 theme add A/B 348/348 |
| 기존 fixture 코퍼스 196개 | 그림자 fixture s3 · s5 · s7 만 바뀜 | testplan 7절 |

- 기존 테스트 기대는 s5 문구 1건만 바뀌었어요(cli 1096 건 가운데 이 1건만 빨강, testplan 7절). 그래서 WI-0100b 의 probe(2554 항목) 대신 이 결과와 fixture 코퍼스 A/B 를 근거로 썼어요(probe 는 미실시)
- 기준선은 착수 직전 HEAD 빌드 사본(f9785c2, 패키지 소스는 main e103d43 과 같음)이에요. 발행본 1.7.7 · 1.4.6 은 문제 재현 기준으로만 썼고, 기준선 출력은 발행본과 147칸 294/294 바이트 같아요

## 5. 단계 (실행 기록)

| 단계 | 내용 | 결과 |
|---|---|---|
| 0 | 사용자 결정 Q70 ~ Q79 반영 | prd 1.2 · 7절 |
| 1 | 미측정 축: Next 15 대표 4칸, pnpm 레이아웃 2칸 | testplan 2.5 · 2.6, 1절과 같음 |
| 2 | 기준선 고정 | testplan 7절 |
| 3 ~ 4 | 해석기 · 판정 · 문구, 새 describe 「WI-0103」 | a5aed60 + 보정 |
| 5 | main 소스에서 빨강 · 147칸 재측정 | testplan 7절 |
| 6 | 변이 · A/B · theme add A/B · turbo 게이트 | testplan 7절 |
| 7 | 반박 검증 3관점 · 보정 · 회귀 재검증 | testplan 6절 · 7절 |
