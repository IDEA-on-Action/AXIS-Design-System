# WI-0055: MCP 컴포넌트 도구의 레지스트리 전환 PRD

> 작성일: 2026-10-23 | 버전: v0.1 (초안, 1단계 실측 · 설계 조사) | 작성자: Sinclair Seo | WI: WI-0055 | GitHub: #150 | 우선순위: P2 | 상태: Draft (D3 ~ D12 결정 대기)
> 기준: `origin/main` 8a8cd5b (`@axis-ds/cli` 1.5.1 · `@axis-ds/mcp` 1.2.3 · linked 4패키지 1.5.0 배포, 레지스트리 index version 1.5.0 · 30항목)
> 관련: WI-0045(#136) D4 에서 분리. 설치 코어(원격 우선 · 동봉본 폴백 · 안전 쓰기 · import 재작성 · 의존성 안내)는 WI-0045 의 cli 구현을 공유합니다

---

## 1. 개요

### 1.1 문제 (실측, 배포본 `@axis-ds/mcp@1.2.3` · 2026-10-23)

빈 디렉터리에 `npm install @axis-ds/mcp@1.2.3` 으로 설치하고 `dist/index.js` 를 stdio 로 띄워 JSON-RPC 로 호출했습니다(initialize 의 serverInfo.version 1.2.3, tools/list 18개).

| # | 호출 | 결과 | 비고 |
|---|---|---|---|
| M1 | `axis.list_components {}` | isError false, 합계 10(Core 4 · Form 3 · Layout 3 · Agentic 0) | 레지스트리는 ui 10 · agentic 18 · lib 2(합 30). agentic 18개가 모두 빠짐 |
| M2 | `axis.list_components {category:"agentic"}` | 합계 0 | |
| M3 | `axis.search_components {query:"progress"}` | 0건 | 레지스트리에는 `agentic-run-progress` 가 있음 |
| M4 | `axis.get_component {name:"separator"}` | 번들 `components.json` 의 설명 · props · 예제 | 설명이 레지스트리(「AXIS 구분선 컴포넌트」)와 다름 |
| M5 | `axis.get_component` `agentic-run-progress` · `run-progress` | 둘 다 「컴포넌트를 찾을 수 없습니다.」(isError false) | |
| M6 | `axis.install_component` `separator` · `dialog` | isError true, 「템플릿이 아직 준비되지 않았습니다. 수동으로 설치해 주세요.」 | 메타는 있으나 하드코딩 템플릿 없음 |
| M7 | `axis.install_component` `agentic-run-progress` | isError true, 「찾을 수 없습니다」 | |
| M8 | `axis.install_component` `button` | isError false, `<targetDir>/components/ui/button.tsx` 생성 | 내용은 shadcn 원형(`bg-primary`, `import { cn } from "@/lib/utils"`). utils 를 설치하지 않아 import 가 풀리지 않음 |
| M9 | 사용자가 고친 button.tsx(표지 1줄)에 같은 install 재호출 | isError false, 표지 1 → 0 | 내용이 다른 기존 파일을 묻지 않고 덮어씀(알림도 없음) |
| M10 | `targetDir:"relative-target"` · `"../escape-check"` | 둘 다 isError false, 서버 cwd 기준으로 해석해 cwd 밖에도 씀 | 프로젝트 루트 개념 · 경로 이탈 검사 없음 |

같은 조건의 대조(배포본 `@axis-ds/cli@1.5.1`, `axis.config.json` 에 `componentsDir: "src/components/ui"`):
`axis add separator dialog agentic-run-progress` 는 rc 0 으로 5파일(utils · separator · dialog · agentic-a11y-labels · agentic/run-progress)을 쓰고, import 를 상대 경로(`./utils`, `../ui/utils`)로 바꾸고, `pnpm add @radix-ui/react-dialog @radix-ui/react-separator "clsx@^2.1.1" "tailwind-merge@^2.6.0"` 를 안내했습니다. 같은 요청에 MCP 는 0파일입니다.

코드 전수(레지스트리 메타 · 템플릿 사용처, `grep` 실측):

| 위치 | 역할 |
|---|---|
| `packages/axis-mcp/src/registry/loader.ts` | `dist/data/components.json`(ui 10) · `tokens.json` 을 읽어 캐시. `searchComponents` · `getComponent` · `listComponents` · `getComponentStats` · `listTokens` · `getToken` · `getTokenStats` |
| `packages/axis-mcp/src/tools/list.ts` · `search.ts` · `get.ts` | loader 메타로 목록 · 검색 · 상세 |
| `packages/axis-mcp/src/tools/install.ts` | `COMPONENT_TEMPLATES` 하드코딩 5개(button · input · label · card · badge), `writeFileSync` 로 무조건 쓰기 |
| `packages/axis-mcp/src/index.ts` | 도구 등록. install 인자 `name` · `targetDir`(둘 다 필수), list · search 의 `category` 는 `core · agentic · form · layout` |
| `packages/axis-mcp/package.json` | `copy-data` 가 `src/registry/data` 를 `dist/data` 로 복사, `files` 에 `src/registry/data` |
| `scripts/mcp-smoke.mjs` | 6개 도구 호출 기대 문자열(`button`, `(`button`)`) · install 은 `<targetDir>/components/ui/button.tsx` 생성 확인 |
| `docs/guides/claude-workflow.md` | 도구 표(76 · 79행) |

`list_tokens` · `get_token` 은 `tokens.json` 을 그대로 씁니다(이 WI 범위 밖).

### 1.2 결정

| # | 결정 | 상태 |
|---|---|---|
| D1 | 공유 방식(2026-10-23 사용자): cli 의 레지스트리 설치 코어를 **발행하지 않는 private workspace 패키지**로 분리하고 cli · mcp 가 빌드 때 번들합니다. 발행 패키지의 런타임 `dependencies` 는 바뀌지 않아야 합니다. cli 리팩터링이 포함됩니다 | 확정 |
| D2 | 메타(2026-10-23 사용자): list · search 는 레지스트리 index.json 의 lib 를 뺀 28개를 씁니다. get 은 레지스트리 항목을 기본으로 하고 `components.json` 에 같은 이름의 props · examples 가 있으면 덧붙입니다. install 과 이름 체계(`agentic-` 접두 전체 이름)를 맞춥니다 | 확정 |
| D3 | 덮어쓰기 정책 | 결정 대기 |
| D4 | `targetDir` 의미와 config 가 없을 때의 배치 | 결정 대기 |
| D5 | 의존성 처리(안내만 · 설치 실행) | 결정 대기 |
| D6 | 도구 인자 하위 호환(`category` enum · agentic 별칭) | 결정 대기 |
| D7 | 출력 형식 하위 호환 | 결정 대기 |
| D8 | list · search · get 의 레지스트리 출처와 캐시 | 결정 대기 |
| D9 | 공유 코어로 옮기는 범위(tailwind-core 사본 통합 여부) | 결정 대기 |
| D10 | 기존 cli 테스트 위치(심 유지 · 코어로 이동) | 결정 대기 |
| D11 | 릴리스 범위(cli · mcp 버전) | 결정 대기 |
| D12 | 코어 패키지 이름 · 위치 | 결정 대기 |

결정 대기 항목의 선택지와 근거는 5절에 있습니다.

## 2. 설계 조사

### 2.1 cli 코어 의존 그래프 (실측, import 추출)

`add/add.ts`(838행)가 import 하는 모듈과 그 모듈이 다시 끌어오는 것:

| 모듈 | 행 | add 가 쓰는 것 | 외부 의존 | 비고 |
|---|---|---|---|---|
| `registry/schema.ts` | 344 | 검증 · 타입 · `REGISTRY_PUBLIC_BASE_URL` | node:crypto | `site.ts` import |
| `registry/remote.ts` | 175 | `resolveRegistryUrl` · `fetchRegistryJson` | 전역 fetch | `config/axis-config.ts` 는 타입만 |
| `registry/bundled.ts` | 32 | `findBundledRegistryDir(import.meta.url)` | node:fs | `<모듈 디렉터리>/registry` → `../registry` 순으로 찾음 |
| `registry/index.ts` | 277 | `RegistryClient` | 없음 | 폴백 문구에 「CLI 에 포함된 레지스트리」가 박혀 있음 |
| `add/safe-write.ts` | 248 | 경로 이탈 · 링크 · 하드링크 · O_EXCL 쓰기 | fs-extra | init 도 씀 |
| `config/axis-config.ts` | 74 | `readAxisConfig` | fs-extra | init · template 도 씀 |
| `site.ts` | 11 | `AXIS_QUICK_START_URL` | 없음 | |
| `template/tailwind-core.ts` | 745 | `detectTailwind` | node:fs | mcp `tools/tailwind-core.ts` 가 바이트 사본(WI-0042 동일성 테스트) |
| `theme/theme-add.ts` | 424 | `detectInstallCommand` · `hasDependency` · `isPlainObject`(합 25행 정도) | node:fs | 나머지는 theme 전용이라 그대로 둠 |
| `init/init.ts` | 775 | `selectUtilsDependencies`(+ `CLSX_RANGE` · `TAILWIND_MERGE_RANGES`, 30행 정도) | chalk | init 전체는 chalk 를 써서 옮기지 않음 |

`add/index.ts`(commander · prompts · chalk)는 cli 에 남깁니다. `add.ts` 자체는 chalk · prompts 를 쓰지 않습니다(실측).

### 2.2 옮길 모듈 (안)

코어 패키지(가칭 `@axis-ds/registry-core`, D12)로 옮기는 것:

- `registry/{schema,remote,bundled,index}.ts`
- `add/safe-write.ts`, `add/add.ts`(runAdd · collectItems · planFiles · rewriteImports · missingDependencies · groupIndex · createClientFor)
- `config/axis-config.ts`, `site.ts`
- 새 파일 2개로 잘라 옮김: `theme-add.ts` 의 헬퍼 3개, `init.ts` 의 `selectUtilsDependencies` 와 범위 상수
- `template/tailwind-core.ts`(D9 에 따라)

cli 의 원래 경로는 같은 이름을 다시 내보내는 얇은 파일(심)로 둡니다. init · theme · template · 테스트의 import 경로가 그대로 유지됩니다.

코어에서 바꿔야 하는 곳(cli 동작은 그대로, 기본값이 종전 문구):

- 문구 주입: 폴백 안내의 「CLI 에 포함된 레지스트리」, runAdd 의 「npx @axis-ds/cli list」 · 「--overwrite」 · 「npx @axis-ds/cli init」 안내를 옵션으로 받습니다. mcp 는 「MCP 에 포함된 레지스트리」 · `overwrite: true` 같은 문구를 넘깁니다. cli-smoke 가 보는 접두(「원격 레지스트리에 접근하지 못해」)는 유지합니다
- stdout 금지: MCP 는 stdout 이 JSON-RPC 통로라 코어가 `console.log` 로 쓰면 프로토콜이 깨집니다. `runAdd` 의 `log` 기본값이 `console.log` 이므로 mcp 는 항상 `log` · `error` · `notify` 를 주입하고, mcp 테스트에 「도구 호출 중 stdout 에 JSON-RPC 이외의 줄이 없다」를 넣습니다(`RegistryClient` 기본 `notify` 는 `console.warn` 이라 stderr)

### 2.3 번들 방식 (스파이크 실측, scratch)

`private: true` · `exports: { ".": "./src/index.ts" }` 인 패키지를 소비 패키지의 **devDependencies** 에 `workspace:*` 로 두고, cli 와 같은 tsconfig(`rootDir: src`, NodeNext)로 `tsup src/index.ts --format esm --dts` 를 돌렸습니다.

| 확인 | 결과 |
|---|---|
| 번들 | rc 0. `dist/index.js` 에 코어 import 잔존 0줄, 코어 함수 본문이 들어감(tsup 은 dependencies · peerDependencies 만 외부로 두므로 devDependencies 의 코어는 기본으로 번들됨. 명시적으로 `noExternal` 도 둡니다) |
| `import.meta.url` | 번들 뒤 실행하면 `dist` 를 가리킴. 따라서 `findBundledRegistryDir` 는 mcp 에서도 `dist/registry` 를 찾습니다 |
| dts | rc 0. 하지만 코어에 타입 오류를 넣어도 **rc 0**(엔트리 d.ts 가 코어 타입을 내보내지 않아 검사하지 않음) |
| `tsc --noEmit`(rootDir src) | 정상 rc 0, 코어 타입 오류 주입 시 rc 2(`../core/src/helper.ts` TS2322). rootDir 밖 오류(TS6059)는 나지 않음 |

결론: 번들은 문제없고, **타입 검사 게이트가 비어 있습니다**. cli · mcp 에는 `type-check` · `lint` 스크립트가 없어 루트 `pnpm type-check`(turbo)가 이 둘을 건너뜁니다. 코어 패키지에 `type-check: tsc --noEmit` 을 두어 turbo 가 돌게 합니다.

배포본 런타임 의존: 코어의 외부 의존은 `fs-extra` 와 node 내장, 전역 fetch 뿐입니다. cli · mcp 모두 `fs-extra ^11.2.0` 을 이미 `dependencies` 에 갖고 있어 발행 `dependencies` 는 바뀌지 않습니다(D1). `pnpm pack` 은 devDependencies 의 `workspace:*` 도 실제 버전(`0.0.0`)으로 바꿔 적을 것으로 보입니다(2단계에서 tarball 의 package.json 으로 실측). 소비자는 devDependencies 를 설치하지 않으므로 영향은 없지만, pack-smoke 에 「코어 이름이 dependencies · peer · optional 에 없음」을 더합니다.

### 2.4 동봉 레지스트리를 mcp 에 싣기

- 빌드: mcp `build` 에 `node ../axis-cli/scripts/copy-registry.mjs ../../apps/web/public/r dist/registry` 를 더합니다(스크립트는 원본 · 대상 인자를 이미 받음, 검증 로직 재사용). 스크립트를 코어로 옮기는 안은 cli `copy-registry.test.ts` 경로가 바뀌어 D10 과 묶입니다
- 위치 해석: tsup 단일 엔트리라 코어 코드가 `dist/index.js` 에 들어가고 `findBundledRegistryDir` 의 1순위 `dist/registry` 가 맞습니다(스파이크로 확인). `dist/data`(tokens · components.json)와 겹치지 않습니다
- turbo 캐시: cli `turbo.json` 은 build inputs 에 `apps/web/public/r/**` 가 있으나 **mcp 는 없습니다**. 넣지 않으면 레지스트리만 바뀐 커밋에서 mcp build 가 캐시로 낡은 동봉본을 냅니다. mcp test inputs 에도 코어 src 를 더합니다
- 크기: `apps/web/public/r` 204KB(32파일)가 mcp tarball 에 더해집니다

### 2.5 스크립트 · 테스트 영향

| 대상 | 영향 | 조치(안) |
|---|---|---|
| cli vitest 640개(15파일, 2026-10-23 worktree 실측 640 passed) | 심을 두면 import 경로 그대로. `add.test.ts` 는 `vi.spyOn(fs, "open" · "close" · "ensureDir")` 로 fs-extra 기본 객체를 바꿔 경합을 재현하므로 코어와 cli 가 **같은 fs-extra 인스턴스**를 써야 합니다(pnpm 이 같은 버전을 같은 store 경로로 링크하면 성립, 2단계에서 640 통과로 확인) | D10 |
| mcp vitest 43개 | `tailwind-core.test.ts`(바이트 사본 동일성)는 원본이 심으로 바뀌면 실패 | D9 에 따라 사본 삭제 또는 원본 경로 변경 |
| `scripts/mcp-smoke.mjs` | install 기대 경로(`components/ui/button.tsx`), search 기대 문자열, 원격 접속 여부 | 서버를 `AXIS_REGISTRY_URL=http://127.0.0.1:9/r` 로 띄워 동봉본 경로를 결정적으로 검사하고 폴백 안내를 확인. agentic 1개 설치(`agentic-run-progress` → utils · a11y-labels 동반) · 덮어쓰기 건너뜀 · 경로 이탈 거부 호출 추가. EXPECTED_TOOLS 는 도구를 늘리지 않으면 그대로 |
| `scripts/pack-smoke.mjs` | 퍼블리시 대상은 `private !== true` 로 고르므로 코어는 자동 제외 | `REQUIRED_FILES['@axis-ds/mcp'] = ['dist/registry/index.json']`, 코어 이름 누출 검사 |
| `scripts/cli-bundled-smoke.mjs` | 동작이 같으면 그대로 통과해야 함(리팩터링 회귀 게이트) | 변경 없음 |
| `.changeset/config.json` | private 패키지는 changeset 이 없으면 버전 대상이 아님 | 변경 없음(필요하면 `ignore` 에 추가) |
| `pnpm-lock.yaml` | 새 importer 와 cli · mcp devDependencies 추가 | 2단계에서 `pnpm install` 로 갱신 |

### 2.6 기존 cli 테스트 640개 통과 경로

1. 코어 패키지를 만들고 2.2 의 파일을 `git mv` 로 옮긴 뒤 cli 원래 경로에 심을 둡니다(테스트 · init · theme · template 의 import 무변경)
2. 문구 주입은 기본값을 종전 문구로 둡니다(테스트 기대 문자열 무변경)
3. `vitest run` 640 passed, `pnpm --filter @axis-ds/cli build` 뒤 `pnpm cli-smoke` 통과로 리팩터링 회귀가 없음을 봅니다(변이: 코어의 덮어쓰기 판정을 뒤집으면 cli 테스트가 실패하는지 1회 확인)
4. 그 뒤에 mcp 를 코어로 전환합니다(리팩터링과 기능 변경 커밋 분리)

## 3. 요구사항 (초안, D3 ~ D12 에 따라 바뀜)

- FR-1 코어 분리: 2.2 의 모듈을 private 패키지로 옮기고 cli 는 심으로 같은 이름을 내보냅니다. cli 동작 · 출력 무변경
- FR-2 mcp list · search: 레지스트리 index 의 lib 제외 28개. 각 항목에 이름 · 제목 · 설명 · 종류(ui · agentic). 출처(원격 · 동봉본)와 index version 을 함께 표시
- FR-3 mcp get: 레지스트리 항목(설명 · dependencies · registryDependencies · 파일 경로)에 `components.json` 의 props · examples 를 덧붙임. 없는 이름은 cli 의 `describeMissingName` 안내(agentic 접두 제안)
- FR-4 mcp install: 코어 `runAdd` 로 설치. 재귀 의존 · import 재작성 · 경로 이탈 · 링크 · 하드링크 · 덮어쓰기 규칙이 cli 와 같음. 결과에 쓴 파일(+ · ~) · 같은 내용 건너뜀 · 다른 내용 건너뜀 · 의존성 명령
- FR-5 동봉 레지스트리: mcp `dist/registry` 에 싣고 원격 실패 시 폴백(안내 1회)
- FR-6 게이트: 코어 type-check, mcp-smoke 확장, pack-smoke REQUIRED_FILES · 코어 누출 검사, mcp turbo inputs

## 4. 수용 기준 (초안)

- AC1 cli vitest 640개 이상 통과, cli-smoke 통과, cli 의 `dist` 실행 결과(add separator dialog agentic-run-progress)가 1.5.1 과 같음
- AC2 빌드한 mcp tarball 을 빈 디렉터리에 설치해 list 28 · search `progress` 에 `agentic-run-progress` · install `separator dialog agentic-run-progress` 가 cli 와 같은 파일 · 내용(바이트 비교)
- AC3 원격 접속 불가(`127.0.0.1:9`)에서도 동봉본으로 AC2 가 성립하고 폴백 안내가 1번
- AC4 내용이 다른 기존 파일은 D3 에 따라 처리되고 사용자 수정이 남음(표지 대조), 경로 이탈은 아무것도 쓰지 않음
- AC5 발행 tarball 의 `dependencies` 가 1.2.3 · 1.5.1 과 같음, 코어 이름 누출 0(양성 대조: 일부러 넣으면 pack-smoke 실패)
- AC6 기존 게이트(build · test · test:registry · cli-smoke · pack-smoke · registry-install-smoke) 통과

## 5. 결정 대기 항목

| # | 질문 | 선택지(첫 번째가 권장) | 근거 |
|---|---|---|---|
| D3 | 내용이 다른 기존 파일을 어떻게 다루나 | ① 기본은 건너뛰고 목록을 알림, `overwrite: true` 인자일 때만 덮어씀(cli `-y` · `--overwrite` 와 같음) ② 다른 파일이 하나라도 있으면 아무것도 쓰지 않고 isError, `overwrite: true` 로 재호출 ③ 종전처럼 항상 덮어씀 | MCP 에는 대화형 확인이 없고 M9 에서 사용자 수정이 사라졌습니다. ① 은 cli 비대화형과 같은 규칙이라 코어를 그대로 씁니다. 건너뛴 경우 isError 는 false(cli rc 0 과 같음)로 두되 결과 첫머리에 건너뛴 수를 적습니다 |
| D4 | `targetDir` 은 무엇이고 config 가 없으면 | ① 프로젝트 루트. `axis.config.json` 이 있으면 그 배치, 없으면 기본 배치 `components/ui` · `components/agentic`(종전 MCP 위치와 같음)로 설치하고 「config 없이 기본 배치」를 알림 ② 프로젝트 루트, config 가 없으면 cli 처럼 실패하고 `npx @axis-ds/cli init` 안내 ③ ① 에 더해 `targetDir` 생략 시 서버 cwd | 종전 호출(`targetDir` 만 주고 config 없음)이 실패로 바뀌지 않게 하려면 ① 입니다. ② 는 cli 와 완전히 같지만 기존 사용 흐름이 깨집니다. 상대 `targetDir` 은 서버 cwd 기준이라(M10) 결과에 해석한 절대 경로를 적습니다. 경로 이탈 검사의 루트는 `targetDir` 입니다 |
| D5 | 의존성 | ① 명령 안내만(cli 와 같음, lockfile 로 pnpm · npm · yarn 선택) ② `installDependencies: true` 일 때 실행 | MCP 클라이언트(AI)가 안내 명령을 직접 실행할 수 있고, 서버가 패키지 매니저를 돌리면 시간 · 네트워크 · 권한 문제가 서버 안으로 들어옵니다 |
| D6 | 도구 인자 하위 호환 | ① `category` enum 은 그대로 받고 `ui` 를 더함. `agentic` 은 agentic 18개, `core · form · layout` 은 `components.json` 의 category 로 거름(현재 ui 10개 모두 있음, 없으면 core). install 은 `name` 문자열 그대로 + 여러 개는 `names` 배열 추가, agentic 별칭은 인자로 두지 않고 없는 이름 안내로 제안 ② enum 을 `ui · agentic` 으로 바꿈(기존 값은 오류) ③ install 에 cli 와 같은 `agentic: boolean` 별칭 추가 | 기존 호출이 zod 검증에서 실패하지 않게 하는 것이 ① 입니다. cli list 는 `ui · agentic` 두 갈래라 표시 분류는 다릅니다 |
| D7 | 출력 형식 | ① 머리글(「# 컴포넌트 설치 완료」 · 「# AXIS Design System 컴포넌트 목록」 등)과 표 구조를 유지하고 줄을 더함(출처 · version · 건너뜀 · 의존성 명령). 부분 실패는 isError true ② cli 출력 문자열을 그대로 반환 ③ JSON(`structuredContent`) 추가 | 기존 클라이언트 프롬프트 · mcp-smoke 가 머리글을 봅니다. ③ 은 SDK 버전 확인이 필요해 이번 범위에서 뺍니다 |
| D8 | list · search · get 의 출처와 캐시 | ① 호출마다 install 과 같은 해석(env `AXIS_REGISTRY_URL` → 서버 cwd 의 `axis.config.json` registry → 기본값, 실패 시 동봉본), 캐시 없음 ② 서버 수명 동안 index 캐시 ③ list · search · get 은 동봉본만(네트워크 없음) | ① 은 install 과 결과가 어긋나지 않습니다. 원격 timeout 은 5초(코어 기본)라 원격 장애 때 첫 호출만 느립니다. ② 는 장수 서버가 낡은 목록을 줍니다. ③ 은 install(원격 우선)과 목록이 다를 수 있습니다 |
| D9 | 코어로 옮기는 범위 | ① `tailwind-core.ts` 도 코어로 옮기고 mcp 의 바이트 사본 · 동일성 테스트를 지움(brand-core 사본은 그대로) ② tailwind-core 는 cli 에 두고 코어는 `detectTailwind` 만 따로 사본 ③ brand-core 까지 함께 통합 | add 가 `detectTailwind` 를 쓰므로 코어에 있어야 합니다. ② 는 사본이 하나 더 생깁니다. ③ 은 mcp brand · template 도구까지 건드려 WI-0051 과 겹칩니다 |
| D10 | cli 테스트 위치 | ① cli 에 그대로 두고 cli 원래 경로를 심으로 유지(640개 무변경) ② 코어 관련 테스트(registry · add · copy-registry)를 코어 패키지로 옮김(cli 와 코어로 수가 나뉨) | ① 은 import · 기대 문자열 · 상대 경로(`../../../../apps/web/public/r`)가 그대로라 리팩터링 회귀를 같은 테스트로 봅니다. ② 는 turbo test 입력 · CI 단계가 함께 바뀝니다 |
| D11 | 릴리스 | ① mcp minor(1.3.0, 도구 동작 · 인자 추가), cli patch(1.5.2, 내부 리팩터링 · 동작 무변경). 두 패키지는 서로 런타임 의존이 없어 버전 범위 조정 없음 ② mcp minor 만, cli 는 changeset 없이 다음 릴리스에 함께 ③ 둘 다 minor | cli 산출물(번들)이 바뀌므로 발행하지 않으면 저장소와 배포본이 어긋납니다. linked 4패키지는 대상 아님 |
| D12 | 코어 패키지 이름 · 위치 | ① `packages/axis-registry-core`, `@axis-ds/registry-core`, `private: true`, version `0.0.0`, exports 는 `src/*.ts` 원본(빌드 없음) ② 같은 이름에 자체 tsup 빌드(dist) ③ `internal/` 같은 새 workspace 경로 | ① 은 turbo `test` 가 `^build` 에 의존하지 않아도 vitest · tsup 이 원본을 바로 읽습니다(스파이크 확인). ② 는 test 전 build 순서가 필요합니다. ③ 은 `pnpm-workspace.yaml` 변경이 필요합니다. pack-smoke 는 `packages/*` 중 private 를 이미 제외합니다 |

## 6. 범위 밖

- `list_tokens` · `get_token`(tokens.json) 과 템플릿 · 브랜드 · 프롬프트 도구
- MCP 도구 추가(`axis.init` 등). 필요하면 별도 WI
- cli 의 `type-check` · `lint` 스크립트 신설(코어 패키지만 type-check 를 둠)
- 의존성 선언만 보고 「설치됨」으로 표시하는 문제(WI-0051)
