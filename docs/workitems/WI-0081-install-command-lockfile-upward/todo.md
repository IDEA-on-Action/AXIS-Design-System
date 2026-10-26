# WI-0081: 설치 안내 명령 · dependencies 판정의 워크스페이스 루트 탐색 TODO

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | 릴리스 노트: [release-notes.md](./release-notes.md) | GitHub: #210 | 상태: ✅ 완료(2026-10-26, cli 1.7.1 · mcp 1.4.1, #219 · Release #221)

## 결정
- [x] D1 앱 층 → 워크스페이스 루트 lockfile(.git 에서 중단, 기본 pnpm) · D2 packageManager 미사용 · D3 pnpm 고정 안내는 WI-0085 로 · D4 루트 선언 인정 + 출처 표시 · D5 findInstalledPackage 멈춤 없음 · D6 단위 테스트는 cli 아래 · D7 cli · mcp patch (배치 6b 결정)

## 구현
- [x] `project.ts`: `findWorkspaceRoot` 신설(표지 먼저 · `.git` 중단), `detectInstallCommand` 를 앱 층 → 루트 층으로, `LOCKFILE_COMMANDS` 로 종전 우선순위 유지
- [x] `dependencies-core.ts`: 앱에 없으면 루트 선언 인정(필수 · 권장), 출처 문구(PASS · WARN · Plug'n'Play), 헤더 판정 5항
- [x] 문서: `docs/guides/theme-customization.md` dependencies 행(판정 열 FAIL 포함, 1.7.1 · 1.4.1 부터 루트 선언 인정 · 안내 명령)

## 테스트
- [x] `packages/axis-cli/src/workspace-root.test.ts` 15건(npm · yarn · pnpm, fx-outside · fx-gitstop 음성 대조, 앱 층 우선, 같은 층 우선순위, lockfile 없는 루트, 중간 층, 가까운 루트, 잘못된 workspaces, 환경 가드)
- [x] init 3건 · theme add 1건 · add 1건(npm · yarn · 워크스페이스 밖 음성 대조)
- [x] template-check: WI-0074 AFTER 표 d · h 행 갱신, 「WI-0081」 7건(npm PASS · rc · yarn 안내 · 앱 선언 우선 · 음성 대조 3 · PnP)
- [x] MCP template: h 행 갱신 + d-rootonly · 워크스페이스 밖 음성 대조 1건
- [x] 수정 전 소스(HEAD)에서 cli 22 · mcp 2 빨강, 변이 M1~M5 · D1~D3 빨강 · 원복(sha 같음)
- [x] 실제 설치 픽스처 신구 비교(발행본 cli 1.7.0 · mcp 1.4.0 대 worktree 빌드본): 예고한 줄만 바뀜
- [x] turbo lint · type-check · build · test `--force`(Cached 0), frontend.yml run 단계 11종

## 릴리스
- [x] changeset `.changeset/wi-0081-install-command-lockfile-upward.md`(@axis-ds/cli patch · @axis-ds/mcp patch)
- [x] PR · 머지(배치 6b 순서 WI-0080 → WI-0081 → Release) (2026-10-26 #219 머지 79c3208, WI-0080 과 한 PR. Release #221 머지 cb8f27c 에서 cli 1.7.1 · mcp 1.4.1, run 40247657745)
- [x] 발행본으로 testplan 2절 `meas.sh` 다시 재기(AC7) (2026-10-26: 안내 49줄 중 바뀐 줄 8 · check 바뀐 줄 cli 13 · mcp 9, 구현 때 worktree 빌드 결과와 diff rc 0, 음성 · 양성 대조 그대로. testplan 7절)
- [ ] 후속 WI-0085(#217) · WI-0086(#218) 진행
