# WI-0081 릴리스 노트: 워크스페이스 앱의 설치 안내 명령과 dependencies 판정이 워크스페이스 루트를 봐요

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | GitHub: #210 | 대상: `@axis-ds/cli` 1.7.1 · `@axis-ds/mcp` 1.4.1(예정, 배치 6b Release PR 에서 WI-0080 과 합쳐짐). tokens · theme · ui-react · agentic-ui 는 바뀌지 않아요

## 바뀐 점

- 설치 안내 명령이 워크스페이스 루트의 lockfile 을 따라요. 앱 디렉터리에 lockfile 이 없으면 가장 가까운 워크스페이스 루트(`pnpm-workspace.yaml` 이나 `package.json` `workspaces` 가 있는 상위)의 lockfile 을 봐요. 종전에는 앱 한 층만 봐서 npm · yarn 워크스페이스 앱에 `pnpm install` · `pnpm add` 를 안내했어요.
  - 해당 출력: `axis init` 의 「설치:」 · 추가 명령 · 애니메이션 안내, `axis theme add` 의 토큰 · theme 설치 안내, `axis theme list` · `info` 의 토큰 설치 안내, `axis add` 와 MCP `axis.install_component` 의 의존성 명령, `axis check` · `axis.check_project` 의 미설치 안내.
  - 실측(발행본 1.7.0 대 수정본): npm 워크스페이스 4줄 · yarn 워크스페이스 4줄이 바뀌고, pnpm 워크스페이스 · 단일 프로젝트는 그대로예요.
- `axis check` · `axis.check_project` 의 `dependencies` 가 앱에 선언이 없는 `tailwindcss` · `clsx` · `tailwind-merge` 를 워크스페이스 루트 `package.json` 선언으로 인정하고, 문구 끝에 「(워크스페이스 루트에 선언: tailwindcss)」 처럼 출처를 붙여요.
  - 루트에만 `tailwindcss` 를 선언한 앱은 종전 「필수 의존성 누락: tailwindcss」 FAIL 이 사라져 `axis check` 종료 코드가 1 에서 0 으로 바뀔 수 있어요(실측 4앱, npm · pnpm · pnpm hoisted). CI 에서 `axis check` 를 게이트로 쓰면 결과가 달라져요.

## 바뀌지 않은 점

- 앱 디렉터리에 lockfile 이 있으면 그것이 먼저예요. 같은 층에 lockfile 이 여럿이면 종전 순서(pnpm → yarn → npm)예요.
- 워크스페이스 루트를 못 찾거나 루트에 lockfile 이 없으면 종전처럼 `pnpm install` 이에요. `package.json` `packageManager` 필드는 보지 않아요.
- 워크스페이스가 아닌 상위 디렉터리의 lockfile · 선언은 쓰지 않아요(그런 상위에만 `tailwindcss` 를 선언한 앱은 여전히 FAIL).
- 설치본 탐색(`node_modules`)은 종전처럼 파일시스템 루트까지 올라가요.

## 알아둘 점

- 앱과 워크스페이스 루트 사이에 `.git`(디렉터리 또는 서브모듈의 파일)이 있으면 거기서 멈춰요. 서브모듈 안 앱은 바깥 저장소의 lockfile · 선언을 보지 않아요.
- 워크스페이스 글롭이 그 앱을 실제로 포함하는지는 보지 않아요. 글롭에서 빠진 앱이 루트 아래 있으면 루트 lockfile · 선언을 따라요.
- lockfile 과 상관없이 pnpm 으로 고정된 안내(`axis template apply`, MCP brand · template 안내, monet 안내)는 이번에 바꾸지 않았어요(WI-0085 에서 다뤄요).
- 루트에만 `@axis-ds/ui-react` 를 선언한 앱의 Tailwind 판정(content 대상 · animation 등)은 아직 앱 선언만 봐요(WI-0086 에서 다뤄요).

## 발행

- (배포 뒤 기록)
