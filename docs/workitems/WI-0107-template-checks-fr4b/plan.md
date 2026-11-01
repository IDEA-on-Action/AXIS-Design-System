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
| 괄호 짝 | `cn(` · `className={` 마다 끝까지 | 안쪽 괄호 짝을 기억하고 아는 괄호는 그 짝으로 건너뜀, 문자열은 표(skipEnds)로 한 번에 건너뜀, 8,000자 거리에서 멈춤, 파일 길이 비례 작업량 상한(같은 결과, 상한 초과만 일부 측정 실패) |
| `<Card` 앞 찾기 | 매번 `lastIndexOf` + 파일 끝까지 `slice` | 위치가 늘어나는 순서로 한 번 훑음 |
| `<Card className="` | lazy 정규식 | 선형 스캔(닫는 따옴표가 없으면 그 뒤는 시도 안 함) |
| 문자열 리터럴 추출(textChunks · joinStrings) | `/(["'`])((?:\\.\|(?!\1)[^\\\n])*)\1/g` | 따옴표별 닫는 위치 표를 오른쪽에서 한 번 만들어 선형으로(같은 결과, 차분 퍼징 12만 건 차이 0) |
| 줄 길이 | 4,096자 상한으로 파일을 건너뜀(검토에서 위반을 가린 PASS 로 지적) | 상한 없음(위 두 줄로 선형) |
| 겹친 클래스 묶음 | 길이 제한 없음 | 8,000자 상한(레지스트리 최장 2,030자, 계산) |

추가 판정 변경 1건(가정, open question): CSS `box-shadow: none`(콜론 뒤 공백)이 card-shadow 로 잡히던 오탐을 두 구현 모두 고쳤어요. 종전 `/box-shadow\s*:\s*(?!none\b…)/` 는 `\s*` 가 0자로 물러나 lookahead 를 피했어요.

## 3. 순서

1. 기준선: origin/main 과 같은 2d10c1c 에서 cli · mcp dist 를 빌드해 scratchpad 에 보관(구판 A/B 용)
2. 스크립트 개정 → registry-core 이식 → cli · mcp 연결 → 템플릿 선언 · 문서
3. 단위 · 패리티 · 비교 테스트, 변이 A/B
4. 레지스트리 재생성 · 템플릿 인덱스 재생성(churn 정리)
5. 실경로(새 HOME, 신 · 구 dist) · turbo `--force` · 스모크

## 4. 독립 검토 반영(2026-11-01 3차)

| 지적 | 재현 | 바꾼 것 |
|---|---|---|
| 템플릿 `lib/utils.ts` 의 기본 `twMerge` 가 `shadow-[shadow:…]` 를 그림자 색으로 봄 | tailwind-merge 2.6.0 에서 `cn('rounded-md border shadow-[shadow:var(--axis-shadow-lg)]', 'shadow-black/50')` → `rounded-md border shadow-black/50`(그림자 사라짐), 확장판은 둘 다 남음 | 레지스트리 utils 와 같은 `extendTailwindMerge` 설정, 공개 JSON 재생성, 동기화 테스트 |
| 판정 목록에 들지 않는 항목의 순회에 상한이 없음 | HEAD 코어로 같은 파일 링크 20만 개 9.8초 · 빈 `.md` 30만 개 3.0초 · 빈 디렉터리 10만 개 1.8초, 셋 다 budgetStop 없음(PASS) | 디렉터리 항목 예산 50,000개(readdir 가 돌려준 이름을 숨김 · `node_modules` 까지 모두 셈, 넘는 다음 이름에서 목록 모으기를 멈춤), 두 구현 같게 |
| 스크립트가 출력 직후 `process.exit()` 해서 파이프로 받으면 stdout 끝이 잘림 | 위반 4,100파일 사본, HEAD 스크립트 `\| (sleep 0.3; cat) \| wc -l` 534 · 534 · 1,914줄, `\| tail -1` 이 위반 줄 | 판정을 `main()` 으로 감싸고 `process.exitCode = main()`, 위반 + 측정 중단이면 stderr 안내 한 줄 |
