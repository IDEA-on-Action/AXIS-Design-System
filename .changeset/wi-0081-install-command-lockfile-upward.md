---
'@axis-ds/cli': patch
'@axis-ds/mcp': patch
---

워크스페이스(모노레포) 앱에서 설치 안내 명령과 `dependencies` 판정이 워크스페이스 루트를 봐요(WI-0081). 종전에는 lockfile 과 의존성 선언을 앱 디렉터리 한 층에서만 봐서, npm · yarn 워크스페이스 앱에 `pnpm install` · `pnpm add` 를 안내했고, 루트에만 `tailwindcss` 를 선언한 앱을 「필수 의존성 누락」 FAIL(종료 코드 1)로 판정했어요.

- 설치 명령(`axis init` 의 「설치:」 · 애니메이션 안내, `axis theme add` 의 토큰 · theme 설치 안내, `axis add` · MCP `axis.install_component` 의 의존성 명령, `axis check` · `axis.check_project` 의 미설치 안내): 앱에 lockfile 이 없으면 가장 가까운 워크스페이스 루트(`pnpm-workspace.yaml` 이나 `package.json` `workspaces`)의 lockfile 을 따라요. 그 전에 `.git` 이 나오거나 루트를 못 찾으면 종전처럼 `pnpm install` 이에요. 앱에 lockfile 이 있으면 그것이 먼저이고, `packageManager` 필드는 보지 않아요.
- `dependencies`(`axis check` · `axis.check_project`): 앱에 선언이 없으면 워크스페이스 루트 `package.json` 의 선언도 인정하고 문구에 「워크스페이스 루트에 선언: …」을 붙여요. 그런 앱의 `axis check` 종료 코드가 1 에서 0 으로 바뀔 수 있어요. 워크스페이스가 아닌 상위 디렉터리의 선언은 여전히 FAIL 이에요.
- lockfile 과 상관없이 pnpm 으로 고정된 안내(template apply · MCP brand · template 등)는 이번에 바꾸지 않았어요(WI-0085).
