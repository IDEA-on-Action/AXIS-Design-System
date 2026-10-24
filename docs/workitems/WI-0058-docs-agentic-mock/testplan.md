# WI-0058 테스트 계획 · 결과

> PRD: [prd.md](./prd.md) | 실행일: 2026-10-24 | 기준: main 59dd6a3 + 이 브랜치 변경(미커밋 작업본에서 측정). 측정 뒤 approval-dialog · surface-renderer 두 파일에 prettier 서식만 적용했고, 그 뒤 tsc rc 0 · lint 0 을 다시 확인했어요(빌드 · axe 는 다시 돌리지 않았어요)
> 표기: **측정** = 이번에 실행해 얻은 값, **브리프** = 배치 2 브리프 scratch 측정(18fac64, 이 WI 범위 코드와 0줄 차이), **추정** = 확인하지 않은 해석

## 1. 정적 검사 · 빌드

| 게이트 | 결과 (측정) |
|---|---|
| 패키지 빌드 `turbo run build --force --filter ./packages/*` | 6 tasks 성공, Cached 0/6 |
| `apps/web` `tsc --noEmit` | rc 0, 출력 0줄. 양성 대조: `agentic/__probe.ts` 에 타입 오류 1줄을 넣으면 TS2322 1건 검출, 지운 뒤 파일 0개 확인 |
| `pnpm --filter @ax/web lint` | 오류 · 경고 0. 단 이 설정은 미사용 import 를 잡지 않아서(교체 직후 미사용 5건이 있었는데도 0), 미사용 import 는 grep 으로 따로 찾아 지웠어요(agent-avatar `Image`, context-panel · source-panel `useState` · `Button`) |
| `pnpm --filter @ax/web build` | rc 0, `out/agentic/` 18페이지 생성, pagefind 49페이지. 빌드가 바꾼 `public/templates/*.json` 5개(updatedAt · index 포맷)는 이 변경과 무관해 되돌렸어요 |
| cli `axis-collector.test.ts` · `axis-refresh.test.ts` (AC6) | 17/17 통과. approval-dialog 라우트 실재 확인 포함 |
| `pnpm check-library-links` | 사이트 링크 48 · 항목 129, 위반 0 |

## 2. AC1 mock 제거 (측정)

| 대상 | `@axis-ds/agentic-ui` import 페이지 | mock 정의(`// Mock` 또는 `const <대문자> = (`) 페이지 |
|---|---|---|
| 이 브랜치 | 18/18 | 0 |
| 음성 대조: HEAD(59dd6a3) 를 `git archive` 로 꺼낸 같은 파일 | 0/18 | 17 (surface-renderer 는 mock 없이 모조 HTML 이라 패턴에 안 걸림, 예상과 같음) |

## 3. AC3 기존 a11y 게이트 (측정)

`CI=1 E2E_SERVER=static playwright test e2e/a11y.spec.ts` (포트 3101, 다른 서버 재사용 없음): **40 passed (4.5m), rc 0**, 재시도 표시 없음. PAGES 의 PlanCard · ToolCallCard 는 이제 실컴포넌트를 렌더해요. PAGES 는 바꾸지 않았어요(D4).

## 4. AC4 · AC5 교체 뒤 18페이지 측정 (측정)

- 방법: 측정 전용 임시 spec(브리프 `measure.spec.ts` 에 ontology 축과 `메시지 추가` 데모 버튼을 더함, 커밋하지 않음)을 고유 포트(3158) 정적 서버로 실행. axe `wcag2a · wcag2aa · wcag21a · wcag21aa`, 상태는 초기(i) · `aria-expanded` 펼침(e) · 데모 버튼 실행 6초 뒤(a)
- 실행: 18페이지 × 브랜드 2 × 테마 2 = 72 tests 통과, 기록 104행(펼침 · 데모 상태 포함)
- 미측정이 아님: 104행 모두 passes ≥ 24. 브랜드 양성 대조로 default 52행은 `data-brand` 없음 · `--axis-button-bg-default` rgb(37,99,235), ontology 52행은 `data-brand="ontology"` · rgb(50,106,218)(라이트) / rgb(107,152,240)(다크)
- 콘솔 · 페이지 오류: **104행 모두 0건**. 오류 수집의 양성 대조: 같은 spec 으로 없는 경로 `/agentic/__wi0058_nope__/` 를 열면 404 리소스 오류 1건이 기록돼요. #418 음성 대조(브리프): 수정 전 같은 수집 코드로 message-bubble · step-timeline 초기 상태 라이트 · 다크 4행 모두 `Minified React error #418`

### 4.1 위반 노드 수 (i 초기 · e 펼침 · a 데모 뒤)

| 페이지 | default 라이트 | default 다크 | ontology 라이트 | ontology 다크 |
|---|---|---|---|---|
| agent-avatar | i0 | i0 | i0 | i0 |
| approval-dialog (ApprovalCard) | i0 | i0 | i0 | i0 |
| attachment-card | i0 | i0 | i0 | i0 |
| code-block | i3 | i1 | i1 | i1 |
| context-panel | i3 e5 | i0 e0 | i0 e1 | i0 e0 |
| diff-viewer | i35 | i7 | i0 | i0 |
| feedback-buttons | i0 | i0 | i0 | i0 |
| message-bubble | i2 a3 | i2 a3 | i2 a3 | i2 a3 |
| plan-card | i0 a0 | i0 a0 | i0 a0 | i0 a0 |
| recovery-banner | i0 | i0 | i0 | i0 |
| run-progress | i0 a0 | i0 a0 | i0 a0 | i0 a0 |
| source-panel | i0 e0 | i0 e0 | i0 e0 | i0 e0 |
| step-timeline | i0 | i0 | i0 | i0 |
| streaming-text | i0 a0 | i0 a0 | i0 a0 | i0 a0 |
| surface-renderer | i0 | i0 | i0 | i0 |
| thinking-indicator | i0 | i0 | i0 | i0 |
| token-usage-indicator | i2 | i0 | i0 | i0 |
| tool-call-card | i0 e0 a0 | i0 e0 a0 | i0 e0 a0 | i0 e0 a0 |

- 브리프 기본 브랜드 수치와 같은 곳: code-block 라이트 3 · 다크 1, diff-viewer 35 · 7, context-panel 라이트 3 · 펼침 5, message-bubble 초기 2
- 이 WI 의 페이지 수정으로 줄어든 것: token-usage-indicator 라벨 위반 1 → 0(라이트 · 다크, 브리프 대비). 라이트 3 → 2 의 차이가 이 1건이에요
- surface-renderer · approval-dialog 는 이번에 처음 실컴포넌트로 잰 값이에요(브리프는 모조 HTML · mock). surface-renderer 의 `text` 는 `prose` 클래스를 쓰는데 `apps/web` 에 typography 플러그인이 없어 효과가 없어요(코드 확인). WI-0046 D4(prose → text-sm) 머지 뒤 다시 재야 해요
- ontology 에서 diff-viewer 가 0 인 이유는 확인하지 않았어요(브랜드가 diff 색 토큰을 덮는다는 것은 추정)

### 4.2 드러난 위반 분류 (컴포넌트 결함, 이 WI 에서 고치지 않음)

노드 상세는 위반 종류마다 앞 8개만 기록했어요(diff-viewer 35노드는 일부만 상세가 있어요). 대비값은 axe 가 보고한 값이에요.

| 컴포넌트 | 위반 (측정) | 어디서 | 분류 |
|---|---|---|---|
| CodeBlock | 언어 배지 #6b7280/#e5e7eb 3.9 | default 라이트 | WI-0062(#170) 목록에 있음(CodeBlock 배지 3.90) |
| CodeBlock | `overflow-auto` 스크롤 영역 scrollable-region-focusable | 4조합 모두 | WI-0069(#183) 목록에 있음 |
| ContextPanel | 모델 배지 #6b7280/#e5e7eb 3.9 | default 라이트(초기 · 펼침) | WI-0062(#170) 목록에 있음(ContextPanel 배지) |
| ContextPanel | provider 글자(text-tertiary) #6b7280/#f3f4f6 4.39 | default 라이트(초기 · 펼침) | **WI-0062(#170) 목록 밖 새 쌍** |
| ContextPanel | 펼침 시 "컨텍스트" 라벨(text-secondary) #6d7580/#f3f4f6 4.23 | default 라이트 펼침 | **WI-0062(#170) 목록 밖 새 쌍** |
| ContextPanel | 같은 라벨 #7d828d/#f3f4f6 3.5 | ontology 라이트 펼침 | **WI-0062(#170) 목록 밖 새 쌍(ontology 브랜드, 이번에 처음 잼)** |
| DiffViewer | 카운트 +13 #22c55e/#f3f4f6 2.07, -5 #ef4444/#f3f4f6 3.41, 보기 탭 #6b7280/#e5e7eb 3.9, 추가 행 #16a34a/#e9f9ef 3.02, 삭제 행 #dc2626/#fdecec 4.22 | default 라이트 | WI-0062(#170) 목록에 있음(DiffViewer 줄 · 카운트 라이트 2.07~4.24, 보기 탭 3.90) |
| DiffViewer | 삭제 행 #dc2626/#1b0d17 3.89 | default 다크 | WI-0062(#170) 목록에 있음(다크 삭제 행 3.89) |
| MessageBubble | 상태 아이콘 span 의 aria-label(role 없음) aria-prohibited-attr, 초기 2 · 데모 뒤 3 | 4조합 모두 | WI-0069(#183) 목록에 있음 |
| TokenUsageIndicator | warning 글자 #eab308/#ffffff 1.91 | default 라이트 | WI-0062(#170) 목록에 있음(warning 1.92, 계산값과 측정값 차이) |

판정 보류(axe incomplete, 위반 0 이 무결이라는 뜻은 아님):

| 페이지 | incomplete (측정) | 분류 |
|---|---|---|
| agent-avatar | color-contrast 9 (default 라이트 · 다크) | WI-0062 목록에 있음(AgentAvatar 이니셜) |
| run-progress | color-contrast 1~4 (default · ontology 다크, default 라이트) | WI-0062 목록에 있음(RunProgress pending) |
| diff-viewer | aria-prohibited-attr 6 (4조합), color-contrast 19 (default 라이트) | aria 는 WI-0069 목록에 있음, 대비는 WI-0062 |
| recovery-banner | aria-valid-attr-value 1 (4조합) | WI-0069 목록에 있음(aria-describedby 추정) |
| context-panel | color-contrast 1 (펼침, 4조합) | 대상 노드를 기록하지 않아 미분류 |
| approval-dialog | color-contrast 1 (default · ontology 다크) | 대상 노드를 기록하지 않아 미분류 |
| streaming-text | color-contrast 17 (데모 뒤, 4조합) | 애니메이션 중 판정 보류로 추정, 미분류 |

### 4.3 측정하지 않은 것

- hover · focus 상태(WI-0062 의 ToolCallCard 헤더 hover 등). 정적 axe 라 재지 않았어요
- 시각 · 동작 차이 사람 확인(예: StreamingText 커서는 mock 이 `!isComplete` 일 때, 실컴포넌트는 스트리밍 중일 때만 보여요. 데모가 부모에서 30ms 마다 text 를 늘리고 컴포넌트도 20ms 로 스스로 스트리밍해요)
- 프로덕션 pages.dev 측정(배포 전)
- `/components` mock 페이지(WI-0066 · WI-0046 범위)
