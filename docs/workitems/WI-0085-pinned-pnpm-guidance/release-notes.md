# WI-0085 릴리스 노트: 설치 · 실행 안내가 프로젝트의 패키지 매니저를 따라요

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | GitHub: #217 | 대상: `@axis-ds/cli` 1.7.2 · `@axis-ds/mcp` 1.4.2(예상, 배치 6c 에서 WI-0086 과 한 Release, 미발행). tokens · theme · ui-react · agentic-ui 는 바뀌지 않아요

## 바뀐 점

- `axis template apply` 의 「필요한 의존성」과 MCP `axis.apply_template` 이 대상 디렉터리의 매니저로 명령을 내요(`npm install …` · `npm install -D …` · `yarn add …` · `yarn add -D …` · `pnpm add …`). 범위는 다른 안내처럼 따옴표로 감싸요(`"react@^19.0.0"`). 매니저는 템플릿 파일을 쓰기 전의 프로젝트로 골라요.
- `axis template init` 의 다음 단계가 새 프로젝트 디렉터리에 맞는 `npm install` · `npm run dev`, `yarn install` · `yarn dev`, `pnpm install` · `pnpm dev` 예요.
- `axis theme list` · `axis theme info` · MCP `axis.list_brands` · `axis.get_brand` 의 tokens 빌드 전 안내가 `pnpm --filter @axis-ds/tokens build` · `npm run build -w @axis-ds/tokens` · `yarn workspace @axis-ds/tokens build` 가운데 맞는 것을 내요. MCP 브랜드 도구의 설치 · 업그레이드 · 재설치 명령도 CLI 처럼 `targetDir` 의 매니저를 따라요(1.4.1 까지 pnpm 한 가지).
- `axis monet import` 다음 단계의 의존성 설치 줄도 현재 디렉터리의 매니저를 따라요.
- 설치 명령 판정 공통: 앱 층 · 워크스페이스 루트 층에 lockfile 이 없으면 `package.json` 의 `packageManager`(`npm@…` · `yarn@…` · `pnpm@…`, 앱 다음 같은 워크스페이스 루트)를 봐요. 그래서 lockfile 없이 `packageManager` 만 있는 프로젝트는 `axis init` · `axis theme add` · `axis add` · `axis check` 의 안내도 npm · yarn 명령으로 바뀌어요.
- MCP `axis.get_brand` 도구 설명의 예시를 `defaultBrand` 대신 실제 응답과 같은 `<html data-brand>` · `setBrand` 로 적었어요.

## 바뀌지 않은 점

- lockfile 이 있으면 종전처럼 lockfile 이 먼저예요(`package-lock.json` 과 `packageManager: yarn@…` 이 함께 있으면 npm).
- lockfile 과 `packageManager` 가 모두 없거나 모르는 이름(`bun@…` 등)이면 종전 기본값 pnpm 이에요. 이때 바뀌는 것은 template apply · init 의 pnpm 의존성 줄에 따옴표가 붙는 것뿐이에요.
- 워크스페이스가 아닌 상위 · `.git` 너머의 `packageManager` 는 보지 않아요(lockfile 과 같은 경계).
- 종료 코드는 바뀌지 않아요.

## 알아둘 점

- bun 은 아직 지원하지 않아요(pnpm 으로 안내).
- `npm run build -w …` 는 npm 7 이상이 필요해요.

## 발행

- 미발행. WI-0086 과 한 PR · 한 Release(cli 1.7.2 · mcp 1.4.2 예상) 뒤 이 절을 채워요.
