# WI-0060: library 상세 데이터 slug 충돌 PRD

> 작성일: 2026-10-25 | 버전: v1.0 | 작성자: Sinclair Seo | WI: WI-0060 | GitHub: #159 | 우선순위: P3 | 상태: Approved (2026-10-25 사용자 결정, project-todo 「배치 4 결정」)
> 기준: `main` be0ba59 (linked 4패키지 1.7.0 · cli 1.6.1 · mcp 1.3.4 배포됨, WI-0067 머지) | 분리 원천: WI-0057 E4
> 표기: **측정**(이번에 실행해 얻은 값) · **추정**(실행하지 않음)

---

## 1. 개요

### 1.1 문제

- `apps/web/public/library/index.json` 은 129 항목(shadcn 47 · monet 34 · axis 48)인데 상세 데이터는 `components/<slug>.json` 99개였어요. 같은 slug 를 쓰는 30쌍(전부 shadcn + axis)이 파일 하나를 나눠 썼어요(측정).
- 상세 화면은 category 를 버리고 `/library/components/<slug>.json` 만 읽어서, 30쌍 중 25쌍은 shadcn 상세에 AXIS 코드 · AXIS 배지 · `npx @axis-ds/cli add` 가 나오고, 5쌍(alert · avatar · progress · skeleton · tooltip)은 반대로 AXIS 상세에 shadcn 데이터(코드 없음)가 나왔어요(측정, main 정적 산출물 브라우저 실측 30건 불일치).
- 30쌍 중 5쌍(accordion · button · collapsible · command · toggle, 모두 ui 카테고리)은 상세 주소 `/library/ui/<slug>` 자체가 같아 129 항목에 정적 페이지가 124개뿐이었어요(측정).
- 이슈 본문의 「충돌 10개 · 108 항목 vs 98 파일 · axis 가 덮어쓰는 한 방향」은 WI-0057 착수 전 수치예요. WI-0057 머지(006836a) 뒤 30쌍 · 양방향이 됐어요(배치 4 브리프 측정).

### 1.2 결정 (2026-10-25 사용자, 배치 4 브리프 · 반박 검토 뒤)

| # | 결정 | 내용 |
|---|---|---|
| D1 | (마) 충돌 5개만 새 slug | 기존 124 URL 유지. 같은 URL 을 쓰던 5개의 shadcn 항목만 slug 를 `shadcn-<slug>` 로(예: `/library/ui/shadcn-button`) 바꿔 129개 모두 정적 페이지. 쿼리 파라미터 방식은 쓰지 않음 |
| D2 | 평면 id 키 | 상세 데이터 파일은 `components/<id>.json`(예: `axis-button.json` · `shadcn-button.json`). 비재귀 검사(check-library-links · check-library-remote-links)를 그대로 씀 |
| D3 | AXIS 가 기존 URL 유지 | 옛 5개 URL(`/library/ui/button` 등)은 지금처럼 AXIS 항목을 보임. 쓰지 않는 링크를 남기지 않음 |
| D4 | 범위 밖 | 코드 없는 외부 항목(shadcn 47 · monet 34)의 상세 화면 개선 |

### 1.3 범위 밖

- shadcn · monet 항목 코드 채우기(원천 데이터가 레포에 없음, 원격 수집 필요), 상세 화면 개편(D4)
- 레지스트리 `apps/web/public/r` · mcp: library 를 읽지 않아 바뀌지 않음(측정, 2.3)
- 레포 밖에서 옛 `components/<slug>.json` 을 직접 읽는 소비자 수(추정 불가, 미측정)

## 2. 요구사항

- FR-1 상세 데이터 파일은 항목마다 하나, 이름은 항목 id(`components/<id>.json`). 항목이 가리키지 않는 파일은 0
- FR-2 같은 (category, slug) 를 쓰는 항목이 있으면 AXIS 항목이 slug 를 지키고(AXIS 가 없으면 순서상 첫 항목), 나머지는 `<source>-<slug>`. 카테고리가 다르면 바꾸지 않음. 한 주소에 AXIS 가 둘이거나 바꾼 뒤에도 겹치면 멈춤. 같은 입력에 다시 돌려도 결과가 같음(`resolveRouteSlugs`, cli `publisher.ts` 한 곳)
- FR-3 cli `axis library publish`(Publisher) 와 `axis library refresh-axis` 가 FR-1 · FR-2 를 같은 함수로 적용. refresh 는 바뀐 외부 항목의 slug 를 index · search-index(url 포함) · categories · 상세 파일에 같은 값으로 쓰고, 외부 파일 내용이 categories 항목과 같으면 옛 바이트를 옮김. `shadowedAxis` 대신 `renamedSlugs` 를 알림
- FR-4 웹 상세 화면(`/library/[category]/[slug]`)은 빌드 때 index.json 에서 (category, slug) 로 항목을 골라 그 id 의 파일을 읽음. 없으면 notFound. index.json 이 없으면 기본 경로로 넘어가지 않고 빌드 실패. 설치 명령은 원본 이름(id 에서 `<source>-` 를 뗀 값)이라 `shadcn-button` 상세도 `npx shadcn@latest add button`
- FR-5 `check-library-links` 규칙 4 를 「항목마다 `components/<id>.json`, 파일의 id · slug · category · source 가 항목과 같음, 남는 파일 위반」으로, 규칙 6 「상세 주소 (category, slug) 유일 · search-index url · categories slug 일치」 추가. 「slug 충돌 허용」 안내 제거

### 2.1 화면 변화 (사용자에게 보이는 것)

| 주소 | 이전 | 이후 |
|---|---|---|
| shadcn 25개(예: `/library/data-display/badge`) | AXIS 코드 · AXIS 배지 · `npx @axis-ds/cli add badge` | shadcn/ui 배지 · `npx shadcn@latest add badge` · 「코드가 없습니다」(다른 외부 56개와 같은 상태, D4) |
| AXIS 5개(예: `/library/ui/alert`) | shadcn/ui 배지 · 코드 없음 | AXIS 배지 · AXIS 코드 |
| 같은 URL 5개(`/library/ui/button` 등) | AXIS(shadcn 항목은 페이지 없음) | AXIS 그대로 + shadcn 은 `/library/ui/shadcn-button` 등 새 페이지 |
| 데이터 URL `/library/components/<slug>.json` | 99개 | 없어짐, `/library/components/<id>.json` 129개 |

### 2.2 영향 범위 전수 (측정, 브리프 목록을 이 브랜치에서 다시 셈)

| 대상 | 측정 | 결과 |
|---|---|---|
| 레지스트리 r/ sha256 | r/ 32파일 `library` 0건(grep rc 1), 대조군 `sha256` 60 · `axis-design-system.pages.dev` 41 | 영향 없음. build:registry 뒤 diff 는 version 2줄뿐이라 되돌림, r/ · mcp 변경 0 |
| mcp registry-guard 하드코딩 | `packages/axis-mcp` 의 `library` 는 CHANGELOG 1건뿐, registry-guard 는 r/ 를 읽음 | 영향 없음, mcp 테스트 143 통과 |
| check-library-links | 규칙 4 강화 · 규칙 6 추가 | 신판 rc 0, 구판(main) rc 1(위반 233) |
| check-library-remote-links | 수집 단계(비재귀 readdir)를 구판 · 신판에 그대로 실행 | URL 109 = 109, 한쪽에만 0 |
| axis library publish | Publisher 파일 경로 · slug | 테스트 2건 추가 |
| refresh-axis | 파일 키 · slug · shadowedAxis 제거 | 테스트 갱신 · 1건 추가, 실데이터 재실행 쓰기 0 |
| guidance.test.ts | library 경로 2곳(`step-timeline.json` → `axis-step-timeline.json`) | 갱신, 통과 |
| 문서 링크 | 레포의 `/library/<cat>/<slug>` · `library/components` 참조 | 앱 소스 1곳(상세 fetch, 고침), 나머지는 WI-0024 · 0025 · 0052 · 0057 이력 서술(당시 사실이라 그대로) |

## 3. 수용 기준 (AC)

- AC1 129 항목 각각 `components/<id>.json` 이 있고 파일 id · slug · category · source 가 항목과 같음, 남는 파일 0
- AC2 상세 주소 129개가 모두 다르고, 정적 산출물에 상세 HTML 129개. 각 화면이 그 항목의 이름 · 소스 배지 · 설치 명령 · 코드 유무를 보임(브라우저 실측 129/129). 수정 전 main 은 같은 측정에서 불일치(음성 대조)
- AC3 기존 124 URL 유지, 옛 5개 URL 은 AXIS 항목을 보임
- AC4 check-library-links 신판 rc 0 · 위반 0, 구판 rc 1. 단일 변이(slug 되돌림 · 파일 바꿔치기)도 rc 1. 사이트 링크 48 · 항목 129 · 파일 129 로 0 이 계측 실패가 아님
- AC5 refresh-axis 두 번째 실행 쓰기 0 · 삭제 0 · 변경 0
- AC6 레지스트리 r/ · mcp 바이트 불변, test:registry · mcp 테스트 통과
- AC7 turbo lint · type-check · build · test(--force), frontend.yml run 단계 전체, E2E static(a11y · nontext · demo) · tokens 통과
- AC8 (배포 뒤, Master) pages.dev 에서 `/library/data-display/badge/` 가 shadcn-badge, `/library/ui/badge/` 가 axis-badge, `/library/ui/alert/` 가 axis-alert, `/library/ui/shadcn-button/` 200

## 4. 릴리스

- `@axis-ds/cli` patch changeset(`.changeset/wi-0060-library-slug.md`). linked 4패키지 · mcp 는 변경 없음
- 사용자 결정: 배치 4 ② 머지 뒤 한 번에 발행(linked 1.8.0 · cli 1.6.2 · mcp 1.3.5). 이 WI 의 Release PR 은 머지하지 않음(Master 몫)
- 웹(라우트 · library 데이터)은 Cloudflare Pages 배포로 반영

## 5. 위험

- 배치 4 ② 는 ui-react · agentic-ui 를 바꾸므로 이 구조(`components/<id>.json`) 위에서 `pnpm library:refresh-axis` 를 다시 돌려야 해요. 구판 cli dist 로 생성하면 옛 slug 파일이 되살아나지만 check-library-links 규칙 4 가 CI 에서 rc 1 로 막아요(측정, 변이 2)
- 옛 데이터 URL `/library/components/<slug>.json` 은 404 가 돼요. 레포 안 소비자는 상세 화면 하나뿐(측정), 레포 밖은 미측정
- shadcn 25개 상세의 코드 탭이 AXIS 코드에서 「코드가 없습니다」로 바뀌어 퇴보처럼 보일 수 있어요(원천 데이터 부재, D4)
