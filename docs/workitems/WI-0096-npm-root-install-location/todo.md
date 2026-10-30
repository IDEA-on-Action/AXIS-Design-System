# WI-0096: npm 워크스페이스 루트 선언의 설치 위치 안내 TODO

> PRD: [prd.md](./prd.md) | 계획: [plan.md](./plan.md) | 테스트 계획: [testplan.md](./testplan.md) | 릴리스 노트: [release-notes.md](./release-notes.md) | GitHub: #240 | 상태: 🔄 구현 · 검증 완료, 사용자 확인(Q110 ~ Q115) · PR 리뷰 · 발행 대기

## 착수
- [x] npm 7.24.2 · 8.19.4 · 9.9.4 · 10.9.4 × lockfile 4조건 × 실행 위치 3곳 설치 위치 측정 (AC1) (2026-10-30, testplan 2.1: 앱 디렉터리 실행 루트 선언 0/16, 루트 실행 16/16, npm 7 은 `--include-workspace-root` 도 0/4)
- [x] pnpm 9.15.4 · yarn 1.22.22 대조 (AC4) (2026-10-30, 앱 디렉터리 실행도 루트 선언 설치 2/2 · 2/2)
- [x] main 빌드로 theme add · init · check 출력 18개 기록 (AC2) (2026-10-30, testplan 2.2: 결함 6줄, 모두 npm 루트 선언)
- [x] 원인 위치 확인 (testplan 2.3)

## 결정
- [x] Q110 ~ Q115 를 권장안으로 진행하고 prd 1.2 · 7절에 기록 (사용자 확인 대기)

## 구현
- [x] registry-core `project.ts` `installCommandPhrase` 추가(기존 함수 시그니처 불변) (AC3)
- [x] registry-core `dependencies-core.ts` `checkDependencies` 두 묶음 (AC3 · AC5)
- [x] cli `theme/index.ts` 루트 선언 tokens 미설치 줄 · 컴포넌트 보류 안내 (AC3)
- [x] cli `init/init.ts` `reportDependencies` · `animationGuideLine` (AC3)
- [x] `packages/axis-cli/README.md` 서술 갱신, 「WI-0096」 범위 서술 grep 대조(다른 WI 문서는 Master 몫이라 그대로)

## 테스트
- [x] 기존 테스트 4건 기대 갱신(plan 4절)
- [x] 새 테스트 cli 9건 · mcp 2건 (AC3 ~ AC5)
- [x] 음성 대조: 호출부를 main 으로 되돌리면 cli 9 · mcp 3 빨강 (AC6)
- [x] 출력 A/B 18개: 바뀐 3개 6줄, 15개 바이트 같음, rc 18/18 같음 (AC4 · AC7)
- [x] 실경로 스모크(npm 10.9.4 실설치): 종전 안내로는 WARN 유지, 새 안내로 PASS (AC8)
- [x] 패키지별 type-check · lint · test(직접 실행, 캐시 없음) (AC9) (cli 1175 · mcp 242, rc 0)

## 릴리스
- [x] changeset `@axis-ds/cli` patch + `@axis-ds/mcp` patch, `pnpm check-changeset-mcp-tokens` rc 0 (AC9)
- [x] release-notes.md
- [x] 결정 Q110 ~ Q115 사용자 확인(Master) (2026-10-30 전부 권장안으로 확정)
- [x] PR 리뷰 · 머지 · 발행(Master) (#261 머지 5ead079, Version PR #266 으로 cli 1.7.9 · mcp 1.4.8 발행, 2026-10-31)
