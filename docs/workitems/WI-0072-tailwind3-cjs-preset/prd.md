# WI-0072: Tailwind 3 CommonJS 설정에서 preset 이 적용되지 않음 PRD

> 작성일: 2026-10-25 | 버전: v1.0 | 작성자: Sinclair Seo | WI: WI-0072 | GitHub: #191 | 우선순위: P1 | 상태: Approved (2026-10-25 사용자 결정: 권장안 + 검토 지적 반영)
> 기준: `main` 778e1dd (linked tokens · theme 1.6.2, ui-react · agentic-ui 1.6.3, cli 1.6.0, mcp 1.3.3 배포됨) | 묶음: 배치 3 ① (WI-0051 · 0068 · 0070 · 0072)
> 표기: **측정**(이번에 실행해 얻은 값) · **계산**(값에서 유도) · **추정**(실행하지 않음)

---

## 1. 개요

### 1.1 문제 (측정)

- tsup 의 cjs 산출물은 `export default` 를 `module.exports.default` 로 감싸요. 그래서 `require("@axis-ds/tokens/tailwind")` 결과가 preset 이 아니라 `{ axisAnimation, axisKeyframes, default }` 예요(npm 1.6.2 실측).
- Tailwind 3.4.19 `loadConfig` + `resolveConfig` 로 npm 1.6.2 를 잰 결과(testplan 2.1): **CommonJS 형태 3가지**(`.cjs` · type 없는 `.js` · `.ts` 안의 `module.exports`)에서 preset 이 통째로 빠져요(colors.primary 없음, AXIS keyframes 0개, `rounded-lg` 0.5rem, 글꼴 `ui-sans-serif`).
- **결함 범위 정정(반박 검토 major)**: `.ts` 의 `export default { presets: [require(...)] }`(create-next-app Tailwind 3 형태)와 `import axisPreset from` · `.mjs` 는 Tailwind 의 jiti interop(`interopDefault`)이 `.default` 를 꺼내 줘서 1.6.2 에서도 정상이에요. 결함은 CommonJS 형태(`module.exports` · `.cjs`)에 한정돼요.
- **회귀가 아님**: 이슈는 「1.5.0 모듈 보존 빌드 이후로 추정」이라 적었지만 발행본 1.1.0 · 1.2.0 · 1.3.0 · 1.5.0 · 1.6.2 모두 같은 `{ default }` 구조예요(배치 3 브리프 실측). 첫 발행부터의 결함이에요.
- cli 1.6.0 `theme add` 가 바로 이 깨진 문구 `presets: [require("@axis-ds/tokens/tailwind")]` 를 안내하고, `axis check` · MCP 는 이 구성을 「AXIS 토큰이 설정되어 있습니다」로 PASS 해요(거짓 초록, 브리프 실측).

### 1.2 결정

| # | 결정 | 근거 |
|---|---|---|
| D1 | tokens `./tailwind` 의 CommonJS 진입점이 preset 객체 자체를 `module.exports` 로 내보낸다. `default` · `axisKeyframes` · `axisAnimation` 은 **열거되지 않는** 속성으로 붙인다 | 권장안. `require(...).default` 기존 사용자와 이름 내보내기 유지, `...preset` 으로 펼쳐도 섞이지 않음 |
| D2 | 구현은 tsup 뒤 후처리 스크립트(`scripts/cjs-preset.mjs`)로 한다. 토큰 소스(`src/tailwind-preset.ts`)는 바꾸지 않는다 | tsup 에 「이름 내보내기가 있는 엔트리의 module.exports = default」 옵션이 없음. 토큰 소스는 ② WI-0026 소유 |
| D3 | 타입: require 조건은 `tailwind-preset.d.cts`(`export =`), import 조건은 `tailwind-preset.d.mts` 로 연결하고 최상위 `types` 는 `d.ts` 로 둔다(typesVersions · node10 그대로) | 런타임과 타입 모양을 맞춤. 측정 중 import 조건이 `d.ts`(CJS 형식 해석)라 node16 ESM 의 `import preset from` 이 `.theme` 타입을 못 읽는 것도 발견해 `d.mts` 로 고침 |
| D4 | cli 안내의 CommonJS 형태는 **버전과 상관없이** `require("@axis-ds/tokens/tailwind").default` 로 한다. ESM · TS 는 `import axisPreset from` | 검토 minor. `.default` 는 1.1.0~1.7.0 모두에서 동작(측정), 버전 분기는 불필요한 복잡도 |
| D5 | check(`tailwind.config`)는 **CommonJS 형태(`.cjs` 이거나 `module.exports`) + `.default` 없는 bare require** 일 때만 설치본 tokens 버전을 본다. 1.7.0 미만(설치본이 없으면 선언 하한)이면 WARN, 판정 불가도 WARN | 검토 major. `.ts` · `.mjs` 의 export default 형태는 PASS 로 둬서 가장 흔한 TS 구성의 거짓 WARN 을 막음 |
| D6 | 수정 버전 상수 `TOKENS_CJS_PRESET_FIXED_VERSION = "1.7.0"` 의 근거는 **bump 종류**다. 이 묶음의 theme changeset 이 minor 라 linked 4패키지가 현재 최고 1.6.3 에서 1.7.0 으로 오른다(② 와 무관) | 검토 major(release 전제 낡음). Release PR 의 version-packages 결과와 대조하는 단계를 release-notes 에 둠 |
| D7 | `theme add` 가 기록하는 tokens 하한 `TOKENS_DEPENDENCY_MIN_VERSION`(1.6.0)은 **올리지 않는다** | 검토 minor 가 요구한 결정 항목. 안내가 버전 무관 `.default` 라 하한을 올리지 않아도 안전하고, cli 가 아직 발행되지 않은 1.7.0 에 묶이지 않게 함. 올리면 새 프로젝트의 bare require 도 안전해지지만 기존 `^1.6.0` 선언과 판정이 갈림. 사용자 확인 항목으로 남김 |
| D8 | 설치본 판독은 registry-core 의 `findInstalledPackage`(상위 디렉터리 탐색) 하나를 WI-0051 · WI-0068 과 함께 쓴다(`packageVersionGate`) | 검토 minor. 같은 보고서 안의 판정이 어긋나지 않게 |

### 1.3 범위 밖

- 토큰 값 · `src/tailwind-preset.ts`(② WI-0026 소유).
- Tailwind 4 진입점(`css/tailwind4`)은 CSS 라 해당 없음.

## 2. 요구사항

| ID | 요구사항 | AC |
|---|---|---|
| FR-1 | CommonJS `require` 결과가 preset 이고, `.default === preset`, 이름 내보내기는 속성으로 읽히며 `Object.keys` · 펼침에 섞이지 않는다 | AC1: 패키지 사본 빌드 + Tailwind 3 loadConfig 10형태 모두 preset 적용, 후처리 전 산출물은 CommonJS 3형태만 실패(음성 대조) |
| FR-2 | ESM import 는 그대로(default · 이름 내보내기) | AC2: `import p, { axisKeyframes }` 결과 불변 |
| FR-3 | 타입: `.cts` 의 `import p = require()` 는 `d.cts`, `.mts` 는 `d.mts` 로 해석되고 없는 keyframes 이름은 타입 오류 | AC3: tsc node16 `--explainFiles` + `@ts-expect-error` 탐침 |
| FR-4 | `theme add` · 가이드의 CommonJS 안내는 `.default` 형태 | AC4: theme-add.test 갱신, 종전 문구 부재 단언 |
| FR-5 | check 는 CommonJS bare require + 설치본 tokens < 1.7.0 이면 WARN, jiti 경로 4형태(.ts export default + require · .ts module.exports · .cjs · .mjs import)는 규칙대로 | AC5: template-check.test 「배치 3 ①」 |
| FR-6 | pack-smoke 가 tarball 설치본의 `require` 결과가 preset 인지 본다 | AC6: `require-preset` 검사 통과 |

## 3. 구현 메모

- `scripts/cjs-preset.mjs`: tsup 산출물에 `module.exports = __toCommonJS(` 가 없으면 실패(모양이 바뀌면 조용히 지나가지 않음), 표지 주석으로 두 번 붙지 않음.
- `scripts/types-resolution-gate.mjs`: 조건별 타입이 있으면 방식마다(node16-cjs → require.types, node16-esm · bundler → import.types) 기대 파일을 바꿈.
- `scripts/pack-install-smoke.mjs`: 중첩 조건 exports 를 펼쳐 읽고 tokens `./tailwind` require 결과가 preset 인지 보는 `require-preset` 검사를 더함.
