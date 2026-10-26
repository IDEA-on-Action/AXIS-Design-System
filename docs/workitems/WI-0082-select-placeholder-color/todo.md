# WI-0082: Select placeholder 색 TODO

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | 릴리스 노트: [release-notes.md](./release-notes.md) | GitHub: #211 | 상태: 구현 · 검증 완료(2026-10-26), push · PR 전

## 조사
- [x] 수정 전 재현: 값 없는 Trigger 의 placeholder 글자 = 본문 글자색(4조합, PRD 1.2)
- [x] Radix Trigger 의 `data-placeholder` 속성 확인(jsdom · Chromium)

## 테스트 먼저
- [x] `packages/axis-ui-react/src/select/select.test.tsx` 4건 → 수정 전 2 실패
- [x] E2E `brand-nontext-contrast` ⑤ select-placeholder 행 → 수정 전 4조합 모두 「렌더 색 = 대상 변수」 실패

## 구현
- [x] `SelectTrigger`: `placeholder:text-[...]` → `data-[placeholder]:text-[var(--axis-input-text-placeholder)]`

## 생성물 · 릴리스
- [x] `library:refresh-axis`(axis-select · ui 카테고리 · index · meta) · `build:registry`(r/select.json · 목록 sha256, version 1.5.0 유지) · 템플릿 updatedAt 되돌림
- [x] changeset `.changeset/wi-0082-select-placeholder-color.md`(ui-react patch)

## 검증
- [x] 브라우저 실측: placeholder 4조합, 값 고른 뒤 글자색 불변, Select 밖 렌더 불변
- [x] 게이트(testplan 3절)
- [x] project-todo 94행 · wi-mapping lastStatus 🔄
