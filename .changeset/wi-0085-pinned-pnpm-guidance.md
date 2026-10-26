---
'@axis-ds/cli': patch
'@axis-ds/mcp': patch
---

설치 · 실행 안내가 대상 프로젝트의 패키지 매니저를 따라요(WI-0085). 종전에는 일부 안내가 lockfile 판정을 거치지 않고 `pnpm` 으로 고정이라 npm · yarn 프로젝트에도 pnpm 명령이 나왔어요.

- `axis template apply` 의 「필요한 의존성」 · MCP `axis.apply_template`: 대상 디렉터리의 매니저로 `npm install …` · `npm install -D …` · `yarn add …` · `yarn add -D …` · `pnpm add …` 를 내고, 다른 안내처럼 범위를 따옴표로 감싸요(`"react@^19.0.0"`, `^` 가 셸에서 사라지지 않게). 매니저는 템플릿 파일을 쓰기 전의 프로젝트로 골라요.
- `axis template init` 의 다음 단계: `npm install` · `npm run dev`, `yarn install` · `yarn dev`, `pnpm install` · `pnpm dev` 가운데 새 프로젝트 디렉터리에 맞는 것.
- `axis theme list` · `axis theme info` · MCP `axis.list_brands` · `axis.get_brand` 의 tokens 빌드 전 안내: 워크스페이스 빌드 명령이 `pnpm --filter @axis-ds/tokens build` · `npm run build -w @axis-ds/tokens` · `yarn workspace @axis-ds/tokens build` 로 매니저를 따라요. MCP 브랜드 도구의 설치 · 업그레이드 · 재설치 명령도 CLI 처럼 `targetDir` 의 매니저를 따라요(종전 pnpm 한 가지).
- `axis monet import` 다음 단계의 의존성 설치 줄도 현재 디렉터리의 매니저를 따라요.
- 설치 명령 판정(`axis init` · `axis theme add` · `axis add` · `axis check` 등 모든 안내 공통): 앱 층과 워크스페이스 루트 층에 lockfile 이 없으면 `package.json` 의 `packageManager`(`npm@…` · `yarn@…` · `pnpm@…`, 앱 다음 같은 워크스페이스 루트)를 봐요. lockfile 이 있으면 종전처럼 lockfile 이 먼저이고, 모르는 이름(`bun@…` 등)은 무시해 종전 기본값 `pnpm` 이에요. 그래서 lockfile 없이 `packageManager` 만 있는 프로젝트는 이미 lockfile 을 따르던 안내도 npm · yarn 명령으로 바뀌어요.
- lockfile · `packageManager` 가 없는 프로젝트의 명령은 종전과 같아요. 다만 template apply · init 의 pnpm 의존성 줄에는 따옴표가 붙어요.
- MCP `axis.get_brand` 도구 설명의 예시를 `defaultBrand` 대신 실제 응답과 같은 `<html data-brand>` · `setBrand` 로 고쳤어요.
