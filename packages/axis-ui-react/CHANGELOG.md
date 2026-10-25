# @axis-ds/ui-react

## 1.8.0

### Minor Changes

- f3dae65: 배치 4 접근성 묶음(WI-0062 · WI-0063 · WI-0069 · WI-0073)의 업그레이드 안내예요. 문서 사이트 59경로 x 기본 · ontology x 라이트 · 다크(236회) axe 검사에서 위반 0, 판정 보류(incomplete) 중 4.5 미만 대비 0 을 확인했어요. **ontology 브랜드의 기존 토큰 값은 바뀌지 않아요.**

  컴포넌트를 그대로 쓰면 코드를 바꿀 필요가 없어요. 아래에 해당하면 확인하세요.
  - **기본 테마 토큰 값을 직접 참조**한다면(CSS `var(--axis-...)` · tokens JS 값 · 복사한 값) 아래 변수의 값이 바뀌었어요. 새 값은 WI-0062 · WI-0063 릴리스 노트 「업그레이드」 표에 있어요. 그 변수가 놓이는 바탕(아바타 · 버튼 비활성 바탕 · 상태 점 글리프는 그 위 글자)과의 대비가 커지는 쪽이에요. 라이트에서는 짙어지고, 다크에서는 입력 경계 · hover · diff 삭제 글자처럼 밝아지는 것도 있어요. 하나 예외로 다크 `--axis-button-border-focus` 는 라이트와 같은 #3B82F6 이 되어 다크 바탕 대비가 7.92 에서 5.47 로 줄었어요(3:1 이상).
    - 라이트 · 다크: `--axis-input-border-default` · `--axis-input-border-hover` · `--axis-button-border-focus` · `--axis-agent-avatar-assistant` · `--axis-agent-avatar-tool` · `--axis-diff-removed-text` · `--axis-status-running-contrast` · `--axis-status-neutral-muted-contrast`
    - 라이트만: `--axis-input-text-placeholder` · `--axis-border-warning` · `--axis-diff-added-text` · `--axis-button-text-disabled` · shadcn `--destructive`
    - 다크만: `--axis-button-bg-disabled` · `--axis-status-success-contrast`
  - **상태 색(`--axis-status-*`)을 글자나 아이콘에** 쓰고 있다면 `--axis-text-success` · `--axis-text-warning` · `--axis-text-error` · `--axis-text-tertiary` 로 바꾸세요. 상태 색 값은 그대로이고 점 · 막대 · 바탕용이에요.
  - **회색 바탕(`--axis-surface-secondary` · `-tertiary`) 위 보조 글자**는 `--axis-text-tertiary` 대신 `--axis-text-secondary` 를 쓰세요.
  - **점 위 글리프 색(`--axis-status-*-contrast`)** 중 running(전체) · success(다크) · neutral-muted 가 흰색에서 짙은 색으로 바뀌었어요. 성공 바탕 버튼 글자로 썼다면 `--axis-button-text-default` 로 바꾸세요.
  - **새 변수** `--axis-form-control-border` · `--axis-form-control-track` · `--axis-progress-fill-{default,success,warning,destructive}` 를 ui-react 와 library 사본이 참조해요. 각 참조에는 1.7.0 이 읽던 변수(`--axis-border-default` · `--axis-surface-tertiary` · `--axis-surface-brand` · `--axis-color-{green,yellow,red}-500`)를 fallback 으로 두어서, 1.7.0 tokens 와 섞여도 1.7.0 렌더로 물러나요. 3:1 대비는 `@axis-ds/tokens` 1.8.0 이상과 함께 쓸 때 나와요.
  - **CSS 변수를 덮어써서 테마 · 브랜드를 만들었다면**(`:root` · `[data-theme]` · `[data-brand]` 블록) 새 변수도 함께 덮어쓰세요. 1.8.0 에서 `Progress` 채움은 `--axis-surface-brand` · `--axis-color-{green,yellow,red}-500` 대신 `--axis-progress-fill-{default,success,warning,destructive}`, `Checkbox` · `RadioGroupItem` · `Textarea` 경계는 `--axis-border-default` 대신 `--axis-form-control-border`, `Switch` 꺼짐 · `Slider` 트랙은 `--axis-surface-tertiary` 대신 `--axis-form-control-track` 을 써요. 예전 변수만 덮어쓰면 그 컴포넌트는 기본값(파랑 채움 · gray.500 경계)으로 남아요. 예시는 테마 커스터마이징 가이드 「2. CSS 변수 오버라이드」 · 「5. 커스텀 테마 생성」에 있어요.
  - **cli · mcp**: 동봉 레지스트리(toast · dialog · agentic 항목)가 새 소스로 바뀌어요. 이미 `axis add` 로 설치한 사본은 자동으로 바뀌지 않아요. 새 소스가 필요하면 `axis add <이름> --overwrite` 로 다시 받으세요(직접 고친 부분은 덮어써져요).
  - `MessageBubble` · `StepTimeline` 의 시각은 `timeZone` 을 주지 않으면 하이드레이션 뒤에 채워져요. 서버 렌더에서 시각을 바로 보이게 하려면 `locale` · `timeZone`(또는 `formatTime`)을 주세요.

- f3dae65: 기본 테마(브랜드 미지정)에서 4.5:1 에 못 미치던 글자 대비를 맞췄어요(WI-0062). ontology 브랜드 출력은 바뀌지 않아요.
  - tokens 기본값: `--axis-agent-avatar-assistant` purple.500 → purple.600 · `--axis-agent-avatar-tool` blue.500 → blue.600(흰 이니셜 3.95 · 3.67 → 5.38 · 5.17), `--axis-status-neutral-muted-contrast` 흰색 → gray.700(대기 단계 숫자 1.47 → 7.00), `--axis-diff-added-text` 라이트 green.600 → green.700 · `--axis-diff-removed-text` 라이트 red.600 → red.700 · 다크 red.400, `--axis-input-text-placeholder` 라이트 gray.400 → gray.500(다크 gray.400 유지), `--axis-button-text-disabled` 라이트 gray.500 → gray.600 · `--axis-button-bg-disabled` 다크 gray.700 → gray.800, shadcn 호환 `--destructive` 라이트 red.500 → red.600(흰 글자 3.76 → 4.83). 전역 `status.*` 값은 그대로예요.
  - ui-react `Toast` 설명에서 `opacity-90` 을 뺐어요(성공 · 경고 바탕 3.99 · 3.98, ontology 경고 · 오류 3.95 → 불투명 글자). `DropdownMenuShortcut` 은 포커스 바탕 위에서도 읽히게 `text-secondary` 를 써요.
  - agentic-ui: `TokenUsageIndicator` 경고 · 초과 글자는 `text-warning` · `text-error`, `DiffViewer` 헤더 `+N` · `-N` 은 `text-secondary` · `text-error`, 보기 탭 · 줄 번호와 `CodeBlock` 언어 배지 · `ContextPanel` 제공자 · 버전 · `ToolCallCard` 소요 시간은 회색 바탕 위라 `text-secondary` 를 써요.
  - cli · mcp: 동봉 레지스트리의 toast · agentic 5개 항목(code-block · context-panel · diff-viewer · token-usage-indicator · tool-call-card) 소스가 새 코드로 바뀌었어요.

- f3dae65: 기본 테마(브랜드 미지정)의 비텍스트 대비(WCAG 1.4.11, 3:1)를 맞췄어요(WI-0063). ontology 브랜드의 기존 토큰 값과 렌더 색은 바뀌지 않아요.
  - tokens 새 변수: `--axis-form-control-border` · `--axis-form-control-track`(기본 gray.500, 흰 바탕 4.83), `--axis-progress-fill-default` · `-success` · `-warning` · `-destructive`(기본 라이트 blue.600 · green.700 · yellow.700 · red.600, 다크 blue.500 · green.500 · yellow.500 · red.500). ontology 는 1.7.0 에서 그 자리에 그려지던 값을 그대로 가져요.
  - tokens 기본값: `--axis-input-border-default` gray.300(다크 gray.700) → gray.500(1.47 · 1.95 → 4.83 · 4.16), `--axis-input-border-hover` 라이트 gray.600 · 다크 gray.400, `--axis-button-border-focus` blue.400 → blue.500(흰 바탕 2.54 → 3.68), `--axis-border-warning` 라이트 yellow.500 → yellow.700(1.85 → 4.76), `--axis-status-running-contrast` 흰색 → gray.950, `--axis-status-success-contrast` 다크 흰색 → gray.950. 전역 `status.*` 점 · 막대 색은 그대로예요.
  - ui-react: `Checkbox` · `RadioGroupItem` · `Textarea` 경계는 `form-control-border`, `Switch` 꺼짐 · `Slider` 트랙은 `form-control-track`, `Progress` 채움은 `progress-fill-*` 를 써요.
  - agentic-ui: 성공 · 경고 · 대기 아이콘과 상태 점(PlanCard · ToolCallCard · ApprovalCard · CodeBlock · FeedbackButtons · AgentAvatar · StepTimeline · RunProgress 완료)은 `text-success` · `text-warning` · `text-tertiary`, 오류 아이콘은 `text-error` 를 써요. PlanCard · ToolCallCard 진행 스피너 arc 는 불투명이에요. RecoveryBanner · AttachmentCard 오류 테두리는 `border-error`, PlanCard 승인 글자는 `button-text-default` 예요.
  - cli · mcp: 동봉 레지스트리의 agentic 10개 항목(agent-avatar · approval-card · attachment-card · code-block · feedback-buttons · plan-card · recovery-banner · run-progress · step-timeline · tool-call-card) 소스가 새 코드로 바뀌었어요. ui-react 폼 컨트롤 library 사본은 새 토큰(tokens 1.8.0)을 참조해요.

- f3dae65: 문서 페이지 axe 에서 나온 비대비 접근성 결함을 고치고, 시각 표시에 하이드레이션 안전 prop 을 더했어요(WI-0069).
  - agentic-ui `MessageBubble` · `StepTimeline`: `locale` · `timeZone` · `formatTime` prop 을 더했어요. `timeZone`(StepTimeline 은 `locale` 도) 을 주지 않으면 시각을 하이드레이션 뒤에 브라우저 시간대로 채워, 서버와 브라우저 시간대가 달라 생기던 하이드레이션 오류(React #418)가 나지 않아요. 최종 표시는 이전과 같아요. 두 모듈 산출물에 `"use client"` 가 붙어요.
  - agentic-ui `MessageBubble` 전송 상태 아이콘이 `role="img"` 와 `aria-label` 로 읽혀요(역할 없는 span 의 aria-label, axe aria-prohibited-attr).
  - agentic-ui `CodeBlock` 코드 스크롤 영역이 Tab 으로 포커스를 받는 이름 있는 region 이에요(axe scrollable-region-focusable).
  - agentic-ui `DiffViewer` 추가 · 삭제 줄 수를 aria-label 대신 화면 낭독 전용 문장으로 읽어요.
  - agentic-ui `RecoveryBanner` 재시도 버튼이 description 이 없을 때 없는 id 를 `aria-describedby` 로 가리키지 않아요.
  - ui-react `Dialog` · `Sheet` · `Popover`: 닫힌 동안 트리거에 `aria-controls` 를 두지 않아요(없는 id 참조, axe aria-valid-attr-value). open · defaultOpen · onOpenChange 는 그대로이고, 세 모듈 산출물에 `"use client"` 가 붙어요.
  - ui-react `CommandSeparator` 가 listbox 안에서 `role="separator"` 대신 보조기술에서 숨긴 장식 요소예요(axe aria-required-children). 검색 중 숨김 · `alwaysRender` 는 그대로예요.
  - ui-react `ScrollArea` 뷰포트가 Tab 으로 포커스를 받아 키보드로 스크롤할 수 있어요.
  - cli · mcp: 동봉 레지스트리의 dialog · agentic 5개 항목(code-block · diff-viewer · message-bubble · recovery-banner · step-timeline) 소스가 새 코드로 바뀌었어요.

### Patch Changes

- f3dae65: Tooltip 이 키보드 포커스로 열린 뒤 그 포커스가 만든 스크롤에 바로 닫히던 결함을 고쳤어요(WI-0073, WCAG 1.4.13 지속성).
  - 화면 밖 트리거로 Tab 하면 브라우저가 트리거를 화면 안으로 스크롤하는데, Radix Tooltip 은 트리거를 담은 요소의 스크롤에 툴팁을 닫아요. 이제 `Tooltip` 래퍼가 open 을 직접 제어해 **트리거에 포커스가 있는 동안 스크롤로 생긴 닫힘**만 무시해요.
  - Esc · 포인터 이탈 · 다른 요소로 포커스 이동 · 클릭 · 포커스 없이 hover 로 연 툴팁의 스크롤 닫힘은 이전과 같아요.
  - `open` · `defaultOpen` · `onOpenChange` 는 그대로 통과해요. 제어 모드에서 무시한 닫힘은 `onOpenChange(false)` 로 전달하지 않아요.
  - `tooltip` 모듈 산출물에 `"use client"` 가 붙어요(상태 훅을 쓰므로). 서버 컴포넌트에서 `<Tooltip>` 을 쓰는 방식은 그대로예요.

- Updated dependencies [f3dae65]
- Updated dependencies [f3dae65]
- Updated dependencies [f3dae65]
  - @axis-ds/tokens@1.8.0

## 1.7.0

### Minor Changes

- 4e91855: 밀도 토큰을 추가했습니다(WI-0026). 컨트롤 높이 · 글자 크기 · 단계별 둥글기를 CSS 변수로 바꿀 수 있습니다.
  - `@axis-ds/tokens`: 새 변수 15개. `--axis-control-h-sm|md|lg`(32 · 40 · 48px), `--axis-control-font-size-sm|md|lg`(12 · 14 · 16px), `--axis-field-h`(40px), `--axis-toggle-h-sm|md|lg`(36 · 40 · 44px), `--axis-table-font-size` · `--axis-table-head-font-size`(14px), `--axis-radius-control|field`(`calc(var(--radius) - 2px)`) · `--axis-radius-surface`(`var(--radius)`). JS export 에도 `control` · `field` · `toggle` · `table` · `radius.control|field|surface` 가 생깁니다.
  - `@axis-ds/ui-react`: Button · Input · Select 트리거 · Toggle · Table · Card · Dialog 가 고정 클래스 대신 이 변수를 읽습니다. 모든 참조에 1.6.x 와 같은 크기의 리터럴 fallback 이 있어, 토큰 CSS 가 옛 버전이어도 크기가 유지됩니다.
  - 브랜드를 지정하지 않은 화면은 바뀌지 않습니다(1.6.3 배포본과 Chromium 계산값 대조). 예외: `@axis-ds/tokens/css/shadcn` 없이 `@axis-ds/tokens/css` 만 쓰는 구성에서는 위 7개 컴포넌트의 둥글기가 0px 에서 fallback 6px(Card · Dialog 8px)로 바뀝니다.
  - `ontology` 브랜드는 디자인 시스템 v1 밀도를 씁니다. Button 27 · 34 · 42px(글자 13 · 14 · 15px), Input · Select 트리거 36px, Table 본문 13.5px · 머리 13px, 둥글기 Button · Toggle 10px → 8px, Input · Select 트리거 10px → 6px, Card · Dialog 12px. Toggle 높이와 Sheet(0px), 그 밖의 컴포넌트(Select 팝업 · Popover 10px 등)는 그대로입니다.

### Patch Changes

- Updated dependencies [4e91855]
- Updated dependencies [4f54bba]
  - @axis-ds/tokens@1.7.0

## 1.6.3

### Patch Changes

- 95a4a05: 움직임 줄이기(`prefers-reduced-motion: reduce`) 설정에서 로딩 · 진행 표시가 멈춰 앱이 응답하지 않는 것처럼 보이던 문제를 고쳤습니다(WI-0071).
  - 로딩 · 진행 표시는 멈추지 않고 기본 주기의 2~3배로 느리게 움직입니다. 처리 중이라는 신호는 남기고 움직임의 속도만 줄입니다.
    - `@axis-ds/ui-react`: Progress `indeterminate` 1.5초 → 4초 왕복, Skeleton 깜박임 2초 → 5초
    - `@axis-ds/agentic-ui`: RunProgress · ToolCallCard · PlanCard · MessageBubble 의 스피너 1초 → 3초 회전, ThinkingIndicator 점 1초 → 2.5초, RunProgress · StepTimeline 의 실행 중 표시와 StreamingText 커서 2초 → 5초
  - 열고 닫는 애니메이션(Dialog · Sheet · Popover · Select · DropdownMenu · Tooltip · Toast)과 Accordion 은 종전처럼 멈춥니다.
  - 움직임 줄이기를 켜지 않은 사용자에게는 바뀌는 것이 없습니다. Tailwind 3 · 4 기본 유틸리티(`motion-reduce:![animation-duration:...]`)만 써서 앱 설정을 바꿀 필요가 없습니다.

## 1.6.2

### Patch Changes

- bf629b9: Accordion · Progress 애니메이션이 어떤 설정에서도 돌지 않던 결함을 고치고, 애니메이션 플러그인 의존을 선언했습니다(WI-0046).
  - `@axis-ds/tokens`: Tailwind 3 preset 에 keyframes 3개(`accordion-down` · `accordion-up` · `progress-indeterminate`)와 `animate-*` 를 더했습니다. Tailwind 4 진입점(`css/tailwind4`)은 같은 출처로 `@keyframes` 와 `--animate-*` 를 만듭니다. preset 을 쓰지 않는 앱을 위해 `axisKeyframes` · `axisAnimation` 을 `@axis-ds/tokens/tailwind` 에서 내보냅니다.
  - `@axis-ds/ui-react`: Progress `indeterminate` 가 트랙 전체를 채워 100% 완료처럼 보이던 표시를, 1/3 폭 막대가 왕복하는 형태로 바꿨습니다. Dialog · Sheet · Popover · Select · DropdownMenu · Tooltip · Toast 가 쓰는 열고 닫는 애니메이션 플러그인(Tailwind 3 `tailwindcss-animate` · Tailwind 4 `tw-animate-css`)을 선택적 peer 의존으로 선언했습니다(설치 경고는 나오지 않습니다).
  - `@axis-ds/ui-react` · `@axis-ds/agentic-ui`: 움직임 줄이기(`prefers-reduced-motion: reduce`) 설정에서 모든 컴포넌트 애니메이션이 멈춥니다(`motion-reduce:!animate-none`).
  - `@axis-ds/agentic-ui`: SurfaceRenderer 의 text surface 가 설치되지 않은 `@tailwindcss/typography` 의 `prose` 대신 `text-sm` 을 씁니다. 플러그인을 넣었을 때와 같은 14px 입니다.

- Updated dependencies [bf629b9]
  - @axis-ds/tokens@1.6.2

## 1.6.1

### Patch Changes

- dff48ee: `Avatar` 가 하이드레이션 전에 끝난 이미지 로드 오류를 이니셜 fallback 으로 바꾸지 못하던 결함을 고쳤습니다(WI-0054).
  - 서버 렌더된 이미지가 하이드레이션 전에 실패하면 `onError` 가 붙기 전이라 깨진 이미지가 그대로 남았습니다. 이제 마운트할 때 `complete && naturalWidth === 0` 이면 `img.decode()` 로 확인해 거부되면 fallback 으로 바꿉니다.
  - 정상 로드인데 고유 크기가 0 인 이미지(예: `width="0"` SVG)는 decode 가 이행되므로 fallback 으로 바꾸지 않습니다. `decode` 가 없는 환경에서는 종전처럼 `onError` 만 씁니다.
  - 한 번 실패한 뒤 `src` 를 바꿔도 fallback 에 고정되던 문제를 함께 고쳤습니다. 실패했던 주소로 돌아오면 다시 시도합니다.
  - props 이름 · 타입 · ref 대상은 바뀌지 않았습니다.

## 1.6.0

### Minor Changes

- e6f6eef: 기본 테마(브랜드 미지정)에서 흰 글자와 일부 보조 글자가 WCAG AA 4.5:1 에 못 미치던 색을 고쳤습니다(WI-0029). primitive 값과 전역 `status-*` 는 그대로이고, 미달을 일으키던 component · semantic 참조만 한 단계 진하게 옮겼습니다. `data-brand="ontology"` 화면은 바뀌지 않고, `shadcn-compat.css` 는 아래 다크 `--muted-foreground` 한 줄만 바뀝니다.

  기본 화면에서 바뀌는 색(라이트 · 다크 공통이 아니면 테마를 적었습니다):
  - Button 기본 바탕 `--axis-button-bg-default · hover · active`: #3B82F6 · #2563EB · #1D4ED8 → #2563EB · #1D4ED8 · #1E40AF (흰 글자 3.67 → 5.16)
  - Button destructive 바탕 `--axis-button-destructive-bg-default · hover · active`: #EF4444 · #DC2626 · #B91C1C → #DC2626 · #B91C1C · #991B1B (흰 글자 3.76 → 4.82)
  - MessageBubble 사용자 바탕 `--axis-agent-message-user-bg`: #3B82F6 → #2563EB
  - 다크 보조 글자 `--axis-text-secondary` #9CA3AF → #D1D5DB, `--axis-text-tertiary` #6B7280 → #9CA3AF (다크 `--axis-button-text-disabled` 도 #9CA3AF 로 같이 바뀝니다). 다크 `--axis-input-text-placeholder` 는 #9CA3AF 그대로입니다
  - shadcn 호환 다크 `--muted-foreground`(`shadcn-compat.css` 의 `.dark`): `218 11% 65%`(#9CA3AF) → `216 12% 84%`(#D1D5DB). 종전처럼 `text.secondary` 에서 파생되어 함께 바뀝니다. 라이트 값과 그 밖의 줄은 그대로입니다
  - PlanCard 거절 hover 글자 `--axis-plan-card-reject-hover-text`: #EF4444 → 라이트 #B91C1C · 다크 #F87171

  새 CSS 변수 3개(PlanCard 전용, 기본값 라이트 / 다크):
  - `--axis-plan-card-approve-bg` #15803D / #15803D: 승인 버튼 바탕(종전 `--axis-status-success`)
  - `--axis-plan-card-approve-hover-bg` #166534 / #166534: 승인 버튼 hover 바탕(종전 `--axis-status-success-strong`)
  - `--axis-plan-card-reject-text` #B91C1C / #EF4444: 거절 버튼 글자(종전 `--axis-status-error`)

  PlanCard 는 이 새 변수를 씁니다. ontology 브랜드 CSS 에는 새 변수 3개를 종전과 같은 값(`status-success` · `status-success-strong` · `status-error`)으로 더해 화면이 바뀌지 않습니다.

  마이그레이션: 토큰 변수(`var(--axis-button-bg-default)` 등)로 색을 쓰고 있다면 할 일이 없습니다. 위 hex 값을 직접 적어 AXIS 버튼 색과 맞추던 곳(스크린샷 비교, 하드코딩한 #3B82F6 · #EF4444 등)은 새 값으로 고치세요. 자체 브랜드 CSS 로 PlanCard 색을 바꾸던 경우에는 승인 버튼 · 거절 글자가 이제 `--axis-status-*` 대신 새 변수 3개를 읽으므로, 같은 값을 새 변수에도 지정하세요.

  cli · mcp 는 동봉 레지스트리의 PlanCard(`agentic-plan-card`) 항목을 위 새 변수 3개를 쓰는 소스로 갱신합니다. `axis add plan-card` 는 원격 레지스트리(pages.dev)를 먼저 읽으므로, 받는 소스는 문서 사이트가 배포된 뒤부터 새 변수를 씁니다. 원격에 닿지 못해 동봉본으로 폴백할 때는 이 cli · mcp 버전부터 새 소스가 설치됩니다.

  `axis add plan-card` 로 PlanCard 소스를 이미 프로젝트에 복사해 간 경우, 토큰 패키지만 올려서는 승인 · 거절 버튼 대비가 고쳐지지 않습니다. 복사본은 여전히 `--axis-status-success` · `--axis-status-success-strong` · `--axis-status-error` 를 읽기 때문입니다. `axis add plan-card` 로 다시 받거나, 복사본의 className 3곳을 새 변수로 바꾸세요: `bg-[var(--axis-status-success)]` -> `bg-[var(--axis-plan-card-approve-bg)]`, `hover:bg-[var(--axis-status-success-strong)]` -> `hover:bg-[var(--axis-plan-card-approve-hover-bg)]`, 거절 버튼의 `text-[var(--axis-status-error)]` -> `text-[var(--axis-plan-card-reject-text)]`.

### Patch Changes

- Updated dependencies [e6f6eef]
  - @axis-ds/tokens@1.6.0

## 1.5.2

### Patch Changes

- a36eb82: `moduleResolution: "node"`(Next 15 가 tsconfig 를 만들 때 쓰는 값)에서 `variant` · `size` 같은 변형 prop 의 타입 검사가 꺼지던 문제를 고쳤습니다(WI-0059). 종전 d.ts 는 `class-variance-authority/types` 를 import 했는데, 이 경로는 cva 의 `exports` 에만 있어 node 해석에서 풀리지 않아 변형 타입이 any 로 떨어졌습니다(`skipLibCheck` 라 오류 없이 통과). 이제 d.ts 가 그 경로를 참조하지 않아 `<Button variant="nope" />` 같은 잘못된 값이 타입 오류로 잡힙니다. 런타임 코드는 바뀌지 않았습니다.

  **업데이트 뒤 빌드가 실패할 수 있습니다.** `moduleResolution: "node"` 로 빌드하던 앱(tsconfig 없이 시작해 Next 가 만든 tsconfig 포함)은 그동안 변형 prop 의 타입 검사가 꺼져 있었습니다. 이 버전부터 다시 켜지므로 다음 코드는 `next build` 의 타입 단계에서 실패합니다.
  - 없는 값을 넘긴 경우: `<Button variant="nope" />` → 실제 있는 값(`default` · `secondary` · `ghost` · `destructive` · `outline` · `link` 등)으로 고칩니다
  - 넓은 `string` 변수를 넘긴 경우: `const v: string = ...; <Button variant={v} />` → 변수 타입을 좁힙니다. 예: `const v = "secondary" as const`, 또는 `import type { ButtonProps } from "@axis-ds/ui-react"` 뒤 `const v: ButtonProps["variant"] = ...`

  `moduleResolution` 이 `bundler` · `node16` 인 앱은 종전에도 검사가 켜져 있어 영향이 없습니다.

## 1.5.1

### Patch Changes

- 0911f1a: TypeScript `moduleResolution: "node"` 에서도 서브패스 타입을 찾도록 `typesVersions` 를 추가했습니다(WI-0053).
  - `@axis-ds/ui-react/avatar` · `@axis-ds/agentic-ui/agent-avatar` 같은 서브패스 import 가 `"moduleResolution": "node"` 인 프로젝트에서 「Cannot find module ... or its corresponding type declarations」(TS2307)로 실패했습니다. tsconfig 없이 시작한 Next 15 앱은 `next build` 때 이 값으로 tsconfig 를 만들기 때문에 타입 단계에서 빌드가 멈췄습니다. 1.5.0 기준 ui-react 30개 · agentic-ui 18개 · tokens 4개(`tailwind` · `json` · `brands` · `brands/ontology/brand.json`) 서브패스가 해당합니다.
  - `typesVersions` 는 `exports` 와 1:1 이고 같은 타입 파일을 가리킵니다. `node16` · `nodenext` · `bundler` 는 종전처럼 `exports` 로 해석되며 결과가 바뀌지 않습니다. 런타임 동작과 `exports` 는 바뀌지 않았습니다.

- Updated dependencies [0911f1a]
  - @axis-ds/tokens@1.5.1

## 1.5.0

### Minor Changes

- 4eb8a83: Next.js App Router 서버 컴포넌트에서 바로 쓸 수 있게 `"use client"` 경계를 넣었습니다(WI-0050).
  - 종전(1.2.1 · 1.3.0 · 1.4.0)에는 `"use client"` 를 쓰지 않은 서버 컴포넌트(create-next-app 기본 `page.tsx` · `layout.tsx`)에서 아래 컴포넌트를 쓰면 `next build` 가 실패했습니다. 이제 패키지 안에 클라이언트 경계가 있어 그대로 렌더됩니다.
    - `@axis-ds/ui-react`: `Avatar`(`useState`), `CommandInput` · `CommandList` · `CommandEmpty` · `CommandGroup` · `CommandItem` · `CommandSeparator`(cmdk 점 접근)
    - `@axis-ds/agentic-ui`: `CodeBlock` · `ContextPanel` · `DiffViewer` · `FeedbackButtons` · `SourcePanel` · `StreamingText` · `ToolCallCard`
    - `@axis-ds/theme`: `ThemeProvider`(import 만 해도 `createContext is not a function` 으로 빌드 전체가 멈췄음). 서버 `app/layout.tsx` 에서 바로 써도 됩니다
  - `cn` 과 `*Variants` 7개(`alertVariants` · `avatarVariants` · `badgeVariants` · `buttonVariants` · `progressVariants` · `progressIndicatorVariants` · `toggleVariants`), 합 8개 함수는 지금처럼 서버 컴포넌트에서 호출할 수 있습니다. 루트 배럴과 이 함수들을 담은 파일에는 지시문을 두지 않습니다. `avatarVariants` 는 `Avatar` 컴포넌트와 파일을 나눴고 import 경로 · 이름은 그대로입니다.
  - `@axis-ds/agentic-ui` 에 서브패스 6개를 더했습니다: `./agent-avatar` · `./recovery-banner` · `./source-panel` · `./step-timeline` · `./surface-renderer` · `./thinking-indicator`(종전에는 루트로만 import 할 수 있었음).

  하위 호환: 루트 `.` 와 기존 서브패스의 exports 경로 · 내보내기 이름 · 타입 선언은 바뀌지 않았습니다.

  빌드 산출물 구조 변경: `@axis-ds/ui-react` · `@axis-ds/agentic-ui` 는 번들(공용 `chunk-*.mjs`) 대신 소스 파일 하나가 `dist` 파일 한 벌(`.mjs` · `.js` · `.d.ts` · `.d.mts`)이 되는 모듈 보존 빌드로 바꿨습니다. `dist` 안의 파일 경로를 exports 를 거치지 않고 직접 import 했다면 경로가 달라질 수 있습니다. `@axis-ds/theme` 는 단일 파일 그대로이고 `dist/index.mjs` · `index.js` 앞에 `"use client"` 가 붙습니다.

  서버 컴포넌트에서 `onClick` 같은 함수 prop 을 넘길 수 없는 것은 React Server Components 규칙이라 그대로입니다. 핸들러가 필요하면 그 부분을 `"use client"` 파일로 만듭니다(각 패키지 README 「서버 컴포넌트」 절).

  `@axis-ds/tokens` 는 코드 변경이 없고, linked 4패키지를 같은 버전으로 맞추려고 함께 올립니다(2026-10-20 결정).

### Patch Changes

- Updated dependencies [4eb8a83]
  - @axis-ds/tokens@1.5.0

## 1.4.0

### Minor Changes

- 4f578fc: Tailwind CSS 4 프로젝트에서 AXIS 를 import 몇 줄로 연동할 수 있게 했습니다(WI-0044).
  - `@axis-ds/tokens`: Tailwind 4 진입점 `@axis-ds/tokens/css/tailwind4` 를 더했습니다. Tailwind 3 preset(`@axis-ds/tokens/tailwind`)과 같은 매핑(색 24 · radius 3 · 글꼴 3)을 `@theme inline` 으로, `.dark` 클래스 다크 모드를 `@custom-variant dark (&:where(.dark, .dark *))` 로 정의하고, 토큰 변수(`css` · `css/shadcn`)를 base 레이어로 함께 불러옵니다. `@import "tailwindcss";` 뒤에 `@import "@axis-ds/tokens/css/tailwind4";` 한 줄이면 `bg-primary` · `rounded-md` · `font-mono` · `dark:bg-primary` 가 AXIS 변수로 생성되고, `--radius` 와 브랜드 CSS(ontology 등)를 따라갑니다. preset 과 같은 소스에서 빌드 때 만들어집니다.
  - `@axis-ds/ui-react` · `@axis-ds/agentic-ui`: 패키지 빌드 산출물을 가리키는 `@source` 를 담은 `tailwind.css` 를 배포합니다. Tailwind 4 는 `node_modules` 를 스캔하지 않아 컴포넌트 클래스(`bg-[var(--axis-button-bg-default)]` 등)가 생성되지 않았는데, 전역 CSS 에 `@import "@axis-ds/ui-react/tailwind.css";` 한 줄을 더하면 생성됩니다. npm · pnpm 설치 모두 동작합니다.
  - 다크 변형은 Tailwind 4 공식 형태라 Tailwind 3 preset(`.dark` 의 자손에만 적용, 명시도 +1)과 달리 `.dark` 를 붙인 요소 자신에도 적용되고 명시도를 올리지 않습니다.

  Tailwind 3 사용자는 영향이 없습니다. preset 과 기존 CSS 산출물(`variables.css` · `shadcn-compat.css` · 브랜드 CSS · JSON · JS)은 바뀌지 않았고, 새 파일과 exports 항목만 더해졌습니다.

### Patch Changes

- Updated dependencies [4f578fc]
  - @axis-ds/tokens@1.4.0

## 1.3.0

### Minor Changes

- 2d403bc: 브랜드 테마 축과 온톨로지 프리셋(WI-0025 M2 · M3): `data-brand`로 테마와 독립된 브랜드 색을 적용하고, 첫 브랜드 `ontology`를 함께 배포
  - tokens: 브랜드 빌드(`dist/css/brands/<brand>.css`, `dist/brands/<brand>/brand.json`, 목록 `dist/brands/index.json`)와 exports `./css/brands/ontology` · `./brands/ontology/brand.json` · `./brands` 추가. 브랜드 미지정 `variables.css`는 1.2.1 변수 249개(`:root` · `.dark` 각각)의 값이 그대로이고 새 변수 11개(`--axis-shadow-sm|lg`, `--axis-card-shadow`, `--axis-plan-card-accent-width`, `--axis-plan-card-reject-hover-text`, 흰 글자 짝 토큰 6개, 기본값은 기존 화면과 같음)만 추가. `--axis-card-shadow-default`는 폐기 예정
  - tokens 브랜드 선택자: 라이트는 같은 속성을 두 번 쓴 `[data-brand="<brand>"][data-brand="<brand>"]`로 명시도 (0,2,0)이라(다크 3종도 (0,2,0)) 기본 `:root` · `.dark`와 앱 `globals.css`의 (0,1,0) 정의보다 높아, 브랜드 CSS import 순서와 상관없이 브랜드 값이 이김(하위 컨테이너 `<div data-brand>`도 지원)
  - theme: `ThemeProvider`에 `defaultBrand` · `brandStorageKey`, `useTheme()`에 `brand` · `setBrand` 추가(`ThemeContextValue` 타입에 필수 멤버 `brand: string | undefined` · `setBrand: (brand: string | undefined) => void`가 늘어, `ThemeContextValue` 타입으로 값을 직접 만드는 경우(테스트 mock 등) `brand` · `setBrand`가 필요. 공개 API 추가로 보고 Breaking change로 분류하지 않음)
  - ui-react: Card · Dialog 그림자가 `--axis-card-shadow` · `--axis-shadow-lg`를 참조(기본 화면 불변, tokens CSS를 로드하지 않으면 그림자 없음), `cn()`이 그림자 변수 클래스를 그림자 그룹으로 병합
  - agentic-ui: 흰 글자 5곳과 PlanCard 색 선 두께를 토큰으로 교체하고, PlanCard 거절 버튼 hover 글자를 `--axis-plan-card-reject-hover-text`로 분리(기본 화면 불변, 기본 브랜드 값은 `status-error`와 같음). CSS가 생성되지 않던 불투명도 수식어 11곳을 고쳐 PlanCard 상태 배지 · 거절 버튼 hover, DiffViewer 줄, FeedbackButtons 선택 상태의 옅은 바탕과 AttachmentCard 오류 테두리가 표시됨(기본 화면 변화)

### Patch Changes

- Updated dependencies [2d403bc]
- Updated dependencies [50bc160]
  - @axis-ds/tokens@1.3.0

## 1.2.1

### Patch Changes

- a5aef4f: 토큰 정합(WI-0025 M1): 정의되지 않은 CSS 변수 참조 24종을 정의된 토큰으로 바로잡고, agentic-ui의 primitive 색 직접 참조를 semantic 토큰으로 교체
  - tokens: semantic `interactive.primary`, `status.*`(14), `diff.*`(4), `agent.*`(4), Alert용 `border.info` · `border.warning` · `icon.info` 추가 (기존 토큰 값 변경 없음)
  - ui-react: Alert · Badge · Progress · Checkbox · RadioGroup · Switch · Slider · Textarea · Toggle · Sheet · Popover · DropdownMenu · Command가 정의된 토큰을 참조하도록 수정. 투명하던 바탕이 불투명해지고 7개 컴포넌트에 키보드 포커스 링이 표시됨
  - agentic-ui: 13개 컴포넌트의 상태 · diff · 아바타 색을 semantic 토큰으로 교체 (라이트 · 다크 계산값 변경 없음)
  - theme: 배포된 1.2.0이 tokens를 1.2.0 정확 버전으로 고정하므로 tokens 1.2.1을 받도록 함께 배포

- WI-0033: 다크 모드에서 component 토큰(button · input · card · badge · dialog) 45개가 `.dark`에 재정의되지 않아 라이트 값이 쓰이던 문제 수정 (changeset 없이 1.2.1에 포함)
  - tokens: component 토큰에 `$extensions.axis.dark`(다크 값 31개) · `$extensions.axis.themeIndependent`(테마 무관 14개) 선언, 다크 빌드가 component 토큰을 다크 값으로 출력. 다크 값이 바뀌는 변수 29개. WI-0033 은 라이트 출력을 바꾸지 않음(M1 반영 빌드 3b52976 대비 `:root` 블록과 나머지 산출물 9개 sha256 일치)
  - ui-react: 다크에서 Card · Dialog 바탕이 흰색으로 남던 문제(제목 대비 1.10:1 → 18.30:1), Button ghost · secondary, Input · Select 트리거, Badge가 다크 톤으로 표시됨. 채움 버튼(primary · destructive)은 변경 없음
  - agentic-ui: ApprovalCard · PlanCard secondary 버튼 글자가 다크에서 보이지 않던 문제 해소(1.00:1 → 16.12:1)
  - 검사: `check-token-refs`에 `:root` · `.dark` 이름 집합 동일 판정, 다크 값 미반영 판정(다크 값이 라이트와 달라야 하는 component 토큰의 `.dark` 값이 `:root`와 같으면 실패), component 색 토큰 테마 선언 판정 추가, 토큰 빌드도 선언 누락 시 실패

- Updated dependencies [a5aef4f]
  - @axis-ds/tokens@1.2.1

## 1.2.0

### Patch Changes

- Updated dependencies [8c36953]
  - @axis-ds/tokens@1.2.0

## 1.1.3

### Patch Changes

- bdbd1ad: 외부 npm 소비 퍼블리싱 버그 3건 수정
  - **tokens**: CSS 커스텀 프로퍼티명의 점(`--axis-space-2.5`)을 하이픈(`--axis-space-2-5`)으로 치환. Turbopack/Lightning CSS 파싱 실패(전 페이지 500) 해소.
  - **ui-react**: `exports` 서브패스를 실제 빌드 산출물(`dist/<name>/index.*` 중첩 구조)에 맞게 정정하고, dist에서 자동 생성하는 `sync-exports` 스크립트로 드리프트 재발 방지. 누락됐던 6개 컴포넌트(badge/label/select/separator/tabs/toast) 서브패스 export 복구.
  - **발행 채널 가드**: workspace 프로토콜 의존 패키지(ui-react/agentic-ui/theme)에 `npm publish` 차단 가드 추가(pnpm/CI 발행만 허용). `workspace:*` 누출로 인한 `npm install` 실패 재발 방지.
  - **검증 게이트**: `pack-smoke` 스크립트로 tarball 단위 외부 소비 검증(workspace 누출/exports 미존재/CSS 점 변수)을 release + CI publish에 연결.

- Updated dependencies [bdbd1ad]
  - @axis-ds/tokens@1.1.3

## 1.1.0

### Minor Changes

- dc711a8: 외부 프로젝트 연동을 위한 패키지 설정 개선
  - @axis-ds/tokens: Dark mode CSS Variables 빌드 추가, shadcn 호환 CSS Variables (shadcn-compat.css) 생성, Tailwind CSS preset 추가
  - 전체 패키지: sideEffects 필드 추가, README 개선
  - examples/nextjs-app: 외부 프로젝트 연동 예제 추가

### Patch Changes

- Updated dependencies [dc711a8]
  - @axis-ds/tokens@1.1.0
