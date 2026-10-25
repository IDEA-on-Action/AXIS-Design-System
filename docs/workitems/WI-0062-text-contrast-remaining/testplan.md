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

### 3.1 a11y E2E 게이트 확대 (D2, 측정)

- 경로: `apps/web/e2e/a11y-routes.cjs` 가 `src/app` 의 page.tsx 59개에서 만들어요. 정적 56 + 동적 대표 3(`/library/ui/` · `/library/ui/accordion/` = index 의 첫 AXIS 항목, `/templates/dashboard/` = 상세 JSON 이 있는 첫 템플릿). 정적 56 은 3절 스크립트 측정의 경로와 같고, 동적 대표는 규칙으로 골라 3절(`agentic` · `code-block`)과 달라요.
- spec 단언 추가: HTTP 200, 준비 선택자(기본 `h1`, 데이터를 받기 전 Skeleton 만 그리는 library · templates 를 거르기 위함), incomplete color-contrast 중 수치가 있고 4.5 미만인 노드 0.
- 결과(2026-10-25, 현재 HEAD 빌드, `CI=1 E2E_SERVER=static`, 워커 1 = CI 와 같은 조건): 236 통과 · 실패 0 · flaky 0 · skipped 0. 조합마다 59건. axe passes 최소 19(측정 0 아님), 위반 0, incomplete 중 4.5 미만 0.
- 소요 시간(로컬 측정, 워커 1): a11y 993초(16.5분) · 최종 게이트 때 1666초(27.8분, 같은 236건이라 기계 부하 차이로 봄, 원인은 재지 않음). 건수는 종전 40의 5.9배이고 종전 소요 시간은 이번에 재지 않았어요. nontext 34~36초 · demo 34~38초 · tooltip 35~47초 · tokens 6~12초. CI 러너 시간은 재지 않았어요(추정: 같은 자릿수, PR 에서 실측해 붙일 것).
- 양성 대조(측정): WI-0062 수정 전 정적 빌드(`scratchpad/wa11y/w62/out-before`)에 새 spec 을 기본 라이트 4경로로 돌리면 3 실패 · 1 통과. `/docs/brand-demo/` 는 위반 0 인데 incomplete `#ffffff/#d1d5db 1.47`(RunProgress 대기 숫자)로 실패해요. 이 경로는 종전 PAGES 에 있었고 종전 spec 은 통과시켰어요(incomplete 미검사). `/agentic/agent-avatar/` 는 incomplete 3.95 · 3.67 9노드, `/agentic/diff-viewer/` 는 위반으로 실패, `/components/button/` 은 통과(음성 대조).
- CI 건수 가드(측정, `frontend.yml` 의 `e2e-count` run 블록을 그대로 뽑아 fixture 에서 실행): 실제 리포트 rc 0(a11y 기대 236 = 59 x 4). 변이 5종 모두 rc 1: a11y 1건 축소 · 조합 쏠림(총합 236 유지, 58 · 60) · 규칙 없는 동적 라우트 추가(경로 계산 실패로 멈춤) · 정적 페이지 추가(기대 240 대 실행 236) · a11y.json 없음.

### 3.2 최종 전체 게이트 (측정, 2026-10-25, 이 단계 변경 반영 뒤)

하나씩 `--force`(Cached 0): turbo lint 7 · type-check 11 · build 8 · test 6 태스크 rc 0(tokens 512 · ui-react 194 · agentic-ui 148 · cli 738 · mcp 143 · theme 47 통과, `ontology-values` 포함). frontend.yml run 단계 10종(check-token-refs · check-contrast-pairs · check-types-versions · check-library-links · build:registry · test:registry · check-licenses · pack-smoke · cli-smoke · registry-install-smoke) rc 0. E2E static a11y 236 · nontext 8 · demo 8 · tooltip 6, tokens 22 통과, 그 리포트로 돌린 CI 건수 가드 rc 0. 생성물: `build:registry` 는 `r/index.json` · `registry.json` 의 version(1.7.0) 외 차이 0 이라 1.5.0 으로 되돌렸고, `public/templates` 5파일은 updatedAt 만 바뀌어(그 외 줄 0, 측정) 되돌렸어요.

### 3.3 템플릿 4종 init 뒤 build 회귀 (측정, 2026-10-25, 검토 minor 반영)

- 실행: `node scripts/template-smoke.mjs`(HEAD 52b7d33 + 이 수정 작업 트리, rc 0). 4종(theme-only · dashboard · landing-page · hr-dashboard) 모두 init rc 0 · npm install rc 0 · next build rc 0, 생성 CSS 에 `@tailwind` 잔존 0 · `.bg-background` 1 · `--axis-*` 정의 544 · 전환 전 `--primary` 0 으로 PASS. 로그 `scratchpad/wa11y/fix2/template-smoke.log`.
- 스크립트가 하는 일(판정 범위): 이 브랜치의 cli 빌드(`packages/axis-cli/dist`)로 `axis template init` 을 하고, 템플릿 JSON 은 저장소의 `apps/web/public/templates` 를 127.0.0.1 서버로 줘요(`AXIS_TEMPLATE_URL` 주입 전제). `@axis-ds/*` 는 npm 레지스트리에서 받아서 템플릿의 `^1.7.0` 이 발행본 1.7.0 으로 풀려요. 즉 **이 브랜치 템플릿 JSON · cli 의 회귀 없음**까지 판정하고, 이 브랜치 tokens(1.8.0 예정) 를 넣은 build 와 `axis check` 는 이 스크립트 범위 밖이에요.
- 범위 밖 항목은 반박 검토가 따로 쟀어요(검토 기록, 이 작업에서 다시 재지 않음): `--keep` 결과물에 브랜치 tokens tarball 을 넣고 `.next` 를 옮긴 뒤 다시 build 하면 4종 build 0, CSS 에 `--axis-input-border-default` #6B7280 과 form-control-border 2건, 브랜치 cli 의 `axis check` 4종 rc 0 이고 출력이 발행본 설치 때와 같았어요.

### 3.4 incomplete 대비 하한 · CI 건수 가드 보정 (측정, 2026-10-25, 검토 minor 반영)

- `a11y.spec.ts` 의 incomplete 하한을 고정 4.5 에서 큰 글씨 3 · 그 밖 4.5 로 바꿨어요. 판정은 `e2e/helpers/contrast-threshold.cjs` 이고 axe-core 4.12.1 color-contrast 와 같은 식(`Math.ceil(px * 72) / 96` pt, 굵게 14pt · 보통 18pt 이상이 큰 글씨, 글자 크기를 못 읽으면 4.5)을 써요.
- 단위 확인: 가짜 axe 노드 data 14건(`selfTest`)을 spec 설정 단계와 `node e2e/helpers/contrast-threshold.cjs` 에서 돌려 14건 통과. 변이 4종(큰 글씨 하한 4.5 · 굵기 무시 · 올림 제거 · bold 판정 끔) 모두 rc 1 로 잡혔어요(처음 12건일 때는 올림 제거 변이가 살아남아 18.66px · 23.99px 경계 2건을 더했어요). 스펙 목록은 `--list` 로 236건(설정 단계 throw 없음).
- CI 건수 가드: `routes=$(...); rc=$?` 는 Actions 기본 셸(`bash -e`)에서 실패한 줄에서 멈춰 `::error` 에 닿지 않았어요. `rc=0; routes=$(...) || rc=$?` 로 바꿨어요. `frontend.yml` 의 `e2e-count` run 블록을 그대로 뽑아 `bash --noprofile --norc -eo pipefail` 로 재현: 경로 계산이 rc 3 으로 실패하는 fixture 에서 구판은 출력 없이 rc 3, 신판은 `::error::a11y 경로 목록을 계산하지 못했어요 (rc=3/3, ...)` 를 내고 rc 1. 실제 리포트(아래 3.5)에서는 신판 rc 0, a11y 기대 236(59 x 4) = 실행 236.

### 3.5 검토 minor 반영 뒤 전체 게이트 (측정, 2026-10-25)

- 하나씩 `--force`(Cached 0): turbo lint 7 · type-check 11 · build 8 · test 6 rc 0(tokens 512 · ui-react 194 · agentic-ui 148 · cli 738 · mcp 143 · theme 47). 하한 확인 케이스를 더한 뒤 web lint · type-check 를 다시 `--force` 로 돌려 rc 0.
- frontend.yml run 단계: check-token-refs · check-contrast-pairs(위반 0) · check-types-versions · check-library-links(위반 0) · build:registry · test:registry(45, version 1.5.0 으로 되돌린 뒤 다시 45) · check-licenses · pack-smoke(퍼블리시 대상 6개) · cli-smoke · registry-install-smoke(5/5) 모두 rc 0.
- E2E(`CI=1 E2E_SERVER=static`, 워커 1, retries 1, flaky 0): a11y 236 · nontext 8 · demo 8 · tooltip 6 · tokens 22 통과. 정적 빌드 `out/` 에 이번 변경(Progress fallback CSS, MessageBubble · StepTimeline Props 문구)이 들어 있는지 grep 으로 확인한 뒤 돌렸어요. 로그 `scratchpad/wa11y/fix2/gates/`.

## 4. 정적 검사 · 생성물 (측정)

- `check-contrast-pairs` rc 0(검사 파일 21 · 소스 짝 15 · 표 짝 15 · 부모 바탕 근거 17행 중 위반 0). 새 부모 근거 행 5개(context-panel · tool-call-card hover · code-block · diff-viewer 탭)가 근거 대조에 들어갔어요.
- `build:registry`: toast · agentic 5항목 sha256 변경, 생성기가 쓴 version 1.7.0 을 1.5.0 으로 되돌림(WI-0052 선례). `library:refresh-axis`: axis 항목 7 + 분류 2 쓰기.
- `pnpm build` 뒤 `apps/web/public/templates` 5파일은 updatedAt 만 바뀌어(내용 diff 0, 측정) 되돌렸어요.
- E2E tokens(`test:e2e:tokens`) 22 통과: dark-tokens 의 라이트 고정 기준값(placeholder · button-text-disabled)과 다크 기대 맵(button-bg-disabled, placeholder 추가)을 의도한 값으로 갱신했어요.
- 전체 게이트(turbo · frontend.yml run 단계 · E2E static)는 WI-0063 커밋 뒤 한 번에 돌려 그 testplan 에 적어요.
