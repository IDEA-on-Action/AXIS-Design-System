/**
 * ontology 접기 값 검산 표 (WI-0025 M3, D-6 · U15 · U16 · plan 5.3)
 *
 * test/ontology-values.test.mjs 와 루트 scripts/check-contrast-pairs.mjs 가 함께 import 한다.
 * - V1_PALETTE: 디자인 시스템 v1 팔레트(초안 2 주석의 원본 토큰 이름). 브랜드 hex 값은 이 안에서만 고른다.
 * - CONTRAST_PAIRS: 글자 · 비텍스트가 실제로 놓이는 바탕 짝과 최소 대비. 짝이 바뀌면 이 표를 먼저 고친다.
 *   bg 가 { mix, pct } 이면 `color-mix(in srgb, var(mix) pct%, transparent)` 를 surface-default 위에 깐 색이다.
 *   { mix, pct, over } 이면 surface-default 대신 over(부모 바탕 변수) 위에 깐다. 부모 바탕은 소스 한 문자열에서
 *   뽑을 수 없으므로 check-contrast-pairs 의 짝 키에는 over 가 들어가지 않는다(over 는 손으로 확인해 적는다).
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
  { fg: '--axis-status-success-contrast', bg: '--axis-status-success', min: TEXT, sameString: true, where: 'run-progress:32 · plan-card:179' },
  { fg: '--axis-status-success-contrast', bg: '--axis-status-success-strong', min: TEXT, sameString: true, where: 'plan-card:179 hover' },
  { fg: '--axis-status-success-contrast', bg: '--axis-status-success', min: NON_TEXT, where: 'step-timeline:68 · 76 (점 위 아이콘)' },
  { fg: '--axis-status-running-contrast', bg: '--axis-status-running', min: TEXT, sameString: true, where: 'run-progress:31' },
  { fg: '--axis-status-error-contrast', bg: '--axis-status-error', min: TEXT, sameString: true, where: 'run-progress:33' },
  { fg: '--axis-status-neutral-muted-contrast', bg: '--axis-status-neutral-muted', min: TEXT, sameString: true, where: 'run-progress:30' },
  { fg: '--axis-agent-message-user-text', bg: '--axis-agent-message-user-bg', min: TEXT, sameString: true, where: 'message-bubble:30' },
  { fg: '--axis-agent-avatar-text', bg: '--axis-agent-avatar-tool', min: TEXT, where: 'agent-avatar:35 · 80' },
  { fg: '--axis-agent-avatar-text', bg: '--axis-agent-avatar-assistant', min: TEXT, where: 'agent-avatar:34 · 80' },
  { fg: '--axis-agent-avatar-text', bg: '--axis-agent-avatar-system', min: TEXT, where: 'agent-avatar:36 · 80' },
  { fg: '--axis-status-neutral-strong', bg: '--axis-status-neutral-bg', min: TEXT, sameString: true, where: 'plan-card:35 배지' },
  // 상태 색을 글자로 쓰는 곳 (surface-default 위)
  { fg: '--axis-status-success', bg: '--axis-surface-default', min: TEXT, where: 'code-block:77 · tool-call-card:49 · plan-card:72' },
  { fg: '--axis-status-error', bg: '--axis-surface-default', min: TEXT, where: 'approval-card:43 · recovery-banner:42 · token-usage-indicator:40' },
  { fg: '--axis-status-warning', bg: '--axis-surface-default', min: TEXT, where: 'token-usage-indicator:41 · approval-card:38' },
  { fg: '--axis-status-running', bg: '--axis-surface-default', min: TEXT, where: 'plan-card:66 · tool-call-card:40' },
  { fg: '--axis-status-info', bg: '--axis-surface-default', min: TEXT, where: 'approval-card:33' },
  { fg: '--axis-status-neutral', bg: '--axis-surface-default', min: TEXT, where: 'plan-card:61 · tool-call-card:32' },
  { fg: '--axis-diff-added', bg: '--axis-surface-default', min: TEXT, where: 'diff-viewer:123' },
  { fg: '--axis-diff-removed', bg: '--axis-surface-default', min: TEXT, where: 'diff-viewer:126' },
  // 옅은 바탕(color-mix 10%) 위 글자
  { fg: '--axis-diff-added-text', bg: { mix: '--axis-diff-added', pct: 10 }, min: TEXT, where: 'diff-viewer:71 · 77' },
  { fg: '--axis-diff-removed-text', bg: { mix: '--axis-diff-removed', pct: 10 }, min: TEXT, where: 'diff-viewer:72 · 78' },
  { fg: '--axis-status-success', bg: { mix: '--axis-status-success', pct: 10 }, min: TEXT, sameString: true, where: 'feedback-buttons:62' },
  { fg: '--axis-status-error', bg: { mix: '--axis-status-error', pct: 10 }, min: TEXT, sameString: true, where: 'feedback-buttons:78' },
  // PlanCard 거절 버튼 hover: 하단 영역(surface-secondary) 위 옅은 바탕, 글자는 전용 component 토큰(기본값 status-error)
  { fg: '--axis-plan-card-reject-hover-text', bg: { mix: '--axis-status-error', pct: 10, over: '--axis-surface-secondary' }, min: TEXT, sameString: true, where: 'plan-card:195 hover' },
  // 비활성 버튼 글자 (WCAG 예외지만 D2 에 따라 sub-aa 로 통과시킨다)
  { fg: '--axis-button-text-disabled', bg: '--axis-button-bg-disabled', min: TEXT, where: '소비처 없음' },
  // 비텍스트 (테두리 · 아이콘)
  { fg: '--axis-border-warning', bg: '--axis-surface-warning', min: NON_TEXT, where: 'alert:19' },
  { fg: '--axis-border-info', bg: '--axis-surface-info', min: NON_TEXT, where: 'alert:15' },
  { fg: '--axis-status-error-border', bg: '--axis-surface-default', min: NON_TEXT, where: 'recovery-banner:34 · attachment-card:86' },
  { fg: '--axis-icon-info', bg: '--axis-surface-default', min: NON_TEXT, where: '소비처 없음' },
];
