# WI-0020: axe 자동 a11y 테스트 도입 PRD

> 작성일: 2026-06-30 | 작성자: AXIS Team | 상태: Done
> 선행: WI-0019(문서 Accessibility 섹션). 본 WI는 컴포넌트 a11y의 자동 회귀 방지.

---

## 1. 개요

### 1.1 배경
WI-0019로 문서에 a11y를 명시했으나, 컴포넌트 a11y가 회귀해도 자동으로 잡히지 않는다. axe-core 기반 자동 검사를 도입해 회귀를 방지한다.

### 1.2 목표
- vitest + jest-axe로 컴포넌트 렌더 결과를 axe-core로 검사
- ui-react / agentic-ui 주요 컴포넌트에 a11y 테스트 추가
- a11y 위반 발견 시 컴포넌트 수정

### 1.3 범위
- 포함: jest-axe 인프라(setup + 헬퍼), ui-react/agentic-ui a11y 테스트, 발견된 위반 수정
- 제외(Non-goals): E2E(Playwright) a11y, 색상 대비(jsdom 미지원 → 비활성), 문서 페이지 axe

---

## 2. 접근

- **jest-axe** + vitest `expect.extend(toHaveNoViolations)` (안정적, vitest 호환)
- `axeCheck(ui)` 헬퍼: 렌더 + axe 실행, `color-contrast` 비활성(jsdom 한계)
- jsdom 폴리필: ResizeObserver(Radix Slider 등)
- 컴포넌트별 **접근성상 유효한 최소 구성**으로 렌더 (Radix 커스텀 컨트롤은 aria-labelledby로 이름 부여)

---

## 3. 요구사항 (AC)
- AC1: jest-axe matcher가 vitest setup에 등록됨
- AC2: ui-react 주요 컴포넌트 a11y 테스트 (20+)
- AC3: agentic-ui 전체 컴포넌트 a11y 테스트 (18)
- AC4: 발견된 위반은 컴포넌트 수정으로 해소
- 비기능: 기존 테스트 회귀 없음, typecheck/build 통과

---

## 4. 발견·수정된 실제 a11y 이슈
- **Slider 썸 accessible name 누락**: Radix Slider 썸(role="slider")에 aria-label/labelledby 전달 경로 부재 → root에서 받아 Thumb에 부여하도록 수정 (실 컴포넌트 개선).

---

## 5. Definition of Done
- [x] jest-axe 인프라 (setup + axeCheck 헬퍼)
- [x] ui-react a11y 테스트 20개
- [x] agentic-ui a11y 테스트 18개
- [x] Slider 썸 라벨 수정
- [x] 기존 테스트 회귀 없음 (ui-react 100, agentic 72) + typecheck/build 통과
- [x] release-notes.md 작성
