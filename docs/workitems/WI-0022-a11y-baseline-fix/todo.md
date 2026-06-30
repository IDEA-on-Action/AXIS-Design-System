# WI-0022: a11y baseline 위반 수정 TODO

> PRD: [prd.md](./prd.md) | 상태: ✅ 완료

## Phase 1: 실측 ✅
- [x] E2E 위반 덤프로 색상/대비/셀렉터 정밀 실측

## Phase 2: button-name ✅
- [x] CodeBlock 복사 버튼 aria-label
- [x] install-command 복사 버튼 aria-label
- [x] docs 페이지 복사 버튼 3개 aria-label
- [x] Button Sizes 데모 / Select trigger aria-label

## Phase 3: color-contrast ✅
- [x] --muted-foreground 46.1% -> 43% (globals.css)
- [x] Required 뱃지 text-red-700/dark:text-red-300 (props-table)
- [x] shiki high-contrast 테마 (shiki.ts + code-block.tsx)
- [x] 쇼케이스 pulse 텍스트 대비 (component-showcase)

## Phase 4: 엄격 모드 ✅
- [x] e2e/a11y.spec.ts baseline 면제 제거 -> 위반 0 단언
- [x] 9페이지 위반 0 확인, 단위/typecheck/build 회귀 0
- [x] release-notes.md
