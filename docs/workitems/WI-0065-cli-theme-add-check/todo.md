# WI-0065: theme add · check 보강 TODO

> PRD: [prd.md](./prd.md) | GitHub: #175

- [x] theme add: Tailwind major 판정, 기본 토큰 CSS 삽입(`insertImportLines` · `hasCssImport`), 규칙 뒤 import 경고(`findLateImports`), Tailwind 3 preset · content 안내, 레이아웃 활성화 탐색 안내
- [x] 설치 안내 lockfile 별(`tokensInstallCommand` · `addCommandFor` 공유 코어), tokens 기록 범위 ^1.6.0(`TOKENS_DEPENDENCY_MIN_VERSION`, brand-core)
- [x] brand-core: Provider 예시를 data-brand · setBrand 로, `findBrandActivation` · `inspectBrandActivation`, mcp 사본 `cp`
- [x] tailwind-core: Tailwind 3 preset 없으면 WARN, `inspectTailwindContent` · `checkTailwindContent`(FAIL) · `checkAnimationPlugin`(WARN)
- [x] cli `axis check` · mcp `axis.check_project` 에 새 항목 3개(같은 순서 · 문구)
- [x] init 애니메이션 플러그인 안내 한 줄
- [x] 테스트 갱신 · 추가(cli theme · check · init, mcp brand · template), check 기준선은 의도한 변경만 반영
- [x] 1.3 border-color 측정, 경로 A before · after 측정
- [x] 변이 확인, cli · mcp README, changeset(cli minor · mcp patch)
- [ ] 머지 뒤 npm 배포본(cli 1.6.0)으로 경로 A 재측정
- [ ] WI-0064 가 import 순서 · Provider 예시를 가이드에 옮기는지 확인(묶음 ④)
