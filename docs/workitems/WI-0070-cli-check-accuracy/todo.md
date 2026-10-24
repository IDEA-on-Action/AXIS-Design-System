# WI-0070: cli check · theme add 판정 정확도 TODO

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | 릴리스 노트: [release-notes.md](./release-notes.md) | GitHub: #189 | 상태: 구현 · 검증 완료(2026-10-25), PR 대기

## 결정
- [x] plugins 배열 판독 · 설치본 기준 「미설치」 · globals.css AXIS 근거(레이아웃 JS import 포함) · 템플릿 4종 WARN 수용 · theme add 문구만 · body Arial · postcss-import 안내 (PRD D1~D8)

## 구현
- [x] registry-core `tailwind-core.ts`: `readAnimationPluginUse` · `findLayoutTokensCssImport` · `checkGlobalsCss` · create-next-app body font-family
- [x] registry-core `project.ts`: `ROOT_LAYOUT_FILES`(brand-core 에서 옮김)
- [x] cli `theme/index.ts`: `baseImportLines`(컴포넌트 스캔 경로 · 브랜드 앞 · 뒤면 경고)
- [x] 문서: theme-customization 4절 Tailwind 3 체크리스트 · check 표 · quick-start · cli README

## 테스트
- [x] cli template-check · theme-add, mcp template 테스트, T4-1 기준선 의도 변경 기록
- [x] pack 한 cli · MCP 로 f1 · f2 · f3, Tailwind 3 CLI 글꼴 · postcss-import 실측

## 릴리스
- [x] changeset(cli · mcp patch)
- [x] PR · 머지 · 발행 (2026-10-25 #196 머지, npm 1.7.0 · cli 1.6.1 · mcp 1.3.4, run 40137182470, provenance 6/6)
- [x] 템플릿 4종 globals.css WARN 해소는 WI-0067 (2026-10-25 WI-0067 로 이관, 사용자 결정으로 그때까지 WARN 수용)
