# WI-0026: 밀도 토큰 TODO

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | 릴리스 노트: [release-notes.md](./release-notes.md) | GitHub: #85 | 상태: 구현 · 검증 완료(2026-10-25), PR 대기

## 결정 · PRD
- [x] 배치 3 결정 반영(Q3 (나) · Sheet 제외 · 이름 · 기본값 · fallback · Q1 · lg · Select · Q4 · Q5 · Q6 · KEY_TOKENS 미추가) (PRD 2)
- [x] PRD v1.0: 낡은 전제 정정(1.4), AC1 기준 1.6.3, AC4 · AC5(variables.css 단독 fallback) 추가

## 구현
- [x] tokens: `components.json` 최상위 `control` · `field` · `toggle` · `table`, `spacing.json` `radius.control|field|surface`
- [x] tokens: `brands/ontology/light.json` 밀도 값(FR-4, Toggle 은 기본값과 같은 값 명시)
- [x] tokens: `tokens.d.ts` 선언에 새 최상위 4개
- [x] ui-react: Button · Input · Select 트리거 · Toggle · Table · Card · Dialog 클래스를 `var(--axis-*,<리터럴>)` 참조로
- [x] 테스트: `baseline-1.2.1`(신규 15개 · var() 허용 3개 · 변이), `brands`(FR-4 표 · U18 예외), ui-react `density.test.ts`(AC3 · AC4), 기존 단언 갱신(button · input · card)
- [x] E2E: `brand-expectations` · `brand-demo`(높이 · Input 둥글기, ontology Button 8px), `dark-tokens`(AC5)
- [x] 문서: `docs/guides/theme-customization.md` 밀도 토큰 절 + ontology 10px 서술 5곳 갱신

## 테스트
- [x] AC1: 1.6.3 배포본 대비 브랜드 미지정 186값(줄 높이 · 표 높이 포함) 차이 0(Chromium 1280 · 375)
- [x] review 지적: 크기별 `leading-4|5|6` 명시(Button · Input · Table), 줄 높이 테스트 3건 · 단위 단언 추가, 생성물 재생성
- [x] AC2: ontology 33항목 일치, Tailwind 4.1 · 3.4 308값 차이 0
- [x] AC5: variables.css 단독 fallback 6 · 6 · 8px 실측
- [x] 변이 3종 · 단위 테스트

## 생성물 · 릴리스
- [x] `build:registry`(5항목, version 1.5.0 유지) · `library:refresh-axis`(8파일, 재실행 0) · 템플릿 churn 되돌림
- [x] changeset `.changeset/wi-0026-density-tokens.md`(tokens · ui-react minor)
- [x] 게이트: `turbo run type-check lint test build --force`(Cached 0) · frontend.yml run 단계 · E2E 4종
- [ ] PR 생성 · 머지(배치 3 순서 ③ → ① → ②, ① 이 `packages/axis-tokens/package.json` 을 고치면 rebase)
- [ ] 배포 뒤 npm 1.7.0 발행본으로 testplan 3 · 4 절 다시 재기
- [ ] 디자인 오너 확인: ontology Toggle 40px(Q4) · Select 팝업 10px(R3)
