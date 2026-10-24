# @axis-ds/mcp

## 1.3.2

### Patch Changes

- e6f6eef: 기본 테마(브랜드 미지정)에서 흰 글자와 일부 보조 글자가 WCAG AA 4.5:1 에 못 미치던 색을 고쳤습니다(WI-0029). primitive 값과 전역 `status-*` 는 그대로이고, 미달을 일으키던 component · semantic 참조만 한 단계 진하게 옮겼습니다. `data-brand="ontology"` 화면은 바뀌지 않고, `shadcn-compat.css` 는 아래 다크 `--muted-foreground` 한 줄만 바뀝니다.

  기본 화면에서 바뀌는 색(라이트 · 다크 공통이 아니면 테마를 적었습니다):
  - Button 기본 바탕 `--axis-button-bg-default · hover · active`: #3B82F6 · #2563EB · #1D4ED8 → #2563EB · #1D4ED8 · #1E40AF (흰 글자 3.67 → 5.16)
  - Button destructive 바탕 `--axis-button-destructive-bg-default · hover · active`: #EF4444 · #DC2626 · #B91C1C → #DC2626 · #B91C1C · #991B1B (흰 글자 3.76 → 4.82)
  - MessageBubble 사용자 바탕 `--axis-agent-message-user-bg`: #3B82F6 → #2563EB
  - 다크 보조 글자 `--axis-text-secondary` #9CA3AF → #D1D5DB, `--axis-text-tertiary` #6B7280 → #9CA3AF (다크 `--axis-button-text-disabled` 도 #9CA3AF 로 같이 바뀝니다). 다크 `--axis-input-text-placeholder` 는 #9CA3AF 그대로입니다
  - shadcn 호환 다크 `--muted-foreground`(`shadcn-compat.css` 의 `.dark`): `218 11% 65%`(#9CA3AF) → `216 12% 84%`(#D1D5DB). 종전처럼 `text.secondary` 에서 파생되어 함께 바뀝니다. 라이트 값과 그 밖의 줄은 그대로입니다
  - PlanCard 거절 hover 글자 `--axis-plan-card-reject-hover-text`: #EF4444 → 라이트 #B91C1C · 다크 #F87171

  새 CSS 변수 3개(PlanCard 전용, 기본값 라이트 / 다크):
  - `--axis-plan-card-approve-bg` #15803D / #15803D: 승인 버튼 바탕(종전 `--axis-status-success`)
  - `--axis-plan-card-approve-hover-bg` #166534 / #166534: 승인 버튼 hover 바탕(종전 `--axis-status-success-strong`)
  - `--axis-plan-card-reject-text` #B91C1C / #EF4444: 거절 버튼 글자(종전 `--axis-status-error`)

  PlanCard 는 이 새 변수를 씁니다. ontology 브랜드 CSS 에는 새 변수 3개를 종전과 같은 값(`status-success` · `status-success-strong` · `status-error`)으로 더해 화면이 바뀌지 않습니다.

  마이그레이션: 토큰 변수(`var(--axis-button-bg-default)` 등)로 색을 쓰고 있다면 할 일이 없습니다. 위 hex 값을 직접 적어 AXIS 버튼 색과 맞추던 곳(스크린샷 비교, 하드코딩한 #3B82F6 · #EF4444 등)은 새 값으로 고치세요. 자체 브랜드 CSS 로 PlanCard 색을 바꾸던 경우에는 승인 버튼 · 거절 글자가 이제 `--axis-status-*` 대신 새 변수 3개를 읽으므로, 같은 값을 새 변수에도 지정하세요.

  cli · mcp 는 동봉 레지스트리의 PlanCard(`agentic-plan-card`) 항목을 위 새 변수 3개를 쓰는 소스로 갱신합니다. `axis add plan-card` 는 원격 레지스트리(pages.dev)를 먼저 읽으므로, 받는 소스는 문서 사이트가 배포된 뒤부터 새 변수를 씁니다. 원격에 닿지 못해 동봉본으로 폴백할 때는 이 cli · mcp 버전부터 새 소스가 설치됩니다.

  `axis add plan-card` 로 PlanCard 소스를 이미 프로젝트에 복사해 간 경우, 토큰 패키지만 올려서는 승인 · 거절 버튼 대비가 고쳐지지 않습니다. 복사본은 여전히 `--axis-status-success` · `--axis-status-success-strong` · `--axis-status-error` 를 읽기 때문입니다. `axis add plan-card` 로 다시 받거나, 복사본의 className 3곳을 새 변수로 바꾸세요: `bg-[var(--axis-status-success)]` -> `bg-[var(--axis-plan-card-approve-bg)]`, `hover:bg-[var(--axis-status-success-strong)]` -> `hover:bg-[var(--axis-plan-card-approve-hover-bg)]`, 거절 버튼의 `text-[var(--axis-status-error)]` -> `text-[var(--axis-plan-card-reject-text)]`.

## 1.3.1

### Patch Changes

- 901fb35: 원격 레지스트리와 포함본을 `version` 이 아니라 항목 내용(sha256)으로 비교합니다(WI-0061). 레지스트리 `version` 은 `@axis-ds/ui-react` 버전을 따라가서, ui-react 만 새로 나오면 내용이 같아도 `axis list` · `axis add` 마다 「version 이 다릅니다」 안내가 떴습니다. 이제 실제로 내용이 다른 항목이 있을 때만 「내용이 다른 항목이 N개 있습니다(button, card …)」로 알리고, 원격을 우선 쓰는 동작은 같습니다. 항목에 sha256 이 없어 비교할 수 없으면 종전처럼 version 으로 판정합니다.

## 1.3.0

### Minor Changes

- d73447e: MCP 컴포넌트 도구가 레지스트리를 읽고 `npx @axis-ds/cli add` 와 같은 결과로 설치합니다(WI-0055).
  - `axis.install_component` 가 하드코딩 템플릿 5개(shadcn 원형) 대신 레지스트리 항목을 설치합니다. 의존 항목(`utils` · `agentic-a11y-labels`)을 함께 설치하고, import 를 설치 위치 기준 상대 경로로 바꾸며, 프로젝트 밖으로 나가는 경로 · 링크는 쓰지 않습니다. 종전에는 separator · dialog 등 5개 밖의 ui 와 agentic 전부가 설치되지 않았습니다.
  - 내용이 다른 기존 파일은 덮어쓰지 않고 건너뛰며 응답 첫머리에 건너뛴 수를 적습니다. `overwrite: true` 일 때만 덮어씁니다(종전에는 묻지 않고 덮어썼습니다).
  - `targetDir` 는 이미 있는 프로젝트 루트입니다. `axis.config.json` 이 있으면 그 배치, 없으면 `components/ui` · `components/agentic` 에 설치하고 알립니다. 없는 디렉터리는 만들지 않고 실패합니다. 여러 개는 `names` 배열로 줍니다.
  - 의존성은 설치하지 않고 lockfile 에 맞는 설치 명령을 안내합니다.
  - `axis.list_components` · `axis.search_components` 가 Core UI 10개 · Agentic UI 18개(28개)를 보여 주고, `category` 에 `ui` 를 더했습니다(종전 값은 그대로). `axis.get_component` 는 레지스트리의 설명 · 의존성 · 파일에 Props · 예제를 덧붙입니다.
  - 레지스트리는 `AXIS_REGISTRY_URL` → `axis.config.json` 의 `registry` → `https://axis-design-system.pages.dev/r` 순으로 읽고, 원격에 닿지 못하면 패키지에 포함된 레지스트리(`dist/registry`)를 씁니다. 응답에 사용한 주소와 출처를 항상 적습니다.
  - 보안: `axis.config.json` 의 `registry` 는 https 이고 루프백 · 사설 · 링크로컬 주소가 아닐 때만 씁니다. 아니면 무시하고 기본 주소로 조회하며 알리고, 쓰는 경우에도 리다이렉트를 따라가지 않습니다(신뢰할 수 없는 저장소의 config 로 내부망에 요청하는 것을 막음). 사내 레지스트리는 환경변수 `AXIS_REGISTRY_URL` 로 주세요(제한 없음). 판정은 IANA 특수 목적 주소(문서용 · 벤치마크 · 6to4 · Teredo · NAT64 등 포함) 전부이고, 연결 단계에서 고른 주소를 다시 판정해 DNS 리바인딩도 막습니다.
  - `@axis-ds/cli` 는 설치 코어를 MCP 와 공유하도록 내부 구조만 바꿨습니다. 명령 동작과 출력은 같습니다.

## 1.2.3

### Patch Changes

- 6b61f24: `axis.minu.best`(Cloudflare 403) 를 가리키던 기본 주소를 `https://axis-design-system.pages.dev` 로 바꿨습니다(WI-0056).
  - `axis template list` · `axis template init` 과 MCP 템플릿 도구(`axis.list_templates` 등)의 기본 템플릿 주소가 `https://axis-design-system.pages.dev/templates` 입니다. 종전에는 기본 설정에서 「템플릿 인덱스를 가져올 수 없습니다 (403)」로 실패했습니다. `AXIS_TEMPLATE_URL` 이 있으면 그것이 우선합니다(종전과 같음).
  - `axis init` · `axis template init` 이 기록하는 `$schema` 가 `https://axis-design-system.pages.dev/schema.json` 입니다. 이 주소에 `axis.config.json` 의 JSON Schema 를 새로 배포해, 에디터가 키 자동완성 · 오타 검사를 할 수 있습니다. 이미 있는 config 의 종전 `$schema` 값은 그대로 읽고, `axis init` 을 다시 실행하면 새 주소로 바뀝니다.
  - `axis.config.json` 이 없을 때 `axis add` 가 안내하는 문서 링크를 GitHub 의 Quick Start 문서로 바꿨습니다(종전 링크는 403).
  - `axis library` 수집 결과의 문서 링크 호스트를 pages.dev 로 바꿨습니다.

## 1.2.2

### Patch Changes

- 4f578fc: Tailwind CSS 4 프로젝트의 `axis init` 안내와 `axis check` 판정을 고쳤습니다(WI-0044).
  - `axis init`: Tailwind 4 이상이면 전역 CSS 에 넣을 줄(`@import "tailwindcss";` · `@import "@axis-ds/tokens/css/tailwind4";` · `package.json` 에 선언된 `@axis-ds/ui-react` · `@axis-ds/agentic-ui` 의 `tailwind.css`)과 create-next-app 기본 `globals.css` 의 `:root` · `@theme inline` · `@media (prefers-color-scheme: dark)` · `body` 블록을 지우라는 주의를 출력합니다. `@axis-ds/tokens` 가 선언돼 있지 않으면 lockfile 에 맞춘 설치 명령(`@axis-ds/tokens@^1.4.0`)을 안내합니다. 선언된 `@axis-ds/tokens` · `@axis-ds/ui-react` · `@axis-ds/agentic-ui` 는 설치본(`node_modules/<패키지>/package.json` 의 정확한 `version`)을 먼저 보고, 1.4.0 이상이면 선언과 관계없이 안내하지 않고 미만이면 설치본 버전과 함께 `^1.4.0` 으로 올리는 명령을 냅니다(선언 하한을 읽을 수 없는 `catalog:` · `npm:` 등이면 명령 대신 선언이 가리키는 버전을 올리고 다시 설치하라는 줄). 설치본이 없으면 선언의 하한이 1.4.0 미만일 때 `^1.4.0` 으로 올리는 명령을, 하한을 읽을 수 없으면(`catalog:` · `latest` · `||` 등) 설치된 버전이 1.4.0 이상인지 확인하라는 줄을 냅니다. `workspace:` 프로토콜은 설치본과 관계없이 안내하지 않습니다. 파일은 고치지 않습니다.
  - `axis init`: Tailwind 4 에서는 존재하지 않는 `tailwind.config.ts` 를 `axis.config.json` 의 `tailwindConfig` 에 적지 않고, 대화형 실행에서도 묻지 않습니다.
  - `axis check` · MCP `axis.check_project`: Tailwind 4 에서 `@import "tailwindcss"` 가 있어도 같은 CSS 에 아래 문제가 있으면 WARN 을 냅니다. 종전에는 `@import "tailwindcss"` 만 있으면 PASS 였습니다. WARN 이라 종료 코드는 그대로 0 입니다.
    - 토큰 진입점 `@axis-ds/tokens/css/tailwind4` import 가 없음(넣을 import 줄을 보여 줌)
    - `package.json` 에 선언된 `@axis-ds/ui-react` · `@axis-ds/agentic-ui` 의 `tailwind.css` import 가 없음(빠진 줄을 보여 줌). 그 패키지를 가리키는 `@source`(경로 문자열에 `@axis-ds/<패키지>` 가 들어 있음, 주석 · `@source not` 제외)를 직접 쓴 경우는 스캔 경로로 인정합니다.
    - 진입점이 있는데 create-next-app 기본 정의(`--background` 색값 · `--color-background: var(--background)` · `--font-mono: var(--font-geist-mono)` · `background: var(--background)` 류)가 남음(실제로 남은 정의 이름을 중복 없이 보여 줌)
    - 진입점이 있는데 `@axis-ds/tokens` 가 1.4.0 미만이거나 판정할 수 없음
    - `@axis-ds/ui-react` · `@axis-ds/agentic-ui` 의 `tailwind.css` 를 import 하는데 그 패키지가 1.4.0 미만이거나 판정할 수 없음
    - 여럿이면 이 순서로 `/` 로 이어 한 문구에 내고, 끝에 `(1.4.0 이상 필요: …)` · `(설치된 버전이 1.4.0 이상인지 확인하세요: …)` 를 한 번 붙입니다. 버전은 `axis init` 과 같은 함수로 설치본 → 선언 하한 → 판정 불가 순으로 보고, 설치본으로 판정했으면 `@axis-ds/tokens 설치본 1.3.0` 처럼 표시합니다(`workspace:` 는 제외).
  - `axis check` · MCP `axis.check_project` 의 Tailwind 3 항목: 설정 파일(`tailwind.config.ts` · `.js` · `.mjs` · `.cjs`)이 `@axis-ds/tokens/tailwind` preset 을 `require` · `import` 하면(주석 밖) `(@axis-ds/tokens/tailwind preset)` 을 붙여 PASS 입니다. 종전에는 preset 만 쓰는 `.ts` 가 WARN(AXIS 토큰 설정이 없습니다), `.js` · `.mjs` · `.cjs` 가 WARN(TypeScript 권장)이었습니다.
  - `axis check` · MCP `axis.check_project` 의 globals.css 항목: 변수를 직접 정의하지 않아도 `@axis-ds/tokens/css` · `css/shadcn` · `css/tailwind4` import 가 있으면 PASS 입니다(문구에 import 경로 표시). 종전에는 WARN(오탐)이었습니다.

  Tailwind 3 프로젝트의 `axis init` 출력 · `axis.config.json` 은 바뀌지 않았습니다. `axis check` 의 Tailwind 3 항목은 위 preset 인정만 더해졌고, `hsl(var(` · `--background` 로 PASS 이던 설정 파일의 문구는 그대로입니다. globals.css 항목은 Tailwind 버전과 관계없이 위 import 인정이 적용됩니다(변수를 직접 정의한 경우의 문구는 그대로).

## 1.2.1

### Patch Changes

- c364b82: `axis check` · MCP `axis.check_project` 의 Tailwind 구성 항목을 고쳤습니다(WI-0042). Tailwind 4 이상은 `tailwind.config` 파일 대신 전역 CSS 의 `@import "tailwindcss"` 를 보고(종전에는 설정 파일이 없다고 FAIL), Tailwind 3 은 `tailwind.config.mjs` · `.cjs` 도 인정합니다. `axis check` 는 FAIL 이 있으면 종료 코드 1 로 끝납니다(종전에는 항상 0). CI 에서 `axis check` 를 쓰고 있다면 FAIL 이 실패로 잡히게 됩니다.

## 1.2.0

### Minor Changes

- b43c921: feat: 브랜드 테마 명령과 MCP 브랜드 도구 추가 (WI-0028)
  - CLI `axis theme list` · `axis theme info <brand>` · `axis theme add <brand>` 를 더했어요. 대상 프로젝트에 설치된 `@axis-ds/tokens`(1.3.0 이상)의 `./brands` 산출물을 읽어요
  - `axis theme add` 는 globals.css 에 브랜드 `@import` 한 줄, `package.json` 에 `@axis-ds/tokens`, `axis.config.json` 에 `brand` 를 기록해요. 두 번 실행해도 결과가 같고, 설치는 실행하지 않고 안내만 해요
  - `axis check` 와 MCP `axis.check_project` 가 `axis.config.json` 의 `brand` 와 실제 import 가 맞는지 검사해요. `brand` 가 없는 프로젝트의 결과는 그대로예요
  - MCP 도구 `axis.list_brands` · `axis.get_brand` 를 더했어요(도구 16개 → 18개). CLI 와 같은 코어로 대상 디렉터리를 읽어요
  - CLI `--version` 과 MCP `serverInfo.version` 이 `package.json` 의 버전을 읽어요(종전 `0.1.0` 고정)

## 1.1.5

### Patch Changes

- c5964e8: fix: 레지스트리 도구가 번들 데이터를 찾지 못해 실패하던 결함 수정
  - 1.1.0 부터 1.1.4 까지 `axis.list_components` · `axis.list_tokens` · `axis.search_components` · `axis.get_component` · `axis.get_token` · `axis.install_component` 가 `ENOENT` 로 실패했어요. 번들 `dist/index.js` 는 `dist/data/` 에서 `components.json` · `tokens.json` 을 찾는데 빌드가 `dist/registry/data/` 로 복사하고 있었어요
  - 빌드의 데이터 복사 위치를 `dist/data/` 로 바꿨어요. 코드와 데이터 내용은 그대로예요

## 1.1.4

### Patch Changes

- chore: npm Trusted Publishing(OIDC) 배포 경로로 첫 발행하고, `repository.url`을 실제 저장소(`IDEA-on-Action/AXIS-Design-System`)로 정정
  - 코드 변경은 없어요. npm 패키지 페이지의 Repository 링크와 provenance 출처가 실제 저장소를 가리키게 돼요

## 1.1.3

### Patch Changes

- fix: 죽은 도메인 `ds.minu.best` 참조를 `axis.minu.best`로 통합
  - CLI 기본 `REGISTRY_URL`/`$schema`, 템플릿 URL을 살아있는 도메인으로 교체 (기존 `ds.minu.best`는 NXDOMAIN이라 컴포넌트/템플릿 fetch 실패)
  - 문서 URL 경로 정합: `getDocsUrl`이 `agentic`은 `/agentic/`, 그 외 카테고리는 `/components/`로 매핑 (기존 `/ui/`는 실 라우트 404)

## 1.1.0

### Minor Changes

- dc711a8: 외부 프로젝트 연동을 위한 패키지 설정 개선
  - @axis-ds/tokens: Dark mode CSS Variables 빌드 추가, shadcn 호환 CSS Variables (shadcn-compat.css) 생성, Tailwind CSS preset 추가
  - 전체 패키지: sideEffects 필드 추가, README 개선
  - examples/nextjs-app: 외부 프로젝트 연동 예제 추가
