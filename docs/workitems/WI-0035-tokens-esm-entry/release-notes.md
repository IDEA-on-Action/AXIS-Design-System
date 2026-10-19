# WI-0035 릴리스 노트: tokens ESM 진입점 문법 오류 수정

> PRD: [prd.md](./prd.md) | TODO: [todo.md](./todo.md)

## 1.2.2 (patch) - ESM 진입점 수정

> 대상: `@axis-ds/tokens` 1.2.1 → 1.2.2. `pnpm changeset status` 기준 의존 정확 고정(`updateInternalDependencies`, `workspace:*` 가 배포본에서 `1.2.1` 로 고정)으로 ui-react · agentic-ui · theme 도 1.2.2 로 함께 오릅니다(todo M1-5)
> 배포: 미배포 (PR 대기)

### 배경

`@axis-ds/tokens` 의 ESM 진입점 `dist/js/tokens.mjs` 에 TypeScript 전용 문법 `as const` 와 `export type` 이 남아 있었습니다. 그래서 `import tokens from '@axis-ds/tokens'` 를 Node 에서 실행하면 `SyntaxError: Unexpected identifier 'as'` 로 실패했습니다. npm 에 배포된 1.1.0 부터 1.2.1 까지 6개 버전이 모두 같은 결함을 갖고 있습니다. CSS 서브패스(`/css` · `/css/shadcn`), `/tailwind`, `/json`, CJS `require` 경로는 영향이 없었습니다.

### 변경 사항

#### fix: tokens.mjs 를 순수 JavaScript 로 생성
- `build-tokens.mjs` 의 ESM 포맷에서 ` as const` 와 `export type Tokens = typeof tokens;` 를 뺐습니다.
- 토큰 값은 그대로입니다. 새 `tokens.mjs` 는 1.2.1 배포본에서 그 두 줄만 걷어낸 파일과 바이트 단위로 같습니다.
- CSS(`variables.css` · `shadcn-compat.css`), `tokens.js`, `tokens.json`, `tokens.d.ts`, tailwind 프리셋은 바이트 단위로 같습니다.
- 공개 타입(`tokens.d.ts`)은 바뀌지 않았습니다. 배포본의 타입은 처음부터 중첩 객체 타입(리프는 `Record<string, string>`), `export =` 이었고 `as const` 리터럴 타입을 노출하지 않았습니다.

#### chore: 설치 스모크 추가
- `scripts/pack-install-smoke.mjs`: tarball 을 빈 디렉터리에 설치해 exports 전수를 import · require 로 불러 보고, types 조건은 TypeScript 로 import 합니다. `pnpm pack-smoke` 가 기존 검사 뒤에 이어 실행합니다.
- `packages/axis-tokens/test/js-entry.test.mjs`: 빌드한 `tokens.mjs` 를 node 로 import 하는 회귀 테스트입니다.

## 검증

- dist 비교: e690905 와 수정본을 각각 `turbo run build --filter=@axis-ds/tokens --force` 로 빌드(cached 0/1). 10개 파일 중 `js/tokens.mjs` 만 변경
- 값 동등: ESM 평면화 249개 = `tokens.js` 249개 = `tokens.json` (깊은 동등)
- 설치 스모크: 수정본 rc 0(런타임 8건 + types 2개), e690905 tarball rc 1, npm 1.2.1 tarball rc 1. 전제: types 검사 직전에만 peer `tailwindcss@3.4.19`(워크스페이스 설치 버전)를 설치
- tokens test · type-check · lint `--force`: rc 0, tests 73 pass · 0 fail · 0 skipped
- `pnpm pack-smoke`: rc 0 (6개 패키지 pack 검증 + tokens 설치 스모크)

## 영향

- ESM 으로 `@axis-ds/tokens` 루트를 import 하던 프로젝트는 1.2.2 로 올리면 동작합니다.
- import 경로는 중첩 객체(`tokens.color.gray['50']`), require 경로는 PascalCase 평면 키 249개(`ColorGray50`)라 값의 모양이 다릅니다. 타입 선언(`tokens.d.ts`)은 중첩 모양 기준이라 require 소비자에게는 타입과 런타임이 어긋납니다(1.2.1 이전부터 있던 결함, 후속 WI 에서 정리).
- ui-react · agentic-ui · theme 1.2.1 은 `@axis-ds/tokens` 를 `1.2.1` 로 고정해 배포됐습니다. 이 패키지를 통해 tokens 를 받는 프로젝트는 그 패키지들도 1.2.2 로 올려야 수정본을 받습니다.
