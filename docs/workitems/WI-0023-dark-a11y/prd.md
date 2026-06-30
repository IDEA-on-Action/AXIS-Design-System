# WI-0023: 다크 모드 a11y E2E PRD

> 작성일: 2026-06-30 | 작성자: AXIS Team | 상태: Done
> 선행: WI-0021/0022(E2E a11y, 라이트만). 본 WI는 다크 모드 a11y 추가.

## 1. 개요
WI-0021/0022 E2E a11y는 라이트 모드만 검사했다. 다크 모드 색상 대비를 추가 검증한다.

## 2. 접근
- ThemeProvider가 `attribute="class" defaultTheme="system" enableSystem` → Playwright `colorScheme: 'dark'` 에뮬레이션만으로 다크 전환.
- a11y.spec.ts를 라이트/다크 양쪽으로 파라미터화 (9페이지 × 2 = 18 테스트). `test.use({ colorScheme })` + 다크 시 html.dark 클래스 검증.

## 3. 발견·수정된 다크 모드 버그
- **코드블록 구문색 미전환**: shiki dual-theme(`themes:{light,dark}`)이 light 색은 인라인, dark 색은 `--shiki-dark` 변수로 출력하는데, `.dark`에서 이를 적용하는 CSS가 없어 다크 배경(#18181b)에 라이트(어두운) 구문색이 렌더 → 대비 1.06~2.18 (85건/페이지). globals.css에 `.dark .shiki { color: var(--shiki-dark) }` 추가로 해소.

## 4. AC
- AC1: 9페이지 × 라이트/다크 axe 위반 0
- AC2: 다크 모드 html.dark 적용 검증
- 비기능: build/typecheck/lint 회귀 없음

## 5. Definition of Done
- [x] a11y.spec.ts 라이트/다크 파라미터화 (18 테스트)
- [x] shiki dark 구문색 CSS 추가 (코드블록 다크 대비)
- [x] 18 테스트 위반 0, build/typecheck/lint PASS
- [x] release-notes.md 작성
