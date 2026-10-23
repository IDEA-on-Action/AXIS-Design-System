# WI-0052: StreamingText 표시 결함 수정 TODO

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | 릴리스 노트: [release-notes.md](./release-notes.md) | GitHub: #146 | 상태: 구현 · 검증 완료(2026-10-23), 배포 대기

## 1단계 실측 · 원인
- [x] 재현: jsdom + fake timer, React 18.3.1 · 19.2.3, StrictMode 켬 · 끔, 시나리오 A~D (D 는 음성 대조)
- [x] 발행본 `@axis-ds/agentic-ui@1.5.0` dist 에 같은 코드 확인
- [x] 원인 C1~C5 줄 번호 정리
- [x] 수정 시제품(visibleLength + slice)으로 A~D 통과 확인
- [x] 결정 D1~D7 반영(2026-10-23 사용자, 모두 권장안)

## FR-1~FR-6 컴포넌트
- [x] `packages/axis-agentic-ui/src/streaming-text/index.tsx` 를 표시 길이 상태 + 코드 포인트 slice 구조로 교체
- [x] onComplete ref 화 · 따라잡을 때 1회 호출(D1)
- [x] 이어 붙임 · 통째 교체 처리(D2 · D3), 코드 포인트 단위(D4)

## 테스트 (AC1 · AC2)
- [x] `src/streaming-text/streaming-text.test.tsx`: StrictMode 켬 · 끔 × 9 시나리오 = 18건
- [x] 음성 대조: 수정 전 소스 13 실패 · 5 통과
- [x] 변이 M1~M7 모두 검출(M7 은 G 추가 뒤)
- [x] React 19.2.3 일회 실측 18/18

## FR-7 생성물 · 릴리스
- [x] `pnpm build:registry` 재생성(streaming-text 항목과 sha256 2줄만 변경, templates 변경은 되돌림)
- [x] changeset `.changeset/wi-0052-streaming-text-display.md`(agentic-ui patch), testplan.md · release-notes.md
- [x] 게이트(AC3): type-check · lint · build · test(모두 --force, Cached 0) · test:registry · pack-smoke · registry-install-smoke
- [x] 배포 뒤 발행본 실측(AC4): `@axis-ds/agentic-ui@1.5.1` + React 19.2.3 jsdom, StrictMode 끔 · 켬 모두 「스트리밍 완료 문장」 · onComplete 1회. 음성 대조 1.5.0 은 끔 「undefined」 반복 · 켬 빈 화면(2026-10-24)
