# 테스트 계획 - WI-0028: CLI · MCP 브랜드 명령

> 작성일: 2026-10-19 | 상태: 구현 · 검증 진행(P1 ~ P6 완료, T7-2 AC2(b) 결정 대기, T7-4 배포 뒤) | PRD: [prd.md](./prd.md) | Plan: [plan.md](./plan.md) | TODO: [todo.md](./todo.md)
> 기준선(e690905, 2026-10-19 실측): cli `npx vitest run` 3파일 58건 통과(rc 0), mcp 테스트 파일 0개 · vitest 없음, `turbo run test --dry=json` 의 test 태스크 5개.
> 결과는 실행한 HEAD · 명령 · `--force` 여부와 함께 적습니다. turbo cached 결과와 0건 · 무출력은 rc · 건수로 측정 수행을 증명하기 전에는 통과 근거로 쓰지 않습니다.

---

## 1. 판정 원칙

- **fixture 단계(P1~P5)**: 1.3.0 배포본 형식을 재현한 fixture(plan 6.1)로 단위 테스트합니다. 형식 일치는 이 단계에서 증명되지 않으므로 P6 대조(T6-2)를 통과해야 AC1 · AC3 을 완료로 봅니다. AC2(a) 도 fixture(T3-4)만으로 완료로 보지 않고, 실제 `axis template init theme-only` 산출물에서 확인(T6-6)해야 완료로 봅니다.
- **실데이터 단계(P6)**: 실제 tokens 빌드 산출물을 tarball 로 설치해 확인합니다. `file:` 설치는 레지스트리 경로가 아니므로 AC2(b) 근거로 쓰지 않습니다.
- **배포 단계(P7)**: AC2(b) 는 레지스트리에서 받은 `@axis-ds/tokens@1.3.0` 으로만 판정합니다.
- **음성 대조군**: 검사형 테스트(FR-5, 동일성 테스트)는 일부러 어긋나게 만든 입력에서 실패하는지 함께 봅니다. 통과 수가 늘었다는 것만으로 판정하지 않습니다.

## 2. AC 대응표

| AC | 테스트 | 단계 |
|---|---|---|
| AC1 `axis theme list` 가 `ontology` 출력 | T2-4(fixture `sample`), **T6-3(실데이터)** | P2 · P6 |
| AC2(a) theme-only 구조에서 두 번 실행 멱등 | T3-4(fixture), **T6-6(실경로)** | P3 · P6 |
| AC2(b) App Router 프로젝트 `pnpm build` 통과 | T3-2b(fixture), **T7-2** | P3 · P7 |
| AC3 MCP 응답 = CLI 출력 내용 | **T5-5**(fixture), T6-4(실데이터) | P5 · P6 |
| AC4 brand · import 불일치 경고 | **T4-3** · T4-4 | P4 |

---

## T0. 스파이크 (U2 판단 근거, 코드 PR 밖)

- [x] T0-1: Next 15 App Router 프로젝트의 `app/globals.css` 가 `@tailwind base` + `@layer base { :root { --primary: ... } }` 를 가질 때, 맨 앞 `@import "@axis-ds/tokens/css/brands/<b>"` 의 라이트 `--primary` 가 `<html data-brand="<b>">` 에서 계산값으로 적용되는지 (`getComputedStyle(document.documentElement).getPropertyValue('--primary')`) → **아니오**. `240 5.9% 10%`(프로젝트 값, 대조군과 같음). plan 8.1 vC
- [x] T0-2: 같은 조건에서 다크(`<html class="dark" data-brand>`) 계산값 → 브랜드 값 `180 81% 43%` 이 이김. plan 8.1 vC
- [x] T0-3: 대조군 - `layout.tsx` 에서 `import './globals.css'` 뒤에 브랜드 CSS 를 JS import 했을 때 같은 두 값 → 라이트 · 다크 모두 브랜드 값. plan 8.1 vD
- [x] T0-4: theme-only 루트 평면 구조에서 `@import` 가 빌드 단계에서 풀리는지(패키지 exports 하위 경로 해석) → 루트 평면 그대로는 `next build` 가 CSS 처리 전에 rc 1(`Couldn't find any 'pages' or 'app' directory`)이라 판정 불가. 파일을 `app/` 으로 옮긴 변형에서는 exports 하위 경로가 풀려 산출 CSS 에 브랜드 블록이 들어감. plan 8.1
- 브랜드 CSS 는 M3 브랜치 tokens 를 `pnpm pack` 한 tarball, 또는 M3 머지 뒤 main 빌드 산출물을 씁니다. 결과는 plan 2장 D5 에 실측으로 옮겨 적습니다.
- 2026-10-19 실측은 main `buildBrands` 로 만든 fixture `sample` 브랜드를 썼습니다(조건 · 전제 · 전체 값은 plan 8.1). ontology 산출물로는 P6 에서 한 번 더 잽니다.
- U2 결정(2026-10-19): 대안 2. FR-2 위치는 그대로이고 M3 에서 라이트 선택자 명시도를 올립니다. P6 의 재측정(T6-7)은 라이트 승리를 확인 항목으로 둡니다.

## T1. 공통 기반 (P1)

- [x] T1-1: `node packages/axis-cli/dist/index.js --version` 출력 = `packages/axis-cli/package.json` version (빌드 뒤 실측, 대조군: 정정 전 `0.1.0`) → 정정 전 `0.1.0`, 정정 뒤 `1.1.4`(package.json 1.1.4), rc 0. 소스 단위 테스트 `src/version.test.ts` 3건은 `.version("0.1.0")` 으로 되돌리면 1건 실패(음성 대조군)
- [x] T1-2: 빌드한 MCP 서버에 stdio `initialize` → `serverInfo.version` = `packages/axis-mcp/package.json` version → 정정 전 `0.1.0`, 정정 뒤 `1.1.5`(package.json 1.1.5), 같은 세션 `tools/list` 16개(대조군). 소스 단위 테스트 `src/version.test.ts` 3건은 `version: "0.1.0"` 으로 되돌리면 1건 실패(음성 대조군)
- [x] T1-3: `axis init -y` · `initTemplate` 이 만드는 `axis.config.json` 의 키 · 값 · 순서가 정정 전과 같음(단위 테스트, 임시 디렉터리) → `src/config/axis-config.test.ts` 8건 통과(정정 전 파일 내용과 바이트 비교, 값 하나를 바꾼 음성 대조군 포함). 빌드 CLI 의 `init -y` 산출물 sha256 정정 전 · 뒤 모두 `8f227788...6fcb385`
- [x] T1-4: `pnpm --filter @axis-ds/mcp test` rc 0, 실행 테스트 수 1 이상 → 2파일 5건 통과, rc 0(`version.test.ts` 3 · `tools/template.test.ts` 2, 후자는 P4 전 `handleCheckProject` 기준선)
- [x] T1-5: `turbo run test --dry=json` test 태스크 6개(@axis-ds/mcp 추가) → `<NONEXISTENT>` 제외 6개(agentic-ui · cli · mcp · theme · tokens · ui-react). mcp test inputs 에 `../../packages/axis-cli/src/theme/brand-core.ts` 가 들어감(파일은 P2 에서 생김)

## T2. 공유 코어 · list · info (P2, FR-1 · FR-3)

- [x] T2-1: `resolveTokens` - tokens-1.3 fixture `ok` · tokens-1.2 fixture `unsupported` · 미설치 `not-installed` · tokens-1.3-unbuilt fixture(`dist` 없음) `not-built`. 버전 문자열을 함께 돌려주고, `not-built` 에서도 `1.3.0` 을 읽음(`dist` 실재에 기대지 않음). 음성 대조군: `not-built` fixture 가 `not-installed` 로 판정되지 않음 → `src/theme/brand-core.test.ts` 5건 통과(하위 디렉터리에서 위로 찾는 경우 포함). 미설치 케이스는 임시 디렉터리 위로 `node_modules/@axis-ds/tokens` 가 없음을 먼저 단언. 변이 M1(`MODULE_NOT_FOUND` 를 `not-installed` 로)을 넣으면 이 항목과 T2-5 unbuilt 가 실패(2건), 되돌린 뒤 sha 원본과 같음
- [x] T2-2: `listBrands` - index.json 항목 수와 결과 수가 같고, 각 항목의 `description` · `themes` · `a11y` 가 brand.json 과 같음. 대조군: index 에 없는 브랜드 디렉터리는 결과에 없음 → 4건 통과(`dist/brands/ghost/brand.json` 을 더한 대조군 포함). 변이 M3(index 대신 `dist/brands` 디렉터리 열거)을 넣으면 대조군 1건 실패
- [x] T2-3: `parseBrandCss` - 라이트 블록 · 다크 블록(선택자 3줄) 선언을 분리. 다크 블록이 없는 CSS 는 다크 빈 맵 → 4건 통과. fixture CSS 는 M3 형식(라이트 `[data-brand="sample"][data-brand="sample"]`)이고 라이트 12 · 다크 8 선언, 0,1,0 라이트 형식 · 다른 브랜드 블록 무시도 확인. 변이 M2(라이트를 0,1,0 선택자로만 인식)를 넣으면 4건 실패
- [x] T2-4: `axis theme list` 출력에 `sample` · 설명 · `light` · `dark` 포함, rc 0 → `src/theme/theme-commands.test.ts`(commander 에 `registerThemeCommand` 로 등록해 실행) 통과. 빌드 산출물 `node packages/axis-cli/dist/index.js theme list -d <tokens-1.3 fixture 프로젝트>` 도 같은 출력, rc 0
- [x] T2-5: 미설치 · 미지원 · 빌드 산출물 없음에서 각각 설치 · 업그레이드 · 빌드(재설치) 안내, rc 1, 빈 목록 문구를 내지 않음 → 3건 통과. 빌드 산출물로도 none · 1.2 · 1.3-unbuilt 각각 rc 1 과 안내 문구 확인. 리뷰 보정(724d94b): index.json 은 있는데 `brand.json` 이 없는 부분 빌드에서 `listBrands` · `getBrand` 가 `not-built`(CSS 만 없을 때 `getBrand` 도 `not-built`), `theme list` · `theme info` 는 빌드 전 안내와 rc 1 이고 스택 트레이스 없음 → 4건 통과(음성 대조군: 파일이 다 있으면 `ok`). 변이(`not-built` 반환을 끔)에서 3건 실패. 수정 전 빌드 CLI 는 같은 프로젝트에서 `MODULE_NOT_FOUND` 스택 트레이스 · rc 1, 수정 뒤 빌드 CLI 는 안내 · rc 1, 빌드 MCP stdio `axis.list_brands` · `axis.get_brand` 는 안내 글과 `isError` false
- [x] T2-6: `axis theme info sample` 에 import 경로 `@axis-ds/tokens/css/brands/sample`, `defaultBrand="sample"` 예시, 주요 토큰 라이트 · 다크 값. 없는 브랜드는 rc 1 + 목록 안내 → 명령 3건 · 코어 3건 통과. 주요 토큰 12개 중 sample 에 있는 8개만 표로 내고 나머지 4개는 「브랜드가 덮어쓰지 않음」 줄. 빌드 산출물 `theme info sample` rc 0, `theme info nope` rc 1
- [x] T2-7: 보정 내역 출력(U3 결정 내용대로) → a11y `status` · `checkedAt` · `gate`(null 은 `-`)와 근거 문서 「WI-0025 PRD 부록 B」, 「보정 전 · 후 값은 이 버전에서 출력하지 않습니다」 1건 통과
- 참고(AC1 판정 아님, P6 에서 tarball 로 다시 잼): 임시 프로젝트에 `node_modules/@axis-ds/tokens` 를 워크스페이스 `packages/axis-tokens` 로 심볼릭 링크하고(`node build-tokens.mjs` 직접 실행 산출물, rc 0) 빌드 CLI 로 `theme list` · `theme info ontology` 를 돌리면 둘 다 rc 0, `ontology` 와 주요 토큰 12개가 모두 나옴. 링크는 레지스트리 · tarball 경로가 아니므로 형식 확인 참고로만 씀. `--axis-font-family-sans` 값이 길어 표 폭이 넓어지는 것은 6.2-5 에서 다시 봄

## T3. theme add (P3, FR-2)

- [x] T3-1: `axis.config.json` 없는 디렉터리 - 파일 변경 0(실행 전후 파일 목록 · 내용 해시 비교), rc 1, `axis init` 안내 → `src/theme/theme-add.test.ts` 2건 통과(config JSON 파손도 변경 0 · rc 1). 빌드 산출물로도 rc 1 · 변경 0
- [x] T3-2: 탐색 순서 - `globalCss` 지정 · `app/globals.css` · `src/app/globals.css` · 루트 `globals.css` 가 함께 있을 때 각각 우선순위대로 하나만 고름. `globalCss` 키가 없을 때(projects/src-app)는 두 번째 후보부터 봄 → 2건 통과(네 후보를 앞에서부터 하나씩 지우며 매번 쓸 CSS 파일이 정확히 1개인지 확인) + 코어 `findGlobalCss` 3건(디렉터리는 파일로 보지 않음 포함)
- [x] T3-2b: `globalCss` 키가 없는 파일을 가리킬 때(projects/app-init, `axis init -y` 산출물과 같은 config) - `app/globals.css` 에 import 정확히 1줄, `globalCss` 경로 없음 경고 출력, `axis.config.json` 의 `globalCss` 값 불변. 음성 대조군: 수동 안내(A1)만 내고 import 0줄로 끝나는 구현이면 이 테스트가 실패함을 한 번 확인(폴백을 끈 상태로 실행) → 1건 통과. 변이 M4(`configuredMissing` 뒤 바로 반환해 폴백을 끔)에서 이 항목 · T3-2 · 코어 1건, 3건 실패. 빌드 산출물로도 경고 줄과 import 1줄, `src/app` 미생성
- [x] T3-3: 삽입 위치 - `@charset` · 기존 `@import` 다음, 없으면 첫 줄. `@tailwind base;` 보다 앞 (U2 대안 2 결정으로 이 위치 확정, 2026-10-19. 라이트 승리는 T6-7 에서 확인) → 6건 통과(`@charset` 만 · 앞쪽 주석 · 규칙 뒤 `@import` 무시 · CRLF · theme-only 실파일 포함). 변이 M7(맨 끝에 삽입)에서 7건 실패. 리뷰 보정(724d94b): 맨 앞 UTF-8 BOM 은 떼어 두었다가 결과 맨 앞에 다시 붙임 → 2건 추가 통과(`insertImportLine` 단위 · `theme add` 실행, 결과가 BOM 으로 시작하고 중간 BOM 0개). 변이(BOM 처리 끔)에서 2건 실패. 수정 전 빌드 CLI 결과는 `@import ...;\n` 뒤에 BOM(357 273 277)이 와서 postcss 8.5.6 `parse` 가 `Unknown word`, 수정 뒤 빌드 CLI 결과는 BOM 이 맨 앞이고 `parse` 성공(노드 2개)
- [x] **T3-4 (AC2(a) fixture 판)**: `theme-only.json` 을 펼친 프로젝트(plan 6.1, `initTemplate` 형태 config, tokens 없음)에서 2회 실행 뒤 `globals.css` 의 브랜드 import 정확히 1줄, `package.json` 의 `@axis-ds/tokens` 키 1개, `axis.config.json` `brand: "sample"`. 2회차 실행의 파일 변경 0 → 1건 통과. 빌드 산출물로도 1회차 변경 3파일(`axis.config.json` · `globals.css` · `package.json`) · 2회차 변경 0 · import 1줄 · tokens 키 1개. 변이 M5(같은 브랜드 import 감지 끔) · M8(기존 범위 덮어씀)에서 각각 실패. fixture 판이라 AC2(a) 완료 판정은 T6-6
- [x] T3-5: tokens 없을 때 `dependencies["@axis-ds/tokens"] === "^1.3.0"`, 설치 명령 미실행(자식 프로세스 호출 0) → 2건 통과(`node:child_process` · `child_process` 의 spawn · exec 계열 7개 호출 합 0, `node_modules` 미생성. devDependencies 에 있으면 추가 안 함). 양성 대조군: 변이 M6(apply 끝에 `execSync("true")`)에서 이 항목 1건 실패
- [x] T3-6: tokens `^1.2.1` 이 이미 있으면 범위 불변 + 업그레이드 안내 → 2건 통과(package.json 바이트 불변. 음성 대조군: tokens 1.3.0 이면 업그레이드 안내 없음)
- [x] T3-7: 이름 규칙 위반(`Bad_Name`) 거절 · 설치돼 있는데 index 에 없는 이름 거절 · 미설치면 경고와 함께 진행 → 4건 통과(거절 두 경우 파일 변경 0 · rc 1. 음성 대조군: index 에 있으면 경고 없음). 빌드 산출물 `nope` · `Bad_Name` rc 1
- [x] T3-8: 다른 브랜드 import 가 있을 때 기존 줄 유지 + 새 줄 추가 + 안내(U13) → 3건 통과(같은 브랜드가 `url('...')` 형태로 있으면 추가 안 함, 주석 안의 import 는 없는 것으로 봄) + 코어 `findBrandImports` 2건
- [x] T3-9: 출력에 `defaultBrand` 예시와 「Provider · `data-brand` 가 없으면 화면이 바뀌지 않음」 문장 → 2건 통과(theme 1.3.0 조건 · `@axis-ds/theme` 설치 안내 포함, `layout.tsx` 불변)
- [x] T3-10: 후보 CSS 파일이 모두 없는 프로젝트 - 수동 안내, `package.json` · config 는 갱신 → 1건 통과(CSS 파일 생성 0)
- [x] T3-11: 쓰는 파일의 들여쓰기 2칸 · 끝 줄바꿈 유지, config 의 다른 키 순서 유지 → 3건 통과(기존 `brand` 키는 제자리에서 값만 바뀜, 4칸 · 탭 · 끝 줄바꿈 없음 · CRLF 도 원래 형식을 따름). 판정 범위는 들여쓰기 · 줄바꿈 · 끝 줄바꿈 · 키 순서뿐입니다. `package.json` · `axis.config.json` 은 `JSON.stringify` 로 다시 쓰므로(plan 4.2 의 `fs.writeJSON(..., { spaces: 2 })` 와 같은 결과) 한 줄 배열은 여러 줄로 펼쳐지고 `\u` · `\/` 이스케이프는 풀립니다(2026-10-19 빌드 CLI 실측, `"files": ["dist"]` 가 3줄로, `"caf\u00e9 \/x"` 가 `"café /x"` 로 바뀜). 최소 편집으로 바꿀지는 결정 대기
- [x] T3-12: 쓰기 대상 CSS 의 실제 경로(realpath)가 프로젝트 밖이면 `css-outside-project` 오류로 아무것도 쓰지 않음, rc 1 → 4건 통과(`globalCss` 의 `../` · 밖의 절대경로 · 밖을 가리키는 `app/globals.css` 심볼릭 링크에서 프로젝트 · 밖 디렉터리 해시 불변, 음성 대조군: 프로젝트 안 절대경로 · 안을 가리키는 심볼릭 링크는 그대로 씀). 변이(거절 끔)에서 3건 실패. 빌드 CLI 로도 `../outside/globals.css` 에서 rc 1, 밖 파일 · `package.json` 불변 (리뷰 보정, 724d94b)
- [x] T3-13: 쓰기 실패 - 쓰기 전 모든 대상의 쓰기 권한을 확인하고, 쓰는 도중 실패하면 먼저 쓴 파일을 계획 전 내용으로 되돌림. CLI 는 스택 트레이스 대신 안내와 rc 1 → 2건 통과(`axis.config.json` 읽기 전용에서 변경 0 · rc 1 · 「바뀐 파일이 없습니다」, `writeFileSync` 에 세 번째 파일 실패를 주입하면 앞 두 파일이 원래 내용 · `ThemeApplyError` 의 되돌린 파일 2개). 변이(권한 확인 끔 · 되돌림 끔)에서 각각 1건 실패. 빌드 CLI 로도 읽기 전용 config 에서 rc 1, `globals.css` · `package.json` 불변(수정 전에는 두 파일이 바뀐 채 스택 트레이스 · rc 1) (리뷰 보정, 724d94b)

## T4. check 의 brand 검사 (P4, FR-5)

- [x] T4-1: brand 없는 fixture 에서 `collectCheckResults` 결과(이름 · severity · 문구 · 개수)가 정정 전 `runCheck` 출력과 같음. 정정 전 출력은 착수 직전 HEAD 에서 캡처해 기대값으로 고정 → 1e84f15 에서 빈 디렉터리 · theme-only · app-init · src-app · config 파손 · 5항목 pass 프로젝트 6개의 `runCheck` 출력(색 제거)을 `packages/axis-cli/test/fixtures/check/run-check-baseline.json` 으로 고정. `src/template/template-check.test.ts` 13건 통과(프로젝트마다 `runCheck` 출력 줄 단위 일치 · `collectCheckResults` 5항목과 출력 줄 일치). 기존 문구 하나를 바꾼 변이에서 2건 실패. `FORCE_COLOR=1` 로 돌려도 26건 통과(색 코드를 지우고 비교)
- [x] T4-2: config 없음 · `brand` 없음 · config JSON 파손에서 brand 항목이 추가되지 않음(파손은 기존 동작 유지 여부를 함께 기록) → 2건 통과(`brand` 빈 문자열 · 숫자도 추가 안 함). 파손 config 는 기존 동작 그대로 `axis.config.json` 항목 pass(존재만 봄), brand 항목 없음, 5항목. 코어 `readBrandConfig` 는 파손 · 배열 · `null` 에서 `null`(코어 2건)
- [x] **T4-3 (AC4)**: brand 일치 pass, import 없음 warn, 다른 브랜드만 import warn, CSS 없음 warn. 음성 대조군: 일치 fixture 에서 warn 0. projects/app-init 에 `theme add` 한 뒤의 check 는 `app/globals.css` 를 검사해 pass(globalCss 경로 없음 표기 포함) → 11건 통과(주석 안 import 는 없음으로 봄 · 다른 브랜드와 함께 있으면 pass · globalCss 가 가리키는 파일을 루트 `globals.css` 보다 먼저 봄 · `runCheck` 출력의 brand 줄과 합계 포함) + 코어 `inspectBrandImport` 1건. 일치 프로젝트는 6항목 모두 pass(warn 0). app-init + tokens-1.3 에 `planThemeAdd` · `applyThemeAdd` 뒤 `brand "sample" import 가 app/globals.css에 있습니다 (globalCss ./src/app/globals.css 없음)` pass, 같은 프로젝트에 brand 만 적은 대조군은 warn. 변이 M9(CLI `checkBrand` 끔) 11건 실패, M10(다른 브랜드도 일치로 봄) 2건 실패. 빌드 산출물 `node dist/index.js check -d <app-init + tokens-1.3 fixture>` 에서 brand 없음 · import 없음 · `theme add` 뒤 · 다른 브랜드 순으로 5항목 출력(기준선과 같음) · warn · pass · warn
- [x] T4-4: MCP `handleCheckProject` 가 T4-3 과 같은 severity 를 냄, brand 없는 fixture 에서 결과 개수 불변 → `src/tools/template.test.ts` 7건 추가 통과(기준선 2건 유지). 일치 pass · summary warn 0, import 없음 · 다른 브랜드 · CSS 없음 warn, globalCss 없는 파일을 가리키면 `app/globals.css` 검사, 문구는 CLI 테스트 기대 문구와 같은 문자열. brand 없음 · config 없음 · 파손에서 5항목. 변이 M12(MCP brand 검사 끔) 6건 실패. 빌드한 MCP 서버 stdio `tools/call axis.check_project` 에서 `[WARN] brand "sample" 와 import(ontology)가 다릅니다 (globalCss ./src/app/globals.css 없음)`, `isError` 없음, `tools/list` 16개(P5 전)

## T5. MCP 브랜드 도구 (P5, FR-4 · AC3)

- [x] T5-1: `src/tools/brand-core.ts` 와 CLI `src/theme/brand-core.ts` 의 바이트 동일. 음성 대조군: 사본에 공백 하나를 더한 상태에서 테스트가 실패하는 것을 한 번 확인하고 되돌림 → P4 에서 선행(T4-4 가 사본을 씀). `src/tools/brand-core.test.ts` 1건 통과, 변이 M11(사본 끝에 공백 1자) 1건 실패, 되돌린 뒤 `cmp` 같음. P5 에서 원본을 고치면 다시 확인
- [x] T5-2: `handleListBrands` · `handleGetBrand` 가 fixture 에서 코어 결과를 그대로 돌려줌 → `src/tools/brand.test.ts` 3건 통과(tokens-1.3 의 목록 · 상세 값, 없는 브랜드 `brand: null` · `available: ["sample"]`, 빈 `name` 오류). fixture 는 CLI `test/fixtures/theme` 원본을 임시 디렉터리로 복사(`_dist` → `dist`). 이 테스트가 CLI fixture 를 읽으므로 mcp `turbo.json` test inputs 에 `$TURBO_ROOT$/packages/axis-cli/test/fixtures/theme/**` 를 더함(dry 에서 inputs 31 → 46, 더해진 15개 = 추적 fixture 15개)
- [x] T5-3: 빌드 산출물 stdio `tools/list` 18개, 이름에 `axis.list_brands` · `axis.get_brand`. WI-0036(#116)이 PR CI(frontend.yml) 의 pack-smoke 배선과 함께 머지된 뒤에는 `scripts/mcp-smoke.mjs` `EXPECTED_TOOLS` 에 두 이름을 더하고 PR CI 의 pack-smoke 가 통과하는지 함께 봄(그 뒤로는 목록을 안 고치면 PR CI 실패. 배선 머지 전에는 PR CI 가 초록이고 main push 의 publish.yml Pack smoke 가 발행을 막음) → (HEAD 2136ad4 + P5 미커밋 변경) `pnpm turbo run build --filter='./packages/*' --force`(6 tasks, cached 0, rc 0) 뒤 `dist/index.js` stdio `tools/list` 18개, 두 이름 포함. WI-0036 배선이 main 에 있어(frontend.yml `Pack smoke`) `EXPECTED_TOOLS` 에 두 이름을 더함. 음성 대조군: 더하기 전 `node scripts/pack-smoke.mjs` rc 1(`tools/list 에 목록 밖 도구: axis.list_brands, axis.get_brand`), 더한 뒤 `pnpm pack-smoke` rc 0(6개 패키지 통과, mcp `tools/list 18개, 레지스트리 도구 호출 6건`, pack-install-smoke 통과). PR CI 통과는 push 전이라 미관측
- [x] T5-4: 미설치 · 미지원 fixture 에서 `isError` 없음, 안내 문구에 설치 명령 → 3건 통과(tokens none · 1.2 · 1.3-unbuilt 각각 `status` not-installed · unsupported · not-built, 빈 `brands`, 목록 · 상세 글 모두 `pnpm add @axis-ds/tokens@^1.3.0` 포함, throw 없음). 변이 M14(미설치 안내에서 설치 명령을 지움) 1건 실패. 도구 단계의 `isError` 없음은 T5-6 stdio 에서 확인
- [x] **T5-5 (AC3)**: 같은 fixture 에서 MCP 핸들러 결과와 CLI 코어 결과가 deep equal 이고, `formatListBrandsResult` · `formatGetBrandResult` 글에 CLI 출력이 담는 항목(이름 · 설명 · 테마 · import 경로 · `defaultBrand` 예시 · 주요 토큰 값)이 모두 있음 → 5건 통과. tokens 1.3 · 1.2 · none · 1.3-unbuilt 4개 fixture 에서 `handleListBrands` · `handleGetBrand(sample)` · `handleGetBrand(nope)` 결과가 CLI 원본 `packages/axis-cli/src/theme/brand-core.ts` 를 동적 import 해 얻은 결과와 deep equal(사본이 아니라 원본과 비교). format 글에 이름 · 설명 · 테마 · import 경로 · Provider 예시 전체 · 라이트 8개 · 다크 6개 토큰 값 · a11y 메타 3개 · 근거 문서. 변이 M13(핸들러가 `version` 을 지움)에서 4건 실패. fixture 판이라 실데이터는 T6-4
- [x] T5-6: `pnpm --filter @axis-ds/mcp build` 산출물로 stdio `axis.list_brands { targetDir: <fixture> }` 정상 응답. `pack-smoke` 는 서버를 실행하지 않으므로 이 스모크를 따로 둡니다(plan 1.2, WI-0036 머지 전 main 기준. 머지 뒤에는 `pack-smoke` 가 tarball 서버의 `tools/list` 를 보지만 `axis.list_brands` 호출은 하지 않으므로 이 스모크는 그대로 둡니다) → (HEAD 2136ad4 + P5 미커밋 변경) 빌드한 `packages/axis-mcp/dist/index.js` 를 빈 임시 cwd 에서 stdio 로 실행(주입 env 없음, fixture 는 CLI `tokens-*` 를 임시 프로젝트 `node_modules/@axis-ds/tokens` 로 복사). `serverInfo.version` 1.1.5, `tools/list` 18개, `axis.list_brands`(tokens-1.3) · `axis.get_brand sample`(tokens-1.3) 정상 글과 `isError` false, `axis.list_brands`(tokens 없음) 설치 안내 · `axis.get_brand sample`(tokens-1.2) 업그레이드 안내 모두 `isError` false. 4개 확인 전부 통과, 스크립트 rc 0

## T6. M3 머지 뒤 실데이터 (P6)

- [x] T6-1: `pnpm --filter @axis-ds/tokens build`(turbo 우회) 뒤 `dist/brands/index.json` · `dist/brands/ontology/brand.json` · `dist/css/brands/ontology.css` 존재(`ls` rc 0) → `pnpm exec turbo run build --filter=@axis-ds/tokens --force`(rc 0, 1 task, cached 0) 뒤 `ls` rc 0, 143 · 469 · 10197 바이트. npm `@axis-ds/tokens@1.3.0` 설치본의 같은 3개 파일과 `cmp` rc 0(바이트 같음)
- [x] T6-2: index.json 키 · 항목 형태, brand.json 최상위 키, CSS 블록 선택자 줄을 fixture 와 대조. 차이 0 또는 fixture · 코어 수정 기록. 라이트 블록 머리는 U2 대안 2(명시도 0,2,0)로 바뀌므로 차이를 기록하고 `parseBrandCss` 가 그 머리를 읽는지 확인 → 차이 0, fixture · 코어 수정 없음. index 최상위 `brands`, 항목 `name` · `css` · `meta`, brand.json `name` · `description` · `themes` · `a11y`(`status` · `checkedAt` · `gate`), CSS 머리 4줄(라이트 `[data-brand="<b>"][data-brand="<b>"] {`, 다크 `[data-brand="<b>"].dark,` · `[data-brand="<b>"][data-theme="dark"],` · `.dark [data-brand="<b>"] {`)이 fixture `tokens-1.3` 과 같음(브랜드 이름을 `<b>` 로 바꿔 비교). 값의 형만 다름(fixture a11y 는 `unchecked` · null, 실데이터는 문자열 3개). `parseBrandCss` 가 머리를 읽는 것은 T6-4 에서 라이트 12 · 다크 10 값이 나와 확인
- [x] **T6-3 (AC1)**: tokens tarball `file:` 설치 프로젝트에서 `axis theme list` 출력에 `ontology` → 1.3.0 이 배포돼 `file:` 대신 빈 프로젝트에 `npm install @axis-ds/tokens@1.3.0`(레지스트리) 설치본으로 판정. 빌드 CLI `theme list` rc 0, `AXIS 브랜드 (1개, @axis-ds/tokens 1.3.0)` · `ontology  디자인 시스템 v1 기반 ontology 브랜드 프리셋  (light · dark)`. 주입 env 없음(`AXIS_*` 0개)
- [x] T6-4: 같은 프로젝트에서 `theme info ontology` 와 MCP 두 도구 응답, T5-5 기준으로 동일 → CLI `theme info ontology` rc 0. 원본 코어(`packages/axis-cli/src/theme/brand-core.ts`)와 MCP 핸들러(`src/tools/brand.ts`)를 vite-node 로 불러 같은 디렉터리에서 list · get ontology · get nope 결과 deep equal 3/3(status 모두 `ok`). 빌드 `packages/axis-mcp/dist/index.js` stdio(cwd 이 프로젝트, 주입 env 없음): `serverInfo.version` 1.1.5, `tools/list` 18개, `axis.list_brands` · `axis.get_brand(ontology)` · `axis.get_brand(nope)` 모두 `isError` false. MCP 표 12행의 토큰 · 라이트 · 다크 값이 CLI `info` 표 12행과 같고, import 경로 · `defaultBrand="ontology"` · a11y 상태 · 점검일 · 게이트 · 근거 문서가 양쪽 글에 모두 있음
- [x] T6-5: 주요 토큰 12개 중 ontology CSS 에 있는 개수 기록, 긴 `a11y.status` 의 `info` 출력 확인 → 라이트 블록 12/12, 다크 블록 10/12(`--radius` · `--axis-font-family-sans` 없음, `info` 에 `-` 로 표시). `a11y 상태` 줄은 문장 전체가 한 줄로 나옴(134자). 출력 최대 줄 길이는 주요 토큰 표의 141자이고 원인은 `--axis-font-family-sans` 라이트 값(폰트 목록)이 라이트 열 폭을 넓히는 것. 80열 터미널에서는 줄이 꺾임(기록만, 코드 변경 없음)
- [x] **T6-6 (AC2(a) 실경로)**: 이 브랜치 빌드 CLI 로 새 임시 디렉터리에 `axis template init theme-only -d <임시>`(`AXIS_TEMPLATE_URL` 주입 없음, 기본 레지스트리) → 받은 파일 목록이 저장소 `theme-only.json` 7개와 같은지 기록 → tokens tarball 설치 없이 `axis theme add ontology` 2회. 루트 `globals.css` 의 브랜드 import 정확히 1줄, `package.json` 의 `@axis-ds/tokens` 키 1개, `axis.config.json` `brand: "ontology"`, 2회차 전후 파일 해시 차이 0 (plan 6.2-7) → **전제: 기본 레지스트리 주입 없음 조건은 지키지 못함.** 주입 없이 실행하면 rc 1(`'theme-only' 템플릿을 찾을 수 없습니다 (403)`), `curl` 로도 `theme-only.json` · `index.json` 모두 403. 그래서 `AXIS_TEMPLATE_URL=http://127.0.0.1:38761/templates`(저장소 `apps/web/public` 을 `python3 -m http.server` 로 내보냄, 빌드 전 추적 파일 상태)를 주입함. init rc 0, 7개 파일 + `axis.config.json`. 7개 모두 저장소 `theme-only.json` 내용과 같음(차이 0). tokens 미설치 상태로 1회차 rc 0 · 3파일 변경(`axis.config.json` · `globals.css` · `package.json`) · not-installed 경고, 2회차 rc 0 · 「바꾼 파일이 없습니다」 · `sha256sum` 8개 파일 차이 0. import 1줄(1행, `@tailwind base;` 앞) · tokens 키 1개 · `brand: "ontology"` · `node_modules` 미생성. 레지스트리 경로(axis.minu.best) 자체는 미검증
- [x] T6-7 (U2 대안 2 의존 확인): ontology tarball 로 plan 8.1 vC 와 같은 구성(FR-2 위치 `@import`)에서 `<html data-brand="ontology">` 라이트 · 다크의 `--primary` · `--background` 계산값이 브랜드 값과 같음(라이트 승리가 확인 항목). 음성 대조군(브랜드 import 없음)과 양성 대조군(`--axis-surface-default`)을 함께 기록. 라이트가 지면 M3 선택자 변경 누락으로 보고 다음 단계 중단 (plan 6.2-6) → **라이트 · 다크 모두 브랜드 값이 이김.** 결과 표는 아래 「T6-7 측정」

## T7. 1.3.0 배포 뒤 (P7)

- [x] T7-1: `npm view @axis-ds/tokens@1.3.0 exports --json` 에 `./brands` · `./css/brands/ontology` · `./brands/ontology/brand.json` → rc 0, 세 키 모두 있음(브랜드 키는 이 3개뿐)
- [ ] **T7-2 (AC2(b))**: 새 App Router Next.js 15 프로젝트(`app/globals.css` · `app/layout.tsx`)에서 `axis init -y` → `axis theme add ontology` → `pnpm install` → `pnpm build` rc 0. env · 캐시 주입 없이 레지스트리 설치. theme-only 는 빌드 대상이 아님(PRD Q4). rc 0 만으로는 판정하지 않고 다음을 모두 봄(plan 6.3-2)
  - ① `axis theme add` 출력에 globalCss(`./src/app/globals.css`) 없음 경고, `app/globals.css` 에 `@axis-ds/tokens/css/brands/ontology` import 정확히 1줄
  - ② `axis check` 의 brand 항목 pass
  - ③ `.next/static/css/*.css` 에서 `grep -E "data-brand=[\"']?ontology"` 1건 이상
  - ④ 음성 대조군: `theme add` 전 빌드 산출 CSS 에서 ③ 과 같은 grep 0건(CSS 파일 1개 이상 · grep rc 1 로 측정 수행 증명)
  - → **미통과(2026-10-19).** 결과는 아래 「T7-2 측정」. 정의된 절차의 `pnpm build` 가 rc 1 이고 원인은 기존 `axis init -y` 입니다. ① · ② · ④ 는 통과, ③ 은 보조 측정(전제 주입)에서만 통과
- [x] T7-3: `pnpm exec turbo run build test --force --continue` rc 0, cached 0, 패키지별 테스트 수 기록 → rc 0, 14/14 태스크(build 8 · test 6), cached 0. cli 9파일 161건 · mcp 4파일 24건 · tokens 221건(node test) · theme 2파일 31건 · ui-react 8파일 110건 · agentic-ui 6파일 72건, 실패 0. 빌드가 고친 추적 파일 5개(`apps/web/public/templates/*.json`)는 `git checkout --` 로 되돌림
- [ ] T7-4: 배포 뒤 `npx @axis-ds/cli@1.2.0 --version` = 1.2.0, `@axis-ds/mcp@1.2.0` tarball stdio `serverInfo.version` = 1.2.0 · 도구 18개


### T6-7 측정 (2026-10-19)

- 구성: T6-6 산출물(theme add 뒤)의 `globals.css` · `layout.tsx` · `page.tsx` · `theme-toggle.tsx` 를 `app/` 으로 옮기고 `postcss.config.mjs`(tailwindcss · autoprefixer)를 더한 plan 8.1 vC 와 같은 구성. 브랜드 import 는 `axis theme add` 가 넣은 1행 그대로(FR-2 위치).
- 설치: `pnpm install`(npm 레지스트리, lockfile 에 `file:` 0건). next 15.5.28 · react 19.3.1 · tailwindcss 3.4.19 · postcss 8.5.31 · autoprefixer 10.6.1 · typescript 5.9.3 · `@axis-ds/tokens` 1.3.0(integrity `sha512-OA30inrV...`).
- 측정: `next build`(첫 실행 rc 1 `<Html> should not be imported outside of pages/_document`, 같은 명령 재실행 rc 0. 8.1 절과 같은 현상) → `next start -p 38762` → Playwright 1.61.1 chromium 149.0.7827.55(headless)로 `<html>` 에 `data-brand` · `.dark` 를 붙였다 떼며 `getComputedStyle` 계산값. 주입 env 는 `NEXT_TELEMETRY_DISABLED=1` 하나.
- 산출 CSS(`.next/static/css/*.css` 1개)에서 브랜드 라이트 블록 2064 바이트, 프로젝트 `:root{--background` 15705 바이트. 브랜드가 앞에 있지만 명시도 0,2,0 으로 이김.

| 구성 | `data-brand` | 테마 | `--primary` | `--background` | `--radius` | `--axis-surface-default` | body 배경 | 판정 |
|---|---|---|---|---|---|---|---|---|
| 기대값(브랜드) | ontology | 라이트 | `220 69.4% 52.5%` | `0 0% 97%` | `12px` | `#FFFFFF` | | |
| 기대값(브랜드) | ontology | 다크 | `219.7 81.6% 68%` | `216 15.2% 6.5%` | (라이트 블록 값) | `#17191D` | | |
| vC | 없음 | 라이트 | `240 5.9% 10%` | `0 0% 100%` | `0.5rem` | (빈 값) | `rgb(255, 255, 255)` | 대조군 |
| vC | 없음 | 다크 | `0 0% 98%` | `240 10% 3.9%` | `0.5rem` | (빈 값) | `rgb(9, 9, 11)` | 대조군 |
| **vC** | ontology | 라이트 | `220 69.4% 52.5%` | `0 0% 97%` | `12px` | `#FFFFFF` | `rgb(247, 247, 247)` | **이김** |
| **vC** | ontology | 다크 | `219.7 81.6% 68%` | `216 15.2% 6.5%` | `12px` | `#17191D` | `rgb(14, 16, 19)` | **이김** |
| vC 하위 div | ontology(`<body>` 아래 div) | 라이트 | `220 69.4% 52.5%` | `0 0% 97%` | `12px` | `#FFFFFF` | (body 는 프로젝트 값) | 이김(보조) |
| vC 하위 div | ontology(`.dark` 아래 div) | 다크 | `219.7 81.6% 68%` | `216 15.2% 6.5%` | `12px` | `#17191D` | (body 는 프로젝트 값) | 이김(보조) |
| vC0 | ontology | 라이트 | `240 5.9% 10%` | `0 0% 100%` | `0.5rem` | (빈 값) | `rgb(255, 255, 255)` | 음성 대조군 |
| vC0 | ontology | 다크 | `0 0% 98%` | `240 10% 3.9%` | `0.5rem` | (빈 값) | `rgb(9, 9, 11)` | 음성 대조군 |

- vC0 은 같은 프로젝트에서 `globals.css` 1행(브랜드 import)만 지우고 다시 빌드(rc 0)한 것입니다. 산출 CSS 1개에서 `data-brand=["']?ontology` grep 0건 · rc 1. vC0 의 `data-brand` 없음 행과 하위 div 행도 프로젝트 값입니다.
- 양성 대조군 `--axis-surface-default` 는 vC 에서 브랜드 값, vC0 에서 빈 값이라 브랜드 CSS 로드 여부를 가릅니다.
- 하위 div 2행은 plan 8.1 끝의 「하위 요소 브랜드」 사용을 보조로 잰 값입니다(plan 은 `<html>` 만 요구).

### T7-2 측정 (2026-10-19)

- 프로젝트: `npx --yes create-next-app@15.5.28 app7 --ts --tailwind --eslint --app --no-src-dir --use-pnpm --import-alias "@/*" --no-turbopack --skip-git`(rc 0). next 15.5.28 · react 19.1.0 · tailwindcss 4.3.3 · `@tailwindcss/postcss` 4.3.3 · typescript 5.9.3. `app/globals.css` 첫 줄이 `@import "tailwindcss";`(Tailwind 4 기본). 주입 env 없음(`AXIS_` · `NEXT_` · `NPM_CONFIG` · `PNPM_` 0개), 레지스트리 https://registry.npmjs.org/.
- CLI 는 이 브랜치 빌드(`packages/axis-cli/dist/index.js`, 0d5e535)입니다. npm 의 cli 1.1.4 에는 `theme` 명령이 없습니다.

| 단계 | 결과 |
|---|---|
| ④ 음성 대조군: `theme add` 전 `pnpm build` | rc 0, CSS 1개, `grep -cE "data-brand=[\"']?ontology"` 0건 · rc 1 |
| `axis init -y` | rc 0, `axis.config.json`(`globalCss: "./src/app/globals.css"`) · `src/components/ui/utils.ts` 생성 |
| ① `axis theme add ontology` | rc 0, `globalCss(./src/app/globals.css)가 없어 app/globals.css 에 추가합니다` 경고, `app/globals.css` 2행(`@import "tailwindcss";` 다음)에 import 1줄, `package.json` 에 `@axis-ds/tokens ^1.3.0` |
| `pnpm install` | rc 0, `@axis-ds/tokens` 1.3.0(lockfile integrity 가 T6-7 과 같음) |
| ② `axis check` | rc 0, `PASS brand "ontology" import 가 app/globals.css에 있습니다 (globalCss ./src/app/globals.css 없음)`. 같은 출력에 기존 항목 FAIL 1(tailwind.config 없음) · WARN 2(AXIS CSS 변수 없음 · 권장 의존성 누락 clsx, tailwind-merge) |
| `axis theme list` | rc 0, `ontology` |
| **`pnpm build`** | **rc 1.** `./src/components/ui/utils.ts:1:39 Type error: Cannot find module 'clsx'`. CSS 컴파일은 `Compiled successfully` 뒤 타입 검사에서 실패 |
| 원인 대조군: 새 create-next-app 15.5.28 프로젝트에 `axis init -y` 만(theme add 없음) → `pnpm build` | rc 1, 같은 오류. `axis init` 의 utils.ts 쓰기는 f1777ee(main)에도 같고 이 WI 가 바꾸지 않음 |
| 보조 측정(전제 주입: `pnpm add clsx tailwind-merge`, clsx 2.1.1 · tailwind-merge 3.7.0) → `pnpm build` | rc 0, CSS 1개, ③ grep 1줄(압축 1줄) · `data-brand=ontology]` 5건(라이트 머리 2 + 다크 3), import 1줄 유지 |

- 판정: 정의된 절차(env · 캐시 주입 없음)의 `pnpm build` 가 rc 1 이라 T7-2(AC2(b))는 미통과입니다. 보조 측정은 init 이 요구하는 의존성을 손으로 넣은 결과라 AC2(b) 근거로 쓰지 않습니다. 처리 방법(예: init 결함을 별도 WI 로 고친 뒤 재측정, 또는 AC2(b) 절차 재정의)은 사용자 결정 대기입니다.

---

## 3. 결과 기록

| 날짜 | HEAD | 명령 | --force | 결과 |
|---|---|---|---|---|
| 2026-10-19 | e690905 | `packages/axis-cli` 에서 `npx vitest run` | 해당 없음(vitest 직접) | 3파일 58건 통과, rc 0 (기준선) |
| 2026-10-19 | e690905 | `turbo run test --dry=json` | 해당 없음(dry) | test 태스크 5개 (기준선) |
| 2026-10-19 | f1777ee | `packages/axis-cli` 에서 `npx vitest run` | 해당 없음(vitest 직접) | 3파일 58건 통과, rc 0 (P1 착수 전 기준선) |
| 2026-10-19 | f1777ee + P1 | `packages/axis-cli` 에서 `npx vitest run` | 해당 없음(vitest 직접) | 5파일 69건 통과, rc 0 |
| 2026-10-19 | f1777ee + P1 | `packages/axis-mcp` 에서 `npx vitest run` | 해당 없음(vitest 직접) | 2파일 5건 통과, rc 0 |
| 2026-10-19 | f1777ee + P1 | `turbo run test --filter=@axis-ds/cli --filter=@axis-ds/mcp --force` | 예 | rc 0, 2 tasks, cached 0, cli 69건 · mcp 5건 |
| 2026-10-19 | f1777ee + P1 | `turbo run test --dry=json` | 해당 없음(dry) | test 태스크 6개(`<NONEXISTENT>` 제외) |
| 2026-10-19 | f1777ee + P1 | `pnpm --filter @axis-ds/cli --filter @axis-ds/mcp type-check` · `lint` | 해당 없음 | 둘 다 rc 0 이지만 두 패키지에 스크립트가 없어 아무것도 실행하지 않음(출력 0줄). 통과 근거 아님 |
| 2026-10-19 | f1777ee + P1 | 각 패키지에서 `npx tsc --noEmit -p tsconfig.json` | 해당 없음 | mcp rc 0. cli rc 2, 오류 20건(`src/library/**` 19 · `template-apply.ts` 1). 원본 두 파일로 바꿔 잰 기준선도 같은 20건(줄 번호만 다름), 이 단계가 더한 오류 0 |
| 2026-10-19 | f1777ee + P1 | 루트 `npx eslint <P1 변경 파일 8개>` | 해당 없음 | rc 1, `src/index.ts` 2건(`MONET_CATEGORIES` · `category` 미사용). 원본 `src/index.ts` 도 같은 2건, 나머지 파일 0건 |
| 2026-10-19 | f1777ee + P1 | `pnpm install --frozen-lockfile --offline` | 해당 없음 | rc 0, lockfile 차이는 mcp importer 의 vitest 3줄 |
| 2026-10-19 | 6d5c567 + P2 | `packages/axis-cli` 에서 `npx vitest run` | 해당 없음(vitest 직접) | 7파일 95건 통과, rc 0 (P2 신규 2파일 26건: brand-core 18 · theme-commands 8) |
| 2026-10-19 | 6d5c567 + P2 | `turbo run test --filter=@axis-ds/cli --filter=@axis-ds/mcp --force` | 예 | rc 0, 2 tasks, cached 0, cli 95건 · mcp 5건 |
| 2026-10-19 | 6d5c567 + P2 | `turbo run test --dry=json` | 해당 없음(dry) | test 태스크 6개. cli inputs 56개에 `../../apps/web/public/templates/theme-only.json`, mcp inputs 27개에 `../axis-cli/src/theme/brand-core.ts`(이제 실제 파일이 해시 대상) |
| 2026-10-19 | 6d5c567 + P2 | 변이 3종(M1 · M2 · M3)을 `brand-core.ts` 에 하나씩 넣고 `npx vitest run src/theme` | 해당 없음 | 각각 rc 1(실패 2 · 4 · 1건), 되돌린 뒤 sha256 앞 12자리 `2658aa445a06` 로 원본과 같음 |
| 2026-10-19 | 6d5c567 + P2 | `pnpm --filter @axis-ds/cli --filter @axis-ds/mcp type-check` · `lint` | 해당 없음 | 둘 다 rc 0 이지만 P1 과 같이 두 패키지에 스크립트가 없어 아무것도 실행하지 않음. 통과 근거 아님 |
| 2026-10-19 | 6d5c567 + P2 | 각 패키지에서 `npx tsc --noEmit -p tsconfig.json` | 해당 없음 | mcp rc 0. cli rc 2, 오류 20건(`src/library/**` 19 · `template-apply.ts` 1)으로 P1 기준선과 같은 분포, `src/theme/**` 0건 |
| 2026-10-19 | 6d5c567 + P2 | 루트 `npx eslint <P2 변경 · 신규 ts 6개>` | 해당 없음 | rc 1, `src/index.ts` 기존 2건(`MONET_CATEGORIES` · `category`)만, `src/theme/**` 0건 |
| 2026-10-19 | 6d5c567 + P2 | `pnpm build`(packages/axis-cli) 뒤 `node dist/index.js theme list` · `theme info` | 해당 없음 | build rc 0, 추적 파일 변경 0. fixture 4종 list rc 0 · 1 · 1 · 1, info sample rc 0 · nope rc 1 |
| 2026-10-19 | 7c0dd38 + P3 | `packages/axis-cli` 에서 `npx vitest run` | 해당 없음(vitest 직접) | 8파일 132건 통과, rc 0 (P3 신규 37건: theme-add 32 · brand-core 5) |
| 2026-10-19 | 7c0dd38 + P3 | `turbo run test --filter=@axis-ds/cli --filter=@axis-ds/mcp --force` | 예 | rc 0, 2 tasks, cached 0, cli 132건 · mcp 5건 |
| 2026-10-19 | 7c0dd38 + P3 | 변이 5종(M4 폴백 끔 · M5 같은 브랜드 감지 끔 · M6 설치 실행 · M7 맨 끝 삽입 · M8 기존 범위 덮어씀)을 하나씩 넣고 `npx vitest run src/theme` | 해당 없음 | 각각 rc 1(실패 3 · 2 · 1 · 7 · 3건), 되돌린 뒤 sha256 앞 12자리 `brand-core.ts` `e308b4c4bc7d` · `theme-add.ts` `c438b6dd0562` 로 원본과 같음 |
| 2026-10-19 | 7c0dd38 + P3 | `pnpm --filter @axis-ds/cli --filter @axis-ds/mcp type-check` · `lint` | 해당 없음 | 둘 다 rc 0 이지만 P1 · P2 와 같이 두 패키지에 스크립트가 없어 아무것도 실행하지 않음. 통과 근거 아님 |
| 2026-10-19 | 7c0dd38 + P3 | 각 패키지에서 `npx tsc --noEmit -p tsconfig.json` | 해당 없음 | mcp rc 0. cli 오류 20건(`src/library/**` 19 · `template-apply.ts` 1)으로 P1 · P2 기준선과 같은 분포, `src/theme/**` 0건 |
| 2026-10-19 | 7c0dd38 + P3 | 루트 `npx eslint <P3 변경 · 신규 ts 5개>` | 해당 없음 | rc 0, 0건. 양성 대조군: 같은 설정으로 `packages/axis-cli/src/index.ts` 는 기존 지적이 나옴(린트가 실제로 돎) |
| 2026-10-19 | 7c0dd38 + P3 | `pnpm build`(packages/axis-cli) 뒤 `node dist/index.js theme add` 를 임시 디렉터리에서 실행 | 해당 없음 | build rc 0, 추적 파일 변경 0. theme-only(템플릿 원본을 펼침, tokens 없음, 주입 env 없음) 1회차 rc 0 · 3파일 변경, 2회차 rc 0 · 변경 0, import 1줄 · tokens 키 1개 · `brand: "sample"` · `node_modules` 미생성. app-init + tokens-1.3 fixture rc 0 · globalCss 없음 경고 · `app/globals.css` import 1줄. `nope` · `Bad_Name` · config 없음 rc 1, config 없음은 변경 0 |
| 2026-10-19 | 1e84f15 | P4 착수 전 `runCheck` 를 6개 프로젝트에서 실행해 출력 캡처(임시 테스트 파일, 캡처 뒤 삭제) | 해당 없음 | rc 0, 6개 프로젝트 출력을 `packages/axis-cli/test/fixtures/check/run-check-baseline.json` 에 고정(T4-1 기대값) |
| 2026-10-19 | 1e84f15 + P4 | `packages/axis-cli` 에서 `npx vitest run` | 해당 없음(vitest 직접) | 9파일 161건 통과, rc 0 (P4 신규 29건: template-check 26 · brand-core 3) |
| 2026-10-19 | 1e84f15 + P4 | `packages/axis-mcp` 에서 `npx vitest run` | 해당 없음(vitest 직접) | 3파일 13건 통과, rc 0 (P4 신규 8건: template 7 · brand-core 동일성 1) |
| 2026-10-19 | 1e84f15 + P4 | `turbo run test --filter=@axis-ds/cli --filter=@axis-ds/mcp --force` | 예 | rc 0, 2 tasks, cached 0, cli 161건 · mcp 13건 |
| 2026-10-19 | 1e84f15 + P4 | 변이 5종(M9 CLI brand 검사 끔 · M10 다른 브랜드도 일치 · M11 사본에 공백 1자 · M12 MCP brand 검사 끔 · 기존 config 문구 변경)을 하나씩 넣고 해당 테스트 실행 | 해당 없음 | 각각 실패 11 · 2 · 1 · 6 · 2건, 되돌린 뒤 sha256 앞 12자리 `template-check.ts` `5fc46b3340e9` · `brand-core.ts`(원본 · 사본) `044d79521986` · mcp `template.ts` `222088e36f29` 로 원본과 같음 |
| 2026-10-19 | 1e84f15 + P4 | `pnpm --filter @axis-ds/cli --filter @axis-ds/mcp type-check` · `lint` | 해당 없음 | 둘 다 rc 0 이지만 P1 ~ P3 과 같이 두 패키지에 스크립트가 없어 아무것도 실행하지 않음(출력 1줄). 통과 근거 아님 |
| 2026-10-19 | 1e84f15 + P4 | 각 패키지에서 `npx tsc --noEmit -p tsconfig.json` | 해당 없음 | mcp rc 0. cli rc 2, 오류 20건(`src/library/**` 19 · `template-apply.ts` 1)으로 P1 ~ P3 기준선과 같은 분포, `src/template/template-check*` · `src/theme/**` 0건 |
| 2026-10-19 | 1e84f15 + P4 | 루트 `npx eslint <P4 변경 · 신규 ts 8개>` | 해당 없음 | rc 0, 0건. 양성 대조군: 같은 설정으로 `packages/axis-cli/src/index.ts` 는 기존 2건(rc 1) |
| 2026-10-19 | 1e84f15 + P4 | `pnpm build`(cli · mcp) 뒤 `node dist/index.js check` · MCP stdio `axis.check_project` | 해당 없음 | build rc 0 · 0, 추적 파일 변경 0. 임시 디렉터리에 app-init + tokens-1.3 fixture 를 펼침(주입 env 없음, tokens 는 fixture 복사본이며 check 는 tokens 를 읽지 않음). CLI brand 없음 5항목(기준선 app-init 과 같은 줄) → brand 만 warn → `theme add sample` rc 0 뒤 pass → import 를 ontology 로 바꾸면 warn. MCP 같은 디렉터리 6항목, brand warn, `isError` 없음, `serverInfo.version` 1.1.5, `tools/list` 16개 |
| 2026-10-19 | 2136ad4 + P5 | `packages/axis-mcp` 에서 `npx vitest run` | 해당 없음(vitest 직접) | 4파일 24건 통과, rc 0 (P5 신규 11건: brand T5-2 3 · T5-4 3 · T5-5 5) |
| 2026-10-19 | 2136ad4 + P5 | `turbo run test --filter=@axis-ds/cli --filter=@axis-ds/mcp --force` | 예 | rc 0, 2 tasks, cached 0, cli 161건 · mcp 24건. mcp `turbo.json` 수정 뒤 mcp 만 `--force` 로 다시 돌려 24건 · cached 0 |
| 2026-10-19 | 2136ad4 + P5 | `turbo run test --filter=@axis-ds/mcp --dry=json` | 해당 없음(dry) | mcp test inputs 31개(CLI `brand-core.ts` · `src/tools/brand*.ts` 포함) → fixture glob 을 더한 뒤 46개(더해진 15개가 `git ls-files packages/axis-cli/test/fixtures/theme` 15개와 같음) |
| 2026-10-19 | 2136ad4 + P5 | 변이 2종(M13 핸들러가 `version` 을 지움 · M14 미설치 안내에서 설치 명령을 지움)을 `brand.ts` 에 하나씩 넣고 `npx vitest run src/tools/brand.test.ts` | 해당 없음 | 각각 실패 4 · 1건, 되돌린 뒤 sha256 앞 12자리 `brand.ts` `ceb55ba24a21` 로 원본과 같음. `brand-core.ts`(원본 · 사본)는 P5 에서 고치지 않음(`044d79521986`, P4 와 같음) |
| 2026-10-19 | 2136ad4 + P5 | `pnpm --filter @axis-ds/cli --filter @axis-ds/mcp type-check` · `lint` | 해당 없음 | 둘 다 rc 0 이지만 P1 ~ P4 와 같이 두 패키지에 스크립트가 없어 아무것도 실행하지 않음(출력 1줄). 통과 근거 아님 |
| 2026-10-19 | 2136ad4 + P5 | 각 패키지에서 `npx tsc --noEmit -p tsconfig.json` | 해당 없음 | mcp rc 0, 오류 0(`--listFiles` 에 `src/tools/brand*.ts` 4개 포함으로 검사 대상 확인). cli rc 2, 오류 20건(`src/library/**` 19 · `template-apply.ts` 1)으로 P1 ~ P4 기준선과 같은 분포 |
| 2026-10-19 | 2136ad4 + P5 | 루트 `npx eslint <P5 변경 · 신규 js/ts 5개>` · `npx eslint packages/axis-mcp/src packages/axis-cli/src scripts/mcp-smoke.mjs` | 해당 없음 | 변경 파일 rc 0, 0건. 전체는 rc 1, 20파일 38건이고 같은 20파일을 f1777ee 내용으로 잰 값도 38건(파일마다 같음), 이 WI 가 더한 오류 0 |
| 2026-10-19 | 2136ad4 + P5 | `pnpm turbo run build --filter='./packages/*' --force` | 예 | rc 0, 6 tasks, cached 0, 추적 파일 변경 0 |
| 2026-10-19 | 2136ad4 + P5 | `node scripts/pack-smoke.mjs`(`EXPECTED_TOOLS` 수정 전) → `pnpm pack-smoke`(수정 뒤) | 해당 없음 | 수정 전 rc 1(`목록 밖 도구: axis.list_brands, axis.get_brand`, 1건 결함), 수정 뒤 rc 0(6개 패키지, mcp `tools/list 18개, 레지스트리 도구 호출 6건`, pack-install-smoke tokens exports 13항목 통과) |
| 2026-10-19 | 2136ad4 + P5 | 빌드한 `packages/axis-mcp/dist/index.js` stdio 스모크(임시 cwd, 주입 env 없음) | 해당 없음 | rc 0. `tools/list` 18개, `axis.list_brands` · `axis.get_brand` 정상(tokens-1.3 fixture), 미설치 · 1.2.1 에서 안내 글과 `isError` false (T5-3 · T5-6) |
| 2026-10-19 | 0d5e535 | `pnpm exec turbo run build --filter=@axis-ds/tokens --force` 뒤 `ls` · `cmp`(npm 1.3.0 설치본) | 예 | rc 0, cached 0, 3개 파일 존재, npm 설치본과 바이트 같음 (T6-1) |
| 2026-10-19 | 0d5e535 | 형식 대조 스크립트(fixture `tokens-1.3` 대 npm 1.3.0 설치본) | 해당 없음 | 키 · CSS 머리 4줄 차이 0 (T6-2) |
| 2026-10-19 | 0d5e535 | `pnpm exec turbo run build --filter=@axis-ds/cli --filter=@axis-ds/mcp --force` | 예 | rc 0, 2 tasks, cached 0, 추적 파일 변경 0 |
| 2026-10-19 | 0d5e535 | npm 1.3.0 설치 프로젝트에서 빌드 CLI `theme list` · `theme info ontology`, 코어 · 핸들러 deep equal, 빌드 MCP stdio | 해당 없음 | list rc 0 `ontology`, info rc 0, deep equal 3/3, `tools/list` 18개, `isError` 0건 (T6-3 · T6-4 · T6-5) |
| 2026-10-19 | 0d5e535 | 빌드 CLI `template init theme-only`(`AXIS_TEMPLATE_URL` 로컬 서버 주입) → `theme add ontology` 2회 | 해당 없음 | 기본 레지스트리 403(주입 없이 rc 1). 주입 뒤 init rc 0, 7파일 차이 0, 1회차 3파일 · 2회차 해시 차이 0 (T6-6) |
| 2026-10-19 | 0d5e535 | vC · vC0 `next build` · `next start` · Playwright 계산값 | 해당 없음 | vC 라이트 · 다크 브랜드 값 이김, vC0 프로젝트 값 (T6-7) |
| 2026-10-19 | 0d5e535 | `npm view @axis-ds/tokens@1.3.0 exports --json` | 해당 없음 | rc 0, `./brands` · `./css/brands/ontology` · `./brands/ontology/brand.json` (T7-1) |
| 2026-10-19 | 0d5e535 | create-next-app 15.5.28 → `axis init -y` → `theme add ontology` → `pnpm install` → `pnpm build` | 해당 없음 | build rc 1(init 의 `utils.ts` · `clsx`), 대조군(init 만) rc 1, 보조(clsx · tailwind-merge 설치) rc 0 · grep 5건, 음성 대조군 0건 · rc 1 (T7-2 미통과) |
| 2026-10-19 | 0d5e535 | `pnpm exec turbo run build test --force --continue` | 예 | rc 0, 14/14, cached 0, cli 161 · mcp 24 · tokens 221 · theme 31 · ui-react 110 · agentic-ui 72 (T7-3) |
| 2026-10-19 | 0d5e535 + changeset | `pnpm changeset status --verbose` | 해당 없음 | rc 0, minor `@axis-ds/cli` 1.2.0 · `@axis-ds/mcp` 1.2.0(둘 다 `.changeset/wi-0028-cli-mcp-brand.md`), patch · major 없음 |
| 2026-10-19 | 53893d6 | 리뷰 결함 재현: 빌드 CLI(53893d6) `theme add` · `theme list` 를 scratchpad 임시 프로젝트(tokens-1.3 fixture 복사, 주입 env 없음)에서 실행 | 해당 없음 | BOM 파일 rc 0 · BOM 이 둘째 줄 앞, `globalCss: "../outside/globals.css"` rc 0 · 밖 파일에 import, brand.json 만 지운 프로젝트 `theme list` rc 1 · `MODULE_NOT_FOUND` 스택, 읽기 전용 config rc 1 · 스택 · `globals.css` · `package.json` 은 바뀐 채, 한 줄 배열 · 이스케이프가 있는 `package.json` 은 3 ~ 4행이 3 ~ 9행으로 다시 쓰임 |
| 2026-10-19 | 724d94b | `packages/axis-cli` 에서 `npx vitest run` · `packages/axis-mcp` 에서 `npx vitest run` | 해당 없음(vitest 직접) | cli 10파일 173건 통과(리뷰 보정 12건 추가), mcp 4파일 24건 통과, 둘 다 rc 0 |
| 2026-10-19 | 724d94b | `pnpm exec turbo run test --filter=@axis-ds/cli --filter=@axis-ds/mcp --force` | 예 | rc 0, 2 tasks, cached 0, cli 173건 · mcp 24건 |
| 2026-10-19 | 724d94b | 변이 5종(BOM 처리 끔 · 프로젝트 밖 거절 끔 · 권한 확인 끔 · 되돌림 끔 · 부분 빌드 `not-built` 끔)을 하나씩 넣고 `npx vitest run src/theme` | 해당 없음 | 각각 rc 1(실패 2 · 3 · 1 · 1 · 3건), 되돌린 뒤 `cmp` 로 원본과 같음. sha256 앞 12자리 `brand-core.ts`(원본 · 사본) `945162cfc0a2` |
| 2026-10-19 | 724d94b | 각 패키지에서 `npx tsc --noEmit -p tsconfig.json` · 루트 `npx eslint packages/axis-cli/src/theme/ packages/axis-mcp/src/tools/brand-core.ts` | 해당 없음 | mcp rc 0. cli 오류 20건으로 P1 ~ P5 기준선과 같은 분포, `src/theme/**` 0건. eslint rc 0, 0건(양성 대조군: `packages/axis-cli/src/index.ts` 는 기존 지적으로 rc 1) |
| 2026-10-19 | 724d94b | `pnpm build`(cli · mcp) 뒤 위 재현 프로젝트를 새로 만들어 빌드 CLI · 빌드 MCP stdio 로 다시 실행 | 해당 없음 | build rc 0 · 0, 추적 파일 변경 0. BOM rc 0 · 맨 앞 BOM · postcss 8.5.6 `parse` 성공, 밖 globalCss rc 1 · 변경 0, 부분 빌드 `theme list` rc 1 빌드 전 안내 · `theme info` 스택 0줄, MCP 두 도구 안내 글 · `isError` false, 읽기 전용 config rc 1 · 변경 0 |
