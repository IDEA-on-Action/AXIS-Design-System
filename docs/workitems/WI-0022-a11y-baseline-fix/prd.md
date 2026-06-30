# WI-0022: a11y baseline 위반 수정 PRD

> 작성일: 2026-06-30 | 작성자: AXIS Team | 상태: Done
> 선행: WI-0021(E2E a11y, baseline 기록). 본 WI는 그 baseline(color-contrast/button-name) 해소.

## 1. 개요
WI-0021 E2E a11y가 기록한 도입 시점 위반(color-contrast ~71, button-name ~22 노드)을 수정한다. 실측 색상/대비 기반 표적 수정.

## 2. 수정 내역 (실측 근거)
| 위반 | 원인 (실측) | 수정 |
|------|-----------|------|
| button-name | CodeBlock/install 복사 버튼, docs 복사 버튼, Button Sizes 데모, Select trigger 등 아이콘 버튼 라벨 누락 | 각 버튼 aria-label 추가 |
| color-contrast: muted | `text-muted-foreground`(#71717a) on `bg-muted`(#f4f4f5) = 4.39 | `--muted-foreground` 46.1% -> 43% |
| color-contrast: Required 뱃지 | `text-destructive`(#ef4444) on `bg-destructive/10`(#fdecec) = 3.29 | `text-red-700 dark:text-red-300` |
| color-contrast: 코드 구문 | shiki github-light 빨강 #d73a49 = 4.38 | `github-light-high-contrast` / `github-dark-high-contrast` |
| color-contrast: 쇼케이스 | `animate-pulse` opacity 저하 텍스트 #818182 = 3.79 | pulse 제거 + `text-muted-foreground` |

## 3. AC
- AC1: 9개 대표 페이지 axe 위반 0
- AC2: E2E a11y를 엄격 모드(위반 0 단언)로 전환
- 비기능: 단위 테스트/typecheck/build 회귀 없음

## 4. Definition of Done
- [x] button-name 전부 해소 (아이콘 버튼 aria-label)
- [x] color-contrast 전부 해소 (muted 토큰/Required 뱃지/shiki/쇼케이스)
- [x] e2e/a11y.spec.ts 엄격 모드 전환 (baseline 면제 제거)
- [x] 9페이지 위반 0, typecheck/lint/build PASS
- [x] release-notes.md 작성
