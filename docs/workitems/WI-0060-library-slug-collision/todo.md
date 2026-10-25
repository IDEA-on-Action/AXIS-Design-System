# WI-0060: library 상세 데이터 slug 충돌 TODO

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | 릴리스 노트: [release-notes.md](./release-notes.md) | GitHub: #159 | 상태: 구현 · 검증 완료(2026-10-25), PR 대기

## 결정
- [x] 사용자 결정 D1~D4 기록(배치 4 결정, PRD 1.2)

## 구현
- [x] cli `publisher.ts`: `resolveRouteSlugs` · `withRouteSlugs` · `componentFileOf`, Publisher 가 `components/<id>.json` 과 바뀐 slug 로 씀
- [x] cli `axis-refresh.ts`: 파일 키 id, 같은 주소 외부 항목 slug 재지정(index · search url · categories · 파일), 옛 파일 삭제, `shadowedAxis` → `renamedSlugs`, CLI 출력 문구
- [x] 웹 `[category]/[slug]/page.tsx`: index.json 에서 (category, slug) 로 항목을 골라 id 전달, 없으면 notFound, index.json 없으면 빌드 실패(기본 경로 폴백 제거)
- [x] 웹 `component-detail-content.tsx`: `components/<id>.json` fetch, 설치 명령은 원본 이름
- [x] `scripts/check-library-links.mjs`: 규칙 4 강화 · 규칙 6 추가, 충돌 허용 안내 제거
- [x] `guidance.test.ts` library 경로 2곳
- [x] 생성물: `pnpm library:refresh-axis`(쓰기 132 · 삭제 99, slug 변경 5)

## 테스트
- [x] cli 단위 테스트 738건(publisher 2 · resolveRouteSlugs 5 · refresh 1 추가, 기존 refresh 4건 기대값 갱신)
- [x] check-library-links 신판 rc 0 · 구판 rc 1 · 단일 변이 2종 rc 1
- [x] refresh-axis 재실행 쓰기 0 · 삭제 0
- [x] 정적 산출물 상세 HTML 129(main 124), 브라우저 실측 129/129 일치(main 99/129, 음성 대조)
- [x] 원격 링크 수집 집합 구판 · 신판 109 = 109
- [x] 게이트: turbo lint · type-check · build · test(--force, 하나씩), frontend.yml run 단계 10개, E2E static a11y 40 · nontext 8 · demo 8 · tokens 22

## 생성물 · 릴리스
- [x] `public/templates` 는 updatedAt 만 바뀐 것(내용 diff 0)을 되돌림, 레지스트리 version 1.5.0 유지(build:registry diff 는 version 2줄뿐이라 되돌림)
- [x] changeset `@axis-ds/cli` patch
- [ ] PR · 머지(Master)
- [ ] Release PR 은 배치 4 ② 머지 뒤 한 번에(Master)
- [ ] 배포 뒤 pages.dev 실측(AC8)
