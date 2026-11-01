# WI-0107: axis check · MCP check_project 템플릿 규칙 검사 릴리스 노트

> 미발행(2026-11-01 작성) | 대상: `@axis-ds/cli` minor → 1.8.0 · `@axis-ds/mcp` minor → 1.5.0 · `@axis-ds/ui-react` · `@axis-ds/agentic-ui` patch → 1.8.4 | GitHub: #271
> `@axis-ds/tokens` · `@axis-ds/theme` 는 그대로예요(linked 그룹은 올라가는 패키지끼리만 버전을 맞춰요)

## 바뀐 점

- `axis check` 와 MCP `axis.check_project` 가 `axis.config.json` 의 `"template": "ontology-console"` 을 보고 10번째 항목 `template.ontology-rules` 를 더해요. 템플릿의 `npm run check:ontology` 와 같은 다섯 규칙(em-dash · exclamation · one-side-line · card-shadow · palette)을 `app/` · `components/` · `lib/` 에 돌려요.
  - axis 에 내장한 판정이고 프로젝트 스크립트를 실행하지 않아요(읽기 전용).
  - 위반은 WARN 이라 종료 코드는 그대로예요. 검사한 파일이 0개 · 읽기 오류는 WARN 「측정 실패」, 위반이 없어도 판정하지 못한 파일(256KB 초과 · 깊이 한도 밖 · 작업량 상한 초과 · 프로젝트 예산 초과)이 있으면 WARN 「일부 측정 실패」예요.
  - 프로젝트 전체 예산: 판정할 파일 4,000개 · 읽는 바이트 합계 16MB. 파일은 정해진 순서(대상 `app` → `components` → `lib`, 그 안은 이름 정렬 깊이 우선)로 모으고, 넘으면 그 뒤 파일은 판정하지 않고 「건너뜀: 프로젝트 예산 초과로 측정 중단(파일 4000개 상한)」 또는 「(읽기 16MB 상한)」을 적어요. 위반이 있으면 위반 WARN 에 이 문구를 함께 붙여요. 템플릿 스크립트도 같은 예산 · 같은 문구이고 위반이 없으면 rc 2 예요.
  - 문구는 건수 · 규칙별 수 · 첫 위치(파일 · 줄 · 규칙 순으로 가장 앞)만 싣고, 파일 이름은 허용 목록(글자 · 숫자 · 문장부호 · 기호 · 공백) 밖 문자(줄바꿈 · 제어 · 태그 · 폭 없는 문자 등)와 따옴표 · 역슬래시를 `\uXXXX` 로 바꿔요. `package.json` 에 `check:ontology` script 가 있으면 「→ 전체 보기: npm run check:ontology」를 붙여요.
- 템플릿 스크립트(`scripts/check-ontology.mjs`)도 같은 판정으로 바꿨어요: 심볼릭 링크는 프로젝트 안일 때만 따라가고(종전에는 밖 파일을 읽고 순환 링크에서 ELOOP 로 rc 1), 256KB 상한, 큰 입력의 2차 시간 제거(12만 자 꼬리 주석 CSS 7.6초 → 26ms, `cn(\"` 반복 수 초 → 수십 ms 등), 읽기 오류 · 일부 측정 실패는 rc 2, 위반은 파일 · 줄 · 규칙 순으로 출력. 일반 소스의 판정 결과는 같아요(템플릿 원본 · 레지스트리 전 컴포넌트 위반 집합 같음, 차분 퍼징 12만 건 차이 0).
- CSS `box-shadow: none`(콜론 뒤 공백)이 card-shadow 로 잡히던 오탐을 고쳤어요.
- MCP 도구 설명에 「적용한 템플릿의 규칙 검사 포함(읽기 전용, 스크립트 실행 안 함)」을 더했어요.
- ontology-console template.json 에 `checks` 선언을 더했어요(빌드 · 동기화 테스트 전용, cli · mcp 는 읽지 않음).
- `@axis-ds/agentic-ui` ToolCallCard: 설명 앞 구분자를 긴 줄표에서 가운뎃점(`·`)으로 바꿨어요.
- `@axis-ds/ui-react` SelectContent · Toast: 그림자를 Tailwind `shadow-md` · `shadow-lg` 에서 Dialog 와 같은 토큰 그림자 `shadow-[shadow:var(--axis-shadow-lg)]` 로 바꿨어요(테두리는 그대로). 기본 브랜드의 `--axis-shadow-lg` 는 Tailwind `shadow-lg` 와 같은 값(`0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`)이라 Toast 는 그대로이고, Select 목록은 `shadow-md`(`0 4px 6px -1px …`)보다 조금 큰 그림자가 돼요. ontology 브랜드에서는 그 브랜드 값(`0 8px 24px rgba(17,20,24,.10)`, 어두운 테마 `0 8px 24px rgba(0,0,0,.50)`)을 써요. 레지스트리 select · toast 도 다시 만들었어요.
- `axis.config.json` 스키마의 `template` · `brand` 설명을 실제로 쓰는 경로에 맞게 고쳤어요.

## 바뀌지 않은 점

- `template` 이 없거나 다른 템플릿 · 이상값이면 `axis check` 출력은 1.7.10 과 바이트가 같아요(13 fixture 측정).
- 기존 9항목의 판정 · 문구 · 종료 코드.

## 알려진 한계

- 정규식 휴리스틱이라 오탐이 있을 수 있어요. 레지스트리 전 컴포넌트를 넣은 사본은 위반 0건이에요(종전 select · toast 의 card-shadow 4건은 위 `@axis-ds/ui-react` 변경으로 없어졌고 판정 규칙은 고치지 않았어요, testplan 6절).
- select · toast 가 card-shadow 에 걸리지 않게 된 근거와 동작은 따로예요.
  - 근거(설계): ontology 브랜드는 카드 그림자 `--axis-card-shadow` 를 `0 0 #0000` 으로 끄지만 떠 있는 레이어용 `--axis-shadow-lg` 에는 값을 두어 고도를 의도적으로 표현해요. 두 컴포넌트는 카드가 아니라 떠 있는 레이어이고, 그림자 값을 브랜드 토큰이 정하므로 카드 그림자 금지와 맞아요.
  - 동작(판정): card-shadow 의 그림자 클래스 판정은 `shadow-[shadow:…]` 처럼 타입 힌트 `shadow:` 가 붙은 임의값을 그림자 클래스로 보지 않아요(대괄호 안의 `:` 때문). 토큰인지를 보고 통과시키는 것이 아니라 클래스 모양 때문이에요. 그래서 `rounded-md border shadow-[shadow:0_4px_8px_…]` 처럼 토큰이 아닌 값을 타입 힌트로 써도 걸리지 않아요. 힌트가 없는 `shadow-[var(--axis-shadow-lg)]` · `shadow-lg` 는 걸려요. 같은 임의값 안의 `_rgb(…)` 처럼 밑줄 바로 뒤의 색 함수는 palette 로도 잡지 못해요.
- 판정은 설치한 cli · mcp 버전 기준이라, 프로젝트에 복사된 스크립트를 고쳤거나 오래된 템플릿으로 만든 프로젝트는 `npm run check:ontology` 결과와 다를 수 있어요.
- 판정 시간은 파일 크기에 선형이에요(적대 입력 35종 × 줄 길이 3가지, 250KB 파일 하나 최악 약 0.25초, testplan 5절). 프로젝트 전체는 파일 4,000개 · 16MB 예산으로 묶어요. 예산 안 최악은 250KB 적대 입력(`cn({` 반복) 파일로 16MB 를 채운 경우 `axis check` 약 4.5초예요(testplan 7절). 시간 기반 상한은 기기 부하에 따라 멈추는 파일이 달라져 결과가 결정적이지 않아 두지 않았어요.
- 예산은 `axis check` · MCP 에서 바꿀 수 없어요. 템플릿 스크립트는 환경변수 `CHECK_ONTOLOGY_MAX_FILES` · `CHECK_ONTOLOGY_MAX_BYTES` 로 낮추기만 할 수 있어요(기본값보다 큰 값 · 0 · 숫자가 아닌 값은 무시).
- 닫히지 않은 `cn(` 를 수만 겹 쌓은 것 같은 병적 입력은 클래스 묶음 판정을 작업량 상한에서 멈추고 「일부 측정 실패」로 알려요(그 파일의 다른 규칙은 판정해요).
