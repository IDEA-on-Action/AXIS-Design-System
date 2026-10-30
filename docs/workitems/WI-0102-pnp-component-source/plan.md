# WI-0102: Plug'n'Play zip 안의 컴포넌트 tailwind.css 판정 구현 계획

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | 기준: `main` e32275e | 상태: 권장안 Q120 (a) · Q122 (a) · Q125 (a) 로 구현(2026-10-30), 사용자 결정 대기

## 1. 판정 모델

`pnpComponentSourceHidden(baseDir, name, range)`(registry-core `project.ts`, `range` 는 앱 선언 범위):

1. Plug'n'Play 가 아니면(`isPnpProject` 거짓) `false`
2. 범위가 `workspace:` · `portal:` · `link:` 로 시작하면 `false`(설치본이 실제 디렉터리)
3. 범위를 읽을 수 있으면 그 범위로, 읽지 못하면(`versionSatisfiesRange` 가 `undefined`: `npm:` 별칭 · `file:` · git 등) `*` 로 `findPnpUnpluggedPackages`(WI-0098)를 불러, 찾으면 `false`
4. 그 밖은 `true`(zip 안에만 있음)

`.pnp.cjs` · zip 은 읽지 않아요(WI-0098 Q23 과 같음). 판정 근거는 설정이 아니라 결과예요(Q122).

## 2. 바뀌는 곳

| 파일 | 함수 · 위치 | 내용 |
|---|---|---|
| `packages/axis-registry-core/src/project.ts` | `findPnpUnpluggedPackages` 바로 뒤 | `PNP_REAL_DIR_RANGE` · `pnpComponentSourceHidden` · `pnpUnplugSetupPhrase` 추가. `componentCssResolution` 주석의 `app` 갈래에 「해석과 스캔은 다름」 한 줄 |
| `packages/axis-registry-core/src/template/tailwind-core.ts` | `tailwind4Issues` | 줄 없음 루프: `r.kind === "app"` 이고 숨겨졌으면 `componentCssPnpMissingIssue` 를 해석 불가 묶음(`unresolvedMissing`)에 넣음. 줄 있음 루프: `componentCssPresentIssue` 다음, WI-0103 `lineIssue` 앞에서 `componentCssPnpPresentIssue` 를 넣고 다음 패키지로 |
| 같은 파일 | `componentCssMissingIssue` 앞 | `PNP_ZIP_SOURCE_NOTE` · `componentCssPnpMissingIssue` · `componentCssPnpPresentIssue` 추가. 머리 주석 WI-0097 단락의 「앱 선언은 종전 그대로」에 WI-0102 예외, WI-0102 단락 추가, `tailwind4Issues` 주석에 두 방향 서술 |
| `packages/axis-cli/README.md` | check 절 2번 · 5번 | 1.7.9 부터의 동작 |
| `docs/guides/troubleshooting.md` | 2절(Tailwind 4) | PnP zip 한 줄 + 루트 `dependenciesMeta` 예시 |
| `.changeset/wi-0102-pnp-component-source.md` | 새 파일 | cli · mcp patch(registry-core 변경) |

WI-0104(Tailwind 3 preset)와 WI-0096(설치 위치 안내)이 고치는 함수는 건드리지 않아요. Tailwind 4 판정 코드에서 바꾼 함수는 `tailwind4Issues` 하나예요.

## 3. 문구

| 방향 | 문구(`<p>` 는 패키지 이름) |
|---|---|
| 줄 없음 | `<p> 의 tailwind.css 는 Plug'n'Play 에서 @source "./dist" 가 .yarn/cache zip 안을 가리켜 컴포넌트 클래스가 생성되지 않습니다 → Plug'n'Play 루트(.pnp.cjs 가 있는 곳) package.json 의 dependenciesMeta 에 "<p>": { "unplugged": true } 를 두고 yarn install 뒤 @import "<p>/tailwind.css";` |
| 줄 있음 | `<p>/tailwind.css import 가 있지만 Plug'n'Play 에서 @source "./dist" 가 .yarn/cache zip 안을 가리켜 컴포넌트 클래스가 생성되지 않습니다 → Plug'n'Play 루트(.pnp.cjs 가 있는 곳) package.json 의 dependenciesMeta 에 "<p>": { "unplugged": true } 를 두고 yarn install 하세요` |

- 두 패키지가 모두 걸리면 패키지마다 한 문제씩 ` / ` 로 이어요(종전 해석 불가 묶음과 같은 자리)
- 버전 안내(`tailwind4VersionNote`)는 종전처럼 문구 끝에 붙어요(범위를 읽지 못하는 선언)

## 4. 기존 기대 변경

| 테스트 | 바뀐 것 |
|---|---|
| `template-check.test.ts` WI-0097 「회귀 가드 F2 · F7 · F8」 | F8(PnP 앱 선언 줄 없음 → 종전 B1)을 빼고 제목을 「F2 · F7」로. F8 은 WI-0102 Z1 이 새 기대로 봄 |
| 같은 파일 「회귀 가드 F6w · F13 · F14」 | 마지막 줄(PnP 앱 선언 + 줄 → PASS)을 빼고 주석으로 이유. WI-0102 Z2 가 새 기대로 봄 |

두 곳 모두 주석으로 WI-0102 로 옮겼다고 적었어요. 코드만 바꾸고 테스트를 고치기 전 cli 전체는 1166 건 중 1162 통과 · 4 실패였고, 실패 4건이 정확히 위 두 테스트 × 2패키지였어요(측정). 그 밖의 기존 기대는 바뀌지 않았어요.
