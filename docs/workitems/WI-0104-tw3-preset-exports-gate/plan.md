# WI-0104: Tailwind 3 preset · tokens 줄의 exports 해석 구현 계획

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | 기준: `main` e32275e | 상태: 권장안(Q130 ~ Q137)으로 구현 반영(2026-10-30), 사용자 확인 대기
> 배치 10 의 이웃 WI(WI-0102 Tailwind 4 PnP @source, WI-0096 설치 위치 안내)가 `tailwind-core.ts` 를 함께 건드릴 수 있어요. 고친 공용 함수는 2절에 이름으로 적었어요

## 1. 해석 모델 (실빌드 기준, testplan 2.2 · 2.4 측정)

### 1.1 Tailwind 3 설정 파일의 preset (`tailwindConfigImportResolution`)

Node 해석기(Tailwind 3.4.19 가 설정을 `require()` 로 읽고, 실패하면 jiti 로 다시 읽음)를 따라 아래 순서로 풀어요. 탐색 순서와 멈춤 규칙은 WI-0103 `resolveCssPackageImport` 와 같고, 조건 이름과 파일 후보만 달라요(그래서 본체를 `resolvePackageSubpath(fromDir, spec, conditions, candidates)` 로 나눴어요).

1. 설정 파일 디렉터리(`baseDir`)부터 루트까지 올라가며 `<dir>/node_modules/@axis-ds/tokens` 디렉터리를 찾아요
2. `package.json` 의 `exports` 가 참 값이면 그 설치본에서 끝나요. `./tailwind` 를 내보내지 않으면(조건이 맞지 않음 포함) `not-exported`
3. `exports` 가 없으면 `tailwind` · `tailwind.js` · `.json` · `.node` · `tailwind/index.*` 파일이 있을 때만 그 설치본에서 풀리고, 없으면 상위로 가요(측정: W-noexports rc 0, A-noexports rc 1)
4. Plug'n'Play 는 판정하지 않아요

조건(Q131, Node 22.22 측정):

| 참조 모양(주석 제거 뒤) | 맞는 조건 | 판정 |
|---|---|---|
| `require("@axis-ds/tokens/tailwind")`(CommonJS · `.mjs` 안의 require) | require · node · module-sync · default | 이 집합으로 `not-exported` 면 WARN |
| `import … from` · `import()` · `import "…"` | import · node · module-sync · default **또는** require · node · module-sync · default | 두 집합 모두 `not-exported` 일 때만 WARN |
| 둘 다 있음 | 각각 | 어느 하나라도 막히면 WARN |

판정은 `not-exported` 만 해요. `target-missing`(Q132) · `not-found`(Q133) · `unknown`(패턴 키 등) 은 `ok` 예요.

### 1.2 Tailwind 3 globals.css 의 tokens 줄 (`packageLineShadowIssue` 의 `tailwind3`)

Next 14 css-loader(`conditionNames: ["style"]`, webpack enhanced-resolve) 측정에서 그림자 미노출 · 조건 불일치(import 만 · require 만)는 rc 1, 대상 파일 없음 · exports 없음은 상위 설치본으로 풀려 rc 0 이었어요. 그래서 WI-0103 의 `cssPackageLineResolution`(조건 `style` · `default`)을 그대로 쓰고 결과 가운데 `shadow-not-exported` 만 WARN 으로 내요. 종전 판정(앱 기준 `tokensCssResolution`, 하위 파일은 그 디렉터리 기준 `outsideCssPackageResolution`, Q54)을 먼저 하고 통과했을 때만 봐요.

## 2. 고친 지점 (구현)

| 파일 | 함수 | 바뀐 것 |
|---|---|---|
| `packages/axis-registry-core/src/project.ts` | `resolveExportTarget` · `exportsTarget` | 조건 집합 인자를 받음(기본값은 종전 `CSS_EXPORT_CONDITIONS`, 기존 호출 결과 불변) |
| 같은 파일 | `resolveCssPackageImport` | 본체를 새 `resolvePackageSubpath` 로 옮기고 CSS 조건 · `cssFileCandidates` 로 부르는 얇은 함수가 됨(동작 불변, WI-0103 테스트 그대로 통과) |
| 같은 파일 | 새 `tailwindConfigImportResolution` · `JS_REQUIRE_CONDITIONS` · `JS_IMPORT_CONDITIONS` · `jsFileCandidates` | 1.1 모델 |
| 같은 파일 | `outsideCssPackageResolution` 주석 | Tailwind 3 앱 안 줄의 추가 판정 서술 |
| `packages/axis-registry-core/src/template/tailwind-core.ts` | `presetTokensUnresolvedMessage` | `code` 인자 추가, WI-0101 판정 뒤 `tailwindConfigImportResolution` 의 `not-exported` 를 WARN(공용 아님, 호출지 1곳) |
| 같은 파일 | 새 `PRESET_REQUIRE_REFERENCE` · `PRESET_IMPORT_REFERENCE` | 참조 모양 판독(`PRESET_REFERENCE` 를 둘로 나눈 것, 기존 정규식은 그대로) |
| 같은 파일 | `packageLineShadowIssue`(공용: Tailwind 4 tokens · 컴포넌트 줄도 씀) | `opts: { tailwind3?: boolean }` 추가. `tailwind3` 이면 `shadow-not-exported` 만 문구를 내고 할 일은 늘 「다시 설치하세요」. 인자를 주지 않는 기존 호출 2곳의 결과는 불변 |
| 같은 파일 | `judgeGlobalsCss` | Tailwind 3(또는 판정 불가) · 앱 안 파일이면 `tokensCssUnresolvedIssue` 의 `lineIssue` 로 위 함수를 넘김 |
| 같은 파일 | `checkTailwindSetup` | `presetTokensUnresolvedMessage` 에 주석 지운 소스를 넘김, docstring 갱신 |
| 같은 파일 | 머리 주석 | WI-0103 의 「Tailwind 3 은 종전」을 좁히고 WI-0104 단락 추가 |
| `packages/axis-cli/README.md` | check 절 | Tailwind 3 preset exports 단락 추가, 중첩 설치본 · globals.css 단락에 Tailwind 3 범위 추가 |

`tokensInstallPhrase` · `tokensCssUnresolvedIssue` · `tokensCssResolution` · `cssPackageLineResolution` 은 바꾸지 않았어요(WI-0096 과 겹치지 않게).

## 3. 안내 문구 (Q136, 구현)

| 갈래 | 문구 |
|---|---|
| preset 미노출 | `<설정 파일>에 AXIS preset 참조가 있지만 먼저 잡히는 <앱 상대 경로>(<버전 또는 「버전 모름」>)가 ./tailwind 를 내보내지 않아 해석되지 않습니다 → 그 node_modules 의 @axis-ds/tokens 를 지우거나 다시 설치하세요` |
| Tailwind 3 tokens 줄 그림자 미노출 | `<전역 CSS>에 <spec> import 가 있지만 그 줄이 있는 파일 위치에서 먼저 잡히는 <앱 상대 경로>(<버전>)가 <subpath> 를 내보내지 않아 해석되지 않습니다 → 그 중첩 node_modules 의 @axis-ds/tokens 를 지우거나 다시 설치하세요` + 하위 파일이면 ` (<파일> 의 import)` |

## 4. 회귀 범위 · 바뀐 기존 테스트

- 바뀐 기존 테스트 1건: cli `template-check.test.ts` 「WI-0103 exports 를 보는 패키지 해석 > 회귀 가드 > Tailwind 3: 하위 파일 쪽 tokens 그림자(미노출)는 종전 PASS(Q79)」 → WI-0104 부터 WARN 과 전체 문구를 기대(Q134). 그 밖의 cli 1165 · mcp 240 기존 테스트는 기대 변경 없이 통과
- 기존 테스트의 설치본 stub(`writeInstalledStub` 의 `{ name, version }`, WI-0103 `realPkg` 의 `./tailwind` 없는 exports)이 Tailwind 3 preset 판정에 걸리는지: `writeInstalledStub` 는 exports 가 없어 Q133 으로 종전, `realPkg` 를 쓰는 Tailwind 3 테스트는 위 1건뿐이고 globals.css 만 확인해요

## 5. 단계 (실행 기록)

1. 착수 측정: 발행본 189칸 + Next 10칸, 버전별 exports(testplan 2절)
2. 구현(2절), type-check
3. 수정본 재측정(testplan 3절)
4. 회귀 테스트(cli 12 · mcp 2), 바뀐 기존 테스트 1건
5. 음성 대조(HEAD 소스 복원) · 변이 6종(testplan 4 · 5절)
6. `pnpm turbo run type-check lint test --force`, `pnpm check-changeset-mcp-tokens`
