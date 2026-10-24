# WI-0072: Tailwind 3 CommonJS preset 테스트 계획 · 결과

> PRD: [prd.md](./prd.md) | 작성일: 2026-10-25 | 기준: `main` 778e1dd + 브랜치 `fix/wi-0051-0070-0068-0072-check-brand-cjs`
> 표기: **측정**(이번에 실행해 얻은 값) · **계산**(값에서 유도) · **추정**(실행하지 않음)

## 1. 단위 · 회귀 테스트 (측정)

| 대상 | 결과 |
|---|---|
| `packages/axis-tokens/test/cjs-preset.test.mjs`(새 파일) | 15 통과. 패키지 사본에서 tsup + `scripts/cjs-preset.mjs` 를 실제로 돌리고 사본을 `node_modules/@axis-ds/tokens` 로 둔 소비자에서 Tailwind 3.4.19 `loadConfig` + `resolveConfig` |
| 설정 10형태(수정 후) | `.cjs` · type 없는 `.js` · `.ts` 의 `module.exports` + bare require, `.ts` export default + require, `.ts` import, `.mjs` import, `.cjs` · `.ts` 의 `.default`, apps/web 형태의 이름 import(`.ts`), CommonJS 구조분해 이름 내보내기: 모두 primary · AXIS keyframes 3개 |
| 음성 대조군(후처리 전 산출물) | CommonJS 3형태만 preset 이 빠지고 나머지 7형태는 정상. 1.6.2 배포본(아래 2.1)과 같은 결과라 이 테스트가 결함을 잡는다는 것을 보임 |
| 모양 · 타입 | `Object.keys` · 펼침 `['darkMode','theme']`, `default === preset`. tsc node16: `.cts` → `d.cts`, `.mts` → `d.mts`(`--explainFiles`), 없는 keyframes 이름 `@ts-expect-error` 통과 |
| 후처리 재실행 | 표지 1번만(중복 실행 안전) |
| tokens 전체 `node --test` | 296 통과 · 0 실패 |
| cli `template-check.test.ts` 「배치 3 ① WI-0072」 | 3건: `.cjs` · `.js` · `.ts` 의 module.exports bare require 는 설치본 1.6.2 WARN · 1.7.0 PASS, jiti 경로(.ts export default + require · .mjs import · .cjs `.default` · .ts `["default"]`)는 1.6.2 · 1.5.0 에서도 PASS, 설치본 없음 → 선언 하한(^1.7.0 PASS · ^1.6.0 WARN) · 둘 다 없으면 「확인하지 못했습니다」 |
| cli `theme-add.test.ts` | CommonJS 안내가 `.default` 형태, 종전 문구 부재 단언 |
| mcp `template.test.ts` 「배치 3 ①」 | 같은 판정 · 문구 |

## 2. 배포 경로 실측 (측정)

### 2.1 loadConfig: npm 1.6.2 vs 이 브랜치 pack 결과

구성: 스크래치 디렉터리 2곳에 tailwindcss 3.4.19 를 npm 으로 설치하고, 한쪽은 npm `@axis-ds/tokens@1.6.2`, 다른 쪽은 이 브랜치에서 `turbo run build --force` 뒤 `pnpm pack` 한 tarball(version 은 changeset 적용 전이라 1.6.2)을 설치. 같은 탐침(설정 파일마다 새 프로세스).

| 형태 | npm 1.6.2 primary · AXIS keyframes · rounded-lg | 이 브랜치 |
|---|---|---|
| a `.cjs` module.exports + bare require | 없음 · 0 · 0.5rem · `ui-sans-serif` | `hsl(var(--primary))` · 3 · `var(--radius)` · Pretendard 스택 |
| b `.js`(type 없음) 같은 형태 | 없음 · 0 | 정상 |
| c `.ts` 안의 module.exports | 없음 · 0 | 정상 |
| d `.ts` export default + require | 정상 | 정상 |
| e `.ts` import(Config 타입) | 정상 | 정상 |
| f `.mjs` import | 정상 | 정상 |
| g `.cjs` `.default` | 정상 | 정상 |
| h `.ts` module.exports `.default` | 정상 | 정상 |
| i `.ts` 이름 import(keyframes 만) | keyframes 3 | 같음 |
| j `.cjs` 구조분해 이름 내보내기 | keyframes 3 | 같음 |

`require("@axis-ds/tokens/tailwind")`: npm 1.6.2 `keys [axisAnimation, axisKeyframes, default]` · `default === p` false, 이 브랜치 `keys [darkMode, theme]` · 펼침도 같음 · `default === p` true.

### 2.2 pack-smoke (측정)

- 이 브랜치 `pnpm pack-smoke` rc 0: `@axis-ds/tokens/tailwind [require] require-preset (keys: darkMode,theme · primary: y)` 통과, G2 타입 해석 tokens node · node16-cjs · node16-esm · bundler 모두 0/5 실패(조건별 기대 파일: node16-cjs 는 `d.cts`).
- 음성 대조: `node scripts/pack-install-smoke.mjs --tarball <npm 1.6.2 tarball>` rc 1, `require-preset 실패: keys: axisAnimation,axisKeyframes,default · primary: n`.

### 2.3 check · theme add (측정, 이 브랜치 pack 한 cli)

- npm 설치 Tailwind 3 프로젝트(f1: `tailwind.config.js` 의 module.exports + bare require, npm tokens 1.6.2 설치): cli 1.6.0 · MCP 1.3.3 은 `tailwind.config` PASS(거짓 초록), 이 브랜치 cli · MCP(stdio)는 WARN `...설치본 1.6.2 에서는 CommonJS 의 require(...) 가 preset 이 아니라 { default } 를 돌려줘...`.
- 같은 프로젝트를 `.default` 로 고친 f2: 이 브랜치 cli · MCP 모두 PASS(8 pass / 0 warn / 0 fail).
- preset 이 없는 f3 에 `theme add ontology`: `presets: [require("@axis-ds/tokens/tailwind").default] (ESM · TypeScript 이면 import axisPreset from "@axis-ds/tokens/tailwind" 뒤 presets: [axisPreset])`.

## 3. 게이트 (측정)

`turbo run lint` · `type-check` · `test` · `build` 를 CI 순서대로 `--force`(각 Cached 0) 로 실행해 모두 rc 0. frontend.yml run 단계는 WI-0051 testplan 3절에 함께 기록.

## 4. 남는 확인 (추정 · 미실행)

- 발행 뒤 npm 1.7.0 으로 2.1 을 다시 잰다(version-packages 결과가 1.7.0 인지 대조 포함).

## 배포 뒤 재측정 (2026-10-25)

- 대상: npm 발행본 tokens · theme · ui-react · agentic-ui 1.7.0, cli 1.6.1, mcp 1.3.4(run 40137182470, provenance 6/6). 레지스트리에서 설치해 node_modules 의 version 으로 확인했어요.
- 결과: 불일치 0. tokens 1.7.0 과 1.6.2(음성 대조)로 CJS · .cjs · .js · .ts · .mjs 등 10형태의 loadConfig 결과와 Tailwind 3.4.19 빌드 CSS 를 쟀고 모두 일치했어요(1.6.2 의 bare require 3형태에서만 preset 이 빠짐). d.cts · d.mts 타입 해석과 check 의 CommonJS WARN 도 일치했어요.
- 원자료: `/tmp/claude-1000/-home-sinclair-work-idea-on-action-AXIS-Design-System/69d8f408-60b9-4bb2-8b0a-d1cb1f9af027/scratchpad/post3`
