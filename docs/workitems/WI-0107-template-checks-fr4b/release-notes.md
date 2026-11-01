# WI-0107: axis check · MCP check_project 템플릿 규칙 검사 릴리스 노트

> 미발행(2026-11-01 작성) | 대상: `@axis-ds/cli` minor → 1.8.0 · `@axis-ds/mcp` minor → 1.5.0 · `@axis-ds/agentic-ui` patch → 1.8.4 | GitHub: #271
> `@axis-ds/tokens` · `@axis-ds/ui-react` · `@axis-ds/theme` 는 그대로예요

## 바뀐 점

- `axis check` 와 MCP `axis.check_project` 가 `axis.config.json` 의 `"template": "ontology-console"` 을 보고 10번째 항목 `template.ontology-rules` 를 더해요. 템플릿의 `npm run check:ontology` 와 같은 다섯 규칙(em-dash · exclamation · one-side-line · card-shadow · palette)을 `app/` · `components/` · `lib/` 에 돌려요.
  - axis 에 내장한 판정이고 프로젝트 스크립트를 실행하지 않아요(읽기 전용).
  - 위반은 WARN 이라 종료 코드는 그대로예요. 검사한 파일이 0개 · 읽기 오류는 WARN 「측정 실패」예요.
  - 문구는 건수 · 규칙별 수 · 첫 위치만 싣고, 파일 이름의 줄바꿈 · 제어문자는 `\uXXXX` 로 바꿔요. `package.json` 에 `check:ontology` script 가 있으면 「→ 전체 보기: npm run check:ontology」를 붙여요.
- 템플릿 스크립트(`scripts/check-ontology.mjs`)도 같은 판정으로 바꿨어요: 심볼릭 링크는 프로젝트 안일 때만 따라가고(종전에는 밖 파일을 읽고 순환 링크에서 ELOOP 로 rc 1), 256KB · 한 줄 4,096자 상한, 큰 입력의 2차 시간 제거(12만 자 꼬리 주석 CSS 7.6초 → 26ms 등), 읽기 오류는 rc 2. 일반 소스의 판정 결과는 같아요(템플릿 원본 · 레지스트리 전 컴포넌트 출력 diff 0).
- CSS `box-shadow: none`(콜론 뒤 공백)이 card-shadow 로 잡히던 오탐을 고쳤어요.
- MCP 도구 설명에 「적용한 템플릿의 규칙 검사 포함(읽기 전용, 스크립트 실행 안 함)」을 더했어요.
- ontology-console template.json 에 `checks` 선언을 더했어요(빌드 · 동기화 테스트 전용, cli · mcp 는 읽지 않음).
- `@axis-ds/agentic-ui` ToolCallCard: 설명 앞 구분자를 긴 줄표에서 가운뎃점(`·`)으로 바꿨어요.
- `axis.config.json` 스키마의 `template` · `brand` 설명을 실제로 쓰는 경로에 맞게 고쳤어요.

## 바뀌지 않은 점

- `template` 이 없거나 다른 템플릿 · 이상값이면 `axis check` 출력은 1.7.10 과 바이트가 같아요(13 fixture 측정).
- 기존 9항목의 판정 · 문구 · 종료 코드.

## 알려진 한계

- 정규식 휴리스틱이라 오탐이 있어요. 레지스트리의 select · toast 를 넣으면 card-shadow WARN 4건이 나와요(testplan 6절).
- 판정은 설치한 cli · mcp 버전 기준이라, 프로젝트에 복사된 스크립트를 고쳤거나 오래된 템플릿으로 만든 프로젝트는 `npm run check:ontology` 결과와 다를 수 있어요.
- 같은 줄 안의 2차 시간은 한 줄 4,096자 상한으로만 묶여 있어요(최악 입력 약 0.9초, 측정).
