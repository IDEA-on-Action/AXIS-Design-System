# WI-0027: 온톨로지 콘솔 템플릿 TODO

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | 릴리스 노트: [release-notes.md](./release-notes.md) | GitHub: #86 | 상태: 구현 · 로컬 검증 완료(2026-10-26), PR 대기

## 결정
- [x] PRD v0.6: 낡은 전제 9건 정정, MVP · 후속 분리, 결정 D1 ~ D11 기록

## 구현
- [x] `apps/web/templates/ontology-console/template.json`(category `console`, 의존 `^1.8.2` 셋 · lucide-react · tailwindcss-animate)
- [x] `files/`: package.json(`check:ontology`) · tsconfig · postcss · tailwind.config(axisPreset + ui-react dist content + animate) · axis.config.json(D10)
- [x] `files/app/layout.tsx`: `<html data-brand="ontology">` + `ThemeProvider defaultBrand="ontology"`, `globals.css` 브랜드 import 3줄
- [x] 화면 4종: 통합 뷰(`/`, 보조 상자 420) · 목록(`/entities`, 검색 · 필터 칩 · Table, 줄 클릭) · depth 상세(`/entities/[id]`, 뒤로 · 이전 · 다음, 세그먼트 탭) · 프로젝트 상세(`/projects/[id]`, 왼쪽 300)
- [x] 셸: 사이드바 240(대메뉴 하나만 펼침) + 카드 한 장, 100vh · 카드 안 스크롤, 1199px 이하 1열
- [x] `files/lib/demo-data.ts`(가상 데이터) · `files/lib/utils.ts`(cn)
- [x] `files/scripts/check-ontology.mjs`(FR-4a 규칙 5종)
- [x] 저장소 쪽 `README.md`

## 갤러리 · 생성물 · 스모크
- [x] `template-types.ts` `console` 유니온 · 맵, `templates/page.tsx` 아이콘
- [x] `apps/web/package.json` 에 `@axis-ds/theme: workspace:*`(D8), lockfile
- [x] `scripts/template-smoke.mjs`: 기본 목록을 index.json 에서 계산, slug 별 data-brand 판정
- [x] 생성물 `public/templates/ontology-console.json` · `index.json` 커밋, 기존 4종 `updatedAt` 만 바뀐 것은 되돌림, r/ version churn 되돌림

## 테스트
- [x] turbo lint · type-check · build · test 각각 `--force`(Cached 0)
- [x] frontend.yml run 단계 전체
- [x] E2E static: a11y(건수 가드) · nontext · demo · tooltip · library · tokens
- [x] 결과 앱: template-smoke(init → install → build) · data-brand · check:ontology(변이 rc 1) · axis check fail 0 · axe 라이트 · 다크 · AC4 치수
- [x] AC9: apply 대상에 config 가 있을 때 동작 기록(cli 는 충돌 표시 · `-y` 때만 덮음, MCP 는 확인 없이 덮음 · 소스 판독)
- [x] cli `init.test.ts` 템플릿 개수 고정(4) 해소

## 구현 검토 반영 (2026-10-26)
- [x] 사이드바: 접힌 하위 목록이 `.flex` 때문에 보이던 결함 수정(접히면 display 클래스를 빼고 `hidden` 만), 클라이언트 이동으로 경로 그룹이 바뀌면 그 그룹을 펼침
- [x] check:ontology: 클래스 묶음(className 표현식 · cn() 인자) 합산 판정, style 객체 한쪽 색 선 · Card boxShadow, CSS · style 이름 색, 카드 모양 div 그림자, 따옴표가 섞인 JSX 문구 느낌표, 앵커 `#add` 오탐 제외
- [x] 변이 27종 A/B(구판 17/27 · 신판 27/27), testplan 8절
- [x] PRD v0.6.1(D1 ~ D11 표기, ListToolbar 정정, FR-4a 범위), README 판정 범위 · 한계 · 지원 폭
- [x] project-todo 배치 5 비고 갱신, origin/main 병합(project-todo 충돌 해소)
- [ ] 후속: a11y 경로에 `/templates/ontology-console/` 를 넣을지(건수 가드 236 → 변경), registry-core `axis-config.ts:13` 주석(brand 를 템플릿 config 도 씀) 정정

## 릴리스
- [x] changeset 없음 확인(발행 패키지 소스 변경 0, cli 테스트 파일 1개만 · 발행물 dist 무관)
- [ ] 머지 조건: npm 1.8.2 발행 · 재측정 뒤 단독 push(D6)
- [ ] 배포 뒤 AC1 · AC2(실경로) · AC8
