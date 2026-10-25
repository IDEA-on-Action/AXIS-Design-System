# WI-0069 릴리스 노트: agentic-ui · ui-react 비대비 접근성 결함

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | GitHub: #183 | 대상: `@axis-ds/ui-react` · `@axis-ds/agentic-ui` minor, `@axis-ds/cli` · `@axis-ds/mcp` patch(배치 4 ② 묶음, linked 1.8.0 · cli 1.6.2 · mcp 1.3.5 로 2026-10-25 발행(PR #207 머지 f3dae65 · Release PR #205 머지 e6d743c, publish run 40179615916, provenance 6/6))

## 바뀐 점

| 컴포넌트 | 1.7.0 | 이번 변경 뒤 |
|---|---|---|
| MessageBubble 전송 상태 아이콘 | 역할 없는 span 의 aria-label(보조기술이 읽지 않을 수 있음) | `role="img"` + aria-label(전송 중 · 전송됨 · 전송 실패) |
| MessageBubble · StepTimeline 시각 | 서버와 브라우저 시간대가 다르면 하이드레이션 오류(React #418) | 하이드레이션 뒤 브라우저 시간대로 채움. `locale` · `timeZone` · `formatTime` prop 추가 |
| CodeBlock 코드 영역 | 스크롤되는데 키보드로 포커스할 수 없음 | Tab 으로 포커스하는 region(이름: 「<파일명> 코드」 · 「<언어> 코드」 · 「코드」) |
| DiffViewer 줄 수 `+N` · `-N` | 역할 없는 span 의 aria-label | 기호는 숨기고 「N줄 추가됨」 · 「N줄 삭제됨」을 화면 낭독 전용 문장으로 |
| RecoveryBanner 재시도 버튼 | description 이 없어도 없는 id 를 aria-describedby 로 가리킴 | description 이 있을 때만 |
| Dialog · Popover · Sheet 트리거 | 닫힌 동안에도 aria-controls(없는 id) | 열린 동안에만 aria-controls |
| CommandSeparator | listbox 안의 `role="separator"`(허용 안 되는 자식) | 역할 없는 `aria-hidden` 장식 요소 |
| ScrollArea 뷰포트 | 안에 포커스할 요소가 없으면 키보드로 스크롤 불가 | Tab 으로 포커스(tabIndex 0) 후 화살표로 스크롤 |

문서 사이트: Input 파일 입력 예제에 라벨, Slider 예제에 `aria-label` 을 더했어요(컴포넌트가 아니라 예제의 결함이었어요).

## 업그레이드

대부분 코드를 바꿀 필요가 없어요. 아래에 해당하면 확인하세요.

- **시각이 서버 HTML 에 없음**: MessageBubble 에 `timeZone` 을 주지 않으면(StepTimeline 은 `locale` 과 `timeZone` 둘 중 하나라도 없으면) 서버 렌더 HTML 의 `<time>` 이 비어 있고 하이드레이션 뒤에 채워져요. 서버 HTML 에 시각이 있어야 하면 `timeZone="Asia/Seoul"`(StepTimeline 은 `locale="ko-KR"` 도) 을 주거나 `formatTime` 을 쓰세요. `formatTime` 은 서버와 브라우저에서 같은 값을 돌려줘야 해요.
- **클라이언트 경계**: `message-bubble` · `step-timeline`(agentic-ui) 과 `dialog` · `popover` · `sheet`(ui-react) 모듈 산출물에 `"use client"` 가 붙어요. 서버 컴포넌트에서 그대로 쓸 수 있고, `formatTime` 같은 함수 prop 은 서버 컴포넌트에서 넘길 수 없어요(RSC 규칙).
- **테스트 셀렉터**: 아래를 직접 찾던 테스트는 고쳐야 해요.
  - DiffViewer `[aria-label="13줄 추가됨"]` → `getByText("13줄 추가됨")`(sr-only 문장)
  - 닫힌 Dialog · Popover · Sheet 트리거의 `aria-controls` 단언 → 연 뒤에 확인
  - MessageBubble 에 `status` 를 주면 `getByRole("img")` 가 상태 아이콘도 찾아요(이름으로 구분: `{ name: "전송됨" }`)
  - StepTimeline 시각이 `<p>` 안의 `<time dateTime>` 으로 바뀌었어요(텍스트는 같음)
- **Tab 순서**: CodeBlock 코드 영역과 ScrollArea 뷰포트가 Tab 순서에 하나씩 들어가요. 안에 이미 포커스할 요소만 있는 ScrollArea 에서 빼고 싶으면 ScrollArea 대신 직접 Radix ScrollArea 를 쓰세요(이번 버전에는 끄는 prop 이 없어요).
- **복사 설치(`axis add`)**: 레지스트리 dialog 와 agentic code-block · diff-viewer · message-bubble · recovery-banner · step-timeline 항목이 새 코드예요. 이미 복사한 파일은 바뀌지 않아요. 새 코드를 받으려면 `axis add <이름> --overwrite`(내용이 다른 기존 파일을 덮어씀)를 쓰세요. 직접 고친 부분이 있으면 먼저 백업하세요. popover · sheet · command · scroll-area 는 레지스트리에 없어요.

## 알려진 제약

- **서버 컴포넌트에서 쓰면 동작이 바뀌어요**: 1.7.0 의 `MessageBubble` · `StepTimeline` 은 서버 컴포넌트로 쓰면 서버 렌더 HTML 에 시각(서버 시간대)이 들어 있었어요. 1.8.0 에서는 `timeZone` 이 없으면(StepTimeline 은 `locale` 과 `timeZone` 둘 중 하나라도 없으면) 서버 컴포넌트에서도 SSR HTML 의 `<time>` 이 비어 있고, JS 가 돈 뒤 브라우저 시간대로 채워져요. JS 가 꺼져 있거나 늦게 도는 화면 · 크롤러에서는 시각이 보이지 않아요. `timeZone`(StepTimeline 은 `locale` 도)을 넘기면 서버가 그 시간대로 만든 시각이 SSR HTML 에 그대로 들어가고, 브라우저에서도 같은 값이라 보는 사람의 시간대로 바뀌지 않아요. 1.7.0 에서 하이드레이션 오류(React #418)가 나던 것은 클라이언트 컴포넌트로 쓸 때였고, 이 변경으로 그쪽은 0건이 됐어요(검토 실측). 문서 Props 표의 `timeZone` 설명에도 같은 안내가 있어요.
- CommandSeparator 는 cmdk 의 Separator 를 쓰지 않고 같은 동작(검색 중 숨김 · `alwaysRender`)을 따라 그려요. cmdk 가 Separator 동작을 바꾸면 다시 확인해야 해요.
- DiffViewer 본문은 긴 줄로 가로 스크롤이 생겨도 포커스를 받지 않아요(문서 예제에서는 미검출, 관찰 대상).

## 발행

- `@axis-ds/tokens` · `theme` · `ui-react` · `agentic-ui` 1.8.0, `@axis-ds/cli` 1.6.2, `@axis-ds/mcp` 1.3.5 (2026-10-25, PR #207 머지 f3dae65, Release PR #205 머지 e6d743c, publish run 40179615916, provenance 6/6 https://slsa.dev/provenance/v1)
- 발행본 재측정 불일치 0(testplan 「배포 뒤 재측정」)
