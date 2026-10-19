# WI-0028 릴리스 노트: CLI · MCP 브랜드 명령

> 릴리스일: 미정(PR 머지 뒤 열리는 Version Packages PR 을 머지할 때 CI 발행) | 유형: feat | 영향: @axis-ds/cli 1.1.4 → 1.2.0 · @axis-ds/mcp 1.1.5 → 1.2.0 (minor) | GitHub: #87

## 배경

WI-0025 로 `@axis-ds/tokens` 1.3.0 에 브랜드 산출물(`./brands` exports, `dist/brands/index.json`, `ontology` 프리셋)이 들어갔습니다. 소비 프로젝트에 적용하려면 import 문과 `ThemeProvider defaultBrand` 를 손으로 넣어야 했고, CLI 와 MCP 어디에도 브랜드를 다루는 명령이 없었습니다.

## 변경 사항

### feat(cli): `axis theme list` · `axis theme info <brand>`
- 대상 프로젝트에 설치된 `@axis-ds/tokens` 의 `./brands` 를 읽어 브랜드 이름 · 설명 · 지원 테마를 출력합니다(FR-1).
- `info` 는 import 경로, Provider 예시(`defaultBrand`), 주요 토큰 12개의 라이트 · 다크 값, a11y 상태 · 점검일 · 게이트와 근거 문서(WI-0025 PRD 부록 B)를 출력합니다(FR-3). 브랜드가 덮어쓰지 않는 값은 `-` 로 표시합니다.
- tokens 가 없거나(`not-installed`) 1.2.1 이하이거나(`unsupported`) 빌드 전이면(`not-built`) 빈 목록 대신 설치 · 업그레이드 안내를 내고 rc 1 로 끝납니다.

### feat(cli): `axis theme add <brand>`
- `globalCss` → `app/globals.css` → `src/app/globals.css` → 루트 `globals.css` 순으로 찾은 파일에 `@import "@axis-ds/tokens/css/brands/<brand>";` 한 줄을 넣습니다. 위치는 `@charset` · 기존 `@import` 다음입니다(U2 대안 2. 라이트 승리는 tokens 1.3.0 의 라이트 선택자 명시도 0,2,0 이 맡습니다).
- `package.json` 에 `@axis-ds/tokens` 가 없으면 `^1.3.0` 으로 더하고, `axis.config.json` 에 `"brand": "<brand>"` 를 기록합니다. 설치는 실행하지 않고 안내만 합니다(U6).
- 바꿀 내용을 먼저 계산한 뒤 쓰고(plan/apply), 두 번 실행하면 두 번째는 파일을 바꾸지 않습니다. `axis.config.json` 이 없으면 아무것도 쓰지 않고 `axis init` 을 안내합니다.
- 쓰기 대상 CSS 의 실제 경로가 프로젝트 밖이면(`globalCss` 의 `../` · 절대경로 · 밖을 가리키는 심볼릭 링크) 아무것도 쓰지 않고 rc 1 로 끝납니다. 쓰기 전에 모든 대상의 쓰기 권한을 확인하고, 쓰는 도중 실패하면 먼저 쓴 파일을 되돌립니다. UTF-8 BOM 으로 시작하는 CSS 는 BOM 을 맨 앞에 둔 채 줄을 넣습니다.
- `package.json` · `axis.config.json` 은 들여쓰기 · 줄바꿈 · 끝 줄바꿈 · 키 순서를 지켜 다시 씁니다. 한 줄 배열은 여러 줄로 펼쳐지고 `\u` · `\/` 이스케이프는 풀립니다.

### feat(cli · mcp): `axis check` · `axis.check_project` 의 brand 검사
- `axis.config.json` 의 `brand` 와 찾은 CSS 파일의 브랜드 import 를 대조해 어긋나면 경고합니다(FR-5, AC4). `brand` 가 없는 프로젝트의 결과는 종전과 같습니다.

### feat(mcp): `axis.list_brands` · `axis.get_brand`
- CLI 와 같은 코어로 대상 디렉터리(`targetDir`, 기본 현재 디렉터리)의 `@axis-ds/tokens` 를 읽습니다(FR-4). 도구는 16개에서 18개가 됩니다.
- tokens 가 없거나 브랜드를 지원하지 않으면 `isError` 없이 설치 · 업그레이드 안내를 돌려줍니다.
- `scripts/mcp-smoke.mjs` 의 `EXPECTED_TOOLS` 에 두 도구를 더했습니다.

### fix: 버전 표기
- CLI `--version` 과 MCP `serverInfo.version` 이 `package.json` 을 읽습니다. 종전에는 `0.1.0` 고정이었습니다(2026-10-19 실측: CLI 는 npm 1.1.4 설치본 `--version` `0.1.0`, MCP 는 로컬 빌드 1.1.5 기준선 `serverInfo.version` `0.1.0`. MCP npm 배포본으로는 재지 않았습니다).

### chore(mcp): 테스트 환경
- `@axis-ds/mcp` 에 vitest 와 `test` 스크립트를 더했습니다(FR-6). MCP 핸들러 결과가 CLI 원본 코어 결과와 deep equal 인지 단위 테스트로 봅니다(AC3).

## 검증 (2026-10-19, 기준 f1777ee + 이 브랜치 0d5e535)

| 항목 | 명령 · 조건 | 결과 |
|---|---|---|
| AC1 | npm 에서 받은 `@axis-ds/tokens@1.3.0`(빈 프로젝트에 `npm install`)에서 빌드 CLI `theme list` | rc 0, `ontology` 1개 |
| AC3 | 같은 프로젝트에서 CLI 코어와 MCP 핸들러(list · get ontology · get nope) | deep equal 3/3, 빌드 MCP stdio 응답 표 12행이 CLI `info` 와 같음 |
| AC2(a) | 빌드 CLI `template init theme-only`(로컬 서버 주입, 아래 전제) → `theme add ontology` 2회 | 1회차 3파일 변경, 2회차 해시 차이 0, import 1줄 · tokens 키 1개 · `brand: "ontology"` |
| AC2(b) | create-next-app 15.5.28 → `axis init -y` → `theme add ontology` → `pnpm install` → `pnpm build` | **rc 1**. `axis init -y` 가 만드는 `src/components/ui/utils.ts` 의 `clsx` 를 찾지 못한 타입 오류(theme add 없이 init 만 한 대조 프로젝트도 같은 rc 1). 아래 「알려진 문제」 |
| S0 재측정 | `@axis-ds/tokens@1.3.0` 레지스트리 설치, FR-2 위치 `@import`, `<html data-brand="ontology">` 계산값 | 라이트 · 다크 모두 브랜드 값. 음성 대조군(import 없음)은 프로젝트 값 |
| 품질 게이트 | `pnpm exec turbo run build test --force --continue` | rc 0, 14/14 태스크, 0 cached. cli 161 · mcp 24 · tokens 221 · theme 31 · ui-react 110 · agentic-ui 72 |
| changeset | `pnpm changeset status --verbose` | minor 대상 `@axis-ds/cli` 1.2.0 · `@axis-ds/mcp` 1.2.0, patch · major 없음 |

- AC2(a) 전제: 기본 레지스트리 `https://axis.minu.best/templates` 가 이 호스트에서 403(Cloudflare)이라 `AXIS_TEMPLATE_URL` 을 저장소 `apps/web/public/templates` 를 내보내는 로컬 서버로 주입했습니다. 받은 7개 파일은 저장소 `theme-only.json` 과 내용이 같습니다. 레지스트리 경로 자체는 검증하지 않았습니다.
- 세부 수치는 [testplan.md](./testplan.md) T6 · T7 에 있습니다.

## 알려진 문제

- **AC2(b) 절차의 `pnpm build` 가 실패합니다.** 원인은 이 WI 가 아니라 기존 `axis init -y` 입니다. init 은 `clsx` · `tailwind-merge` 를 import 하는 `utils.ts` 를 쓰지만 의존성을 더하거나 안내하지 않습니다. 두 패키지를 손으로 설치한 보조 측정에서는 `pnpm build` rc 0, 산출 CSS 에 `data-brand=ontology` 선택자 5건이었습니다. 처리 방법은 결정 대기입니다.
- `theme info` 의 주요 토큰 표는 `--axis-font-family-sans` 값이 길어 한 줄이 141자입니다. 80열 터미널에서는 줄이 꺾입니다.

## 소비 프로젝트 영향

- 기존 명령의 출력 형식은 바뀌지 않습니다. `axis check` 는 `brand` 를 기록한 프로젝트에서만 brand 항목을 더 냅니다.
- 브랜드 명령은 `@axis-ds/tokens` 1.3.0 이상이 필요합니다. Provider 는 `@axis-ds/theme` 1.3.0 이상의 `ThemeProvider defaultBrand` 를 씁니다.
