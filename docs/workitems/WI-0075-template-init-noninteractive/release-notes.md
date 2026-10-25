# WI-0075 릴리스 노트: 터미널이 아닌 곳에서 질문이 남아도 조용히 끝나지 않아요

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | GitHub: #201 | 대상: `@axis-ds/cli` minor(배치 6 묶음에서 cli 1.7.0 예정). mcp · tokens · theme · ui-react · agentic-ui 는 바뀌지 않아요

## 바뀐 점

- CI · 파이프 · `</dev/null` 처럼 stdin 이 터미널이 아니면 질문을 띄우지 않아요. 종전에는 입력이 닫힌 곳(`</dev/null` · 빈 파이프)에서 질문 한 줄만 찍고 아무것도 만들지 않은 채 rc 0 으로 끝났어요(`axis add` 만 예외). 파이프로 응답을 넣으면 그 값으로 동작했어요.
  - `axis template init <name>` 을 `--dir` 없이 부르면 `./<name>` 에 만들고 「프로젝트 디렉토리를 기본값 '<name>' 로 정했습니다」를 알려요.
  - `axis init` 을 `-y` 없이 부르면 `-y` 와 같은 기본값으로 진행하고 쓴 값(componentsDir · tailwindConfig · globalCss)을 한 줄 알려요. 내용이 다른 기존 `utils.ts` 가 있으면 덮어쓰기 확인이라 진행하지 않고 rc 1 이에요(axis.config.json · utils.ts · package.json 모두 그대로, `axis init -y` 안내). `-y` 와 대화형은 종전처럼 덮어써요.
  - 이름 없는 `axis template init`, 비어 있지 않은 디렉터리의 `axis template init`, 충돌 파일이 있는 `axis template apply`, `axis v0 import` · `axis monet import` 는 아무것도 쓰지 않고 rc 1 로 끝나며 필요한 옵션을 알려요.
- `axis template init` 에 `-y` 가 생겼어요. 질문을 기본값으로 답하고 비어 있지 않은 디렉터리도 진행해요(템플릿과 같은 경로의 파일은 덮어씀, `template apply -y` 와 같은 뜻).
- 터미널에서 실행하면 종전과 같이 물어요.

## 알아둘 점

- 판정은 stdin 이 터미널인지 하나예요. `printf 'x\n' | axis template init dashboard` 처럼 파이프로 응답을 넣던 스크립트는 이제 묻지 않고 `./dashboard` 로 진행해요. 값은 `--dir` · `-y` 로 주세요.
- 다른 명령의 종료 코드는 바뀌지 않아요(14종 대조). 진입점이 명령을 끝까지 기다리도록 바뀌어, 앞으로 가드를 빠뜨린 질문이 생기면 rc 0 대신 rc 1(또는 Node 의 rc 13)로 드러나요.
