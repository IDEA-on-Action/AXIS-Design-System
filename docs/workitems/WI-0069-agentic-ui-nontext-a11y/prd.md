# WI-0069: agentic-ui · ui-react 비대비 접근성 결함 PRD

> 작성일: 2026-10-25 | 버전: v1.0 | 작성자: Sinclair Seo | WI: WI-0069 | GitHub: #183 | 우선순위: P2 | 상태: Approved (2026-10-25 사용자 결정 D4 (가) · D5 (가), project-todo 「배치 4 결정」)
> 기준: `main` f8a05be (linked 1.7.0 · cli 1.6.1 · mcp 1.3.4 발행본) + 브랜치 `fix/batch4-a11y`(WI-0073 4e17809 뒤) | 묶음: 배치 4 ② a11y(WI-0062 · 0063 · 0069 · 0073)
> 표기: **측정**(이번에 실행해 얻은 값) · **계산**(값에서 유도) · **추정**(실행하지 않음)

---

## 1. 개요

### 1.1 문제

a11y E2E 게이트(PAGES 10경로)는 문서 사이트의 일부만 재요. 배치 4 브리프가 배포본 53경로 x 기본 · ontology x 라이트 · 다크(212회)에 axe 를 돌려 PAGES 밖에서 대비가 아닌 결함을 찾았어요. 4환경 모두 같은 노드라 브랜드 · 테마와 관계없는 구조 결함이에요. 더해 agentic-ui 의 시각 표시는 서버와 브라우저 시간대가 다르면 하이드레이션 오류를 내요.

### 1.2 기준선 (측정, 이 브랜치 수정 전 정적 빌드, 대상 12경로 x 4환경 = 48회)

| 경로 | 규칙 | 노드(환경마다) | 종류 |
|---|---|---|---|
| /agentic/message-bubble/ | aria-prohibited-attr | 2 | 위반 |
| /agentic/code-block/ | scrollable-region-focusable | 1 | 위반 |
| /agentic/diff-viewer/ | aria-prohibited-attr | 6 | incomplete |
| /agentic/recovery-banner/ | aria-valid-attr-value | 1 | incomplete |
| /components/command/ | aria-required-children | 1 | 위반 |
| /components/input/ | label | 1 | 위반 |
| /components/scroll-area/ | scrollable-region-focusable | 1 | 위반 |
| /components/slider/ | aria-input-field-name | 1 | 위반 |
| /components/dialog/ | aria-valid-attr-value | 2 | incomplete |
| /components/popover/ | aria-valid-attr-value | 1 | incomplete |
| /components/sheet/ | aria-valid-attr-value | 1 | incomplete |

합계(4환경): 비대비 위반 노드 28 · 비대비 incomplete 44. 배포본 브리프 측정(`scratchpad/b4/axe.json`)과 경로 · 규칙 · 노드 수가 같아요. `/agentic/step-timeline/` 은 axe 결함이 없고 시각 하이드레이션 대상이라 함께 쟀어요.

### 1.3 원인 분류 (D4: 컴포넌트 결함과 문서 예제 결함을 가름)

| 결함 | 원인 위치 | 근거(측정: 소스 · DOM 판독) |
|---|---|---|
| MessageBubble 상태 아이콘 | **컴포넌트** | `message-bubble/index.tsx` 전송 상태 `<span aria-label>` 에 역할이 없음 |
| CodeBlock 스크롤 | **컴포넌트** | 코드 본문 `div.overflow-auto` 에 tabIndex 가 없어 포커스할 요소 없는 스크롤 영역 |
| DiffViewer 줄 수 | **컴포넌트** | 헤더 `+N` · `-N` `<span aria-label>` 에 역할이 없음 |
| RecoveryBanner | **컴포넌트** | 재시도 버튼이 description 없을 때도 `aria-describedby={descId}`(루트는 조건부였음) |
| Command | **컴포넌트** | cmdk 1.1.1 `Separator` 가 `role:"separator"` 를 props 전개 **뒤에** 고정해 listbox 안의 허용 안 되는 자식이 됨(덮어쓸 수 없음) |
| ScrollArea | **컴포넌트** | Radix 뷰포트(`data-radix-scroll-area-viewport`)에 tabIndex 가 없음. 문서 예제 내용(태그 목록)에 포커스할 요소가 없어 드러남 |
| Dialog · Popover · Sheet | **컴포넌트**(Radix 동작 통과) | Radix 1.1.15 Trigger 가 닫힌 동안에도 `aria-controls={contentId}` 를 두는데 콘텐츠는 열릴 때만 DOM 에 있음. 문서 헤더의 「메뉴 열기」 Sheet 트리거도 같지만 1280px 에서 `lg:hidden` 이라 axe 가 보지 않았음 |
| Input file | **문서 예제** | 컴포넌트는 `id` · `aria-*` 를 그대로 전달. 예제 `<Input type="file" />` 에 라벨이 없음(placeholder 도 없어 이름 0) |
| Slider | **문서 예제** | 컴포넌트는 root 의 `aria-label` · `aria-labelledby` 를 썸에 전달(WI-0020). 예제가 이름을 주지 않음 |
| library 상세 설치 명령 복사 버튼 | **문서 사이트** | `/library/[category]/[slug]` 의 아이콘 버튼(`size="icon"`)에 이름이 없음(axe button-name). 동적 라우트라 브리프 53경로에 없었고, 이번 전 경로 측정(동적 대표 포함)에서 처음 잡힘. 배포본 pages.dev 에도 같은 버튼이 있어 이번 변경과 무관한 기존 결함(측정) |

### 1.4 결정

| # | 결정 | 근거 |
|---|---|---|
| D4 | 새로 확인된 ui-react 문서 페이지 비대비 위반도 원인을 가려 이 WI 에서 함께 고친다 | 사용자 결정(가). PAGES 확대(WI-0062 D2)가 이 위반으로 실패하지 않게 |
| D5 | 시각 포맷에 `locale` · `timeZone` · `formatTime` prop 을 더하고, 기본은 하이드레이션 안전(서버 · 하이드레이션 첫 렌더는 비우고 하이드레이션 뒤 채움). `suppressHydrationWarning` 은 쓰지 않는다. 최종 표시는 이전과 같다(하위 호환) | 사용자 결정(가) |
| D5-1 | 결과가 실행 환경에 달리지 않을 때만 첫 렌더부터 표시: `formatTime` 이 있거나, MessageBubble 은 `timeZone`(로케일 기본 ko-KR 고정), StepTimeline 은 `locale` 과 `timeZone` 둘 다 | StepTimeline 기본 로케일은 실행 환경 값이라 timeZone 만으로는 서버 · 브라우저가 다를 수 있음(계산) |
| D5-2 | 하이드레이션 판정은 `useSyncExternalStore(서버 스냅샷 false · 클라이언트 true)`. 클라이언트 전용 렌더(테스트 `render()` 등)는 첫 렌더부터 표시 | effect 로 한 번 더 그리지 않고, 하이드레이션일 때만 비움 |
| D5-3 | 이 훅 때문에 `message-bubble/index` · `step-timeline/index` 를 `client-modules.mjs` 에 넣는다(서버 렌더 9개로 줄어듦) | 레지스트리가 항목당 파일 하나라 시각 부분만 따로 떼면 새 lib 항목과 그 파급(cli · mcp · smoke 기대값)이 생김. props 가 직렬화 가능해(Date · ReactNode · string) 서버 컴포넌트에서 계속 쓸 수 있음 |
| D4-1 | Dialog · Popover · Sheet 루트를 열림 상태를 아는 래퍼로 바꿔 닫힌 동안 트리거의 `aria-controls` 를 뺀다(Radix Trigger 는 props 를 뒤에서 전개하므로 `aria-controls: undefined` 로 덮어쓸 수 있음, 측정: dist 판독) | Radix 컨텍스트는 공개되지 않음. Tooltip(WI-0073) 과 같은 제어 래퍼 방식 |
| D4-2 | CommandSeparator 는 cmdk Separator 대신 `aria-hidden` 장식 div 를 그리고, 검색 중 숨김은 `useCommandState` 로 cmdk 와 같게 한다 | cmdk 가 role 을 뒤에서 고정해 덮어쓸 수 없음 |

### 1.5 범위 밖

- color-contrast 위반(diff-viewer · code-block · context-panel · token-usage 등, 기본 라이트 · 다크)은 WI-0062 몫이에요. 이 WI 의 재측정에서도 수가 같아요(44 → 44, 회귀 판정 기준).
- a11y E2E 게이트의 PAGES 확대와 CI 건수 가드 계산은 WI-0062 D2 몫이에요. 이 WI 는 대상 경로를 별도 스크립트로 재요.
- DiffViewer 본문 `overflow-auto` 도 긴 줄에서 가로 스크롤이 생기면 같은 부류(scrollable-region-focusable)가 될 수 있어요(추정, 문서 예제에서는 스크롤이 생기지 않아 axe 미검출). 바깥이 이미 이름 있는 region 이라 이번에는 두고 관찰해요.
- 문서 헤더 「메뉴 열기」(모바일 폭) 는 Sheet 를 쓰므로 같은 수정이 적용돼요. 모바일 폭 axe 는 재지 않았어요(추정).

## 2. 수용 기준 (AC)

| AC | 내용 | 검증 |
|---|---|---|
| AC1 | 1.2 의 12경로 x 기본 · ontology x 라이트 · 다크에서 비대비 axe 위반 · incomplete 0. 브랜드 · 테마 적용 프로브와 passes > 0 을 함께 확인하고, 같은 스크립트가 수정 전 빌드에서 28 · 44 를 잡는 것을 양성 대조로 보인다 | 브라우저 axe(정적 빌드) |
| AC2 | 문서 전 정적 경로 53 + 동적 대표 2(library 상세 · templates 상세) x 4환경에서 비대비 위반 0(새 회귀 없음), color-contrast 위반은 WI-0062 기준선과 같은 수 | 브라우저 axe |
| AC3 | MessageBubble · StepTimeline: TZ=UTC 서버 렌더 → TZ=Asia/Seoul 하이드레이션에서 오류 0, 최종 표시는 브라우저 시간대 기존 형식. timeZone(·locale) 지정 시 서버 HTML 부터 표시. formatTime 사용. 수정 전 코드는 같은 조건에서 하이드레이션 오류 2 | 단위 `time-hydration.test.tsx` · 프로브 |
| AC4 | agentic 4결함을 드러내는 props 로 axe(violations + incomplete) 0, 수정 전 코드에서 실패 | 단위 `a11y.test.tsx` WI-0069 묶음 |
| AC5 | Dialog · Popover · Sheet 닫힌 트리거 aria-controls 없음 · 열면 콘텐츠 id · 닫으면 다시 없음, 제어 · defaultOpen 통과. CommandSeparator role 없음 · 검색 중 숨김 · alwaysRender. ScrollArea 뷰포트 tabIndex 0. 결함 단언은 수정 전 코드에서 실패 | 단위 `nontext-a11y.test.tsx` |
| AC6 | 문서 예제 Input file · Slider 와 library 상세 복사 버튼에 이름, Props · 접근성 절에 새 prop · 동작 안내 | 문서 · axe |
| AC7 | `check-contrast-pairs` rc 0(밀린 diff-viewer 줄 번호 갱신), postbuild 가드(client-modules) 통과 | 게이트 |
| AC8 | build:registry · library:refresh-axis 재생성분 커밋(레지스트리 version 1.5.0 유지), public/templates updatedAt churn 되돌림 | 생성물 diff |
| AC9 | 게이트: turbo lint · type-check · build · test 각각 `--force`, frontend.yml run 단계, E2E static(a11y · nontext · demo · tooltip)과 tokens | 게이트 로그 |
