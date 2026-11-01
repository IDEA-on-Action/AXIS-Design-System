---
"@axis-ds/cli": minor
"@axis-ds/mcp": minor
"@axis-ds/agentic-ui": patch
---

`axis check` 와 MCP `axis.check_project` 가 적용한 템플릿의 규칙 검사를 함께 해요(WI-0107, WI-0027 FR-4b).

- `axis.config.json` 의 `template` 이 `ontology-console` 이면 10번째 항목 `template.ontology-rules` 를 더해요. 템플릿의 `npm run check:ontology` 와 같은 다섯 규칙(em-dash · exclamation · one-side-line · card-shadow · palette)을 axis 에 내장한 판정으로 돌리고, 프로젝트의 스크립트는 실행하지 않아요(읽기 전용).
- 위반은 WARN 이라 종료 코드는 바뀌지 않아요. 검사한 파일이 0개이거나 읽기 오류가 나면 WARN 「측정 실패」예요.
- 문구에는 건수 · 규칙 id · 첫 위치만 싣고 소스 조각은 싣지 않아요. 파일 이름의 줄바꿈 · 제어문자는 `\uXXXX` 로 바꿔 한 줄로 내요. 「전체 보기: npm run check:ontology」 안내는 프로젝트 `package.json` 에 그 script 가 있을 때만 붙여요.
- 심볼릭 링크는 실경로가 프로젝트 안일 때만 따라가고, 256KB 를 넘거나 한 줄이 4,096자를 넘는 파일은 건너뛰고 건수를 알려요.
- `template` 이 없거나 다른 템플릿이면 항목을 만들지 않아 종전 출력과 같아요. 실행할 검사는 cli · mcp 안의 정적 표로 정하고, 원격 템플릿 JSON 의 `checks` 는 읽지 않아요.
- `@axis-ds/agentic-ui`: ToolCallCard 의 설명 앞 구분자를 긴 줄표에서 가운뎃점(`·`)으로 바꿨어요. 레지스트리로 넣은 컴포넌트가 ontology 규칙에 걸리지 않게 하려는 것이고 다른 동작은 같아요.
