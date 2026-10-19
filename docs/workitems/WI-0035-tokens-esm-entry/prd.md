# WI-0035: tokens ESM 진입점 문법 오류 수정 PRD

> 작성일: 2026-10-19 | 버전: v1.0 (2026-10-19) | 작성자: Sinclair Seo | WI: WI-0035 | GitHub: #113 | 상태: Approved (2026-10-19 결정 반영: 별도 patch 1.2.2 취소, 1.3.0 에 포함)
> 선행: 없음. 기준 `main` e690905 (`@axis-ds/tokens` 1.2.1 배포 완료)
> 관련: WI-0025 M4(1.3.0 릴리스 설계 단계에서 이 결함을 발견)

---

## 1. 개요

### 1.1 배경
- `@axis-ds/tokens` 의 exports `'.'` import 조건은 `./dist/js/tokens.mjs` 입니다. 이 파일에 TypeScript 전용 문법(`as const`, `export type`)이 남아 있어 Node 에서 `import tokens from '@axis-ds/tokens'` 를 실행하면 `SyntaxError: Unexpected identifier 'as'` 로 실패합니다.
- CSS(`/css` · `/css/shadcn`) · `/tailwind` · `/json` 서브패스와 CJS `require` 경로는 영향이 없습니다.

### 1.2 원인 (실측, e690905)
| # | 내용 | 실측 |
|---|---|---|
| C1 | `build-tokens.mjs` 의 커스텀 포맷 `typescript/axis-module` 이 `tokens.mjs` 를 만들면서 객체 끝에 ` as const` 를 붙이고 `export type Tokens = typeof tokens;` 를 넣습니다. 출력 파일 확장자는 `.mjs` 라 Node 는 JavaScript 로 읽습니다 | `git log -S'as const'` 결과 최초 커밋 f57de7d(2026-01-23)부터 같은 코드 |
| C2 | CJS(`tokens.js`)는 Style Dictionary 내장 포맷 `javascript/module-flat`, 타입(`tokens.d.ts`)은 커스텀 포맷 `typescript/axis-declarations` 로 따로 만듭니다. 두 파일에는 TS 전용 문법이 없습니다 | `tokens.d.ts` 는 중첩 객체 타입(리프는 `Record<string, string>`)을 `export =` 로 내보내고, `as const` 리터럴 타입은 없습니다 |
| C3 | npm 배포본 6개(1.1.0 · 1.1.1 · 1.1.2 · 1.1.3 · 1.2.0 · 1.2.1) 모두 `tokens.mjs` 에 ` as const;` 가 1건씩 있고 node import 가 rc 1 로 실패합니다. 정상이었던 배포 버전은 없습니다 | `npm pack @axis-ds/tokens@<버전>` 을 빈 디렉터리에 풀어 import. 1.2.1 배포본 sha256(7964f163d70c)은 e690905 `--force` 빌드와 같습니다 |
| C4 | 기존 pack-smoke 는 exports 타깃 파일이 tarball 에 "있는지"만 봐서 이 결함을 통과시켰습니다 | `scripts/pack-smoke.mjs` 검사 항목 3개(workspace 프로토콜 · 타깃 실재 · 점 포함 CSS 변수) |
| C5 | 저장소 안에서 루트 JS 진입점을 import 하는 소비처는 0곳입니다. 예제 앱은 `@axis-ds/tokens/tailwind` 만 씁니다 | `grep -rln "@axis-ds/tokens['\"]"` (dist · node_modules 제외, rc 0, 일치는 `transpilePackages` 문자열 1곳뿐) |

### 1.3 목표
1. `tokens.mjs` 를 순수 JavaScript 로 만들어 Node · 번들러에서 import 가 성공하게 합니다.
2. 다른 산출물(CSS · CJS · JSON · `.d.ts` · tailwind 프리셋)은 바이트 단위로 바꾸지 않습니다.
3. 같은 부류(파일은 있는데 불러오면 깨짐)를 배포 전에 잡는 설치 스모크와 회귀 테스트를 둡니다.
4. WI-0025 1.3.0 에 합쳐 linked 4패키지(tokens · ui-react · agentic-ui · theme) 1.3.0 으로 배포합니다(D1). 처음에는 별도 patch 1.2.2 선배포로 정했다가 취소했습니다(D3).

### 1.4 범위
- 포함: `build-tokens.mjs` ESM 포맷 수정, tokens 회귀 테스트 1파일, `scripts/pack-install-smoke.mjs` 와 `pnpm pack-smoke` 연결, `@axis-ds/tokens` patch changeset, WI 문서
- 제외: 2장 Non-goals 참고

### 1.5 확정 결정 (2026-10-19)
| # | 결정 | 내용 |
|---|---|---|
| D1 | 배포 경로 | 별도 patch(tokens 1.2.2) 선배포를 취소하고 1.3.0 에 합칩니다(2026-10-19 사용자 재결정, 근거는 D3). 이 PR 의 tokens patch changeset 은 WI-0025 M4 의 minor changeset 과 합쳐 linked 4패키지 1.3.0 이 됩니다. changeset 파일은 patch 그대로 둡니다 |
| D2 | 수정 방식 | 포맷에서 ` as const` 와 `export type Tokens` 두 줄만 뺍니다. 타입은 지금처럼 `tokens.d.ts` 가 맡고, `.d.ts` 는 바꾸지 않습니다 |
| D3 | 1.2.2 취소 근거 | `main` 에는 1.2.1 배포(014e8ac) 뒤에 머지된 WI-0025 M2(89ab33a, ThemeProvider `brand` 옵션, `ThemeContextValue` 필수 멤버 `brand` · `setBrand` 추가)가 changeset 없이 들어 있습니다. `main` 에서 1.2.2 를 내면 이 기능과 타입 변경이 patch 번호로 먼저 나갑니다(실측: `git diff 014e8ac origin/main -- packages/axis-theme/src/index.ts`). `publish.yml` 은 `main` 에서만 OIDC 로 발행하므로 1.2.1 태그 기반 release 브랜치는 인프라 변경이 필요해 택하지 않았습니다. 결함은 1.1.0 부터 6개 배포본 전부에 있었고 보고는 0건이라 1.3.0 까지 기다립니다 |
| D4 | 머지 순서 | #116(mcp 1.1.5) → M3 #107 → WI-0030 #114 → 이 PR #118 → M4 #110 → Version Packages PR(1.3.0). #118 을 일찍 머지하면 Version PR 이 1.2.2 를 제안하므로 M4 바로 앞에 둡니다 |

---

## 2. Non-goals (범위 제외)

- **`.d.ts` 에 리터럴 타입 도입**: 배포본의 공개 타입은 처음부터 중첩 객체 타입(리프는 `Record<string, string>`), `export =` 이었고 `as const` 리터럴 타입은 없었습니다(C2). 리터럴 타입으로 바꾸면 공개 타입이 달라지므로 이번 수정에 넣지 않습니다.
- **ESM 과 CJS 의 모양 통일**: ESM 은 중첩 객체(`tokens.color.gray['50']`), CJS · JSON 은 평면 키(`ColorGray50`)입니다. 값은 같지만 모양을 맞추는 것은 공개 API 변경입니다.
- **`.d.ts` 의 `export =` 와 ESM 런타임(`tokens` · `default` named export) 정합**: 별도 검토 대상입니다.
- **다른 패키지의 설치 스모크**: ui-react 등은 react 같은 런타임 의존을 설치해야 해서 이번 스모크 대상은 tokens 만입니다.
- **PR CI(`frontend.yml`)에서 pack-smoke 실행**: 지금은 `publish.yml`(main push)에서만 돕니다. 바꾸지 않습니다.

---

## 3. 요구사항

### 3.1 기능 요구사항
- FR-1: `typescript/axis-module` 포맷 출력에서 ` as const` 와 `export type Tokens = typeof tokens;` 를 제거합니다. 남는 export 는 `tokens`(named)와 `default` 입니다.
- FR-2: 수정 뒤 `--force` 빌드의 dist 파일별 sha256 이 수정 전과 비교해 `dist/js/tokens.mjs` 하나만 달라야 합니다. `dist/css/**` · `tokens.js` · `tokens.json` · `tokens.d.ts` · tailwind 프리셋 4개는 같아야 합니다.
- FR-3: `tokens.mjs` 의 값은 `tokens.js`(require) · `tokens.json` 과 같아야 합니다. 모양이 다르므로 ESM 객체를 Style Dictionary `name/pascal` 키로 평면화해 깊은 동등을 비교합니다.
- FR-4: `scripts/pack-install-smoke.mjs` 를 추가합니다. `pnpm pack` tarball 을 빈 디렉터리에 `npm install` 하고 exports 전수를 소비자 자리에서 불러 봅니다(import 조건은 `import()`, require 조건은 `require()`, `.json` 은 두 방식, CSS 는 두 해석기로 경로 해석). types 조건은 TypeScript(`node16`)로 import 해 컴파일합니다. 종료 코드는 0 통과 · 1 결함 · 2 측정 실패입니다. 루트 `pack-smoke` 스크립트 뒤에 이어 실행합니다.
- FR-5: `packages/axis-tokens/test/js-entry.test.mjs` 를 추가합니다. 패키지 사본에서 `build-tokens.mjs` 를 실행하고, 만들어진 `tokens.mjs` 를 node 로 import 합니다. 기존 테스트처럼 저장소의 dist 는 읽지 않습니다.
- FR-6: `.changeset` 에 `@axis-ds/tokens` patch changeset 을 둡니다.

### 3.2 비기능 요구사항
- **CSS 불변**: `dist/css/**` 가 1바이트라도 바뀌면 진행하지 않습니다.
- **음성 대조**: 새 스모크와 회귀 테스트는 수정 전 코드에서 실패해야 합니다.
- **공개 타입 불변**: `.d.ts` 바이트가 같고, TypeScript 가 보는 루트 진입점 타입이 같아야 합니다.

---

## 4. 수용 기준 (AC)

| # | 기준 | 확인 방법 |
|---|---|---|
| AC-1 | 새 빌드의 `tokens.mjs` 를 node 가 import 합니다 | 회귀 테스트, 설치 스모크 |
| AC-2 | 바뀐 dist 파일은 `js/tokens.mjs` 하나입니다 | `--force` 빌드 전후 sha256 목록 diff |
| AC-3 | ESM 값과 CJS · JSON 값이 같습니다 | 평면화 깊은 동등(249개) |
| AC-4 | 설치 스모크가 수정본에서 rc 0, 수정 전 커밋 tarball 에서 rc 1 입니다 | `node scripts/pack-install-smoke.mjs [--tarball]` |
| AC-5 | tokens test · type-check · lint 가 `--force` 로 통과합니다 | `turbo run test type-check lint --filter=@axis-ds/tokens --force` |
| AC-6 | `pnpm changeset status` 에서 tokens 가 patch 로 잡힙니다. 이 브랜치 단독으로는 1.2.2 로 보이고, M4 의 minor changeset 과 합쳐지면 linked 4패키지 1.3.0 입니다(D1) | `pnpm changeset status --verbose`, M4 머지 뒤 Version Packages PR 에서 1.3.0 확인 |
