# WI-0076: MCP 동봉 토큰 데이터가 tokens 실제 값과 어긋남 PRD

> 작성일: 2026-10-25 | 버전: v1.0 | 작성자: Sinclair Seo | WI: WI-0076 | GitHub: #202 | 우선순위: P3 | 상태: Approved (2026-10-25 배치 6 결정: 브리프 권장안 일괄 채택, project-todo 「배치 6 결정」 줄이 정본)
> 기준: `main` 3b5ed0f (linked 1.8.0 · cli 1.6.2 · mcp 1.3.5 발행됨, 미발행 changeset 0) | 묶음: 배치 6 (WI-0078 → **0076** → 0074 → 0075 → 0077)
> 표기: **측정**(이번에 실행해 얻은 값) · **계산**(값에서 유도) · **추정**(실행하지 않음)

---

## 1. 개요

### 1.1 문제 (측정)

- `@axis-ds/mcp` 의 `axis.list_tokens` · `axis.get_token` 은 `src/registry/data/tokens.json`(41개)을 그대로 동봉해 읽었어요. 이 파일은 처음 만든 커밋(ea764b4, 2026-01-23) 뒤 한 번도 바뀌지 않았고, tokens 패키지와 연결이 없는 손 사본이었어요.
- 발행본 1.3.5 를 tokens 1.8.0 과 비교(브리프 · 이번 재측정 모두): 41개 가운데 **값 다름 16**(colors 13 · fontFamily 2 · shadow.lg 1, 예: `colors.primary` 가 `hsl(222.2 47.4% 11.2%)`, 실제 `221 39% 11%`), **tokens 에 원천 없음 5**(`shadow.md` · `animation.*` 4), **없는 CSS 변수 이름 4**(`--radius-none` · `-sm` · `-lg` · `-full`), `radius.md` 가 `--radius`(0.5rem)를 가리킴.
- tokens 의 284 + shadcn 25 변수 가운데 MCP 에 없는 것이 대부분이었고, 다크 값 · 밀도 토큰(WI-0026)은 0건이었어요. 없는 경로의 `get_token` 은 `isError` 없는 일반 텍스트였어요.
- mcp `package.json` 에 `@axis-ds/tokens` 의존이 없어 turbo 가 tokens 를 mcp 빌드 앞에 세우지 않았고(수정 전 `--dry=json`: mcp build 의존 `registry-core#build` 뿐, test 의존 없음), 이를 잡는 테스트도 0건이었어요. `scripts/mcp-smoke.mjs` 는 응답에 `colors.primary` 문자열만 봐서 값이 낡아도 초록이었어요.

### 1.2 결정 (2026-10-25 배치 6 결정)

| # | 결정 | 근거 |
|---|---|---|
| D1 | 원천은 tokens **빌드 산출물**: `json/tokens.json` + `css/variables.css`(:root · .dark) + `css/shadcn-compat.css`(:root · .dark). tokens 패키지 exports(`./json` · `./css` · `./css/shadcn`)로 찾아요 | shadcn HSL 은 build-tokens.mjs 가 빌드 때 계산해 src 로는 얻을 수 없어요. dist 는 발행본과 같은 바이트예요 |
| D2 | 기존 경로 이름 유지 + tokens 토큰을 tokens 이름 기반 경로로 추가. 1.3.5 경로 36개는 그대로 `path`, 같은 계열(space · font-*)은 그 체계를 이어 써요(`spacing.5` · `typography.fontSize.3xl`). `--axis-*` 는 접두를 떼고 `-` 를 `.` 로(`control.h.md`), shadcn 은 `colors.<이름>`(`-foreground` 는 `.foreground`), `--radius` 는 `radius`. 계열 규칙과 다른 이름은 `aliases` 로 함께 받아요(`space.5`). CSS 변수 이름으로도 찾아요 | mcp-smoke · 문서가 기존 경로를 써요. 밀도 미반영도 함께 풀어요 |
| D3 | 원천이 없는 5개(`shadow.md` · `animation.duration.fast` · `normal` · `slow` · `animation.easing.default`)는 내지 않고, category enum 에서 `animation` 을 빼고 `density` · `component` 를 더해요 | MCP 는 tokens 에 있는 값만 말해요. tokens dist 전체에서 `150ms` 0파일(브리프 측정) |
| D4 | 생성본은 `dist/data/tokens.json` 에만 두고 `src/registry/data/tokens.json` 은 삭제해요. 테스트는 생성 함수를 직접 불러 tokens dist 와 비교해요 | 커밋본을 두면 같은 낡음 구조와 빌드 churn 이 남아요 |
| D5 | `TokenMeta` 에 다크 값(`dark`) 필드, 브랜드는 `axis.get_brand` 에 맡김, 없는 경로는 `isError: true` | 다크는 같은 변수의 다른 모드라 한 항목에 붙여요. 브랜드는 이미 대상 프로젝트 tokens 를 읽는 도구가 있어요 |
| D6 | mcp 가 `@axis-ds/tokens` 를 `workspace:*` devDependency 로 갖고, `packages/axis-mcp/turbo.json` test 에 `dependsOn: ["^build"]` | 빌드 · 테스트 순서와 캐시 무효화를 명시해요(AC6) |
| D7 | 원천이 예상과 다르면(블록 없음 · json 과 CSS 짝 없음 · 값 불일치 · 모르는 접두 · 호환 경로의 원천 사라짐 · 경로 겹침) 생성이 throw 해요 | 0건 · 부분 생성이 조용히 통과하지 않게 해요 |

### 1.3 범위 밖

- tokens 값 · 빌드 스크립트(읽기만 해요). linked 4패키지와 cli 는 바뀌지 않아요.
- 브랜드(ontology) 값의 토큰 응답 포함(D5, `axis.get_brand` 가 맡음).
- 반박 검토의 후보 「대상 프로젝트에 설치된 tokens 를 런타임에 읽기」: 이번 결정은 빌드 때 생성이에요. 그래서 MCP 응답은 **MCP 를 빌드한 시점의 tokens 버전**을 따라가요(출처 줄로 표시). tokens 만 발행하고 mcp 를 다시 발행하지 않으면 그 사이는 어긋날 수 있어요(changeset 측정: devDependency 라 tokens patch 가 mcp 를 올리지 않음). 후속 판단 항목으로 남겨요.

## 2. 요구사항

| ID | 요구사항 | AC |
|---|---|---|
| FR-1 | mcp build 가 tokens dist 에서 `dist/data/tokens.json` 을 생성하고 손으로 적은 값이 남지 않아요 | AC1 |
| FR-2 | 생성본의 모든 항목이 tokens dist 원천 값(라이트 · 다크)과 1:1 로 같고, 비교 건수가 하한 이상이에요 | AC2 |
| FR-3 | 1.3.5 동봉본을 픽스처로 넣으면 같은 비교가 값 다름 16 · 없어진 토큰 5 · 없는 CSS 변수 4 를 보고해요 | AC3 |
| FR-4 | 모든 `cssVariable` 이 tokens dist CSS 에 실제로 정의돼 있어요 | AC4 |
| FR-5 | 밀도 경로(`control.h.md` 등)와 다크 값을 돌려줘요 | AC5 |
| FR-6 | mcp build · test 가 turbo 에서 `@axis-ds/tokens#build` 뒤에 돌고, tokens src 가 바뀌면 mcp 해시가 바뀌어요 | AC6 |
| FR-7 | pack 한 tarball 의 stdio 응답이 tokens 발행본과 불일치 0이고, mcp-smoke 기대가 값으로 바뀌어 1.3.5 tarball 에서 실패해요 | AC7 |
| FR-8 | 없는 경로의 `get_token` 은 `isError: true` 이고 안내 문구에 브랜드 도구가 나와요 | AC8 |

### 2.1 AC

- AC1: 빌드 로그 `[token-gen] @axis-ds/tokens 1.8.0 에서 토큰 N개 생성`, `colors.primary` 가 `hsl(221 39% 11%)`. 생성기를 1.3.5 사본 반환으로 바꾼 변이에서 테스트가 빨개져요.
- AC2: `tokens-sync.test.ts` 가 variables.css 284 · shadcn 25 · json 284 를 전부 비교하고 하한(284 · 25)을 단언해요. 값 변조 · 다크 누락 · hsl 감싸기 제거 변이에서 실패해요.
- AC3: 픽스처 `test/fixtures/tokens-1.3.5.json` 비교 결과 16 · 5 · 4.
- AC4: 생성본 `cssVariable` 가운데 tokens CSS 에 없는 것 0. radius.md 를 옛 `--radius` 로 매핑하는 변이에서 실패해요.
- AC5: `get_token('control.h.md')` 가 `2.5rem`, 다크 값 함께. 1.3.5 에서는 「찾을 수 없습니다」(수정 전 재현).
- AC6: `turbo run build test --filter=@axis-ds/mcp --dry=json` 의 mcp build · test 의존에 `@axis-ds/tokens#build`, tokens src 값 하나를 바꾸면 두 해시가 바뀌고 되돌리면 원래 해시예요.
- AC7: 격리 HOME 에 pack tarball + `@axis-ds/tokens@1.8.0`(npm) 설치, `list_tokens` 309행이 발행본 dist 와 불일치 0. mcp-smoke 가 1.3.5 tarball 에서 FAIL.
- AC8: `get_token('animation.duration.fast')` · `get_token('brand.ontology')` 가 `isError: true`.

## 3. 응답 계약 변경 (minor)

- 경로 5개 제거, category `animation` 제거 · `density` · `component` 추가(`animation` 을 주면 입력 검증 오류).
- 미발견 `isError: true`(문구 첫머리 「토큰을 찾을 수 없습니다」는 유지).
- 항목에 `dark` · `aliases` 필드, `cssVariable` 은 항상 있어요. 표에 다크 · CSS 열을 더했어요.
- 값 형식은 그대로(shadcn 색은 `hsl(H S% L%)`), CSS 사용 안내는 `hsl(var(--primary))` 로 바로잡았어요(종전 `var(--primary)`).

## 4. 변경 파일

- `packages/axis-mcp/src/registry/token-gen.mjs` · `token-gen.d.mts`(새 파일, 생성기 · 빌드 CLI)
- `packages/axis-mcp/src/registry/loader.ts`(컴포넌트 · 토큰 캐시 분리, 별칭 · CSS 변수 조회, 테스트용 `setTokenData`)
- `packages/axis-mcp/src/types.ts`(`TOKEN_CATEGORIES`, `TokenMeta.dark` · `aliases`)
- `packages/axis-mcp/src/tools/get.ts` · `list.ts` · `src/index.ts`(표 · 상세 · enum · isError)
- `packages/axis-mcp/package.json`(build 에 `gen-tokens`, devDependency `@axis-ds/tokens`) · `turbo.json`(test dependsOn) · `pnpm-lock.yaml`
- `packages/axis-mcp/src/registry/data/tokens.json` 삭제, `packages/axis-mcp/test/fixtures/tokens-1.3.5.json`(회귀 픽스처)
- `packages/axis-mcp/src/registry/tokens-sync.test.ts`(새 파일)
- `scripts/mcp-smoke.mjs`(값 기대 · 밀도 · isError), `docs/guides/claude-workflow.md` 3.2, `packages/axis-mcp/README.md` 「토큰 도구」
