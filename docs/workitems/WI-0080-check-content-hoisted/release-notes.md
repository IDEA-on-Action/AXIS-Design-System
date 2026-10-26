# WI-0080 릴리스 노트: 호이스팅 모노레포의 Tailwind 3 content 를 실제 설치 위치로 판정해요

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | GitHub: #209 | 대상: `@axis-ds/cli` 1.7.1 · `@axis-ds/mcp` 1.4.1(2026-10-26 발행, 배치 6b 에서 WI-0081 과 합쳐짐, PR #219 머지 79c3208 · Release PR #221 머지 cb8f27c, publish run 40247657745, provenance). tokens · theme · ui-react · agentic-ui 는 바뀌지 않아요

## 바뀐 점

- `axis check` · MCP `axis.check_project` 의 `tailwind.content`(Tailwind 3) 가 `@axis-ds/ui-react` · `@axis-ds/agentic-ui` 경로를 프로젝트 디렉터리부터 상위로 찾은 설치본 위치 기준으로 판정해요. 종전에는 늘 `./node_modules/<pkg>` 로 봐서 npm workspaces · pnpm `node-linker=hoisted` 앱에서 판정이 거꾸로였어요.
  - 실제 위치 `../../node_modules/@axis-ds/ui-react/dist/**/*.{js,mjs}` 를 넣었는데 FAIL(rc 1)이던 것이 PASS 예요.
  - 종전 안내대로 `./node_modules/...` 를 넣으면 PASS 였지만 실제 빌드에서 ui-react 클래스가 하나도 생기지 않았어요(실측 0/402). 이제 FAIL 이고 `../../node_modules/...` 를 안내해요.
- `./**/*.{js,mjs}` 같은 glob 은 `../` 를 넘지 않는 것으로 봐요. 호이스팅 앱에서는 FAIL(실측 44/402), 단일 프로젝트에서는 종전처럼 PASS 예요.
- 실제 설치 위치를 가리키는 절대경로 glob 을 덮은 것으로 봐요(모든 레이아웃, 실측 402/402). pnpm 기본 앱에서 `.pnpm` 스토어의 실경로를 가리키는 절대 glob 도 인정해요(실측 372/372). 종전에는 FAIL 이었어요.
- `{./src,../../node_modules/@axis-ds/ui-react/dist}/**/*.{js,mjs,tsx}` 처럼 중괄호 안에 깊이가 다른 경로를 섞은 glob 은 갈래마다 따로 판정해요(호이스팅 앱 실측 372/372, 종전 FAIL).
- 제안이 상위 경로일 때 문구 끝에 안내가 붙어요: Tailwind 3 는 상대 경로를 빌드를 실행한 디렉터리 기준으로 풀어서, 모노레포 루트에서 빌드하면 `content: { relative: true, files: [...] }` 를 쓰라는 내용이에요. `axis theme add` 의 Tailwind 설정 안내도 같은 제안과 안내를 보여 줘요.
- pnpm 기본(앱 `node_modules` 링크) · 단일 프로젝트 · 설치본 없음 · Plug'n'Play 는 판정과 문구가 그대로예요(절대경로 인정만 달라짐).

## 알아둘 점

- 판정은 앱 디렉터리에서 빌드한다고 보고 해요. 모노레포 루트에서 빌드하는 구성이면 `relative: true` 를 쓰세요(실측: 루트 cwd 빌드에서 `../../node_modules/...` 는 0/402, `relative: true` 는 402/402).
- 설치본 탐색은 파일시스템 루트까지 올라가요. 앱 · 워크스페이스에 설치본이 없고 홈 같은 상위에만 있으면 제안이 프로젝트 밖 경로를 가리킬 수 있어요(Node 해석과 같음).
- 루트에만 `@axis-ds/ui-react` 를 선언한 앱은 content 대상이 생기지 않아요(WI-0086 에서 다뤄요).

## 저장소 규칙

- `packages/axis-registry-core/` 를 바꾸는 PR 은 changeset 에 `@axis-ds/cli` 와 `@axis-ds/mcp` 를 모두 올려야 CI(`pnpm check-changeset-mcp-tokens`)를 통과해요. 비교 기준은 PR 이면 base 와의 merge-base, main push 면 push 이전 커밋(`github.event.before`)과의 merge-base 라서 rebase 머지처럼 커밋 여러 개가 한 번에 들어와도 앞 커밋의 변경을 셈해요. 비교 기준을 구하지 못하면 exit 2 예요(CI checkout `fetch-depth: 0`).

## 발행

- `@axis-ds/cli` 1.7.1 · `@axis-ds/mcp` 1.4.1 (2026-10-26, PR #219 머지 79c3208, Release PR #221 머지 cb8f27c, publish run 40247657745, provenance 2/2). linked 4패키지는 1.8.1 그대로
- 발행본 재측정: 매트릭스 24경우 cli · mcp 각 24/24(대조 1.7.0 · 1.4.0 각 12/24), cli · mcp 불일치 0, 음성 대조 10/10(testplan 6절)
- 저장소 규칙의 main push 모드 검사는 2026-10-26 #225 main push run 40269191762 에서 registry-core 4개를 세고 통과해 정착 확정이에요(testplan 6.1절)
