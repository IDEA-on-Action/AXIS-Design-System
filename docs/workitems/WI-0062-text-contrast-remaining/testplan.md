# WI-0062: 기본 테마 텍스트 대비 잔여 테스트 계획 · 결과

> PRD: [prd.md](./prd.md) | 작성일: 2026-10-25 | 기준: `main` f8a05be + 브랜치 `fix/batch4-a11y`(WI-0069 236f363 뒤)
> 표기: **측정**(이번에 실행해 얻은 값) · **계산**(토큰 값에서 유도) · **추정**(실행하지 않음)

## 1. 토큰 대비 (측정: node --test)

| 테스트 | 내용 | 이번 dist | 수정 전 dist(음성 대조) |
|---|---|---|---|
| `default-contrast.test` 짝 표 적용 묶음 | 짝 표 글자 행(kind 없음 · min 4.5) + 기본 전용 짝 2(placeholder · shadcn destructive) x 기본 라이트 · 다크 | 전부 통과 | **13 실패**(neutral-muted-contrast x2, avatar tool · assistant x4, diff added-text · removed-text x3, button disabled x2, placeholder, destructive) |
| `ontology-values.test` | 같은 표를 ontology 라이트 · 다크에 행의 min 으로 | 통과(행 12개 추가 뒤에도) | - |
| `baseline-1.2.1.test` | 1.2.1 대비 바뀐 기본 변수 = WI0029 + WI0062 예외 표 | 통과 | 예외 표를 넣기 전 2 실패(변수 10개 · shadcn 1줄) |
| tokens 전체 | 11개 파일 | 397 통과 | - |

- 음성 대조 방법: 수정 전 `dist`(작업 시작 때 백업, 재빌드와 `diff -r` 동일 확인)를 임시 디렉터리에 두고 같은 테스트 파일을 돌렸어요(`scratchpad/wa11y/w62/neg62`).
- 회귀 판정에서 Toast · 보조 글자 · TokenUsage 처럼 **소비처 클래스**가 원인인 미달은 토큰이 이미 통과값이라 토큰 테스트가 잡지 못해요. 그 부분은 2절 단위 테스트와 3절 브라우저 측정이 맡아요.

## 2. 단위 테스트 (측정: vitest)

| 파일 | 건수 | 내용 | 수정 전 소스 |
|---|---|---|---|
| agentic `src/text-contrast.test.tsx` | 19 | 양성 대조 1(검사 대상이 그려짐) + 9개 렌더 x (회색 바탕 위 `text-tertiary` 없음 · 상태 색 글자 없음) | **10 실패**(DiffViewer 2 x 2, ContextPanel, CodeBlock, TokenUsage 4) |
| ui-react `src/text-contrast.test.tsx` | 5 | Toast 4변형 설명 · 제목 opacity 없음, DropdownMenuShortcut `text-secondary` | **5 실패** |

- 수정 전 소스: 컴포넌트 소스만 `git show HEAD:` 로 되돌려 돌린 뒤 백업으로 복원했어요(`scratchpad/wa11y/w62/bak62`).
- 「상태 색 글자 없음」은 보이는 글자 노드마다 색을 정하는 가장 가까운 `text-[var(...)]` 를 따라가요(sr-only 제외). 처음에는 요소 직속 글자만 봐서 DiffViewer `+N`(안쪽 span 이 글자를 가짐)을 놓쳤고, 수정 전 소스 음성 대조에서 8 실패로 드러나 고쳤어요(고친 뒤 10 실패).
- hover · focus 상태 바탕(ToolCallCard 헤더 hover, Dropdown 항목 focus)은 jsdom 이 상태를 만들지 않아 이 테스트가 보지 않아요. 짝 표 행(`parent.variant: 'hover:'`)과 계산으로 고정했어요.

## 3. 브라우저 측정 (측정)

배치 4 브리프 · WI-0069 와 같은 스크립트(`scratchpad/wa11y/w62/axe-run.mjs`: Playwright Chromium + `@axe-core/playwright`, 태그 wcag2a · 2aa · 21a · 21aa, `nextjs-portal` 제외)로 정적 빌드를 127.0.0.1 정적 서버에서 쟀어요. 경로는 문서 정적 경로 전부 56(`/contribute/` · `/library/` · `/templates/` 포함) + 동적 라우트 대표 3(`/library/agentic/` · `/library/agentic/code-block/` · `/templates/dashboard/`) = 59 예요(WI-0060 머지 뒤 구조). 실행마다 `dark` 클래스 · `data-brand` 프로브가 기대와 같았고 모두 HTTP 200 이에요.

| 빌드 | 실행 | color-contrast 위반 노드(기본 라이트 · 기본 다크 · ontology 라이트 · ontology 다크) | incomplete 중 수치 4.5 미만 |
|---|---|---|---|
| 수정 전(WI-0069 상태) | 236 | 62 · 26 · 23 · 22 | 기본 라이트 32 · 기본 다크 13 |
| WI-0062 토큰 · 컴포넌트 반영 | 236 | 20 · 19 · 23 · 22 | 0 |
| 최종(WI-0062 문서 사이트 + WI-0063 반영) | WI-0063 testplan 참고 | | |

- WI-0062 반영 빌드의 남은 위반은 모두 문서 사이트 자체(`/library/` · `/templates/` 필터 개수 `opacity-70`, `/contribute/` 제목 green.600)예요. 4환경 모두에 있고 컴포넌트 · 토큰과 무관해요. 이 측정에서 처음 잡혀 같은 WI 에서 고쳤고, 판정은 최종 빌드로 해요.
- 컴포넌트 · 토큰 원인 위반(diff-viewer 35 · 7, context-panel 3, code-block 2, token-usage 2)과 incomplete(AgentAvatar 3.95 · 3.67, RunProgress 대기 1.47 x2 경로, Diff 줄 번호 4.43 · 4.23)은 0 이에요.
- ontology 계산값 불변(측정): `/docs/brand-demo/` 에서 html 의 `--axis-*` 289개 계산값을 수정 전 · 후 빌드에서 읽어 비교했어요(`scratchpad/wa11y/w62/ont-probe.mjs`). ontology 라이트 · 다크 차이 0, 기본 라이트 7 · 기본 다크 5(2.1 표의 변수와 정확히 같음 = 양성 대조).
- ontology CSS 바이트: `dist/css/brands/ontology.css` 가 수정 전 백업과 `cmp` 동일.

## 4. 정적 검사 · 생성물 (측정)

- `check-contrast-pairs` rc 0(검사 파일 21 · 소스 짝 15 · 표 짝 15 · 부모 바탕 근거 17행 중 위반 0). 새 부모 근거 행 5개(context-panel · tool-call-card hover · code-block · diff-viewer 탭)가 근거 대조에 들어갔어요.
- `build:registry`: toast · agentic 5항목 sha256 변경, 생성기가 쓴 version 1.7.0 을 1.5.0 으로 되돌림(WI-0052 선례). `library:refresh-axis`: axis 항목 7 + 분류 2 쓰기.
- `pnpm build` 뒤 `apps/web/public/templates` 5파일은 updatedAt 만 바뀌어(내용 diff 0, 측정) 되돌렸어요.
- E2E tokens(`test:e2e:tokens`) 22 통과: dark-tokens 의 라이트 고정 기준값(placeholder · button-text-disabled)과 다크 기대 맵(button-bg-disabled, placeholder 추가)을 의도한 값으로 갱신했어요.
- 전체 게이트(turbo · frontend.yml run 단계 · E2E static)는 WI-0063 커밋 뒤 한 번에 돌려 그 testplan 에 적어요.
