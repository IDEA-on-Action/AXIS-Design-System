# WI-0079: ontology 남은 대비 미달 TODO

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | 릴리스 노트: [release-notes.md](./release-notes.md) | GitHub: #208 | 상태: 구현 · 검증 완료(2026-10-26), push · PR 전

## 결정 · 조사
- [x] 후보 · 대비 · 영향 범위 · 고칠 테스트 정리(design-review.md, 2026-10-25)
- [x] 사용자 결정 기록: 권장안 반영 · Q3 destructive 분리 · Q4 placeholder 철회 · Q5 Input 테두리 유지 (PRD 1.3)
- [x] 수정 전 재현: main e2a9725 정적 빌드에서 ontology 미달 측정(PRD 1.2)

## 테스트 먼저
- [x] `ontology-pairs.mjs` `CONTRAST_PAIRS`: 기본 전용 표에 있던 placeholder · 경계 · 트랙 · 썸 2 · Progress 4 짝을 공용으로 옮기고 경계 · 트랙에 panel · 페이지 바탕 짝 추가(13행), 고정 색(`#FFFFFF`) · shadcn 바탕(`bgShadcn`) 표기
- [x] `ontology-values.test`: 고정 색 · shadcn 바탕 해석, WI-0079 값 4테스트(팔레트 이름 단언, warning ≠ destructive, placeholder = text-tertiary, Input 테두리 line-2 유지) → 수정 전 19 실패
- [x] `default-contrast.test`: `DEFAULT_ONLY` 를 shadcn destructive · Input 경계 2짝으로 줄이고 옮긴 짝이 공용 표에 있는지 단언(기본 브랜드는 수정 전에도 통과)
- [x] `brands.test`: `WI0063_SAME` 을 팔레트 이름 표(`WI0079_NAMES`)로, 초안 대조에 placeholder 예외 `WI0079_OVERRIDES` → 수정 전 2 실패
- [x] `brand-nontext-contrast.spec` ⑤ 폼 컨트롤 대상 표(11 대상 x 4조합) → 수정 전 ontology 2건 실패(44 단언), 기본 2건 통과
- [x] frontend.yml E2E 건수 가드 nontext 8 → 12, describe 별 건수 4개 추가

## 구현
- [x] `packages/axis-tokens/src/brands/ontology/{light,dark}.json` form-control 2 · progress.fill 3 · input.text.placeholder

## 문서
- [x] theme-customization 「ontology 프리셋」 절: 미달 쌍 표 muted 줄, 「남은 대비 미달 보정 (WI-0079)」 표
- [x] WI-0025 prd.md 부록 B: placeholder 철회 기록
- [x] design-review.md 맨 위 「권장안으로 먼저 반영 · 다른 값이면 다시 발행」 안내
- [x] changeset `.changeset/wi-0079-ontology-contrast-residual.md`(tokens · mcp patch)

## 생성물 · 검증
- [x] `library:refresh-axis`(변경 0) · `build:registry`(r/ version 1.8.1 → 1.5.0 되돌림, 내용 변경 0) · 템플릿 updatedAt 되돌림
- [x] 브라우저 실측(수정 후) · 기본 브랜드 음성 대조 · 스크린샷 대조
- [x] 게이트(testplan 4절)
- [x] project-todo 91행 · wi-mapping lastStatus 🔄

## 검토 뒤 결정 반영 (2026-10-26)
- [x] Progress warning 을 원시색 노랑(라이트 `{color.yellow.700}` · 다크 `{color.yellow.500}`)으로, 테스트 기대값 갱신(ontology-values · brands.test · CONTRAST_PAIRS where · brand-nontext 주석)
- [x] warning 대 destructive 구분 재계산(휘도 대비 · 색상 각도), 트랙 위 대비 브라우저 실측(testplan 4b)
- [x] `brand.json` `a11y.status` 갱신과 단언(brands.test)
- [x] WI-0082 changeset 에 cli patch 추가(changeset status 1.8.2 · cli 1.7.3 · mcp 1.4.3)
- [x] 게이트 · E2E 재실행(testplan 4b)
