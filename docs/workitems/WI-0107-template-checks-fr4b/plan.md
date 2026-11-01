# WI-0107: 구현 계획

> PRD: [prd.md](./prd.md) | 작성일: 2026-11-01

## 1. 파일

| 파일 | 변경 |
|---|---|
| `packages/axis-registry-core/src/template/template-checks.ts`(신규) | 정적 표 · 정의, `templateChecksFor` · `collectTemplateCheckResults` · `inspectOntologyRules` · `inspectOntologySource` · `messageSafePath`. 판정 엔진은 템플릿 스크립트와 같은 정규식 · 함수 이름 |
| `packages/axis-registry-core/package.json` | exports `./template-checks` |
| `packages/axis-registry-core/src/config/axis-config.ts` | template · brand 주석 정정(D2) |
| `packages/axis-cli/src/template/template-check.ts` | 10번째 항목, 머리 주석 |
| `packages/axis-cli/src/template/types.ts` · `packages/axis-mcp/src/tools/template.ts` 의 `TemplateIndexEntry` | `checks` 를 넣지 않는 이유 주석(런타임 불변식) |
| `packages/axis-mcp/src/tools/template.ts` · `src/index.ts` | 같은 호출, 도구 설명 |
| `apps/web/templates/ontology-console/files/scripts/check-ontology.mjs` | D3 ① ② 와 같은 판정(lstat · realpath · 방문 집합 · 깊이, 선형 분해, 상한), 측정 실패 rc 2 |
| `apps/web/templates/ontology-console/template.json` · `apps/web/src/lib/template-types.ts` · `apps/web/scripts/build-template-index.mjs` | `checks` 선언 · 타입 · 모양 검사 |
| `apps/web/public/templates/ontology-console.json` · `index.json` | 빌드 산출물 내용 diff(나머지 4종 updatedAt churn 은 되돌림) |
| `packages/axis-agentic-ui/src/tool-call-card/index.tsx` · `apps/web/public/r/agentic-tool-call-card.json` · `r/index.json` · `r/registry.json` | D4 구분자, sha256(version churn 은 되돌림) |
| `apps/web/public/schema.json` | template · brand 설명 |
| `.changeset/wi-0107-template-checks.md` | cli minor · mcp minor · agentic-ui patch |
| 테스트 2개(신규) | `packages/axis-cli/src/template/template-checks.test.ts`(42), `packages/axis-mcp/src/tools/template-checks.test.ts`(12) |

## 2. 판정 엔진의 선형화(두 구현 같게)

정규식 결과는 그대로 두고 2차 시간이 드는 자리만 바꿨어요(템플릿 원본 · 레지스트리 전 컴포넌트에서 구 · 신 스크립트 출력 `diff` rc 0, testplan 3절).

| 자리 | 종전 | 바꾼 것 |
|---|---|---|
| CSS 규칙 분해 | `/([^{}]+)\{([^{}]*)\}/g` | 중괄호 위치를 한 번 훑는 `cssRules`(같은 결과) |
| 블록 주석 지우기 | `/\/\*[\s\S]*?\*\//g` | indexOf 로 한 번(닫히지 않은 `/*` 뒤는 더 맞을 수 없음) |
| 줄 번호 | 위반마다 앞에서부터 셈 | 줄바꿈 위치 목록 + 이분 탐색 |
| 괄호 짝 | `cn(` · `className={` 마다 끝까지 | 한 번 훑으며 안쪽 괄호 짝도 기억(같은 결과) |
| `<Card` 앞 찾기 | 매번 `lastIndexOf` + 파일 끝까지 `slice` | 위치가 늘어나는 순서로 한 번 훑음 |
| `<Card className="` | lazy 정규식 | 선형 스캔(닫는 따옴표가 없으면 그 뒤는 시도 안 함) |
| 줄 안 2차 시간(문자열 정규식 등) | 한 줄 길이 제한 없음 | 한 줄 4,096자 상한(넘으면 파일을 건너뛰고 셈) |
| 겹친 클래스 묶음 | 길이 제한 없음 | 8,000자 상한(레지스트리 최장 2,030자, 계산) |

추가 판정 변경 1건(가정, open question): CSS `box-shadow: none`(콜론 뒤 공백)이 card-shadow 로 잡히던 오탐을 두 구현 모두 고쳤어요. 종전 `/box-shadow\s*:\s*(?!none\b…)/` 는 `\s*` 가 0자로 물러나 lookahead 를 피했어요.

## 3. 순서

1. 기준선: origin/main 과 같은 2d10c1c 에서 cli · mcp dist 를 빌드해 scratchpad 에 보관(구판 A/B 용)
2. 스크립트 개정 → registry-core 이식 → cli · mcp 연결 → 템플릿 선언 · 문서
3. 단위 · 패리티 · 비교 테스트, 변이 A/B
4. 레지스트리 재생성 · 템플릿 인덱스 재생성(churn 정리)
5. 실경로(새 HOME, 신 · 구 dist) · turbo `--force` · 스모크
