# WI-0074 릴리스 노트: 호이스팅 모노레포에서도 설치된 Tailwind · AXIS 버전으로 판정해요

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | GitHub: #199 | 대상: `@axis-ds/cli` 1.7.0 · `@axis-ds/mcp` 1.4.0(2026-10-26 발행, 배치 6 묶음에서 다른 WI 의 minor 와 합쳐짐, PR #214 머지 4a5e185 · Release PR #216 머지 61ae674, publish run 40205738223, provenance). tokens · theme · ui-react · agentic-ui 는 바뀌지 않아요

## 바뀐 점

- `axis check` · MCP `axis.check_project` 가 Tailwind 버전과 AXIS 패키지(tokens · ui-react · agentic-ui) 버전을 프로젝트 디렉터리부터 상위로 찾은 설치본으로 판정해요. 종전에는 프로젝트의 `node_modules` 한 층만 읽어서, npm workspaces · pnpm `node-linker=hoisted` 처럼 루트에만 설치되는 모노레포에서 설치본을 못 찾고 package.json 선언으로 판정했어요.
  - 예: 앱이 `tailwindcss: "latest"` 를 선언한 npm 워크스페이스는 `FAIL tailwind.config 파일이 없습니다`(rc 1)였는데 이제 Tailwind 4 로 판정해 PASS 예요.
  - 예: 앱 선언이 `@axis-ds/tokens ^1.3.0` 이어도 루트 설치본이 1.8.0 이면 「1.4.0 이상 필요」 WARN 을 내지 않아요. 루트 설치본이 1.3.0 이면 「설치본 1.3.0」으로 안내해요.
- 같은 판정을 쓰는 다른 명령도 함께 바로잡혀요.
  - `axis init`: 루트에만 Tailwind 4 가 설치된 앱에 `tailwind-merge@^2.6.0`(Tailwind 3 범위) 대신 `^3.4.0` 을 써요.
  - `axis theme add`: 그런 앱의 CSS 에 Tailwind 3 기본 CSS(`@axis-ds/tokens/css` · `css/shadcn`) 대신 `@axis-ds/tokens/css/tailwind4` 를 넣어요.
  - `axis template apply`: Tailwind 3 템플릿을 Tailwind 4 앱에 적용하면 major 경고를 내요.
  - `axis add`: 추가하는 `tailwind-merge` 범위가 init 과 같아요.
- 가장 가까운 설치본이 앞서요(앱에 Tailwind 3 이 따로 설치돼 있으면 루트의 Tailwind 4 보다 앞). Plug'n'Play(`.pnp.cjs`)면 종전처럼 선언으로 판정해요.
- 설치본이 프로젝트 디렉터리에 있는 구조(pnpm 기본 · 단일 프로젝트)는 판정이 바뀌지 않아요(실제 설치 픽스처 측정).

## 알아둘 점

- 루트에만 `tailwindcss` 를 선언한 앱은 `dependencies` 항목이 여전히 「필수 의존성 누락: tailwindcss」 FAIL 이에요. 워크스페이스 루트 선언 인정은 후속(WI-0081 축)에서 다뤄요.
- 호이스팅 Tailwind 3 의 `tailwind.content` 가 `../../node_modules/...` 경로를 인정하지 않는 문제는 WI-0080 에서 다뤄요.
- 상위 탐색은 Node 의 패키지 탐색과 같이 파일시스템 루트까지 올라가고 프로젝트 · 워크스페이스 루트에서 멈추지 않아요. 그래서 아직 install 하지 않은 앱이나 워크스페이스 밖에 놓인 앱에서는 관계없는 상위 디렉터리(예: 홈의 `node_modules`)의 `tailwindcss` · `@axis-ds/*` 설치본이 선언보다 앞서 판정에 쓰여요. 그 앱을 Node 로 실행해도 같은 설치본을 읽으므로 실행 결과와는 맞는 판정이에요(반박 검토 minor, 설계 경계로 기록). 저장소 안 템플릿 디렉터리(`apps/web/templates/*/files`)에서 init 테스트가 저장소 루트 `node_modules/tailwindcss` 를 읽게 된 것이 이 경계의 실측 예예요.

## 발행

- `@axis-ds/cli` 1.7.0 · `@axis-ds/mcp` 1.4.0 (2026-10-26, PR #214 머지 4a5e185, Release PR #216 머지 61ae674, publish run 40205738223, provenance 6/6)
- 발행본 재측정: 항목 70/70 수집, 12 전이 · 98 불변 줄, 음성 대조 전이 0(testplan 6절)
