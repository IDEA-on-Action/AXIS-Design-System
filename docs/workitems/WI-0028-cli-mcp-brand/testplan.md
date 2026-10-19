# 테스트 계획 - WI-0028: CLI · MCP 브랜드 명령

> 작성일: 2026-10-19 | 상태: 초안(구현 전) | PRD: [prd.md](./prd.md) | Plan: [plan.md](./plan.md) | TODO: [todo.md](./todo.md)
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

## T1. 공통 기반 (P1)

- [ ] T1-1: `node packages/axis-cli/dist/index.js --version` 출력 = `packages/axis-cli/package.json` version (빌드 뒤 실측, 대조군: 정정 전 `0.1.0`)
- [ ] T1-2: 빌드한 MCP 서버에 stdio `initialize` → `serverInfo.version` = `packages/axis-mcp/package.json` version
- [ ] T1-3: `axis init -y` · `initTemplate` 이 만드는 `axis.config.json` 의 키 · 값 · 순서가 정정 전과 같음(단위 테스트, 임시 디렉터리)
- [ ] T1-4: `pnpm --filter @axis-ds/mcp test` rc 0, 실행 테스트 수 1 이상
- [ ] T1-5: `turbo run test --dry=json` test 태스크 6개(@axis-ds/mcp 추가)

## T2. 공유 코어 · list · info (P2, FR-1 · FR-3)

- [ ] T2-1: `resolveTokens` - tokens-1.3 fixture `ok` · tokens-1.2 fixture `unsupported` · 미설치 `not-installed` · tokens-1.3-unbuilt fixture(`dist` 없음) `not-built`. 버전 문자열을 함께 돌려주고, `not-built` 에서도 `1.3.0` 을 읽음(`dist` 실재에 기대지 않음). 음성 대조군: `not-built` fixture 가 `not-installed` 로 판정되지 않음
- [ ] T2-2: `listBrands` - index.json 항목 수와 결과 수가 같고, 각 항목의 `description` · `themes` · `a11y` 가 brand.json 과 같음. 대조군: index 에 없는 브랜드 디렉터리는 결과에 없음
- [ ] T2-3: `parseBrandCss` - 라이트 블록 · 다크 블록(선택자 3줄) 선언을 분리. 다크 블록이 없는 CSS 는 다크 빈 맵
- [ ] T2-4: `axis theme list` 출력에 `sample` · 설명 · `light` · `dark` 포함, rc 0
- [ ] T2-5: 미설치 · 미지원 · 빌드 산출물 없음에서 각각 설치 · 업그레이드 · 빌드(재설치) 안내, rc 1, 빈 목록 문구를 내지 않음
- [ ] T2-6: `axis theme info sample` 에 import 경로 `@axis-ds/tokens/css/brands/sample`, `defaultBrand="sample"` 예시, 주요 토큰 라이트 · 다크 값. 없는 브랜드는 rc 1 + 목록 안내
- [ ] T2-7: 보정 내역 출력(U3 결정 내용대로)

## T3. theme add (P3, FR-2)

- [ ] T3-1: `axis.config.json` 없는 디렉터리 - 파일 변경 0(실행 전후 파일 목록 · 내용 해시 비교), rc 1, `axis init` 안내
- [ ] T3-2: 탐색 순서 - `globalCss` 지정 · `app/globals.css` · `src/app/globals.css` · 루트 `globals.css` 가 함께 있을 때 각각 우선순위대로 하나만 고름. `globalCss` 키가 없을 때(projects/src-app)는 두 번째 후보부터 봄
- [ ] T3-2b: `globalCss` 키가 없는 파일을 가리킬 때(projects/app-init, `axis init -y` 산출물과 같은 config) - `app/globals.css` 에 import 정확히 1줄, `globalCss` 경로 없음 경고 출력, `axis.config.json` 의 `globalCss` 값 불변. 음성 대조군: 수동 안내(A1)만 내고 import 0줄로 끝나는 구현이면 이 테스트가 실패함을 한 번 확인(폴백을 끈 상태로 실행)
- [ ] T3-3: 삽입 위치 - `@charset` · 기존 `@import` 다음, 없으면 첫 줄. `@tailwind base;` 보다 앞
- [ ] **T3-4 (AC2(a) fixture 판)**: `theme-only.json` 을 펼친 프로젝트(plan 6.1, `initTemplate` 형태 config, tokens 없음)에서 2회 실행 뒤 `globals.css` 의 브랜드 import 정확히 1줄, `package.json` 의 `@axis-ds/tokens` 키 1개, `axis.config.json` `brand: "sample"`. 2회차 실행의 파일 변경 0
- [ ] T3-5: tokens 없을 때 `dependencies["@axis-ds/tokens"] === "^1.3.0"`, 설치 명령 미실행(자식 프로세스 호출 0)
- [ ] T3-6: tokens `^1.2.1` 이 이미 있으면 범위 불변 + 업그레이드 안내
- [ ] T3-7: 이름 규칙 위반(`Bad_Name`) 거절 · 설치돼 있는데 index 에 없는 이름 거절 · 미설치면 경고와 함께 진행
- [ ] T3-8: 다른 브랜드 import 가 있을 때 기존 줄 유지 + 새 줄 추가 + 안내(U13)
- [ ] T3-9: 출력에 `defaultBrand` 예시와 「Provider · `data-brand` 가 없으면 화면이 바뀌지 않음」 문장
- [ ] T3-10: 후보 CSS 파일이 모두 없는 프로젝트 - 수동 안내, `package.json` · config 는 갱신
- [ ] T3-11: 쓰는 파일의 들여쓰기 2칸 · 끝 줄바꿈 유지, config 의 다른 키 순서 유지

## T4. check 의 brand 검사 (P4, FR-5)

- [ ] T4-1: brand 없는 fixture 에서 `collectCheckResults` 결과(이름 · severity · 문구 · 개수)가 정정 전 `runCheck` 출력과 같음. 정정 전 출력은 착수 직전 HEAD 에서 캡처해 기대값으로 고정
- [ ] T4-2: config 없음 · `brand` 없음 · config JSON 파손에서 brand 항목이 추가되지 않음(파손은 기존 동작 유지 여부를 함께 기록)
- [ ] **T4-3 (AC4)**: brand 일치 pass, import 없음 warn, 다른 브랜드만 import warn, CSS 없음 warn. 음성 대조군: 일치 fixture 에서 warn 0. projects/app-init 에 `theme add` 한 뒤의 check 는 `app/globals.css` 를 검사해 pass(globalCss 경로 없음 표기 포함)
- [ ] T4-4: MCP `handleCheckProject` 가 T4-3 과 같은 severity 를 냄, brand 없는 fixture 에서 결과 개수 불변

## T5. MCP 브랜드 도구 (P5, FR-4 · AC3)

- [ ] T5-1: `src/tools/brand-core.ts` 와 CLI `src/theme/brand-core.ts` 의 바이트 동일. 음성 대조군: 사본에 공백 하나를 더한 상태에서 테스트가 실패하는 것을 한 번 확인하고 되돌림
- [ ] T5-2: `handleListBrands` · `handleGetBrand` 가 fixture 에서 코어 결과를 그대로 돌려줌
- [ ] T5-3: 빌드 산출물 stdio `tools/list` 18개, 이름에 `axis.list_brands` · `axis.get_brand`
- [ ] T5-4: 미설치 · 미지원 fixture 에서 `isError` 없음, 안내 문구에 설치 명령
- [ ] **T5-5 (AC3)**: 같은 fixture 에서 MCP 핸들러 결과와 CLI 코어 결과가 deep equal 이고, `formatListBrandsResult` · `formatGetBrandResult` 글에 CLI 출력이 담는 항목(이름 · 설명 · 테마 · import 경로 · `defaultBrand` 예시 · 주요 토큰 값)이 모두 있음
- [ ] T5-6: `pnpm --filter @axis-ds/mcp build` 산출물로 stdio `axis.list_brands { targetDir: <fixture> }` 정상 응답. `pack-smoke` 는 서버를 실행하지 않으므로 이 스모크를 따로 둡니다(plan 1.2)

## T6. M3 머지 뒤 실데이터 (P6)

- [ ] T6-1: `pnpm --filter @axis-ds/tokens build`(turbo 우회) 뒤 `dist/brands/index.json` · `dist/brands/ontology/brand.json` · `dist/css/brands/ontology.css` 존재(`ls` rc 0)
- [ ] T6-2: index.json 키 · 항목 형태, brand.json 최상위 키, CSS 블록 선택자 줄을 fixture 와 대조. 차이 0 또는 fixture · 코어 수정 기록
- [ ] **T6-3 (AC1)**: tokens tarball `file:` 설치 프로젝트에서 `axis theme list` 출력에 `ontology`
- [ ] T6-4: 같은 프로젝트에서 `theme info ontology` 와 MCP 두 도구 응답, T5-5 기준으로 동일
- [ ] T6-5: 주요 토큰 12개 중 ontology CSS 에 있는 개수 기록, 긴 `a11y.status` 의 `info` 출력 확인
- [ ] **T6-6 (AC2(a) 실경로)**: 이 브랜치 빌드 CLI 로 새 임시 디렉터리에 `axis template init theme-only -d <임시>`(`AXIS_TEMPLATE_URL` 주입 없음, 기본 레지스트리) → 받은 파일 목록이 저장소 `theme-only.json` 7개와 같은지 기록 → tokens tarball 설치 없이 `axis theme add ontology` 2회. 루트 `globals.css` 의 브랜드 import 정확히 1줄, `package.json` 의 `@axis-ds/tokens` 키 1개, `axis.config.json` `brand: "ontology"`, 2회차 전후 파일 해시 차이 0 (plan 6.2-7)

## T7. 1.3.0 배포 뒤 (P7)

- [ ] T7-1: `npm view @axis-ds/tokens@1.3.0 exports --json` 에 `./brands` · `./css/brands/ontology` · `./brands/ontology/brand.json`
- [ ] **T7-2 (AC2(b))**: 새 App Router Next.js 15 프로젝트(`app/globals.css` · `app/layout.tsx`)에서 `axis init -y` → `axis theme add ontology` → `pnpm install` → `pnpm build` rc 0. env · 캐시 주입 없이 레지스트리 설치. theme-only 는 빌드 대상이 아님(PRD Q4). rc 0 만으로는 판정하지 않고 다음을 모두 봄(plan 6.3-2)
  - ① `axis theme add` 출력에 globalCss(`./src/app/globals.css`) 없음 경고, `app/globals.css` 에 `@axis-ds/tokens/css/brands/ontology` import 정확히 1줄
  - ② `axis check` 의 brand 항목 pass
  - ③ `.next/static/css/*.css` 에서 `grep -E "data-brand=[\"']?ontology"` 1건 이상
  - ④ 음성 대조군: `theme add` 전 빌드 산출 CSS 에서 ③ 과 같은 grep 0건(CSS 파일 1개 이상 · grep rc 1 로 측정 수행 증명)
- [ ] T7-3: `pnpm exec turbo run build test --force --continue` rc 0, cached 0, 패키지별 테스트 수 기록
- [ ] T7-4: 배포 뒤 `npx @axis-ds/cli@1.2.0 --version` = 1.2.0, `@axis-ds/mcp@1.2.0` tarball stdio `serverInfo.version` = 1.2.0 · 도구 18개

---

## 3. 결과 기록

| 날짜 | HEAD | 명령 | --force | 결과 |
|---|---|---|---|---|
| 2026-10-19 | e690905 | `packages/axis-cli` 에서 `npx vitest run` | 해당 없음(vitest 직접) | 3파일 58건 통과, rc 0 (기준선) |
| 2026-10-19 | e690905 | `turbo run test --dry=json` | 해당 없음(dry) | test 태스크 5개 (기준선) |
