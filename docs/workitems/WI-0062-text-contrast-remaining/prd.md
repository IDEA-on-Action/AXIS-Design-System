# WI-0062: 기본 테마 텍스트 대비 잔여 PRD

> 작성일: 2026-10-25 | 버전: v1.0 | 작성자: Sinclair Seo | WI: WI-0062 | GitHub: #170 | 우선순위: P2 | 상태: Approved (2026-10-25 사용자 결정 D1 (가), project-todo 「배치 4 결정」)
> 기준: `main` f8a05be (linked 1.7.0 · cli 1.6.1 · mcp 1.3.4 발행본) + 브랜치 `fix/batch4-a11y`(WI-0069 236f363 뒤) | 묶음: 배치 4 ② a11y(WI-0062 · 0063 · 0069 · 0073)
> 표기: **측정**(이번에 실행해 얻은 값) · **계산**(토큰 값에서 유도) · **추정**(실행하지 않음)

---

## 1. 개요

### 1.1 문제

WI-0029 가 흰 글자 짝 15개를 고친 뒤에도 기본 테마(브랜드 미지정)에는 4.5:1 에 못 미치는 글자가 남아 있어요. 짝 표(`packages/axis-tokens/test/ontology-pairs.mjs` CONTRAST_PAIRS)는 ontology 에만 적용돼 기본 브랜드의 미달을 잡지 못했고, a11y E2E 는 10경로만 재서 나머지 경로의 위반이 보이지 않았어요.

### 1.2 기준선 (1.7.0 dist 재측정, 이 브랜치 수정 전)

배치 4 브리프의 `pairs.mjs` 를 이 브랜치 dist 로 다시 돌렸어요(**계산**, `scratchpad/wa11y/w62/before.txt`). 브리프 값과 반올림까지 같아요(이슈 쌍 41행 x 4환경 미달 58, 표 43행 미달 기본 라이트 30 · 기본 다크 10 · ontology 0).

| 글자 쌍(기본 브랜드) | 라이트 | 다크 | 소비처 |
|---|---|---|---|
| Toast 설명 opacity-90 성공 · 경고 | 3.99 · 3.98 | 통과 | ui-react toast:124 |
| (ontology) Toast 설명 opacity-90 경고 · 오류 | 3.95 · 3.95 | 통과 | 같음 |
| text-tertiary / surface-secondary · surface-tertiary | 4.39 · 3.90 | 통과 | ContextPanel 제공자 · 버전, ToolCallCard 소요 시간(hover), DropdownMenuShortcut(포커스), CodeBlock 언어 배지, DiffViewer 보기 탭 |
| text-tertiary / diff 옅은 바탕(추가 · 삭제) | 4.43 · 4.23 | 통과 | DiffViewer 줄 번호 |
| AgentAvatar 흰 이니셜 / assistant · tool | 3.95 · 3.67 | 같음 | agent-avatar:80 |
| RunProgress 대기 단계 숫자 흰색 / neutral-muted | 1.47 | 1.47 | run-progress:30 |
| TokenUsage 경고 · 초과 글자(status-warning · status-error) | 1.91 · 3.76 | 통과 | token-usage-indicator:40 · 41 |
| Diff added-text · removed-text / 옅은 바탕 | 3.02 · 4.22 | 삭제 3.89 | diff-viewer:77 · 78 |
| DiffViewer 헤더 +N · -N(diff-added · diff-removed) / surface-secondary | 2.07 · 3.41 | 통과 | diff-viewer:125 · 129 |
| shadcn destructive-foreground / destructive | 3.78 | 통과 | shadcn-compat.css |
| Input · Select placeholder / input-bg | 2.53 | 통과 | input:24 · select:24 |
| 비활성 버튼 글자 / 비활성 바탕(소비처 없음) | 3.28 | 4.05 | components.json |

브라우저 axe(**측정**, 수정 전 정적 빌드 59경로 x 4환경 = 236회, `scratchpad/wa11y/w62/axe-before.json`): color-contrast 위반 노드 기본 라이트 62 · 기본 다크 26 · ontology 라이트 23 · ontology 다크 22. 앞의 표에 없던 위반으로 문서 사이트 `/library/` · `/templates/` 필터 개수(`opacity-70`, 4환경)와 `/contribute/` 제목(`text-green-600` 16px, 3.29)이 새로 잡혔어요. incomplete 중 수치가 4.5 미만인 노드는 기본 라이트 32 · 다크 13(AgentAvatar 3.95 · 3.67, RunProgress 대기 1.47, Diff 줄 번호 4.43 · 4.23)이에요.

### 1.3 결정

| # | 결정 | 근거 |
|---|---|---|
| D1 | (가) 혼합. 흰 글자 짝 · 글자 전용 토큰은 기본값을 조정하고, 상태 색을 글자로 쓰는 곳은 기존 `text-*` 참조로 바꾼다. 전역 `status.*` 값은 그대로 둔다 | 사용자 결정(가). status.* 는 점 · 막대 · 테두리에도 쓰여 값을 바꾸면 비텍스트 표식까지 함께 바뀜 |
| D1-1 | 참조를 바꿀 때는 ontology 의 두 변수 값이 라이트 · 다크 모두 같은 대체 토큰만 고른다(`text-warning` = `status-warning`, `text-error` = `diff-removed` 등). 후보는 dist 4환경 값을 전수 대조해 뽑았다(`scratchpad/wa11y/w62/cand.mjs`) | ontology 브랜드 계산값 · 렌더 색 불변 |
| D1-2 | 값을 바꾸는 토큰은 ontology 가 모두 덮어쓰는 것만 고른다. 결과로 `dist/css/brands/ontology.css` 는 바이트 그대로다 | 같음 |
| D1-3 | 회색 바탕(surface-secondary · tertiary · diff 옅은 바탕) 위 보조 글자는 `text-tertiary` 대신 `text-secondary`. 전역 `text.tertiary` 는 흰 바탕 4.83 이라 그대로 둔다 | ontology 는 secondary = tertiary 값이라 출력 불변 |
| D1-4 | DiffViewer 헤더 `+N` 은 `text-secondary`, `-N` 은 `text-error` | ontology 가 이미 이 색(diff-added = 회색, diff-removed = 빨강)으로 그려 기본도 같은 구성이 됨 |
| D2 | 짝 표를 기본 브랜드 라이트 · 다크에도 적용한다(default-contrast.test). 글자 행은 행의 min, `kind: 'icon'` 행은 WCAG 1.4.11 3:1(WI-0063). ontology 는 종전대로 행의 min | 사용자 결정 D2. 아이콘 행을 4.5 로 둔 것은 ontology 의 보수 기준이었음 |
| D3 | Toast 설명 `opacity-90` 은 지운다. ontology 경고 · 오류 설명은 3.95 → 4.50 으로 렌더가 바뀐다(토큰 값은 그대로) | 브리프 AC4 의 의도한 변경 |

### 1.4 범위 밖

- ontology 라이트 Input placeholder `#9AA1AB`(흰 바탕 2.60)는 토큰 값 변경이라 「ontology 값 불변」 범위 밖이에요. 공용 표에 넣지 않고 기본 전용 짝(`DEFAULT_ONLY`)으로만 고정했어요. 해소하려면 ontology 값 결정이 필요해요(사용자 결정 대상).
- 비텍스트(아이콘 · 점 · 테두리 · 폼 컨트롤 경계 · 포커스 링 · Progress)는 WI-0063 이에요.
- a11y E2E 게이트(D2 의 게이트 부분): `apps/web/e2e/a11y.spec.ts` 의 경로를 `apps/web/e2e/a11y-routes.cjs` 가 앱 라우트(page.tsx) · library · templates index 에서 만들어요(정적 경로 전부 + 동적 라우트 대표 1개씩, 규칙 없는 동적 라우트가 생기면 멈춤). `frontend.yml` 건수 가드는 같은 파일에서 기대 건수(경로 수 x 조합 수)를 계산해요. axe incomplete color-contrast 중 대비 수치가 4.5 미만인 노드도 실패로 봐요. 결과는 testplan 3.1 절이에요.
- shadcn 호환 `--input`(입력 경계 = border.default 1.23)은 shadcn 컴포넌트 소비자 쪽 비텍스트라 이번에 바꾸지 않았어요.

## 2. 변경

### 2.1 토큰 기본값 (ontology 는 모두 덮어써 출력 불변)

| 토큰 | 라이트 1.7.0 → 이번 | 다크 1.7.0 → 이번 | 대비(계산) |
|---|---|---|---|
| `--axis-agent-avatar-assistant` | purple.500 → purple.600 | 같음 | 흰 이니셜 3.95 → 5.38 |
| `--axis-agent-avatar-tool` | blue.500 → blue.600 | 같음 | 3.67 → 5.17 |
| `--axis-status-neutral-muted-contrast` | white → gray.700 | 같음 | 대기 숫자 1.47 → 7.00 |
| `--axis-diff-added-text` | green.600 → green.700 | green.600 그대로 | 3.02 → 4.60 |
| `--axis-diff-removed-text` | red.600 → red.700 | red.600 → red.400 | 4.22 → 5.66 · 다크 3.89 → 6.80 |
| `--axis-input-text-placeholder` | gray.400 → gray.500 | gray.400 그대로(테마 무관 → 다크 값 분리) | 2.53 → 4.83 |
| `--axis-button-text-disabled` | gray.500 → gray.600 | text.tertiary 그대로 | 3.28 → 5.13 |
| `--axis-button-bg-disabled` | gray.300 그대로 | gray.700 → gray.800 | 다크 4.05 → 5.78 |
| shadcn `--destructive` | red.500 → red.600 | red.500 그대로 | 흰 글자 3.78 → 4.83 |

### 2.2 소스

- ui-react: `toast` 설명 `opacity-90` 제거, `dropdown-menu` Shortcut `text-secondary`.
- agentic-ui: `token-usage-indicator` 경고 · 초과 글자 `text-warning` · `text-error`, `diff-viewer` 헤더 `+N` · `-N` · 보기 탭 · 줄 번호, `code-block` 언어 배지, `context-panel` 제공자 · 버전, `tool-call-card` 소요 시간.
- 문서 사이트: `/library/` · `/templates/` 필터 개수 `opacity-70` 제거, `/contribute/` 「호환 라이선스」 제목 green.600 → green.700.
- 짝 표: 아이콘 행에 `kind: 'icon'`, TokenUsage · DiffViewer 헤더 행을 새 토큰으로, 보조 글자 · 상태 알림 글자 행 12개 추가.

## 3. 수용 기준 (AC)

| AC | 내용 | 검증 |
|---|---|---|
| AC1 | 짝 표 글자 행 전부와 기본 전용 짝(placeholder · shadcn destructive)이 기본 라이트 · 다크 4.5 이상. 수정 전 dist 에서 같은 테스트가 실패 | tokens `default-contrast.test` |
| AC2 | ontology 출력 불변: `dist/css/brands/ontology.css` 바이트 동일, `ontology-values.test` 통과 | 바이트 비교 · 테스트 |
| AC3 | 1.2.1 기준선에서 바뀐 기본 변수는 예외 표(WI0062_CHANGED · NEW · SHADCN)와 정확히 같다 | `baseline-1.2.1.test` |
| AC4 | 회색 바탕 위 보조 글자 없음, 상태 색을 글자에 직접 쓰지 않음, Toast 설명 불투명. 수정 전 소스에서 실패 | 단위 `text-contrast.test.tsx`(agentic · ui-react) |
| AC5 | 문서 정적 전 경로 + 동적 대표 x 4환경 axe color-contrast 위반 0(WI-0063 반영 뒤 최종 빌드 기준), incomplete 중 수치가 4.5 미만인 노드 0 | 브라우저 axe |
| AC6 | `check-contrast-pairs` rc 0, 레지스트리(version 1.5.0 유지) · library 재생성, public/templates updatedAt churn 되돌림 | 게이트 · 생성물 |
