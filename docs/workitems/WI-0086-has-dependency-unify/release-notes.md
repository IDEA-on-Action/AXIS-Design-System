# WI-0086 릴리스 노트: Tailwind · 컴포넌트 패키지 판정과 의존성 안내가 워크스페이스 루트 선언을 봐요

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | GitHub: #218 | 대상: `@axis-ds/cli` 1.7.2 · `@axis-ds/mcp` 1.4.2(예상, 배치 6c 에서 WI-0085 와 한 Release, 미발행). tokens · theme · ui-react · agentic-ui 는 바뀌지 않아요

## 바뀐 점

- `axis check` · `axis.check_project` 의 Tailwind 쪽 판정(Tailwind 버전 · `tailwind.content` 대상 · `animation` · Tailwind 4 컴포넌트 `tailwind.css` · 1.4.0 안내 · preset 버전 게이트)과 brand 의 `@axis-ds/theme` 버전 게이트가, 앱 `package.json` 에 선언이 없으면 워크스페이스 루트 `package.json` 의 선언도 봐요. `dependencies` 항목이 1.7.1 부터 쓰던 것과 같은 경계예요.
  - 루트에만 `@axis-ds/ui-react` 를 선언한 Tailwind 3 앱은 `tailwind.content` · `animation` 항목이 새로 나와요. `content` 가 컴포넌트 경로를 덮지 않으면 `tailwind.content` FAIL 이라 종료 코드가 0 에서 1 로 바뀔 수 있어요. 그동안 실제 빌드에서 컴포넌트 클래스가 만들어지지 않던 상태라(브리프 실측 ui-react 선택자 0/388), 제안 경로(`../../node_modules/@axis-ds/ui-react/dist/**/*.{js,mjs}` 등)를 `content` 에 넣으면 PASS 예요.
  - 루트에만 `tailwindcss` ^4 를 선언하고 아직 설치하지 않은 앱은 Tailwind 4 로 판정해 「tailwind.config 파일이 없습니다」 FAIL 이 사라져요(종료 코드 1 에서 0).
- `axis init` 은 루트에 선언된 `clsx` · `tailwind-merge` 를 앱 `package.json` 에 다시 쓰지 않고 「(워크스페이스 루트에 선언: clsx, tailwind-merge)」로 알려요. `tailwind-merge` 범위 기준도 루트 선언 Tailwind 를 따라, 루트 Tailwind 4 앱에 Tailwind 3 범위를 쓰지 않아요.
- `axis add` 와 MCP `axis.install_component` 의 의존성 안내에서 루트에 선언된 패키지가 빠져요.
- `--dir` · MCP `targetDir` 를 앱 디렉터리를 가리키는 심볼릭 링크로 줘도 실경로와 같은 판정이에요. 종전에는 링크가 놓인 쪽 상위를 올라가 루트 · 설치본을 못 찾아 「필수 의존성 누락」 같은 다른 결과가 나왔어요.

## 바뀌지 않은 점

- 앱 선언이 있으면 앱 선언이 먼저예요. 설치본이 있으면 종전처럼 설치본이 선언보다 먼저예요.
- 워크스페이스가 아닌 상위 디렉터리 · `.git` 너머의 선언은 인정하지 않아요.
- 쓰기는 앱 `package.json` 에만 해요. 루트 선언을 앱으로 옮기지 않아요.
- `dependencies` 항목의 `@axis-ds/*` 설치 확인 대상은 종전대로 앱 선언만 봐요.
- pnpm 기본 레이아웃(앱 `node_modules` 의 링크)의 `content` 제안은 그대로 `./node_modules/…` 예요(`.pnpm` 스토어 경로가 나오지 않아요).

## 알아둘 점

- `axis theme add` 가 루트에 선언된 의존성을 앱 `package.json` 에 다시 쓰는 경로는 이번에 바꾸지 않았어요(WI-0087).
- `axis init` 의 애니메이션 · Tailwind 4 컴포넌트 import · 「@axis-ds/tokens 설치:」 안내는 아직 앱 선언만 봐요. 루트에 tokens 를 선언한 미설치 Tailwind 4 앱에서 tokens 설치 줄이 나올 수 있어요.
- 링크 경로로 쓴 절대 `content` glob 은 실경로 기준 판정이라 덮음으로 보지 않아요. 실경로 절대 glob 을 쓰세요.

## 발행

- 미발행. WI-0085 와 한 PR · 한 Release(cli 1.7.2 · mcp 1.4.2 예상) 뒤 이 절을 채워요.
