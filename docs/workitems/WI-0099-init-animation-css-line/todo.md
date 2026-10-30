# WI-0099: init 애니메이션 안내가 check 와 같은 전역 CSS 줄 판정을 씀 TODO

> PRD: [prd.md](./prd.md) | 계획: [plan.md](./plan.md) | 테스트 계획: [testplan.md](./testplan.md) | 릴리스 노트: [release-notes.md](./release-notes.md) | GitHub: #243 | 상태: 🔄 구현 · 검증 완료, 사용자 확인(Q140 ~ Q147) · PR 리뷰 · 발행 대기

## 착수
- [x] Issue #243 본문, WI-0092(S9 · Q18) · WI-0087(DEC-4 · DEC-6) · WI-0096(init 애니메이션 설치 구절) 문서와 코드 확인 (2026-10-31)
- [x] main b1912a5 빌드로 init · check 37칸 측정 (AC1) (testplan 2.2: 침묵 · WARN 어긋남 15, 다른 패키지 안내 4)
- [x] 종전 안내대로 고쳐도 check 가 WARN 으로 남는지 스모크 (testplan 2.4)

## 결정
- [x] Q140 ~ Q147 을 권장안으로 진행, prd 1.2 · 7절에 선택지 · 근거 기록 (사용자 확인 대기)

## 구현
- [x] registry-core `tailwind-core.ts`: `animationPluginProblem` · `inspectTailwind4Animation` 추출, `checkAnimationPlugin` 이 사용(판정 · 문구 불변) (AC5)
- [x] cli `init/init.ts` `animationGuideLine`: Tailwind 4 줄 판정 · 「쓸 수 없음」 · 「줄 없음」 갈래, PnP 루트 전용은 종전 (AC2 · AC3 · AC7)
- [x] `packages/axis-cli/README.md` init 절 갱신

## 테스트
- [x] 새 `src/wi-0099-init-animation-css.test.ts` 28건(대표 21칸 init = check, 음성 대조 4, 공용 함수 2, 종료 코드 · 쓰기 1) (AC2 ~ AC7)
- [x] 바뀐 기존 테스트 0건 (AC7)
- [x] 음성 대조: 수정 전 init.ts 로 15 빨강 · 13 초록, 변이 2건 빨강, sha256 대조 원복 (AC8)
- [x] 수정본 37칸 재측정: 어긋남 15 → 3(Q143 · Q146), 다른 패키지 안내 4 → 0, check 출력 37/37 바이트 같음, init rc · 쓴 파일 같음 (AC2 · AC5 · AC6)
- [x] registry-core · cli · mcp type-check · lint rc 0, cli test 1266 · mcp test 251 통과 (AC9)

## 릴리스
- [x] changeset `@axis-ds/cli` patch + `@axis-ds/mcp` patch, `pnpm check-changeset-mcp-tokens` rc 0 (AC9)
- [x] release-notes.md
- [ ] 사용자 확인 Q140 ~ Q147(Master)
- [ ] PR 리뷰 · 머지 · 발행(Master)
