/**
 * ontology 접기 값 검산 표 (WI-0025 M3, D-6 · U15 · U16 · plan 5.3)
 *
 * test/ontology-values.test.mjs 와 루트 scripts/check-contrast-pairs.mjs 가 함께 import 한다.
 * - V1_PALETTE: 디자인 시스템 v1 팔레트(초안 2 주석의 원본 토큰 이름). 브랜드 hex 값은 이 안에서만 고른다.
 * - CONTRAST_PAIRS: 글자 · 비텍스트가 실제로 놓이는 바탕 짝과 최소 대비. 짝이 바뀌면 이 표를 먼저 고친다.
 *   bg 가 { mix, pct } 이면 `color-mix(in srgb, var(mix) pct%, transparent)` 를 surface-default 위에 깐 색이다.
 *   { mix, pct, over } 이면 surface-default 대신 over(부모 바탕 변수) 위에 깐다. 부모 바탕은 소스 한 문자열에서
 *   뽑을 수 없으므로 check-contrast-pairs 의 짝 키에는 over 가 들어가지 않는다(over 는 손으로 확인해 적는다).
 * - 글자 · 아이콘이 부모 요소의 바탕 위에 놓이면 bg 에 그 부모 바탕 변수를 직접 적고(불투명 바탕), 옅은 바탕이면
 *   over 에 적는다. 이때 parent 에 근거 위치를 남긴다: { at: '부모 바탕 클래스가 있는 파일:행', fgAt: '글자 클래스가
 *   있는 파일:행', variant?: 'hover:' }. 값은 손으로 적고, check-contrast-pairs 가 그 두 행에 실제로
 *   `<variant>bg-[var(부모 바탕)]` 과 `var(fg)` 가 있는지 단언한다(행이 밀리거나 부모 바탕이 바뀌면 실패).
 *   부모 바탕 = 문자열 bg 이면 bg, 옅은 바탕이면 bg.over 다. 경로는 packages/axis-agentic-ui/src 기준.
 *
 * - fg 가 '#RRGGBB' 이면 토큰이 아닌 고정 색이다(Switch 썸 bg-white). bgShadcn: true 이면 bg 는 shadcn 변수
 *   (`--background`, 문서 사이트 · 앱의 페이지 바탕)이고, ontology 는 브랜드 JSON shadcn 블록, 기본은 shadcn-compat.css 에서 읽는다(WI-0079).
 * - kind: 'icon' 인 행은 글자가 아니라 아이콘 · 글리프(svg)다. ontology(ontology-values.test)는 종전대로 행의 min 을 적용하고,
 *   기본 브랜드(default-contrast.test, WI-0062 · 0063)는 WCAG 분류대로 비텍스트 3:1(1.4.11)을 적용한다.
 *   글자 행(kind 없음)은 두 브랜드 모두 min 을 그대로 적용한다.
 *
 * 이 파일은 test/ 아래라 npm 배포본(files: dist)에 들어가지 않는다.
 */

/** v1 팔레트: 이름 -> { light, dark }. sub-aa 는 부록 B 라이트 보정값이고 다크는 보정 없는 sub 와 같다 */
export const V1_PALETTE = {
  bg: { light: '#F7F7F7', dark: '#0E1013' },
  card: { light: '#FFFFFF', dark: '#17191D' },
  panel: { light: '#F3F4F6', dark: '#1F2227' },
  'panel-2': { light: '#EAECEF', dark: '#2A2E34' },
  ink: { light: '#111418', dark: '#F1F3F5' },
  'ink-2': { light: '#2A2F36', dark: '#D0D4D9' },
  sub: { light: '#6B7280', dark: '#9CA3AD' },
  'sub-aa': { light: '#5F6673', dark: '#9CA3AD' },
  muted: { light: '#9AA1AB', dark: '#7A828D' },
  line: { light: '#E6E8EB', dark: '#2B2F35' },
  'line-2': { light: '#D6DADF', dark: '#5F6874' },
  key: { light: '#326ADA', dark: '#6B98F0' },
  'key-dark': { light: '#2757B8', dark: '#9DBBF6' },
  'key-light': { light: '#E8EFFC', dark: '#1C2A45' },
  'on-key': { light: '#FFFFFF', dark: '#0E1013' },
  bad: { light: '#C8332E', dark: '#F07A72' },
  'bad-dark': { light: '#A8281F', dark: '#F49890' },
  'bad-light': { light: '#FDE8E8', dark: '#3A1A1A' },
  'bad-line': { light: '#F5C6C6', dark: '#7A3330' },
};

const TEXT = 4.5;
const NON_TEXT = 3;

/**
 * 짝 표. fg · bg 는 CSS 변수 이름. where 는 소비처(파일:행), 같은 className 문자열 안의 짝은
 * check-contrast-pairs 가 소스에서 다시 뽑아 이 표와 대조한다(sameString: true).
 * 부모 · 자식으로 나뉜 짝(아바타, 타임라인 아이콘)은 소스에서 뽑을 수 없어 손으로 둔다.
 */
export const CONTRAST_PAIRS = [
  // 흰 글자 짝 토큰 (D-5)
  // WI-0063: 완료 점 바탕은 status-success 대신 text-success(기본 라이트 green.700 · 다크 green.400, ontology 는 두 값이 같음)
  { fg: '--axis-status-success-contrast', bg: '--axis-text-success', min: TEXT, sameString: true, kind: 'icon', where: 'run-progress:32 (완료 글리프)' },
  // PlanCard 승인 버튼: WI-0029 에서 status-success 대신 전용 component 토큰(기본 green.700 · green.800).
  // 글자는 WI-0063 에서 status-success-contrast(다크 기본값이 짙은 글자로 바뀜) 대신 button-text-default(ontology 는 두 값이 같음)
  { fg: '--axis-button-text-default', bg: '--axis-plan-card-approve-bg', min: TEXT, where: 'plan-card:179' },
  { fg: '--axis-button-text-default', bg: '--axis-plan-card-approve-hover-bg', min: TEXT, where: 'plan-card:179 hover' },
  { fg: '--axis-status-success-contrast', bg: '--axis-text-success', min: NON_TEXT, kind: 'icon', where: 'step-timeline:107 · 115 (점 위 아이콘)' },
  { fg: '--axis-status-running-contrast', bg: '--axis-status-running', min: TEXT, sameString: true, kind: 'icon', where: 'run-progress:31 (진행 스피너)' },
  { fg: '--axis-status-error-contrast', bg: '--axis-status-error', min: TEXT, sameString: true, kind: 'icon', where: 'run-progress:33 (오류 글리프)' },
  { fg: '--axis-status-neutral-muted-contrast', bg: '--axis-status-neutral-muted', min: TEXT, sameString: true, where: 'run-progress:30 (대기 단계 숫자)' },
  { fg: '--axis-agent-message-user-text', bg: '--axis-agent-message-user-bg', min: TEXT, sameString: true, where: 'message-bubble:58' },
  { fg: '--axis-agent-avatar-text', bg: '--axis-agent-avatar-tool', min: TEXT, where: 'agent-avatar:35 · 80' },
  { fg: '--axis-agent-avatar-text', bg: '--axis-agent-avatar-assistant', min: TEXT, where: 'agent-avatar:34 · 80' },
  { fg: '--axis-agent-avatar-text', bg: '--axis-agent-avatar-system', min: TEXT, where: 'agent-avatar:36 · 80' },
  // PlanCard 상태 배지 (불투명 배지 바탕이라 부모 바탕과 무관). ontology 라이트 warning 은 4.51:1 로 여유 0.01 (리뷰 f2)
  { fg: '--axis-status-neutral-strong', bg: '--axis-status-neutral-bg', min: TEXT, sameString: true, where: 'plan-card:35 배지' },
  { fg: '--axis-badge-warning-text', bg: '--axis-badge-warning-bg', min: TEXT, sameString: true, where: 'plan-card:39 배지' },
  { fg: '--axis-badge-success-text', bg: '--axis-badge-success-bg', min: TEXT, sameString: true, where: 'plan-card:43 · 55 배지' },
  { fg: '--axis-badge-error-text', bg: '--axis-badge-error-bg', min: TEXT, sameString: true, where: 'plan-card:47 배지' },
  { fg: '--axis-badge-info-text', bg: '--axis-badge-info-bg', min: TEXT, sameString: true, where: 'plan-card:51 배지' },
  // 상태 색을 아이콘에 쓰는 곳 (surface-default 위)
  // WI-0063: 성공 · 오류 · 경고 · 대기 아이콘은 ontology 값이 같은 text-* 로(기본 라이트 green.500 2.28 · yellow.500 1.91 · gray.400 2.54 해소).
  // 진행 · 정보는 ontology 값이 같은 대체 토큰이 없어 status-* 그대로(기본 3.68, 스피너 arc 는 불투명으로 바꿔 합성 2.81 → 3.68)
  { fg: '--axis-text-success', bg: '--axis-surface-default', min: TEXT, kind: 'icon', where: 'tool-call-card:49 · plan-card:72' },
  { fg: '--axis-text-error', bg: '--axis-surface-default', min: TEXT, kind: 'icon', where: 'approval-card:43 · tool-call-card:57 · plan-card:77' },
  { fg: '--axis-text-warning', bg: '--axis-surface-default', min: TEXT, kind: 'icon', where: 'approval-card:38' },
  { fg: '--axis-status-running', bg: '--axis-surface-default', min: TEXT, kind: 'icon', where: 'plan-card:66 · tool-call-card:40' },
  { fg: '--axis-status-info', bg: '--axis-surface-default', min: TEXT, kind: 'icon', where: 'approval-card:33' },
  { fg: '--axis-text-tertiary', bg: '--axis-surface-default', min: TEXT, kind: 'icon', where: 'plan-card:61 · 82 · tool-call-card:32' },
  // 상태를 글자로 쓰는 곳: 상태 색 대신 text-* (WI-0062 D1 (가), ontology 는 두 변수 값이 같아 출력 불변)
  { fg: '--axis-text-error', bg: '--axis-surface-default', min: TEXT, where: 'token-usage-indicator:40 (한도 초과 글자)' },
  { fg: '--axis-text-warning', bg: '--axis-surface-default', min: TEXT, where: 'token-usage-indicator:41 (경고 글자)' },
  // 부모 바탕이 surface-default 가 아닌 곳 (리뷰 f2: 이전에는 surface-default 로 가정해 여유를 크게 셌다)
  // DiffViewer 헤더 +N / -N: 헤더 div 가 surface-secondary. WI-0062 에서 diff-added · diff-removed 대신 글자 토큰
  // (ontology 는 diff-added = text-secondary, diff-removed = text-error 값이라 출력 불변)
  { fg: '--axis-text-secondary', bg: '--axis-surface-secondary', min: TEXT, where: 'diff-viewer:125 (헤더 :115)', parent: { at: 'diff-viewer/index.tsx:115', fgAt: 'diff-viewer/index.tsx:125' } },
  { fg: '--axis-text-error', bg: '--axis-surface-secondary', min: TEXT, where: 'diff-viewer:129 (헤더 :115)', parent: { at: 'diff-viewer/index.tsx:115', fgAt: 'diff-viewer/index.tsx:129' } },
  // RecoveryBanner 아이콘: 배너 루트가 surface-error. 아이콘이지만 이전 행과 같이 글자 기준(4.5)으로 둔다
  { fg: '--axis-text-error', bg: '--axis-surface-error', min: TEXT, kind: 'icon', where: 'recovery-banner:42 (루트 :34)', parent: { at: 'recovery-banner/index.tsx:34', fgAt: 'recovery-banner/index.tsx:42' } },
  // CodeBlock 복사 완료 아이콘: 헤더(surface-secondary) 안 버튼, hover 때는 버튼이 surface-tertiary
  { fg: '--axis-text-success', bg: '--axis-surface-secondary', min: TEXT, kind: 'icon', where: 'code-block:77 (헤더 :57)', parent: { at: 'code-block/index.tsx:57', fgAt: 'code-block/index.tsx:77' } },
  { fg: '--axis-text-success', bg: '--axis-surface-tertiary', min: TEXT, kind: 'icon', where: 'code-block:77 hover (버튼 :73)', parent: { at: 'code-block/index.tsx:73', fgAt: 'code-block/index.tsx:77', variant: 'hover:' } },
  // ToolCallCard 상태 아이콘: 평소는 카드 루트(surface-default, :90), hover 때는 헤더 버튼이 surface-secondary(:100)
  { fg: '--axis-text-tertiary', bg: '--axis-surface-secondary', min: TEXT, kind: 'icon', where: 'tool-call-card:32 hover (버튼 :100)', parent: { at: 'tool-call-card/index.tsx:100', fgAt: 'tool-call-card/index.tsx:32', variant: 'hover:' } },
  { fg: '--axis-status-running', bg: '--axis-surface-secondary', min: TEXT, kind: 'icon', where: 'tool-call-card:40 hover (버튼 :100)', parent: { at: 'tool-call-card/index.tsx:100', fgAt: 'tool-call-card/index.tsx:40', variant: 'hover:' } },
  { fg: '--axis-text-success', bg: '--axis-surface-secondary', min: TEXT, kind: 'icon', where: 'tool-call-card:49 hover (버튼 :100)', parent: { at: 'tool-call-card/index.tsx:100', fgAt: 'tool-call-card/index.tsx:49', variant: 'hover:' } },
  { fg: '--axis-text-error', bg: '--axis-surface-secondary', min: TEXT, kind: 'icon', where: 'tool-call-card:57 hover (버튼 :100)', parent: { at: 'tool-call-card/index.tsx:100', fgAt: 'tool-call-card/index.tsx:57', variant: 'hover:' } },
  // 옅은 바탕(color-mix 10%) 위 글자
  { fg: '--axis-diff-added-text', bg: { mix: '--axis-diff-added', pct: 10 }, min: TEXT, where: 'diff-viewer:71 · 77' },
  { fg: '--axis-diff-removed-text', bg: { mix: '--axis-diff-removed', pct: 10 }, min: TEXT, where: 'diff-viewer:72 · 78' },
  { fg: '--axis-text-success', bg: { mix: '--axis-status-success', pct: 10 }, min: TEXT, sameString: true, kind: 'icon', where: 'feedback-buttons:62' },
  { fg: '--axis-text-error', bg: { mix: '--axis-status-error', pct: 10 }, min: TEXT, sameString: true, kind: 'icon', where: 'feedback-buttons:78' },
  // PlanCard 거절 버튼 글자: 하단 영역(surface-secondary) 위, 전용 component 토큰(WI-0029, 기본 라이트 red.700 · 다크 status-error)
  { fg: '--axis-plan-card-reject-text', bg: '--axis-surface-secondary', min: TEXT, where: 'plan-card:195 (하단 영역 :175)', parent: { at: 'plan-card/index.tsx:175', fgAt: 'plan-card/index.tsx:195' } },
  // PlanCard 거절 버튼 hover: 하단 영역(surface-secondary) 위 옅은 바탕, 글자는 전용 component 토큰(WI-0029 기본 라이트 red.700 · 다크 red.400)
  { fg: '--axis-plan-card-reject-hover-text', bg: { mix: '--axis-status-error', pct: 10, over: '--axis-surface-secondary' }, min: TEXT, sameString: true, where: 'plan-card:195 hover (하단 영역 :175)', parent: { at: 'plan-card/index.tsx:175', fgAt: 'plan-card/index.tsx:195' } },
  // 보조 글자 (WI-0062). 기본 라이트 text-tertiary 는 surface-secondary 4.39 · surface-tertiary 3.90 · diff 옅은 바탕 4.23 이라
  // 그 바탕 위 보조 글자는 text-secondary 로 바꿨다(ontology 는 secondary = tertiary 값이라 출력 불변)
  { fg: '--axis-text-tertiary', bg: '--axis-surface-default', min: TEXT, where: 'textarea:14 · command:50 placeholder · 보조 글자 전반' },
  { fg: '--axis-text-secondary', bg: '--axis-surface-secondary', min: TEXT, where: 'context-panel:66 (루트 :124)', parent: { at: 'context-panel/index.tsx:124', fgAt: 'context-panel/index.tsx:66' } },
  { fg: '--axis-text-secondary', bg: '--axis-surface-secondary', min: TEXT, where: 'tool-call-card:115 hover (버튼 :100)', parent: { at: 'tool-call-card/index.tsx:100', fgAt: 'tool-call-card/index.tsx:115', variant: 'hover:' } },
  { fg: '--axis-text-secondary', bg: '--axis-surface-tertiary', min: TEXT, where: 'code-block:65 언어 배지', parent: { at: 'code-block/index.tsx:65', fgAt: 'code-block/index.tsx:65' } },
  { fg: '--axis-text-secondary', bg: '--axis-surface-tertiary', min: TEXT, where: 'context-panel:69 버전 배지', parent: { at: 'context-panel/index.tsx:69', fgAt: 'context-panel/index.tsx:69' } },
  { fg: '--axis-text-secondary', bg: '--axis-surface-tertiary', min: TEXT, where: 'diff-viewer:142 · 154 보기 탭 (탭 묶음 :134)', parent: { at: 'diff-viewer/index.tsx:134', fgAt: 'diff-viewer/index.tsx:142' } },
  { fg: '--axis-text-secondary', bg: { mix: '--axis-diff-added', pct: 10 }, min: TEXT, where: 'diff-viewer:180 · 183 · 225 · 235 줄 번호' },
  { fg: '--axis-text-secondary', bg: { mix: '--axis-diff-removed', pct: 10 }, min: TEXT, where: 'diff-viewer:180 · 183 · 225 · 235 줄 번호' },
  // 상태 알림 글자 (ui-react Toast · Alert, 불투명 글자. WI-0062 에서 Toast 설명 opacity-90 을 뺐다)
  { fg: '--axis-text-success', bg: '--axis-surface-success', min: TEXT, where: 'ui-react toast:33 · alert:17' },
  { fg: '--axis-text-warning', bg: '--axis-surface-warning', min: TEXT, where: 'ui-react toast:37 · alert:19' },
  { fg: '--axis-text-error', bg: '--axis-surface-error', min: TEXT, where: 'ui-react toast:35 · alert:21' },
  { fg: '--axis-text-info', bg: '--axis-surface-info', min: TEXT, where: 'ui-react alert:15' },
  // 비활성 버튼 글자 (WCAG 예외지만 D2 에 따라 sub-aa 로 통과시킨다)
  { fg: '--axis-button-text-disabled', bg: '--axis-button-bg-disabled', min: TEXT, where: '소비처 없음' },
  // 비텍스트 (테두리 · 아이콘)
  { fg: '--axis-border-warning', bg: '--axis-surface-warning', min: NON_TEXT, where: 'alert:19' },
  { fg: '--axis-border-info', bg: '--axis-surface-info', min: NON_TEXT, where: 'alert:15' },
  // WI-0063: 오류 테두리는 status-error-border(기본 red.200, 1.44 · 1.32) 대신 border-error(ontology 는 두 값이 같음)
  { fg: '--axis-border-error', bg: '--axis-surface-default', min: NON_TEXT, where: 'attachment-card:86' },
  // RecoveryBanner 테두리: 같은 요소의 바탕 surface-error 와 맞닿는다(바깥 쪽 바탕은 소비처마다 달라 표에 두지 않는다)
  { fg: '--axis-border-error', bg: '--axis-surface-error', min: NON_TEXT, where: 'recovery-banner:34', parent: { at: 'recovery-banner/index.tsx:34', fgAt: 'recovery-banner/index.tsx:34' } },
  { fg: '--axis-icon-info', bg: '--axis-surface-default', min: NON_TEXT, where: '소비처 없음' },
  // 상태 점 (WI-0063, 비텍스트 3:1). 대기 · 건너뜀 점 neutral-muted 는 사용자 결정으로 값 유지라 표에 두지 않는다(brand-nontext-contrast NEUTRAL_MUTED_FLOOR)
  { fg: '--axis-text-success', bg: '--axis-surface-default', min: NON_TEXT, where: 'agent-avatar:28 온라인 점 · run-progress:32 · step-timeline:107 완료 점' },
  { fg: '--axis-text-success', bg: '--axis-surface-secondary', min: NON_TEXT, where: 'run-progress:32 완료 점, 현재 단계 행(:122)', parent: { at: 'run-progress/index.tsx:122', fgAt: 'run-progress/index.tsx:32' } },
  { fg: '--axis-text-warning', bg: '--axis-surface-default', min: NON_TEXT, where: 'agent-avatar:29 바쁨 점' },
  { fg: '--axis-text-tertiary', bg: '--axis-surface-default', min: NON_TEXT, where: 'agent-avatar:30 오프라인 점' },
  { fg: '--axis-status-running', bg: '--axis-surface-default', min: NON_TEXT, where: 'run-progress:31 · step-timeline:108 진행 점' },
  { fg: '--axis-status-running', bg: '--axis-surface-secondary', min: NON_TEXT, where: 'run-progress:31 진행 점, 현재 단계 행(:122)', parent: { at: 'run-progress/index.tsx:122', fgAt: 'run-progress/index.tsx:31' } },
  { fg: '--axis-status-error', bg: '--axis-surface-default', min: NON_TEXT, where: 'run-progress:33 · step-timeline:109 오류 점' },
  { fg: '--axis-status-error-contrast', bg: '--axis-status-error', min: NON_TEXT, kind: 'icon', where: 'run-progress:33 오류 글리프' },
  // 포커스 링 (WI-0063). button-border-focus 는 blue.400(흰 바탕 2.54) → blue.500
  { fg: '--axis-border-focus', bg: '--axis-surface-default', min: NON_TEXT, where: 'ui-react checkbox · radio · switch · slider · textarea 포커스 링' },
  { fg: '--axis-input-border-focus', bg: '--axis-input-bg-default', min: NON_TEXT, where: 'ui-react input · select 포커스 링' },
  { fg: '--axis-button-border-focus', bg: '--axis-surface-default', min: NON_TEXT, where: 'ui-react button 포커스 링' },
  // 켜진 컨트롤 (Switch 켜짐 · Checkbox 체크 · Slider 썸 테두리)
  { fg: '--axis-interactive-primary', bg: '--axis-surface-default', min: NON_TEXT, where: 'ui-react switch:15 · checkbox:20 · slider:34' },
  // WI-0079: 기본 브랜드 전용 표(default-contrast DEFAULT_ONLY)에 있던 폼 컨트롤 · Progress · placeholder 짝을 두 브랜드 공용으로 옮겼다.
  // ontology 값을 고쳐(경계 · 트랙 sub/muted, Progress success · warning · destructive = ink-2 · bad · bad-dark, placeholder sub-aa/sub)
  // 이제 ontology 도 통과한다. 경계 · 트랙은 컨트롤이 놓이는 바탕 세 가지(card = surface-default, panel = surface-secondary,
  // 페이지 바탕 = shadcn --background, bgShadcn)를 모두 본다. card 만 보면 여유가 적은 바탕(panel)이 가려진다.
  // '#FFFFFF' 처럼 hex 로 적은 쪽은 토큰이 아닌 고정 색이다(Switch 썸 bg-white).
  { fg: '--axis-input-text-placeholder', bg: '--axis-input-bg-default', min: TEXT, where: 'ui-react input:24 · select:26 placeholder' },
  { fg: '--axis-form-control-border', bg: '--axis-surface-default', min: NON_TEXT, where: 'ui-react checkbox:16 · radio-group:26 · textarea:11 경계 / card' },
  { fg: '--axis-form-control-border', bg: '--axis-surface-secondary', min: NON_TEXT, where: '같은 경계 / panel' },
  { fg: '--axis-form-control-border', bg: '--background', bgShadcn: true, min: NON_TEXT, where: '같은 경계 / 페이지 바탕' },
  { fg: '--axis-form-control-track', bg: '--axis-surface-default', min: NON_TEXT, where: 'ui-react switch:16 꺼짐 트랙 · slider:27 트랙 / card' },
  { fg: '--axis-form-control-track', bg: '--axis-surface-secondary', min: NON_TEXT, where: '같은 트랙 / panel' },
  { fg: '--axis-form-control-track', bg: '--background', bgShadcn: true, min: NON_TEXT, where: '같은 트랙 / 페이지 바탕' },
  { fg: '#FFFFFF', bg: '--axis-form-control-track', min: NON_TEXT, where: 'ui-react switch 썸(bg-white) / 꺼짐 트랙' },
  { fg: '#FFFFFF', bg: '--axis-interactive-primary', min: NON_TEXT, where: 'ui-react switch 썸(bg-white) / 켜짐 트랙' },
  { fg: '--axis-progress-fill-default', bg: '--axis-surface-tertiary', min: NON_TEXT, where: 'ui-react progress:26 채움 / 트랙' },
  { fg: '--axis-progress-fill-success', bg: '--axis-surface-tertiary', min: NON_TEXT, where: 'ui-react progress:27' },
  { fg: '--axis-progress-fill-warning', bg: '--axis-surface-tertiary', min: NON_TEXT, where: 'ui-react progress:28 (ontology 는 원시색 노랑, 라이트 4.16 · 다크 7.12)' },
  { fg: '--axis-progress-fill-destructive', bg: '--axis-surface-tertiary', min: NON_TEXT, where: 'ui-react progress:29' },
];
