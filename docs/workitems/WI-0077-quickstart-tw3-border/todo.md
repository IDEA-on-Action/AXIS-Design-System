# WI-0077: Tailwind 3 기본 테두리색 TODO

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | 릴리스 노트: [release-notes.md](./release-notes.md) | GitHub: #203 | 상태: ✅ 완료(2026-10-26, linked 1.8.1, #214 · Release #216)

## 결정
- [x] preset 기본 테두리색(fallback 포함) · 생성기 borderColor 건너뛰기 명시 · 문서 정정 · 템플릿 유지 (PRD D1~D4, 배치 6 결정)

## 구현
- [x] `packages/axis-tokens/src/tailwind-preset.ts` `theme.extend.borderColor.DEFAULT`
- [x] `packages/axis-tokens/scripts/tailwind4.mjs` `TAILWIND3_ONLY_KEYS`
- [x] 문서: `docs/guides/quick-start.md` · `docs/guides/theme-customization.md` · `packages/axis-tokens/README.md` · `packages/axis-ui-react/README.md`

## 테스트
- [x] `test/tw3-border-default.test.mjs`(새 파일, package.json test 목록) · `test/tailwind4.test.mjs` 갱신 · 변이 확인
- [x] 발행본 1.8.0 소비자 음성 대조(9/12) · 후보 0/12 · shadcn 없는 소비자 gray 유지 · README 예시 R0/R1
- [x] turbo lint · type-check · build · test `--force`(Cached 0), frontend.yml run 단계

## 릴리스
- [x] changeset `.changeset/wi-0077-tw3-border-default.md`(@axis-ds/tokens patch, linked 로 4패키지 1.8.1)
- [x] PR · 머지(배치 6 순서 마지막), Release PR 에서 linked 1.8.1 대조 (2026-10-25 #214 머지 4a5e185, Release #216 머지 61ae674 에서 linked 4패키지 1.8.1, run 40205738223)
- [x] 발행본 1.8.1 로 testplan 3 다시 재기(격리 HOME, 4상태 0/12 · shadcn 없는 소비자 gray) (2026-10-26: V0 0/12(1.8.0 음성 대조 9/12), N0 gray 유지, TW4 무회귀. testplan 7절)
