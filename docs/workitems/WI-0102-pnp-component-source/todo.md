# WI-0102: Plug'n'Play zip 안의 컴포넌트 tailwind.css TODO

> PRD: [prd.md](./prd.md) | 계획: [plan.md](./plan.md) | 테스트 계획: [testplan.md](./testplan.md) | 릴리스 노트: [release-notes.md](./release-notes.md) | GitHub: #249 | 상태: 🔄 권장안으로 구현 · 검증 완료, 사용자 결정(Q120 ~ Q125) · PR 리뷰 대기

## 착수 (원인 측정)
- [x] Yarn 4.5.3 PnP 실앱에서 Issue 재현(C2: rc 0 · 클래스 0, 산출물이 base 와 `cmp` 같음) (AC1) (2026-10-30)
- [x] 양성 대조: node-modules linker 에서 클래스 생성(C1: 47,858 B · 2건, Issue 값과 같음) (AC1)
- [x] 대조 ① 루트 `dependenciesMeta` unplug(C3: C1 과 바이트 같음) · ② node-modules(C1) · ③ 앱 `@source` zip 경로(C5 · C6: 0) · 계측 대조 실제 디렉터리 `@source`(C7: 47,858 B) (AC1)
- [x] 앱 쪽 `dependenciesMeta` 는 Yarn 이 따르지 않음(C4) (AC1)
- [x] `@tailwindcss/postcss` 경로 · 최신 Yarn 4.18.1 · Tailwind 4.3.3 (testplan 2.2 · 2.3)
- [x] 후보 B(`preferUnplugged`) 효과(C8) · 대조(C9) · 디스크 비용(2.4)

## 결정
- [x] 해결 후보 비교표(prd 1.3)와 결정 항목 Q120 ~ Q125(prd 7절) 작성
- [ ] 사용자 결정 Q120 ~ Q125 (Master 가 확인)
- [ ] Q121 이 (a) 면 다음 linked 발행 WI 에 `preferUnplugged` 를 넣는 항목 등록 (Master)

## 구현 (권장안 Q120 (a) · Q122 (a) · Q125 (a))
- [x] registry-core `project.ts`: `pnpComponentSourceHidden` · `pnpUnplugSetupPhrase` (AC2 ~ AC5)
- [x] registry-core `tailwind-core.ts` `tailwind4Issues`: 줄 없음 · 줄 있음 두 방향 (AC2 · AC3)
- [x] 주석 · `packages/axis-cli/README.md` 2번 · 5번 · `docs/guides/troubleshooting.md` 2절 갱신, 「앱 선언은 종전 그대로」 서술 grep 대조
- [x] WI-0097 회귀 가드 두 곳의 PnP 줄을 WI-0102 로 옮김(plan 4절)

## 테스트
- [x] cli 「WI-0102」 describe(Z1 ~ Z11 · 헬퍼, 21건) · mcp 「WI-0102」 1건 (AC2 ~ AC7)
- [x] 음성 대조: 판정을 수정 전 동작으로 되돌리면(M1) cli 12 · mcp 1 빨강 (AC8)
- [x] 변이 M1 ~ M8 빨강 8/8, 원복 대조 (AC8)
- [x] 실측 앱 5개에 수정본 CLI, check 판정과 실빌드 일치 (testplan 4.2)
- [x] turbo build · type-check · lint `--force`(Cached 0), cli 1187 · mcp 241 통과 (AC9)

## 릴리스
- [x] changeset `@axis-ds/cli` patch + `@axis-ds/mcp` patch, `pnpm check-changeset-mcp-tokens` rc 0 (AC9)
- [x] release-notes.md
- [ ] PR 리뷰 · 머지 · 발행 (Master)
