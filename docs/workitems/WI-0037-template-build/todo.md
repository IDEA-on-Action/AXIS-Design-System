# WI-0037: 템플릿 원형 빌드 TODO

> PRD: [prd.md](./prd.md) | GitHub: #119

- [x] 템플릿 4종 layout · page · globals(+ theme-toggle)를 `files/app/` 으로 이동, page 의 `./components` · `./lib` import 를 `../` 로
- [x] `postcss.config.mjs` 4개 추가, `tailwind-merge` ^3.4.0 → ^2.6.0, `@types/node` ^20 추가(template.json · files/package.json 양쪽)
- [x] features · description 정정(자체 CSS 변수 테마, AXIS 패키지 미사용), theme-only README 구조 · 설치 안내 현행화
- [x] `createTemplateConfig` globalCss `./app/globals.css`
- [x] `templateApplyWarnings`(Tailwind major 차이 · src/app) 와 apply 경고 출력
- [x] 사이트 SetupTab 을 `template init` 경로로
- [x] `pnpm --filter @ax/web build:templates` 로 public/templates 재생성
- [x] `scripts/template-smoke.mjs`(루트 `pnpm template-smoke`) 작성, 4/4 PASS · 음성 대조 2종 FAIL 확인
- [x] 테스트 갱신(axis-config · init 템플릿 정합 · test-helpers 레이아웃 · check 기준선) · 추가(apply 경고 · 템플릿 구조)
- [ ] 머지 뒤 pages.dev 배포본 `template init` 으로 AC1 재측정(배포 경로, 이번 스모크는 AXIS_TEMPLATE_URL 주입 전제)
