# WI-0027 릴리스 노트: 온톨로지 콘솔 템플릿 `ontology-console`

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | GitHub: #86 | 대상: 문서 사이트(Pages) 의 템플릿 JSON · 갤러리. npm 릴리스 없음

## 바뀐 점

`npx @axis-ds/cli template init ontology-console` 로 받는 새 템플릿이 생겼어요. cli · mcp 는 템플릿을 pages.dev 에서 받으므로 cli 를 올리지 않아도 배포 뒤 바로 받을 수 있어요.

| 항목 | 내용 |
|---|---|
| 화면 | 통합 뷰(`/`, 보조 상자 420px) · 목록(`/entities`, 검색 · 필터 칩 · 표, 줄 클릭 → 상세) · depth 상세(`/entities/[id]`, 뒤로 · 이전 · 다음, 세그먼트 탭) · 프로젝트 상세 2분할(`/projects/[id]`, 왼쪽 300px) |
| 셸 | 사이드바 240px(대메뉴 하나만 펼침 · 라이트 · 다크 전환) + AXIS Card 한 장, 100vh 고정 · 카드 안 스크롤, 1199px 이하 1열 |
| 브랜드 | 처음부터 ontology: `<html data-brand="ontology">` + `ThemeProvider defaultBrand="ontology"`, `globals.css` 브랜드 import, `axis.config.json` 의 `brand` |
| 컴포넌트 | `@axis-ds/ui-react` 의 Button · Badge · Card · Table · Tabs · Input 조립. 새 core 컴포넌트 없음 |
| 의존성 | `@axis-ds/tokens` · `@axis-ds/ui-react` · `@axis-ds/theme` `^1.8.2`(템플릿 중 ui-react · theme 를 쓰는 첫 템플릿), `lucide-react`, `tailwindcss-animate` |
| 규칙 검사 | `npm run check:ontology`: 엠 대시 · 느낌표 문구 · 한쪽 색 선 · 카드 그림자 · 팔레트 밖 색. 위반이면 rc 1 과 `파일:줄` |
| 예시 데이터 | 가상(주문 · 재고 도메인), 실제 회사 · 개인 이름 없음 |
| 갤러리 | 새 category `console`(Console 탭) |

## 저장소 안 변경

- `apps/web/src/lib/template-types.ts`: `TemplateCategory` 에 `console`, `templateCategories` 맵에 항목
- `apps/web/src/app/templates/page.tsx`: `console` 아이콘(`PanelsTopLeft`)
- `apps/web/package.json`: `@axis-ds/theme: workspace:*`(템플릿 파일을 type-check · build 가 함께 컴파일해서, hoist 에 기대지 않음)
- `scripts/template-smoke.mjs`: 기본 slug 를 `index.json` 의 로컬 템플릿에서 계산, slug 별 추가 판정 표(ontology-console 은 빌드 HTML 의 `data-brand="ontology"`)
- `packages/axis-cli/src/init/init.test.ts`: 템플릿 개수 4 고정 대신 0건만 막음(같은 파일 clsx 테스트와 같은 방식). 테스트 파일이라 발행물(`dist`)에는 영향 없음
- 생성물 `apps/web/public/templates/ontology-console.json` · `index.json`(43개)

## 발행 · 배포

- changeset 없음. 발행 패키지 소스(`packages/*/src` 의 테스트 밖 파일) 변경 0, `@ax/web` 은 미발행
- **머지 조건**: npm 에 `@axis-ds/tokens` · `ui-react` · `theme` 1.8.2 가 있어야 해요(PRD D6). 2026-10-26 측정 중 발행을 확인했고(tokens 1.8.2 2026-10-26T09:56Z, cli 1.7.3 · mcp 1.4.3), 결과 앱은 npm 발행본으로 다시 쟀어요. Release 쪽 발행본 재측정이 끝났는지는 머지 전에 확인해요
- 머지는 Release 머지와 간격을 두고 단독 push, Deploy Production 완료 뒤 pages.dev 색인 · 상세 JSON 확인(AC1 · AC8)

## 알려진 제한 · 후속

- `axis check` · MCP `axis.check_project` 는 이 템플릿의 규칙 검사를 실행하지 않아요(FR-4b 후속)
- 수정 화면 · 검토 패널 · 마크다운 편집기 · 칸반 · 에이전트 대화 · 기록 · 로그인 · 노드 캔버스는 후속 WI
- 결과 앱 axe 측정은 로컬 기록이고 CI 에 연결하지 않았어요(D7)
- `axis template apply ontology-console -y` · MCP `apply_template` 는 기존 `axis.config.json` 을 덮어써요(AC9 측정, WI-0088 과 같은 부류)
