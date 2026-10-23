# WI-0052 릴리스 노트: StreamingText 표시 결함 수정

> 작성일: 2026-10-23 | WI: WI-0052 | GitHub: #146 | changeset: `@axis-ds/agentic-ui` patch

## 변경 사항

- **표시 결함**: 「스트리밍 완료 문장」이 「트리밍 완료 문장undefined」로 보이던 문제를 고쳤어요. 원인은 함수형 상태 갱신이 나중에 실행되는 동안 interval 의 지역 인덱스가 먼저 증가해 한 칸 뒤 글자를 읽은 것이에요
- **StrictMode**: effect 를 다시 실행하면 interval 이 사라져 아무 글자도 안 보이던 문제를 고쳤어요(Next.js 개발 서버 기본값이 StrictMode 켬)
- **구조**: 상태는 「보여 줄 글자 수」 하나이고, 화면 문자열은 `text` 에서 잘라 만들어요. effect 가 정리 후 다시 실행돼도 그 위치에서 이어 가요
- **text 변경(D2 · D3)**: 이어 붙이면 지금 위치에서 계속 흘리고, 통째 바뀌면 처음부터 다시 흘려요(종전에는 남은 글자가 버려지거나 빈 화면)
- **onComplete(D1)**: 화면이 text 끝까지 따라잡을 때마다 1회 불러요. `isComplete=true` 로 즉시 표시할 때는 부르지 않아요. ref 로 읽어서, 부모가 매 렌더 새 함수를 넘겨도 진행이 멈추지 않아요
- **글자 단위(D4)**: 코드 포인트 단위로 흘려 이모지가 반쪽으로 보이지 않아요
- **레지스트리**: `apps/web/public/r/agentic-streaming-text.json` 재생성(`index.json` · `registry.json` 의 sha256 갱신)
- **테스트**: `streaming-text.test.tsx` 18건(StrictMode 끔 · 켬 × 9 시나리오)

props 이름 · 타입 · 기본값은 바뀌지 않았어요.

## 알려진 한계

- 문서 사이트 `/agentic/streaming-text` 는 실제 컴포넌트가 아니라 페이지 안의 mock 을 써서, 사이트에서는 이 컴포넌트의 동작을 볼 수 없어요(D5, 별도 WI)
- `apps/web/public/library/components/streaming-text.json` · `categories/agentic.json` 에는 수정 전 소스 사본이 남아 있어요(D6, WI-0057 에서 재생성)
- 패키지 테스트는 React 18 로 돌아요. React 19 는 이번에 일회 실측만 했어요(testplan 2절)
