---
"@axis-ds/cli": minor
"@axis-ds/mcp": minor
"@axis-ds/agentic-ui": patch
"@axis-ds/ui-react": patch
---

`axis check` 와 MCP `axis.check_project` 가 적용한 템플릿의 규칙 검사를 함께 해요(WI-0107, WI-0027 FR-4b).

- `axis.config.json` 의 `template` 이 `ontology-console` 이면 10번째 항목 `template.ontology-rules` 를 더해요. 템플릿의 `npm run check:ontology` 와 같은 다섯 규칙(em-dash · exclamation · one-side-line · card-shadow · palette)을 axis 에 내장한 판정으로 돌리고, 프로젝트의 스크립트는 실행하지 않아요(읽기 전용).
- 위반은 WARN 이라 종료 코드는 바뀌지 않아요. 검사한 파일이 0개이거나 읽기 오류가 나면 WARN 「측정 실패」, 위반은 없지만 판정하지 못한 파일(256KB 초과 · 깊이 한도 밖 · 작업량 상한 초과)이 있으면 WARN 「일부 측정 실패」예요.
- 문구에는 건수 · 규칙 id · 첫 위치(파일 · 줄 · 규칙 순으로 가장 앞의 위반)만 싣고 소스 조각은 싣지 않아요. 파일 이름은 글자 · 숫자 · 문장부호 · 기호 · 공백만 남기고 나머지(줄바꿈 · 제어 · 태그 · 폭 없는 문자 등)와 따옴표 · 역슬래시를 `\uXXXX` 로 바꿔 한 줄로 내요. 「전체 보기: npm run check:ontology」 안내는 프로젝트 `package.json` 에 그 script 가 있을 때만 붙여요.
- 심볼릭 링크는 실경로가 프로젝트 안일 때만 따라가고, 256KB 를 넘는 파일은 건너뛰고 건수를 알려요. 줄 길이 상한은 없고 판정은 선형 시간이에요.
- 프로젝트 전체 예산(판정할 파일 4,000개 · 읽는 바이트 합계 16MB · 훑는 디렉터리 항목 50,000개)을 넘으면 그 뒤 파일은 판정하지 않고 「건너뜀: 프로젝트 예산 초과로 측정 중단(…)」을 적어 WARN 「일부 측정 실패」로 알려요. 위반이 있으면 위반 WARN 에 중단 사실을 함께 적어요.
- `template` 이 없거나 다른 템플릿이면 항목을 만들지 않아 종전 출력과 같아요. 실행할 검사는 cli · mcp 안의 정적 표로 정하고, 원격 템플릿 JSON 의 `checks` 는 읽지 않아요.
- `@axis-ds/agentic-ui`: ToolCallCard 의 설명 앞 구분자를 긴 줄표에서 가운뎃점(`·`)으로 바꿨어요. 레지스트리로 넣은 컴포넌트가 ontology 규칙에 걸리지 않게 하려는 것이고 다른 동작은 같아요.
- `@axis-ds/ui-react`: SelectContent 와 Toast 의 그림자를 Tailwind `shadow-md` · `shadow-lg` 에서 Dialog 와 같은 토큰 그림자 `shadow-[shadow:var(--axis-shadow-lg)]` 로 바꿨어요. 떠 있는 레이어의 고도를 브랜드 토큰이 정하게 하려는 것이에요. 기본 브랜드의 `--axis-shadow-lg` 는 Tailwind `shadow-lg` 와 값이 같아 Toast 는 그대로이고, Select 목록은 `shadow-md` 보다 조금 큰 그림자가 돼요. ontology 브랜드에서는 그 브랜드의 `--axis-shadow-lg` 값을 써요. 테두리는 그대로예요. ontology-console 템플릿의 `lib/utils.ts` 도 레지스트리 utils 처럼 이 그림자를 tailwind-merge 그림자 그룹에 넣었어요(`cn(기본, "shadow-black/50")` 이 그림자를 지우지 않음).
