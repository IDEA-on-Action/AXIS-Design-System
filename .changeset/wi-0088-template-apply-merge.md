---
"@axis-ds/cli": patch
"@axis-ds/mcp": patch
---

WI-0088: `axis template apply` · `template init` · MCP `axis.apply_template` 이 기존 package.json 을 덮어쓰지 않고 합쳐요. 템플릿 경로의 디렉터리 탈출도 막아요(보안 수정).

- 주의(합쳐도 바뀌는 값): 「덮어쓰지 않는다」는 사용자에게만 있는 필드가 남는다는 뜻이에요. 양쪽에 같은 이름이 있는 `scripts` · 의존성 4맵의 키와 axis.config.json 의 키는 **템플릿 값으로 바뀌어요**. 예를 들어 `dependencies.react` 를 `18.3.1` 로 고정해 두었으면 apply 뒤 템플릿 범위(예: `^19`)로 바뀌고, 같은 이름의 `scripts.build` 도 템플릿 명령이 돼요. JSON 으로 읽을 수 없는 package.json(주석 · 깨진 JSON)과 하위 경로의 package.json 은 종전처럼 통째로 덮어써요. 값을 지키려면 apply 전에 `axis template diff` 나 `--dry-run` 으로 「합치기」 대상을 확인하고, apply 뒤 버전 관리 diff 에서 되돌려 주세요
- 보안 수정: 템플릿의 `files[].path` · `postInstall[].file` 이 대상 디렉터리 밖(절대 경로, `../x` · `a/../../x` 처럼 상위로 나가는 경로, 프로젝트 안 심볼릭 링크를 거쳐 밖으로 나가는 경로)을 가리키면 `template apply` · `init` · `diff` 와 MCP `axis.apply_template` · `axis.diff_template` 이 어떤 파일도 쓰거나 읽기 전에 「템플릿 경로 '<경로>' 가 대상 디렉터리 밖을 가리켜(<원인>) 중단했습니다. 아무 파일도 바꾸지 않았습니다」로 멈춰요(CLI rc 1, MCP 오류). 종전에는 오염된 레지스트리나 `AXIS_TEMPLATE_URL` 로 지정한 레지스트리가 프로젝트 밖에 쓰거나 읽을 수 있었어요. 공식 템플릿 5개는 경로가 모두 안쪽이라 영향이 없어요(측정 결과 바이트 같음)

- 바뀐 점: 대상에 package.json 이 있으면 템플릿 package.json 으로 통째로 바꾸지 않고 합쳐요. `packageManager` · `name` · `version` · `private` · `workspaces` · `engines` · `type` 등 최상위 필드는 사용자 값을 두고, 템플릿에만 있는 필드는 뒤에 붙여요. `scripts` · `dependencies` · `devDependencies` · `peerDependencies` · `optionalDependencies` 는 키 단위로 합치고 같은 키는 템플릿 값을 써요(종전 동작 · 「필요한 의존성」 설치 명령과 같은 범위). 그래서 apply 뒤 `axis check` 등 다음 명령의 설치 안내가 사용자의 `packageManager` 를 따라요(종전에는 필드가 사라져 pnpm 으로 안내)
- 바뀐 점: 템플릿이 axis.config.json 을 가진 경우(ontology-console) 기존 axis.config.json 과 합쳐요. 같은 키는 템플릿 값(템플릿이 쓴 파일을 가리킴)이고, 사용자에게만 있는 키는 남아요(종전에는 사라짐)
- 바뀐 점: 합친 파일은 기존 파일의 들여쓰기 · 줄바꿈(CRLF) · 끝 줄바꿈 유무를 따라요. CLI 충돌 목록 · `--dry-run` 은 그 파일을 「합치기」로, MCP 결과는 「합치기: 기존 필드를 두고 템플릿 키를 합침」으로 표시해요
- 바뀐 점: 파일을 쓰는 도중 실패하면 이미 건드린 파일을 원래 내용으로 되돌리고(새로 만든 파일 · 빈 디렉터리는 지움) CLI 는 rc 1, MCP 는 오류 응답이에요. `template init` 은 그때 axis.config.json 생성과 다음 단계 안내로 넘어가지 않아요
- 바뀌지 않은 점: 빈 디렉터리(같은 경로의 파일이 없음)에 쓰는 파일은 템플릿 바이트 그대로예요. package.json · axis.config.json 이 아닌 파일, 하위 경로의 package.json 은 종전처럼 덮어써요. 기존 package.json 을 JSON 객체로 읽을 수 없으면 종전처럼 템플릿 내용으로 덮어쓰고 한 줄로 알려요. 충돌 확인(`-y` 없는 비대화형 rc 1) · 종료 코드 · 「필요한 의존성」 명령은 그대로예요
