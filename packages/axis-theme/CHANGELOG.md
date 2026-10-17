# @axis-ds/theme

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
