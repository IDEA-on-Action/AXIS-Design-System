# WI-0046: 애니메이션 플러그인 의존 선언 · keyframes TODO

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | 릴리스 노트: [release-notes.md](./release-notes.md) | GitHub: #137 | 상태: 구현 · 검증 완료(2026-10-24), PR 대기

## 실측 · 결정
- [x] 배치 2 브리프 측정 확인(1.6.0: tw3 · tw4 기본 0/33, 플러그인 30 · 32/33, progress keyframes 0건)
- [x] 결정 D1~D10 PRD 기록(브리프 권장안 + review major 3 · minor 1)

## 구현
- [x] tokens `src/tailwind-preset.ts`: `axisKeyframes` · `axisAnimation` named export, `theme.extend` 에 연결(FR-1)
- [x] tokens `scripts/tailwind4.mjs`: `@keyframes` 생성 경로 · `--animate-*` 접두사 · animation → keyframes 참조 검사(FR-2 · FR-3)
- [x] tokens `test/tailwind4.test.mjs`: 76 · 80 · 91 행 단언 갱신, keyframes 독립 파서 대조, 변이 4종
- [x] ui-react Progress 불확정 `w-1/3` 왕복 · `duration-[1500ms]`(FR-4, PRD 4.4)
- [x] ui-react · agentic-ui 모든 `animate-*` 22곳에 `motion-reduce:!animate-none`(FR-5), Tooltip 클래스 문자열 합침
- [x] agentic-ui SurfaceRenderer `prose` → `text-sm`(FR-6)
- [x] ui-react `package.json` optional peer 2종 + lockfile(FR-7)
- [x] 문서: quick-start Tailwind 4 절 애니메이션 문단 · troubleshooting · docs 페이지 · ui-react README · tokens README(FR-8)
- [x] 사이트 `tailwind.config.ts` keyframes 객체 import(preset 미채택) · `/components/progress` 실컴포넌트(FR-9)

## 테스트
- [x] 단위: progress 3 · reduced-motion 2×2 · surface-renderer 1 추가, 변이 2건 검출
- [x] Tailwind 3 · 4 실빌드 + Playwright(기본 · reduce), 1.6.0 대조군
- [x] 사이트 빌드 CSS keyframes · progress 페이지 axe 0 · a11y 게이트 40

## 생성물 · 릴리스
- [x] `build:registry`(version 유지) · `library refresh-axis`(재실행 변경 0) · 템플릿 churn 되돌림
- [x] changeset `.changeset/wi-0046-animation-keyframes.md`(tokens · ui-react · agentic-ui patch, theme 제외)
- [x] 게이트: type-check · lint · test · build(--force, Cached 0) · test:registry · pack-smoke · check-library-links · cli test
- [x] PR 생성 · 머지(① 다음, ③ 앞) · 배포 완료(#185 · #187)
- [x] 배포 뒤 운영 사이트 · 발행본 실측(testplan 6절) 완료 (2026-10-25 실측: 배포 후 재측정 워크플로, npm 1.6.2 · cli 1.6.0 · pages.dev, env 주입 없음). Progress 부분 폭 왕복(0.333, 양 끝 도달) · Accordion accordion-down/up · reduced-motion 정지, 발행본 Dialog enter. 미해소: /components/skeleton 문서 mock(WI-0066)
