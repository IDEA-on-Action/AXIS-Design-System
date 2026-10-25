---
"@axis-ds/tokens": minor
"@axis-ds/ui-react": minor
"@axis-ds/agentic-ui": minor
"@axis-ds/cli": patch
"@axis-ds/mcp": patch
---

배치 4 접근성 묶음(WI-0062 · WI-0063 · WI-0069 · WI-0073)의 업그레이드 안내예요. 문서 사이트 59경로 x 기본 · ontology x 라이트 · 다크(236회) axe 검사에서 위반 0, 판정 보류(incomplete) 중 4.5 미만 대비 0 을 확인했어요. **ontology 브랜드의 기존 토큰 값은 바뀌지 않아요.**

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
