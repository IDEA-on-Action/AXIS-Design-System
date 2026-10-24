# WI-0054: Avatar 하이드레이션 전 이미지 오류 fallback 전환 TODO

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | 릴리스 노트: [release-notes.md](./release-notes.md) | GitHub: #148 | 상태: 구현 · 검증 완료(2026-10-24), PR 대기

## 실측 · 원인
- [x] SSR + 지연 하이드레이션 fixture 로 재현(chromium · firefox · webkit, 수정 전 깨진 src 가 img 로 남음)
- [x] 부수 결함 재현(ok → 깨진 src → ok 에서 fallback 고정)
- [x] 원인 C1 · C2 줄 번호 정리
- [x] SVG 예외 근거 실측(크기 0 SVG 는 complete · naturalWidth 0 인데 decode 이행)

## 구현 (FR-1~FR-5)
- [x] `packages/axis-ui-react/src/avatar/avatar.tsx`: 마운트 · src 변경 시 `complete && naturalWidth === 0` 후보를 `decode()` 거부로 확정
- [x] 실패 상태를 「실패한 src」로 저장, src 변경 시 렌더 중 초기화(C2)
- [x] `scripts/client-modules.mjs` avatar 근거 문구 갱신(useEffect · useRef 추가)

## 테스트 (AC1 · AC2)
- [x] 단위 테스트 9건 추가(합계 20), 음성 대조 6 실패
- [x] 변이 M1~M8, M8 은 등가 변이로 생존(사유 testplan 1.2)
- [x] Playwright SSR 하이드레이션 실측: 수정 전 실패 · 수정 후 통과, 세 엔진 같음, dist 로도 1회

## 생성물 · 릴리스
- [x] 레지스트리 스크래치 대조: version 외 차이 0, public/r 변경 없음
- [x] library `refresh-axis`: axis-avatar 항목 4개 파일 반영, version 유지, 재실행 변경 0
- [x] changeset `.changeset/wi-0054-avatar-hydration-fallback.md`(ui-react patch)
- [x] 게이트(AC3): type-check · lint · test · build(--force, Cached 0) · test:registry · pack-smoke · check-library-links
- [ ] PR 생성 · 머지 · 배포
- [ ] 배포 뒤 발행본 실측(AC4)
