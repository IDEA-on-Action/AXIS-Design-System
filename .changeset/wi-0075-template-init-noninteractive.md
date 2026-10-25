---
'@axis-ds/cli': minor
---

터미널이 아닌 곳(CI · 파이프 · `</dev/null`)에서 질문이 남으면 「질문 한 줄만 찍고 아무것도 만들지 않은 채 rc 0」으로 끝나던 결함을 고쳐요(WI-0075). 질문의 성격에 따라 처리해요.

- 기본값이 있고 파괴적이지 않은 질문은 기본값으로 진행하고 쓴 값을 한 줄 알려요: `axis template init <name>`(`--dir` 없음)은 `./<name>` 에 만들고, `axis init`(`-y` 없음)은 `-y` 와 같은 기본값으로 진행해요.
- 기본값이 없는 입력과 덮어쓰기 확인은 아무것도 쓰지 않고 rc 1 에 필요한 옵션을 안내해요: 이름 없는 `template init`, 비어 있지 않은 디렉터리의 `template init`, 충돌 파일이 있는 `template apply`, `v0 import` · `monet import`.
- `axis template init` 에 `-y` 를 추가해요. 질문을 기본값으로 답하고, 비어 있지 않은 디렉터리도 진행해요(템플릿과 같은 경로의 파일은 덮어씀, `template apply -y` 와 같은 뜻).
- 판정은 stdin 이 터미널인지 하나라, `printf 'x\n' | axis template init dashboard` 처럼 파이프로 응답을 넣던 스크립트는 이제 묻지 않고 기본값(`./dashboard`)으로 진행해요. 값은 `--dir` · `-y` 로 주세요.
- 진입점이 명령을 끝까지 기다려요(`await program.parseAsync()`). 앞으로 가드를 빠뜨린 질문이 들어와도 rc 0 대신 rc 1(또는 Node 의 rc 13)로 드러나요. 다른 명령의 종료 코드는 그대로예요.
