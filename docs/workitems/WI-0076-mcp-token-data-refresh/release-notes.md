# WI-0076 릴리스 노트: MCP 토큰 도구가 tokens 실제 값을 돌려줘요

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | GitHub: #202 | 대상: `@axis-ds/mcp` minor 1.4.0(2026-10-26 발행, tokens 1.8.1 과 함께, PR #214 머지 4a5e185 · Release PR #216 머지 61ae674, publish run 40205738223, provenance). tokens · theme · ui-react · agentic-ui · cli 는 바뀌지 않아요

## 바뀐 점

- `axis.list_tokens` · `axis.get_token` 의 데이터를 MCP 빌드 때 `@axis-ds/tokens` 빌드 산출물(`json/tokens.json` · `css/variables.css` · `css/shadcn-compat.css`)에서 생성해요. 1.3.5 까지는 처음 만든 뒤 갱신되지 않은 손 사본이라 41개 가운데 16개 값이 tokens 1.8.0 과 달랐어요(예: `colors.primary` `hsl(222.2 47.4% 11.2%)` → 실제 `hsl(221 39% 11%)`, `muted-foreground` 는 WI-0029 대비 수정 전 값).
- 토큰 309개(tokens 1.8.0 기준): 기존 경로 36개는 그대로, tokens 의 모든 변수가 새로 나와요. 밀도 토큰 15개(`control.h.md` · `field.h` · `toggle.h.lg` · `table.font.size` · `radius.control` 등)와 shadcn `card` · `popover` · `input` · `chart-1~5` · `radius` 도 있어요.
- 항목마다 다크 값과 실제 CSS 변수 이름을 보여줘요. shadcn 색은 `hsl(var(--primary))` 로 쓰라고 안내해요(종전 `var(--primary)` 는 그대로 쓰면 색이 안 나와요).
- `path` 는 기존 경로 · tokens 이름 기반 경로(`space.5` · `font.size.sm`) · CSS 변수 이름(`--axis-control-h-md`)을 받아요.
- 목록 첫머리에 생성에 쓴 tokens 버전이 나와요.

## 응답 계약 변경 (MCP 클라이언트 확인)

- 경로 5개 제거: `shadow.md` · `animation.duration.fast` · `animation.duration.normal` · `animation.duration.slow` · `animation.easing.default`. tokens 에 원천이 없는 값이었어요.
- `category`: `animation` 제거(주면 입력 검증 오류), `density` · `component` 추가.
- 없는 경로의 `axis.get_token` 은 `isError: true` 로 답해요(문구는 「토큰을 찾을 수 없습니다: `<경로>`」로 시작).
- `cssVariable` 바로잡음: `radius.none` · `sm` · `lg` · `full` 은 종전 `--radius-*`(존재하지 않음)에서 `--axis-radius-*`, `radius.md` 는 `--radius`(0.5rem)에서 `--axis-radius-md`(0.375rem).
- 표 열이 `경로 | 값 | 다크 | CSS | 설명` 으로 바뀌었어요.

## 알아둘 점

- 브랜드(ontology 등) 값은 토큰 응답에 넣지 않아요. `axis.list_brands` · `axis.get_brand` 를 쓰세요.
- 값은 **MCP 를 빌드한 시점의 tokens** 를 따라가요. tokens 만 새로 발행하고 mcp 를 다시 발행하지 않으면 그 사이 MCP 응답은 이전 tokens 값이에요(출처 줄로 확인). tokens 를 devDependency 로 두어 tokens 발행이 mcp 를 자동으로 올리지 않아요(changeset 측정).

## 발행 전 대조

- Release PR 에서 mcp 가 1.4.0 인지 봐요(배치 6 의 WI-0074 mcp patch 와 합쳐도 minor).
- 발행 뒤 testplan 6절대로 격리 HOME 에서 다시 재요.

## 발행

- `@axis-ds/mcp` 1.4.0 (2026-10-26, PR #214 머지 4a5e185, Release PR #216 머지 61ae674, publish run 40205738223, provenance 6/6). 출처 줄은 tokens 1.8.1
- 발행본 재측정: tokens 1.8.1 dist 대비 list 309행 · get 309경로 불일치 0, 양성 대조 불일치 2 · 3 검출(testplan 6절)
