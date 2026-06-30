# 릴리스 노트 - WI-0023 다크 모드 a11y E2E

> 릴리스 날짜: 2026-06-30
> 범위: E2E a11y 다크 모드 확장 + 코드블록 다크 구문색 수정

## 요약
E2E a11y를 라이트/다크 양쪽으로 확장(18 테스트)하고, 다크 모드가 드러낸 코드블록 구문색 대비 버그를 수정했어요.

## 변경 내역

### ✨ 추가
- `e2e/a11y.spec.ts`: 라이트/다크 파라미터화 (9페이지 × 2 = 18 테스트). `colorScheme` 에뮬레이션 + html.dark 검증.

### 🐛 수정
- **코드블록 다크 구문색**: shiki dual-theme이 다크 배경에 라이트(어두운) 구문색을 렌더(대비 1.06~2.18)하던 선존 버그. `globals.css`에 `.dark .shiki { color: var(--shiki-dark); background: var(--shiki-dark-bg) }` 추가로 해소.

## Breaking Changes
> 없음. 다크 모드 코드블록 가독성이 개선됨.

## 검증 방법
1. `pnpm --filter @ax/web test:e2e:a11y` → 18 테스트 위반 0 (라이트/다크)
2. `pnpm --filter @ax/web build` → 빌드 성공

## 알려진 이슈
- E2E는 여전히 main CI 미포함(브라우저 설치 비용). 로컬/수동.

## 기여자
- @sinclairseo
