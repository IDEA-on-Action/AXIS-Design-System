# WI-0093: theme list · info · MCP 브랜드 도구의 tokens 설치 안내 TODO

> PRD: [prd.md](./prd.md) | 계획: [plan.md](./plan.md) | 테스트 계획: [testplan.md](./testplan.md) | 릴리스 노트: [release-notes.md](./release-notes.md) | GitHub: #236 | 상태: 🔄 구현 · 검증 완료, PR · 릴리스 대기

## 결정
- [x] 구현 후 추가 결정 B1(theme add PnP 한 줄 통일) · B2(루트 빌드 전 재설치 줄이 공용 문구) · B3(앱 선언 빌드 전 재설치 줄) · B4(MCP 등록부 배선 테스트) · 공통(cli 1.7.6 · mcp 1.4.5 표기)(2026-10-27 사용자 결정)
- [x] Q13 경계 P1 + P2 · PnP 한 줄 · Q14 registry-core 헬퍼 · Q15 npm 루트 위치(list · info · MCP 만) · Q16 unsupported · not-built · Q17 theme add 공백(WI-0087 DEC-1 재오픈) · Q20 범위 밖 · Q4 PR-B(2026-10-27 사용자 결정)

## 구현
- [x] registry-core `project.ts`: `APP_LOCKFILES` · `hasAppLockfile` · `rootDeclarationsAllowed` · `DependencyInstallGuide` · `dependencyInstallGuide`(기존 함수 본문 불변)
- [x] cli `theme-add.ts`: P1 · P2 판정을 `rootDeclarationsAllowed` 로
- [x] cli `theme/index.ts`: `tokensInstallGuide` · `tokensStatusGuide` guide 인자 · list · info 등록부 · theme add 두 줄
- [x] mcp `tools/brand.ts` · `tools/index.ts` · `index.ts`: `tokensInstallGuideFor` · 서식 함수 guide 인자 · 호출지
- [x] 문서: `packages/axis-cli/README.md` · `packages/axis-mcp/README.md` 안내 문장
- [x] 추가 결정: cli `theme-add.ts` `tokensGuide` · `theme/index.ts` `installPhrase` · `rebuildGuide` · theme add PnP 한 줄 · 빌드 전 재설치 줄 대칭, README 버전 표기 1.7.6 · 1.4.5

## 테스트
- [x] HEAD 기준선(cli 912 · mcp 181, 관련 파일별)
- [x] cli 13건 · mcp 10건 추가, WI-0087 음성 대조 기대 1건 변경
- [x] 수정 전 소스에서 cli 11 빨강 · mcp 10 빨강
- [x] 변이 9종 각각 빨강 1건 이상
- [x] 추가 결정 테스트 cli 2건 · mcp 2건(`index-brand-wiring.test.ts`), 변이 6종 각각 빨강 1건 이상
- [x] 실매니저 16건(pnpm 9.15.4 · npm 10.9.4 · yarn 4.5.3 node-modules · PnP x 루트 · 앱 · 미선언 · P2) 수정 전 · 후
- [x] MCP stdio 9 픽스처 수정 전 · 후
- [x] type-check · lint · build `--force`(Cached 0), cli · mcp 전체 vitest

## 릴리스
- [x] changeset `.changeset/wi-0093-theme-install-guide-source.md`(@axis-ds/cli patch · @axis-ds/mcp patch)
- [x] PR · 머지
- [x] Release PR 머지 · npm 발행
- [x] 발행본으로 testplan 4 · 5절 다시 재기

> 완료 기록(2026-10-28, Master): #246 머지 → cli 1.7.6 · mcp 1.4.5 (#247, run 40578802526, provenance 2/2), 발행본 재측정 2026-10-28. 발행본 실측 통과(PR-A 7/7 · PR-B 18/18, CLI · MCP 출력 일치).
