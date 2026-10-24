# WI-0068: ThemeProvider 브랜드 해제 유지 · 마크업 존중 TODO

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | 릴리스 노트: [release-notes.md](./release-notes.md) | GitHub: #182 | 상태: 구현 · 검증 완료(2026-10-25), PR 대기

## 결정
- [x] 센티널 `""` · 초기값 저장값 > 마크업 > defaultBrand(사용자 결정: 마크업 우선) · 하이드레이션 안전 · 언마운트 복원 · check 버전 분기 · 정적 providerExample (PRD D1~D8)

## 구현
- [x] `packages/axis-theme/src/index.ts`: readStoredBrand · readMarkupBrand · resolveInitialBrand · writeBrand 센티널, useSyncExternalStore 하이드레이션 판별, 렌더 중 상태 보정, 첫 커밋 DOM 보호, 언마운트 복원
- [x] cli `theme/brand-core.ts`: `markupWithProvider` · `THEME_MARKUP_BRAND_MIN_VERSION` · providerExample 문구 · `ROOT_LAYOUT_FILES` 공유 → `cp` 로 mcp 사본(sha256 동일)
- [x] cli · mcp `brandActivationResult` WARN 문구, theme add 안내 한 줄
- [x] 문서: theme-customization 4절(브랜드 적용 · 표 · Provider 없이 · 인라인 스크립트) · quick-start · tokens README · cli README

## 테스트
- [x] theme.test 11건 · theme.hydrate.test 5건(양성 대조) · 변이 2종
- [x] 브라우저 하이드레이션 S1 · S2 · S3 · S5 · S6(npm 1.6.2 대조)
- [x] cli · mcp check 테스트, pack 한 cli · MCP 로 f1 · f2

## 릴리스
- [x] changeset(theme minor, 동작 변경 S5 기록)
- [ ] PR · 머지 · Release PR 버전 1.7.0 대조 · 발행
- [ ] 발행본 1.7.0 으로 testplan 2 다시 재기
