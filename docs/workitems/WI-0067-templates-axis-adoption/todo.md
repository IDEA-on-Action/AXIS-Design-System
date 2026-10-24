# WI-0067: 템플릿 4종 AXIS 토큰 전환 TODO

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | 릴리스 노트: [release-notes.md](./release-notes.md) | GitHub: #181 | 상태: 구현 · 검증 완료(2026-10-25), PR 대기

## 결정
- [x] 사용자 결정 D1~D6 기록(배치 4 브리프 권장안, PRD 1.2)

## 구현
- [x] 4종 `globals.css`: tokens CSS 2줄 + ontology 브랜드 import 주석 줄, 자체 `:root` · `.dark` 변수 블록 제거, `* { @apply border-border }` 유지(preflight 테두리 색 대응, 실측으로 필요 확인)
- [x] 4종 `tailwind.config.ts`: `presets: [axisPreset]`, 같은 이름 theme.extend 제거. hr-dashboard 는 `status` · `status-soft` · `fade-in-up` 만 로컬 확장
- [x] hr-dashboard: chart-success · warning · alert → `--axis-status-*`, chart-blue · zone 4색 → preset `chart-1~5`, glass 원천 AXIS 변수, 진입 애니메이션 `motion-reduce:!animate-none motion-reduce:!opacity-100`, 범례 · 프로젝트 현황 색도 같은 원천으로
- [x] dashboard stats-card 하드코딩 green · red 4건 → AXIS 상태 변수(라이트 `-strong` · 다크 기본)
- [x] 4종 `layout.tsx`: Inter 제거, `pretendard` 동적 서브셋 CSS import, body 글꼴 클래스 제거, 브랜드 켜는 법 주석
- [x] 4종 `template.json` · `files/package.json`: `@axis-ds/tokens ^1.7.0` · `pretendard ^1.3.9`, description · features 정정, template version 0.2.0
- [x] theme-only README · page.tsx 문구 정정
- [x] `build-template-index.mjs`: 두 곳 의존성 불일치 시 빌드 실패(D5)
- [x] `scripts/template-smoke.mjs`: `--axis-*` 정의 1건 이상 · 전환 전 `--primary` 0건 판정 추가
- [x] cli 테스트: theme-only 동결 fixture(`test/fixtures/theme/templates/theme-only-pre-wi0067.json`) + layout `theme-only-axis` + 전환 후 check 기준선(D4)
- [x] 가이드: `theme-customization.md` 「템플릿에서 ontology 켜기」, `quick-start.md` 「6. 템플릿에서 시작하기 · 템플릿에서 ontology 켜기」

## 테스트
- [x] cli 단위 테스트 730건 통과, 동결을 빼면 8건 실패(A/B)
- [x] 생성기 일치 검사 음성 대조(불일치 주입 rc 1)
- [x] template-smoke 4/4 PASS, 고치기 전 JSON 4/4 FAIL(음성 대조)
- [x] 실경로: 발행본 cli 1.6.1 · 4종 init → pnpm install → check(tailwind · globals PASS, fail 0)
- [x] 브라우저 실측: theme-only · hr-dashboard x 기본 · ontology x 라이트 · 다크 12상태 일치, 끄면 기본값 복귀, Pretendard 로드
- [x] 게이트: turbo lint · type-check · build · test(--force, 하나씩), frontend.yml run 단계, E2E static(a11y · nontext · demo) · tokens

## 생성물 · 릴리스
- [x] `build:templates` 결과 커밋(상세 JSON 4개 + index.json, 둘 다 내용 변경)
- [x] changeset 없음(npm 릴리스 없음, Pages 배포만)
- [x] PR 생성 · CI · 머지(2026-10-25 #200, CI pass d86a968, 머지 bb7f1ac)
- [x] 배포 뒤 pages.dev `templates/<slug>.json` 4개가 커밋본과 `updatedAt` 외 동일(AC9) (2026-10-25 5/5 일치, 발행본 cli 실경로 4/4 PASS)
- [x] 이슈 #181 종료 · project-todo · wi-mapping ✅ (2026-10-25)
