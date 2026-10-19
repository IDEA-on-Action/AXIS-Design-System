# WI-0028 구현 계획

> PRD: [prd.md](./prd.md)(main 기준 Draft v0.3) | TODO: [todo.md](./todo.md) | 테스트: [testplan.md](./testplan.md) | 작성일: 2026-10-19 | 기준: `main` e690905
> 이 문서는 설계만 담습니다. 구현 코드는 아직 없습니다. 줄 번호 · 건수 · 버전은 2026-10-19 실측값이며, 코드가 바뀌면 낡으므로 착수 시점에 다시 확인합니다.
> 진행 조건(2026-10-19 사용자 결정): 개발은 지금 시작하고, 실제 ontology 프리셋 확인은 WI-0025 M3(#107) 머지 뒤, cli · mcp 배포는 1.3.0 배포 뒤에 합니다. PRD 4행 「선행」 줄의 정정은 PR #112 가 맡으므로 이 브랜치에서는 고치지 않습니다.
> 미결 항목은 8장의 U 번호로 적었습니다. 권장안을 전제로 설계했고, 권장안이 PRD 범위를 바꾸는 항목은 결정 전까지 착수하지 않습니다(8장 「게이트」 표시).

---

## 1. 조사 결과 (현재 구조)

### 1.1 `@axis-ds/cli` (package.json 1.1.4)

| 항목 | 실측 |
|---|---|
| 명령 등록 | `src/index.ts`(595줄)가 commander `program` 에 `init` · `add` · `list` · `monet` · `v0` · `library` 를 직접 등록하고, `registerSyncCommand(program)`(`src/sync/index.ts`) · `registerTemplateCommand(program)` · `registerCheckCommand(program)`(`src/template/index.ts`)로 나머지를 붙입니다. 마지막 줄이 `program.parse()` 라 `src/index.ts` 를 import 하면 명령이 실행됩니다 |
| 버전 표기 | `src/index.ts:30` `.version("0.1.0")` (package.json 은 1.1.4) |
| `axis.config.json` 생성 | `axis init`(`src/index.ts:67-76`): `$schema` · `componentsDir` · `tailwindConfig` · `globalCss` · `registry`, `-y` 기본 `globalCss` 는 `./src/app/globals.css`. `axis template init`(`src/template/template-apply.ts:184-195`): `$schema` · `template` · `componentsDir` · `tailwindConfig` · `globalCss`(`./globals.css`). 두 곳 모두 타입 없는 객체 리터럴입니다 |
| `axis check` | `src/template/template-check.ts` `runCheck(dir)` 가 결과 5개를 모으고 바로 `console.log` 합니다. `axis.config.json` 은 존재만 봅니다. globals.css 탐색 순서는 `globals.css` → `app/globals.css` → `src/app/globals.css` → `src/globals.css` → `styles/globals.css` 입니다. 옵션은 `-d, --dir <path>` |
| 빌드 | `tsup src/index.ts src/monet.ts src/v0.ts src/sync/index.ts --format esm --dts`, tsconfig `rootDir: "src"` · `resolveJsonModule: true` |
| 테스트 | vitest ^2.1.0, `vitest.config.ts` include `src/**/*.test.ts`, 기존 3파일 58건 통과(e690905, `npx vitest run`, rc 0) |
| lint · type-check 스크립트 | 없음(WI-0034 D3 에서 제외) |

### 1.2 `@axis-ds/mcp` (package.json 1.1.4)

| 항목 | 실측 |
|---|---|
| 도구 등록 | `src/index.ts`(687줄)가 `McpServer` 에 `server.tool(name, desc, zodShape, handler)` 로 16개를 등록하고, 핸들러 본체는 `src/tools/*.ts`(`handleX` + `formatX`)에 있습니다. 끝에서 `main()` 이 stdio 연결을 시작하므로 `src/index.ts` 도 import 하면 서버가 뜹니다 |
| 버전 표기 | `src/index.ts:55` `version: "0.1.0"`. npm 1.1.4 의 `initialize` 응답 `serverInfo.version` 도 `0.1.0` 입니다(2026-10-19 tarball 실측) |
| 정적 JSON | `src/registry/loader.ts` 가 `join(__dirname, "data")` 를 읽고, 빌드는 `src/registry/data` 를 `dist/registry/data` 로 복사합니다 |
| `axis.check_project` | `src/tools/template.ts:291` `handleCheckProject` 가 결과 배열을 돌려주고 `formatCheckProjectResult` 가 글로 바꿉니다. CLI 검사와 같은 5항목 · 같은 탐색 순서를 따로 구현했습니다 |
| 의존성 | `@modelcontextprotocol/sdk` · `fs-extra` · `node-fetch` · `zod`. `@axis-ds/tokens` 와 `@axis-ds/cli` 에 의존하지 않습니다 |
| 테스트 | 테스트 파일 0개, `test` 스크립트 · vitest 없음(PRD FR-6 서술과 일치) |

**기존 결함(이 WI 범위 밖, U7)**: tsup 이 `loader.ts` 를 `dist/index.js` 한 파일로 묶으면서 `__dirname` 이 `dist` 가 되어, 로더는 `dist/data/components.json` 을 찾는데 데이터는 `dist/registry/data` 에 있습니다. npm `@axis-ds/mcp@1.1.4` tarball 을 받아 stdio 로 `axis.list_components` · `axis.list_tokens` 를 호출하면 둘 다 `ENOENT ... dist/data/components.json`(tokens.json) 으로 `isError: true` 입니다(2026-10-19 실측, 대조군: 같은 세션의 `tools/list` 는 16개 정상). `pack-smoke` 는 tarball 구조만 보고 서버를 실행하지 않아 이 결함을 못 잡습니다. 브랜드 도구는 정적 번들을 쓰지 않으므로 이 결함을 물려받지 않지만, 같은 함정(번들 뒤 `__dirname` 이동)을 피하도록 4.3 절에 규칙을 둡니다.

### 1.3 브랜드 데이터 형식

**main(e690905, WI-0025 M2 반영)**: `packages/axis-tokens/scripts/brands.mjs` · `build-brands.mjs` 가 `src/brands/<brand>/{light,dark,brand}.json` 을 읽어 다음을 만듭니다. main 에는 `src/brands` 가 없어 브랜드 산출물이 0개이고, `package.json` exports 에도 브랜드 항목이 없습니다.

| 산출물 | 경로 | exports 키 |
|---|---|---|
| 브랜드 CSS | `dist/css/brands/<brand>.css` | `./css/brands/<brand>` |
| 메타데이터 | `dist/brands/<brand>/brand.json`(소스 그대로 복사) | `./brands/<brand>/brand.json` |

`brand.json` 스키마(검증 V2, `validateBrand`): `name`(디렉터리 이름과 같음, kebab-case `^[a-z][a-z0-9]*(-[a-z0-9]+)*$`) · `description`(비어 있지 않은 문자열) · `themes`(정렬하면 `["dark","light"]`) · `a11y`(객체, 내부 키는 검증하지 않음). fixture `test/fixtures/brands/valid/sample/brand.json` 의 `a11y` 는 `{ status, checkedAt, gate }` 입니다.

브랜드 CSS 형식(`renderBrandBlock` · `brandHeader`): 머리 주석 뒤에 라이트 블록 `[data-brand="<b>"] {` 과 다크 블록 `[data-brand="<b>"].dark,\n[data-brand="<b>"][data-theme="dark"],\n.dark [data-brand="<b>"] {` 이 오고, 각 블록은 `  --axis-...: 값;` 줄 다음에 shadcn 줄(`  --primary: H S% L%;`, `SHADCN_KEYS` 순서)이 붙습니다. 머리 주석이 권하는 사용법은 「`variables.css` · `shadcn-compat.css` 뒤에 `@import '@axis-ds/tokens/css/brands/<b>'`」입니다.

**M3(origin/feat/wi-0025-m3-ontology-v2 17e4427, 읽기만)**: 위에 더해

- `dist/brands/index.json` 과 exports `"./brands": "./dist/brands/index.json"` 을 추가합니다. 스키마는 `{ "brands": [{ "name", "css": "./css/brands/<b>", "meta": "./brands/<b>/brand.json" }] }`(이름순)이고, 코드 주석이 「1.3.0 공개 API」, 「WI-0028 `axis theme list` 가 읽는다」고 적고 있습니다(WI-0025 plan 3 결정 2 A안). 브랜드가 1개 이상일 때만 생깁니다.
- `src/brands/ontology/{brand,light,dark}.json`. `brand.json` 의 `a11y` 는 `status`(긴 자유 문장) · `checkedAt: "2026-10-18"` · `gate: "CI frontend.yml E2E a11y (WI-0025 AC8)"` 입니다. light.json 은 `--axis-*` 대상 leaf 와 `shadcn` 20키(소수 HSL 포함, 예 `220 69.4% 52.5%`)를 담습니다.
- 같은 브랜치가 WI-0028 PRD 를 v0.4 로 올려 FR-3 근거 문서를 WI-0025 부록 B 로 명시하고 Q6(보정 전 값의 데이터 출처)을 추가했습니다. main 의 PRD 는 아직 v0.3 이라 Q6 이 없습니다.

### 1.4 `@axis-ds/theme` FR-6

main 의 `packages/axis-theme/src/index.ts` 에 `defaultBrand?` · `brandStorageKey?` 와 `useTheme().brand` · `setBrand` 가 이미 있습니다(#91, M2). npm `@axis-ds/theme@1.2.1` tarball 에는 `defaultBrand` 가 0건입니다(대조군 `ThemeProvider` 16건). 즉 FR-6 은 코드상 완료, 배포는 1.3.0 입니다. npm `@axis-ds/tokens@1.2.1` tarball 에도 brand 경로가 0건입니다(대조군 `dist/css` 2건).

### 1.5 theme-only 템플릿 (AC2(a) 대상)

`apps/web/public/templates/theme-only.json` 파일 7개(`globals.css` · `layout.tsx` · `package.json` · `page.tsx` · `tailwind.config.ts` · `theme-toggle.tsx` · `tsconfig.json`)가 모두 루트에 놓입니다. `globals.css` 는 `@tailwind base;` 로 시작하고 `@layer base { :root { --background: ...; ... } }` 로 shadcn 변수를 직접 정의하며, `@axis-ds/tokens` 의존성과 `--axis-*` 변수가 없습니다. `layout.tsx` 는 `import './globals.css'` 만 하고 `ThemeProvider` 가 없습니다.

---

## 2. PRD 와 실제 코드가 어긋나는 곳

| # | PRD 서술 (main v0.3) | 실측 | 처리 |
|---|---|---|---|
| D1 | 기준 버전 cli · mcp 1.1.3, tokens · theme 1.2.0 | cli · mcp 1.1.4(2026-10-17 배포), tokens · theme 1.2.1 | 계획은 실측 기준. 릴리스는 1.1.4 → 1.2.0(minor)으로 읽습니다. PRD 정정은 U9 |
| D2 | 1.1 「`defaultBrand` 는 현재 `ThemeProvider` 에 없는 prop」 | main 코드에는 있음, npm 1.2.1 에는 없음(1.4 절) | Provider 안내는 「`@axis-ds/theme` 1.3.0 이상」을 조건으로 출력합니다 |
| D3 | FR-1 「`brand.json` 을 읽어」 목록 출력 | M3 가 목록 전용 `dist/brands/index.json`(exports `./brands`)을 추가했고, exports 가 명시형이라 `dist/brands` 디렉터리를 열거하려면 exports 를 우회해야 합니다 | 목록은 `index.json`, 각 항목의 메타는 그 `meta` 경로의 `brand.json` 으로 읽습니다(4.1 절). PRD 와 모순은 없고 출처가 하나 늘었습니다 |
| D4 | FR-3 「원본 대비 보정 내역」 출력 | 배포본에는 보정 후 값만 있고 `brand.json` 에 보정 필드가 없음(M3 PRD v0.4 Q6 과 같은 지적) | U3 |
| D5 | FR-2 「찾은 파일에 `@axis-ds/tokens/css/brands/<brand>` import 추가」 | CSS `@import` 는 규칙상 파일 맨 앞(`@charset` · 다른 `@import` 뒤)에만 둘 수 있어 브랜드 CSS 가 프로젝트 `:root` 정의보다 앞에 놓입니다. theme-only 처럼 `globals.css` 가 `:root` 에 shadcn 변수를 직접 정의하면, 라이트 브랜드 선택자 `[data-brand="b"]`(명시도 0,1,0)와 `:root`(0,1,0)가 같아 뒤에 오는 프로젝트 값이 이길 것으로 추론됩니다. 다크는 `[data-brand].dark`(0,2,0)가 `.dark`(0,1,0)를 이깁니다. **미실측 추론**입니다 | U2. 착수 직후 스파이크 S0 으로 실측합니다 |
| D6 | FR-2 의존성 추가 | 추가할 버전 범위를 정하지 않음 | U6 |
| D7 | FR-2 `axis theme add <brand>` | AC2(a) 프로젝트는 `@axis-ds/tokens` 가 없어 설치된 브랜드 목록으로 `<brand>` 를 검증할 수 없음 | U5 |
| D8 | FR-5 「FR-2 와 같은 탐색 순서」 | 기존 globals.css 검사 순서(루트 우선)와 FR-2 순서(`globalCss` → `app/` → `src/app/` → 루트)가 다름 | 기존 항목은 그대로 두고 brand 항목만 FR-2 순서를 씁니다(출력 불변 요구, 2.2) |
| D9 | FR-6 「cli 구성을 본떠」 | cli 는 `src/index.ts` 를 import 하면 실행되는 구조라 테스트가 모듈 단위 함수만 부릅니다. mcp 도 같음 | 테스트는 `src/tools/brand.ts` 핸들러와 공유 코어만 import 합니다 |

---

## 3. 데이터 출처 결정

1. **목록**: 대상 프로젝트에서 `createRequire(<baseDir>/package.json).resolve("@axis-ds/tokens/brands")` 로 `index.json` 을 찾습니다. Node 의 exports 해석을 그대로 쓰므로 pnpm 심볼릭 링크 · 호이스팅 · 상위 디렉터리 `node_modules` 를 따로 다루지 않습니다.
2. **메타데이터**: `index.json` 각 항목의 `meta`(`./brands/<b>/brand.json`)를 `@axis-ds/tokens` 뒤에 붙여 같은 방식으로 resolve 합니다. 경로를 코드에 박지 않고 index 가 준 값을 씁니다.
3. **import 경로**: 항목의 `css`(`./css/brands/<b>`)로 `@axis-ds/tokens/css/brands/<b>` 를 만듭니다. FR-2 · FR-4 · FR-5 가 같은 함수를 씁니다.
4. **주요 토큰(FR-3 · FR-4)**: `@axis-ds/tokens/css/brands/<b>` 를 resolve 해 CSS 를 읽고 라이트 · 다크 첫 블록에서 선언을 뽑습니다. 고를 변수 목록은 U4.
5. **상태 판정**: resolve 결과로 셋을 가릅니다. `MODULE_NOT_FOUND` = 미설치, `ERR_PACKAGE_PATH_NOT_EXPORTED` = 브랜드 미지원 버전(1.2.1 이하), 성공 = 지원. 버전 문자열은 `package.json` 이 exports 에 없어 직접 resolve 할 수 없으므로 `resolve("@axis-ds/tokens")`(`dist/js/tokens.js`)에서 위로 올라가 `name` 이 `@axis-ds/tokens` 인 `package.json` 을 찾아 읽습니다. 미설치 · 미지원이면 빈 목록 대신 설치 · 업그레이드 안내를 돌려줍니다(PRD FR-4, Q5 현재 안).
6. MCP 도 1~5 를 그대로 씁니다. 정적 번들을 새로 만들지 않습니다(PRD FR-4).

---

## 4. FR 별 구현 방식

### 4.1 공유 코어 `brand-core.ts` (FR-1 · FR-3 · FR-4 · FR-5)

- CLI `packages/axis-cli/src/theme/brand-core.ts` 를 원본으로 두고 MCP `packages/axis-mcp/src/tools/brand-core.ts` 에 **바이트 단위로 같은 사본**을 둡니다(U1 권장안). 사본 동일성은 MCP 테스트가 두 파일을 읽어 비교해 막습니다(tokens `brands.mjs` 의 「복제 + 드리프트 검사」와 같은 방식).
- 사본이 두 패키지에서 똑같이 컴파일되도록 Node 내장 모듈(`node:fs` · `node:path` · `node:module`)만 쓰고 chalk · fs-extra · zod 를 쓰지 않습니다. 출력 문자열을 만들지 않고 구조화된 값만 돌려줍니다.
- 공개 함수(이름은 착수 때 확정)
  - `resolveTokens(baseDir)` → `{ status: "ok" | "not-installed" | "unsupported", version?, indexPath? }`
  - `listBrands(baseDir)` → `{ status, brands: BrandSummary[] }`, `BrandSummary = { name, description, themes, a11y, importPath }`
  - `getBrand(baseDir, name)` → `BrandDetail = BrandSummary + { tokens: { light: Record<string,string>, dark: Record<string,string> }, providerExample, adjustments }`(`adjustments` 내용은 U3)
  - `parseBrandCss(css, name)` → `{ light, dark }` 선언 맵
  - `brandImportPath(entry)`, `findGlobalCss(baseDir, config)`(FR-2 순서, 찾은 상대 경로 또는 `undefined`), `findBrandImports(css)`(파일 안의 `@axis-ds/tokens/css/brands/<b>` import 이름 목록, `@import "..."` · `@import '...'` · `@import url(...)` 세 형태)
  - 상수 `BRAND_NAME_PATTERN`(tokens 와 같은 정규식), `MIN_BRAND_TOKENS_VERSION = "1.3.0"`, `KEY_TOKENS`(U4)
- 정렬과 내용은 index.json 순서(이름순)를 그대로 따릅니다. CLI · MCP 가 같은 값을 받으므로 AC3 의 동일성은 코어 결과의 동일성으로 판정할 수 있습니다.

### 4.2 CLI 명령 (FR-1 · FR-2 · FR-3)

`packages/axis-cli/src/theme/index.ts` 에 `registerThemeCommand(program)` 을 두고 `src/index.ts` 에서 `registerCheckCommand` 다음에 부릅니다. 하위 명령 셋 모두 `axis check` 와 같은 `-d, --dir <path>` 옵션을 받습니다(기본 현재 디렉터리).

- `axis theme list`: `listBrands` 결과를 `이름 · 설명 · 테마(light · dark)` 한 줄씩 출력합니다. `status` 가 미설치 · 미지원이면 `pnpm add @axis-ds/tokens@^1.3.0` 형태의 안내를 내고 종료 코드 1 로 끝냅니다(목록이 비었다는 뜻이 아니라 측정을 못 했다는 뜻이므로).
- `axis theme info <brand>`: 메타(설명 · 테마 · a11y 의 `status` · `checkedAt` · `gate`), import 경로, Provider 예시, 주요 토큰(라이트 · 다크 표), 보정 내역(U3)을 출력합니다. 없는 브랜드는 목록을 함께 보여 주고 종료 코드 1.
- `axis theme add <brand>`: `src/theme/theme-add.ts` `planThemeAdd(baseDir, brand)` 가 **쓰기 전에** 바꿀 내용을 모두 계산하고, `applyThemeAdd(plan)` 이 씁니다. 테스트는 두 함수를 따로 부릅니다.
  1. `axis.config.json` 이 없으면 아무것도 쓰지 않고 `axis init` 안내 후 종료 코드 1(PRD FR-2).
  2. `<brand>` 검증: `BRAND_NAME_PATTERN` 불일치는 거절. tokens 가 설치돼 있고 지원 버전이면 index 에 없는 이름은 거절. 미설치면 U5 권장안대로 이름 규칙만 보고 「설치 후 `axis theme list` 로 확인」 경고를 붙여 진행합니다.
  3. CSS: `findGlobalCss` 로 대상을 찾고, 같은 브랜드 import 가 이미 있으면 건너뜁니다. 없으면 `@charset` · 기존 `@import` 줄 다음(없으면 맨 앞)에 `@import "@axis-ds/tokens/css/brands/<b>";` 한 줄을 넣습니다(U2 결과에 따라 바뀔 수 있음). 다른 브랜드 import 가 있으면 지우지 않고 새 줄을 더한 뒤 「이전 브랜드 import 를 지워도 됩니다」 안내를 냅니다(U13). 대상이 없으면 수동 적용 안내(A1)만 내고 다음 단계로 갑니다.
  4. `package.json`: `dependencies` · `devDependencies` 어디에도 `@axis-ds/tokens` 가 없을 때만 `dependencies` 끝에 `"@axis-ds/tokens": "^1.3.0"`(U6)을 더하고 설치 명령을 안내합니다. 이미 있으면 범위를 고치지 않고, 설치된 버전이 1.3.0 미만이면 업그레이드만 안내합니다. 설치는 실행하지 않습니다.
  5. `axis.config.json`: 나머지 키와 순서를 보존한 채 `brand` 를 기록합니다(같은 값이면 쓰지 않음).
  6. Provider 안내: `import { ThemeProvider } from "@axis-ds/theme"` + `<ThemeProvider defaultBrand="<b>">` 예시와, `ThemeProvider` 나 `<html data-brand="<b>">` 가 없으면 import 만으로는 화면이 바뀌지 않는다는 문장을 출력합니다. `package.json` 에 `@axis-ds/theme` 이 없으면 설치 안내를 덧붙입니다. 코드는 고치지 않습니다(Q1, U10).
  - 파일 쓰기는 기존 들여쓰기 2칸과 끝 줄바꿈을 유지합니다(`fs.writeJSON(..., { spaces: 2 })` 와 같은 결과).

### 4.3 MCP 도구 (FR-4)

- `packages/axis-mcp/src/tools/brand.ts`: `handleListBrands({ targetDir })` · `handleGetBrand({ name, targetDir })` 가 코어 결과를 그대로 돌려주고, `formatListBrandsResult` · `formatGetBrandResult` 가 마크다운 글로 바꿉니다(기존 `formatCheckProjectResult` 문체). 미설치 · 미지원은 `isError` 없이 안내 글을 돌려줍니다(정상 응답 · 설치 필요).
- `src/index.ts` 에 `server.tool("axis.list_brands", ..., { targetDir: z.string().optional() }, ...)` 와 `server.tool("axis.get_brand", ..., { name: z.string(), targetDir: z.string().optional() }, ...)` 를 `axis.check_project` 와 같은 try/catch 형태로 추가합니다. 도구는 16 → 18개.
- **번들 경로 규칙**: 브랜드 도구는 패키지 안 파일을 `__dirname` 기준으로 읽지 않습니다. 대상 프로젝트 파일만 읽으므로 1.2 절의 결함 계열이 생기지 않습니다.

### 4.4 `axis.config.json` 의 `brand` 필드 (FR-2 설정)

- `packages/axis-cli/src/config/axis-config.ts`(신규)에 `AxisConfig` 인터페이스를 둡니다: `$schema?` · `componentsDir?` · `tailwindConfig?` · `globalCss?` · `registry?` · `template?` · `monetDir?`(`monet.ts:187` 이 이미 읽는 키) · `brand?: string`. `AXIS_CONFIG_SCHEMA_URL` 상수와 `readAxisConfig(baseDir)` 도 둡니다.
- `axis init`(`src/index.ts`)과 `initTemplate`(`template-apply.ts`)의 객체 리터럴에 `AxisConfig` 타입을 붙여 두 경로가 같은 정의를 따르게 합니다. 생성 내용(키 · 값 · 순서)은 바꾸지 않습니다. `brand` 는 생성 때 쓰지 않고 `axis theme add` 만 씁니다.
- 스키마 파일(`https://axis.minu.best/schema.json`)은 만들지 않습니다(Q2, U11 권장안).
- MCP 는 config 를 읽기만 하므로 코어 안에 최소 타입 `{ globalCss?: string; brand?: string }` 만 둡니다.

### 4.5 `axis check` · `axis.check_project` 의 brand 검사 (FR-5)

- CLI `template-check.ts`: `runCheck` 를 `collectCheckResults(baseDir): Promise<CheckResult[]>`(결과만 모음)와 출력부로 나눕니다. 출력 문구 · 순서는 그대로입니다.
- 두 검사기 모두 마지막에 `checkBrand(baseDir)` 를 더합니다. `axis.config.json` 이 없거나 `brand` 가 없으면 **결과를 추가하지 않습니다**(기존 프로젝트 출력 불변, PRD FR-5).
- `brand` 가 있으면 `findGlobalCss` 로 찾은 파일의 `findBrandImports` 결과와 비교합니다.

| 상황 | severity | 메시지(초안) |
|---|---|---|
| import 에 `brand` 가 있음 | pass | `brand "<b>" import 가 <파일>에 있습니다` |
| CSS 파일을 못 찾음 | warn | `brand "<b>" 가 설정됐지만 CSS 파일을 찾지 못했습니다` |
| import 가 없음 | warn | `brand "<b>" import 가 <파일>에 없습니다 → 'axis theme add <b>'` |
| 다른 브랜드만 import | warn | `brand "<b>" 와 import(<c>)가 다릅니다` |

- AC4 는 warn 1건 이상으로 판정합니다. MCP `handleCheckProject` 도 같은 함수(코어 사본)를 써서 같은 결과를 냅니다.

### 4.6 버전 표기 정정 (2.2)

- CLI: `src/index.ts` 에서 `createRequire(import.meta.url)("../package.json").version` 을 읽어 `.version(...)` 에 넘깁니다. 빌드 산출물 `dist/index.js` 기준 `../package.json` 도 패키지 루트라 개발 · 배포가 같습니다. `import pkg from "../package.json"` 은 `rootDir: "src"` 밖이라 dts 빌드에서 TS6059 가 날 수 있어 쓰지 않습니다(착수 때 실측으로 확인).
- MCP: `src/index.ts` 에서 같은 방식으로 `McpServer({ version })` 에 넘깁니다. `src/index.ts` 가 패키지 바로 아래 `src/` 에 있어야 성립하므로 이 코드는 하위 디렉터리로 옮기지 않습니다.

### 4.7 MCP 테스트 환경 (FR-6)

- `packages/axis-mcp/package.json`: devDependencies `vitest` `^2.1.0`(cli 와 같은 범위, lockfile 에 이미 있는 버전), scripts `"test": "vitest run"`.
- `packages/axis-mcp/vitest.config.ts`: cli 설정에서 coverage 블록만 뺀 형태(`globals` · `environment: "node"` · include `src/**/*.test.ts`).
- `packages/axis-mcp/turbo.json`(신규, tokens 의 M3 선례): `test.inputs` 에 `$TURBO_DEFAULT$` 와 `$TURBO_ROOT$/packages/axis-cli/src/theme/brand-core.ts` 를 넣어, CLI 원본만 바뀌어도 MCP 동일성 테스트가 캐시로 건너뛰지 않게 합니다.
- CI 는 `frontend.yml` 의 `pnpm test`(turbo)가 새 `test` 스크립트를 자동으로 잡습니다. 커버리지는 `turbo run test --dry=json` 의 태스크 수로 확인합니다. 현재 5개(agentic-ui · cli · theme · tokens · ui-react, e690905 에서 `turbo run test --dry=json` 의 `test` 태스크 중 `<NONEXISTENT>` 제외)이고 목표는 6개입니다.

---

## 5. 파일 단위 변경 목록

| # | 파일 | 변경 | FR · AC |
|---|---|---|---|
| 1 | `packages/axis-cli/src/theme/brand-core.ts` (신규) | 4.1 공유 코어 원본 | FR-1 · 3 · 4 · 5 |
| 2 | `packages/axis-cli/src/theme/theme-add.ts` (신규) | `planThemeAdd` · `applyThemeAdd` | FR-2, AC2 |
| 3 | `packages/axis-cli/src/theme/index.ts` (신규) | `registerThemeCommand`, list · info · add 출력 | FR-1 · 2 · 3, AC1 |
| 4 | `packages/axis-cli/src/config/axis-config.ts` (신규) | `AxisConfig` · `readAxisConfig` · 스키마 URL 상수 | FR-2 |
| 5 | `packages/axis-cli/src/index.ts` | 버전 읽기, `registerThemeCommand(program)`, init 객체에 `AxisConfig` 타입 | 2.2, FR-2 |
| 6 | `packages/axis-cli/src/template/template-apply.ts` | init 객체에 `AxisConfig` 타입(내용 불변) | FR-2 |
| 7 | `packages/axis-cli/src/template/template-check.ts` | `collectCheckResults` 분리, `checkBrand` 추가 | FR-5, AC4 |
| 8 | `packages/axis-cli/src/theme/brand-core.test.ts` (신규) | 코어 단위 테스트 | FR-1 · 3, AC1 |
| 9 | `packages/axis-cli/src/theme/theme-add.test.ts` (신규) | 멱등 · 경로 탐색 · config · package.json | FR-2, AC2(a) |
| 10 | `packages/axis-cli/src/template/template-check.test.ts` (신규) | brand 유무 · 일치 · 불일치 | FR-5, AC4 |
| 11 | `packages/axis-cli/test/fixtures/theme/` (신규) | fixture 원본(6장). `node_modules` · `dist` 이름은 루트 `.gitignore` 에 걸리므로(`git check-ignore -v` 실측, 부정 규칙 아님) `tokens-1.3/pkg/` 처럼 다른 이름으로 두고 테스트가 임시 디렉터리의 `node_modules/@axis-ds/tokens` 로 복사합니다 | 전부 |
| 12 | `packages/axis-cli/src/theme/test-helpers.ts` (신규, 테스트 전용) | fixture 를 임시 디렉터리에 펼치는 `makeProject({ tokens: "1.3" \| "1.2" \| "none", layout: "root" \| "app" \| "src-app" })` | 전부 |
| 13 | `packages/axis-mcp/src/tools/brand-core.ts` (신규) | 1번의 바이트 동일 사본 | FR-4 · 5 |
| 14 | `packages/axis-mcp/src/tools/brand.ts` (신규) | `handleListBrands` · `handleGetBrand` · format 2개 | FR-4 |
| 15 | `packages/axis-mcp/src/tools/index.ts` | 14번 export | FR-4 |
| 16 | `packages/axis-mcp/src/index.ts` | 도구 2개 등록, 버전 읽기 | FR-4, 2.2 |
| 17 | `packages/axis-mcp/src/tools/template.ts` | `handleCheckProject` 에 brand 검사 추가 | FR-5 |
| 18 | `packages/axis-mcp/src/tools/brand.test.ts` (신규) | AC3 동일성, 미설치 · 미지원 안내 | FR-4, AC3 |
| 19 | `packages/axis-mcp/src/tools/brand-core.sync.test.ts` (신규) | CLI 원본과 사본 바이트 비교 | U1 |
| 20 | `packages/axis-mcp/src/tools/template.test.ts` (신규) | check_project brand 검사 | FR-5, AC4 |
| 21 | `packages/axis-mcp/package.json` · `vitest.config.ts` (신규) · `turbo.json` (신규) | 4.7 | FR-6 |
| 22 | `pnpm-lock.yaml` | mcp importer 에 vitest 추가(`pnpm install --offline` 으로 새 다운로드 0 확인) | FR-6 |
| 23 | `packages/axis-cli/README.md` · `packages/axis-mcp/README.md` | theme 명령 · 브랜드 도구 절 | 문서 |
| 24 | `.changeset/<이름>.md` (1.3.0 배포 뒤) | `@axis-ds/cli` · `@axis-ds/mcp` minor | 2.2 |
| 25 | `docs/workitems/WI-0028-cli-mcp-brand/{todo,testplan,release-notes}.md` | 진행 현행화 | SSDD |

바꾸지 않는 것: `packages/axis-tokens/**`(PRD 2.2), `packages/axis-theme/**`, `apps/web/public/templates/*.json`(빌드가 고치면 되돌림), `project-todo.md`(PR #112 소관), PRD.

MCP 의 `src/tools/brand-core.ts` 를 1번 파일에서 tsup 으로 끌어와 묶는 방식은 쓰지 않습니다. `rootDir: "src"` 밖 파일을 dts 빌드에 넣게 되고, 1.2 절과 같은 번들 경로 함정을 새로 만듭니다.

---

## 6. fixture 기반 개발과 M3 뒤 재확인

### 6.1 fixture 구성 (main 에서 개발)

main 에는 브랜드 산출물이 없으므로 **M3 가 정한 1.3.0 배포본 형식**을 손으로 재현한 fixture 로 개발합니다. 형식의 출처는 1.3 절(main `brands.mjs` · `build-brands.mjs` 와 M3 `brandIndex`)이고, 값은 ontology 가 아니라 tokens 테스트 fixture `sample` 을 씁니다(M3 머지 전 ontology 값을 다른 브랜치에 복제하지 않기 위해).

| fixture | 내용 |
|---|---|
| `tokens-1.3/pkg/package.json` | `name: "@axis-ds/tokens"`, `version: "1.3.0"`, `main: "dist/js/tokens.js"`, exports 에 `"."` · `"./brands"` · `"./css/brands/sample"` · `"./brands/sample/brand.json"`(M3 와 같은 명시형) |
| `tokens-1.3/pkg/<dist>/brands/index.json` | `{ "brands": [{ "name": "sample", "css": "./css/brands/sample", "meta": "./brands/sample/brand.json" }] }` |
| `tokens-1.3/pkg/<dist>/brands/sample/brand.json` | `packages/axis-tokens/test/fixtures/brands/valid/sample/brand.json` 과 같은 내용 |
| `tokens-1.3/pkg/<dist>/css/brands/sample.css` | `brandHeader` + 라이트 · 다크 블록(4.1 의 형식). 값은 sample light/dark 의 일부와 shadcn 줄 |
| `tokens-1.3/pkg/<dist>/js/tokens.js` | `module.exports = {}` (resolve 기준점) |
| `tokens-1.2/pkg/` | 1.2.1 과 같은 exports(브랜드 키 없음), `version: "1.2.1"` |
| `projects/root/` | theme-only 와 같은 루트 평면 구조: `axis.config.json`(`globalCss: "./globals.css"`) · `globals.css`(`@tailwind base;` 로 시작) · `package.json`(`@axis-ds/tokens` 없음) |
| `projects/app/` | `app/globals.css` · `app/layout.tsx` · `axis.config.json`(`globalCss` 없음) |

- `<dist>` 는 복사할 때 `dist` 로 이름을 바꿉니다(5장 11번).
- fixture 의 index · brand.json · CSS 형식이 1.3 절과 맞는지는 테스트 안에서 상수로 단언하지 않고, 6.2 의 재확인 단계에서 실제 빌드 산출물과 바꿔 끼워 봅니다.

### 6.2 M3 머지 뒤 재확인 절차

1. main 을 M3 머지 커밋 위로 올리고 `pnpm --filter @axis-ds/tokens build` 를 `--force` 로 돌립니다(turbo 캐시 우회). 산출물에 `dist/brands/index.json` · `dist/brands/ontology/brand.json` · `dist/css/brands/ontology.css` 가 있는지 `ls` 로 확인합니다.
2. **형식 대조**: 산출물 `index.json` 키 집합과 항목 형태, `brand.json` 최상위 키, CSS 블록 머리(라이트 1줄, 다크 3줄 선택자)를 fixture 와 비교합니다. 다르면 fixture 를 산출물에 맞추고 코어를 고칩니다(fixture 가 낡은 쪽).
3. **실데이터 테스트**: `pnpm --filter @axis-ds/tokens pack` 으로 tarball 을 만들어 임시 프로젝트에 `file:` 로 설치하고, CLI `theme list` · `theme info ontology` · MCP `axis.list_brands` · `axis.get_brand` 를 실행합니다. AC1(`ontology` 출력)은 여기서 처음 실측합니다.
4. 주요 토큰 목록(U4)이 ontology 산출물에 실제로 있는지 봅니다. 없는 키는 「브랜드가 덮어쓰지 않음」으로 표시되는지 확인합니다.
5. `a11y.status` 가 긴 문장(1.3 절)이라 `theme list` 한 줄 출력에서는 빼고 `info` 에서만 전부 냅니다. 출력 폭은 이 단계에서 실물로 확인합니다.
6. S0 스파이크(U2)를 아직 실측하지 못했다면 이 tarball 로 실측합니다.

### 6.3 1.3.0 배포 뒤

1. 레지스트리에서 `npm view @axis-ds/tokens@1.3.0 exports --json` 으로 `./brands` 가 실제 배포본에 있는지 확인합니다.
2. AC2(b): App Router Next.js 프로젝트(Next 15)를 새로 만들고 `axis init -y` → `axis theme add ontology` → `pnpm install` → `pnpm build` 가 rc 0 인지 봅니다. 레지스트리 설치이므로 `file:` 주입이 없습니다(스모크 우회 방지).
3. changeset 추가(7장) → PR 리뷰 → 머지.

---

## 7. 버전 · changeset 계획

- `@axis-ds/cli` · `@axis-ds/mcp` 1.1.4 → **1.2.0**(minor). linked 그룹(`.changeset/config.json`: tokens · ui-react · agentic-ui · theme)에 속하지 않으므로 changeset 하나에 두 패키지를 `minor` 로 적습니다. 1.2.0 이 linked 패키지의 1.2.0 과 번호만 겹치는 문제(PRD Q3)는 U9 에서 정합니다.
- **changeset 은 1.3.0 배포가 끝난 뒤 넣습니다.** `publish.yml` 은 main push 때 changesets/action 이 Version Packages PR 을 만들고 그 PR 머지로 발행하므로, 1.3.0 전에 changeset 을 main 에 넣으면 cli · mcp 1.2.0 이 `@axis-ds/tokens@^1.3.0` 을 안내하는데 그 버전이 아직 없는 상태로 나갈 수 있습니다. 코드 PR 은 draft 로 열어 두고, 1.3.0 배포 확인(6.3 의 1) 뒤 changeset 커밋을 더해 ready 로 바꿉니다.
- `@axis-ds/tokens` 는 이 WI 에서 올리지 않습니다(PRD 2.2).
- 릴리스 노트 `release-notes.md` 는 changeset 과 같은 커밋에서 씁니다.

---

## 8. 미결 (U 번호)

권장안을 전제로 4~7장을 썼습니다. 「게이트」는 권장안이 PRD 범위 · 요구사항을 바꾸므로 사용자 결정 전 착수하지 않는 항목입니다.

| # | 갈림길 | 권장안 | 게이트 |
|---|---|---|---|
| U1 | CLI · MCP 공유 코어 방식 | 복제 + 바이트 동일성 테스트 | 아니오 |
| U2 | 브랜드 import 위치(D5) | S0 스파이크로 cascade 를 먼저 실측하고, 프로젝트 `:root` 가 이기면 위치를 다시 정함 | 위치를 바꾸면 예(FR-2 변경) |
| U3 | FR-3 보정 내역 출처(D4, M3 PRD Q6) | 이번 WI 는 `a11y` 메타와 근거 문서 안내만, 보정 전 · 후 값은 후속 | 예(FR-3 축소) |
| U4 | 「주요 토큰」 목록 | 고정 목록 12개(아래) | 아니오(PRD 미정 갈림길) |
| U5 | tokens 미설치 시 `add <brand>` 검증(D7) | 이름 규칙만 보고 경고와 함께 진행 | 아니오 |
| U6 | 추가할 tokens 범위(D6) | `^1.3.0` | 아니오 |
| U7 | MCP 기존 데이터 경로 결함(1.2 절) | 이 WI 밖, 별도 patch WI | 포함하면 예(범위 추가) |
| U8 | 기본 토큰 CSS(`@axis-ds/tokens/css` · `css/shadcn`)가 없는 프로젝트 | 안내만, 자동 추가 안 함 | 자동 추가면 예 |
| U9 | 버전 번호(Q3)와 PRD 기준 버전 표기(D1) | 1.2.0 유지, PRD 정정은 PRD 담당 PR 에서 | PRD 수정은 예 |
| U10 | `ThemeProvider` 자동 수정(Q1) | 안내만 | 아니오(PRD 현재 서술과 같음) |
| U11 | `axis.config.json` 스키마 파일(Q2) | TS 타입만, 스키마 파일 없음 | 아니오 |
| U12 | tokens 미설치 시 MCP 응답(Q5) | 설치 안내만(PRD 현재 안) | 아니오 |
| U13 | 다른 브랜드 import 가 이미 있을 때 | 기존 줄 유지 + 새 줄 추가 + 안내 | 아니오 |

U4 고정 목록(라이트 · 다크 각각, 브랜드 CSS 에 있는 것만 출력): `--primary` · `--primary-foreground` · `--background` · `--foreground` · `--ring` · `--radius` · `--axis-surface-default` · `--axis-text-primary` · `--axis-text-brand` · `--axis-button-bg-default` · `--axis-border-focus` · `--axis-font-family-sans`.
