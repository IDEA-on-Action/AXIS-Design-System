# WI-0075: 비대화형 질문 처리 TODO

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | 릴리스 노트: [release-notes.md](./release-notes.md) | GitHub: #201 | 상태: ✅ 완료(2026-10-26, cli 1.7.0, #214 · Release #216). 실제 터미널 대화형 1회(사람)는 남음

## 결정
- [x] 성격별 처리 · `template init -y` · 공통 헬퍼 + parseAsync 안전망 · v0 · monet 포함 (PRD D1~D4, 배치 6 결정)
- [x] cli-smoke 에 비TTY 갈래 추가(판단 기록 testplan 4절), template-smoke CI 연결은 범위 밖

## 구현
- [x] `src/interactive.ts`: `isInteractive` · `ask`(비대화형이면 NonInteractiveError) · `noteDefault` · `failNonInteractive`
- [x] template init: 이름 없음 rc 1, `--dir` 없음 → `./<name>` + 1줄 알림, 비어 있지 않음 → rc 1 / `-y` 진행, `-y` 옵션
- [x] template apply: 충돌 + `-y` 없음 + 비대화형 → rc 1(쓰지 않음)
- [x] init: `-y` 없음 + 비대화형 → `-y` 와 같은 기본값 + 1줄 알림
- [x] init: `-y` 없음 + 비대화형 + 내용이 다른 utils.ts → rc 1 · 아무것도 쓰지 않음 · `-y` 안내(반박 검토 major)
- [x] v0 import(ZIP · 클립보드 포함) · monet import: 비대화형 rc 1 + 안내
- [x] add 의 `createConfirm` 을 공통 헬퍼로(동작 동일)
- [x] 진입점 `await program.parseAsync()` + NonInteractiveError → rc 1
- [x] 문서: quick-start · theme-customization 의 template init 안내에 `-y` · 비대화형 동작, cli README 「터미널이 아닌 곳에서 실행」 표, frontend.yml cli-smoke 주석

## 테스트
- [x] `template-apply.test.ts` 18 · `interactive.test.ts` 9 · `init.test.ts` +4(기존 대화형 2건은 판정 주입)
- [x] 수정 전 소스에서 12 failed(+ interactive.test 수집 실패), 변이 M1~M10 빨강 · 원복 sha 대조
- [x] 비TTY 매트릭스 15행 × stdin 2조건 전후(결함 7행 고침 · 정상 행 불변), 종료 코드 A/B 14종 동일, 안전망 P0~P3
- [x] cli-smoke 비TTY 12건(반박 검토 뒤 init utils.ts 덮어쓰기 갈래 2건 추가), 수정 전 dist 양성 대조 FAIL
- [x] turbo lint · type-check · build · test `--force`(Cached 0), frontend.yml run 단계 10종
- [ ] 실제 터미널 대화형 1회(사람)

## 릴리스
- [x] changeset `.changeset/wi-0075-template-init-noninteractive.md`(@axis-ds/cli minor)
- [x] PR · 머지(배치 6 순서 WI-0074 다음), Release PR 에서 cli 1.7.0 대조 (2026-10-25 #214 머지 4a5e185, Release #216 머지 61ae674 에서 cli 1.7.0, run 40205738223)
- [x] 발행본으로 매트릭스 재측정(AC7) (2026-10-26: 15케이스 x 신구 x stdin 2조건 60행, README 표와 일치, 1.6.2 음성 대조 무생성 재현. testplan 7절)
