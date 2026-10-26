# WI-0085: pnpm 고정 안내 정리 · packageManager 신호 TODO

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | 릴리스 노트: [release-notes.md](./release-notes.md) | GitHub: #217 | 상태: ✅ 완료(2026-10-26, cli 1.7.2 · mcp 1.4.2, #225 · Release #226)

## 결정
- [x] D1 lockfile 다음 순위로 packageManager(사용자 결정) · D2 매니저별 워크스페이스 실행 · D3 따옴표 · -D · D4 헬퍼는 project.ts 한 곳 · D5 accordion 그대로 · D6 쓰기 전 판정 · D7 선택 인자 · D8 U6 정정 · get_brand 설명 · D9 cli · mcp patch

## 구현
- [x] `project.ts`: `detectInstallCommand` packageManager 분기, `packageManagerOf` · `addCommandPrefix` · `addCommandFor` dev · `runScriptCommand` · `workspaceRunCommand`
- [x] `add.ts`: `addCommandForSpecs` 를 `addCommandPrefix` 위로(동작 불변)
- [x] cli `template-apply.ts`(apply 의존성 · init 다음 단계), `theme/index.ts`(빌드 전 · 주석), `monet.ts`(cwd)
- [x] mcp `brand.ts`(포매터 선택 인자 · `tokensInstallCommandFor` · U6 주석), `template.ts`(`installCommand`), `index.ts`(전달 · get_brand 설명), `tools/index.ts` export
- [x] 문서: WI-0081 prd D2 · D3 · AC5 정정, cli · mcp README, theme-customization dependencies 행

## 테스트
- [x] cli workspace-root(AC5 변형 뒤집기 · packageManager 7 · 헬퍼 4) · template-apply 13 · theme-commands 1 · monet-guidance 1, mcp brand 5 · template-apply 6
- [x] 수정 전 소스에서 cli 18 · mcp 10 빨강, 변이 12종 각각 빨강 · 원복(sha 같음), B1 은 MCP stdio
- [x] 실경로 15픽스처 x 11칸: 168/285 → 0/285, cli · mcp 90쌍 불일치 0, 음성 대조 따옴표만, rc 변화 0
- [x] turbo lint · type-check · build · test `--force`(Cached 0), frontend.yml run 단계 11종 rc 0, 생성물 되돌림

## 릴리스
- [x] changeset `.changeset/wi-0085-pinned-pnpm-guidance.md`(@axis-ds/cli patch · @axis-ds/mcp patch)
- [x] PR · 머지(WI-0086 과 한 PR, 단독 push, push run 완료와 검사 단계 registry-core N>0 을 로그로 확인한 뒤 Release 머지) (2026-10-26 #225 머지 7d1915b, main push run 40269191762 success · 검사 「registry-core 4개 · cli · mcp changeset 각 2개」 통과, Release #226 머지 37b73d0 에서 cli 1.7.2 · mcp 1.4.2, publish run 40271807118)
- [x] 발행본으로 testplan 2절 다시 재기(AC10, WI-0086 전이와 합친 표) (2026-10-26: meas-run-new.json 이 구현 때 meas-run-after.json 과 cmp rc 0, 기대 매니저와 다른 명령 0/285(구판 1.7.1 · 1.4.1 171/285), rc 변화 0, cli · mcp 90쌍 불일치 0. testplan 6절)
