# WI-0052: StreamingText 표시 결함 수정 TODO

> PRD: [prd.md](./prd.md) | GitHub: #146 | 상태: 1단계 완료(실측 · 원인 · 초안), 결정 D1~D7 대기

## 1단계 실측 · 원인
- [x] 재현: jsdom + fake timer, React 18.3.1 · 19.2.3, StrictMode 켬 · 끔, 시나리오 A~D (D 는 음성 대조)
- [x] 발행본 `@axis-ds/agentic-ui@1.5.0` dist 에 같은 코드 확인
- [x] 원인 C1~C5 줄 번호 정리
- [x] 수정 시제품(visibleLength + slice)으로 A~D 통과 · 기존 테스트 83개 · tsc · eslint 통과 확인(커밋 안 함)
- [ ] 결정 D1~D7 반영(PRD 2절)

## FR-1~FR-6 컴포넌트
- [ ] `packages/axis-agentic-ui/src/streaming-text/index.tsx` 를 표시 길이 상태 + `text.slice` 구조로 교체
- [ ] onComplete ref 화 · 전환 시 1회 호출(D1)
- [ ] 이어 붙임 · 통째 교체 처리(D2 · D3), 글자 단위(D4)

## 테스트 (AC1 · AC2)
- [ ] `src/streaming-text/streaming-text.test.tsx`: StrictMode 켬 · 끔 × A · B · C · D, onComplete 횟수
- [ ] 수정 전 소스로 실패, 수정 후 통과(음성 대조) 기록
- [ ] React 19.2.3 1회 실측 기록

## FR-7 생성물 · 릴리스
- [ ] `pnpm build:registry` 로 `apps/web/public/r/agentic-streaming-text.json` 재생성(templates 변경은 되돌림)
- [ ] changeset(D7), testplan.md · release-notes.md
- [ ] 기존 게이트(AC3), 배포 뒤 발행본 실측(AC4)
