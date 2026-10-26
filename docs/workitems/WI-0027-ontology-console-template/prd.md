# WI-0027: 온톨로지 콘솔 템플릿 PRD

> 작성일: 2026-10-15 | 버전: v0.6.1(2026-10-26, 착수 전 전제 갱신 · MVP 분리 · 결정 반영 · 구현 검토 반영) | 작성자: Sinclair Seo | WI: WI-0027 | GitHub: #86 | 상태: 결정 반영 · 구현 중
> 기준: `main` d7ae4a5(PR #228 WI-0079 · 0082 머지). 발행본은 linked 1.8.1 · cli 1.7.2 · mcp 1.4.2 이고, Release PR #229(linked 1.8.2 · cli 1.7.3 · mcp 1.4.3)가 진행 중이에요
> 표기: **측정**(이번에 실행해 얻은 값) · **계산**(값에서 유도) · **추정**(실행하지 않음)
> 선행(충족): WI-0025 FR-6 `defaultBrand` · FR-8 `brands/ontology`(1.3.0), WI-0026 밀도 토큰(1.7.0), WI-0067 템플릿 4종 AXIS 토큰 전환(Pages, #200), WI-0068 마크업 data-brand 우선(theme 1.7.0), WI-0028 FR-5 brand 검사(완료 2026-10-24), WI-0079 · 0082 ontology 대비 값(#228 머지). 남은 조건: npm 1.8.2 발행 · 재측정(머지 조건, 착수 조건 아님)

## v0.6 변경 요지

- v0.5(2026-10-20) 뒤 레포가 바뀌어 낡은 전제 9건을 정정했어요(1.4 표). 대표: 기존 템플릿 4종이 이제 `@axis-ds/tokens` 에 의존(WI-0067), `axis check` 는 고정 5항목이 아니라 5 + 조건부 4항목, `ThemeProvider` 는 이미 `defaultBrand` 를 받음, 문서 사이트 a11y 게이트는 CI 에 연결됨, WI-0028 FR-5 완료로 Q4 해소.
- 범위를 **MVP(이번 배포)** 와 **후속** 으로 나눴어요(1.3). MVP 는 cli · mcp 를 바꾸지 않아 npm 발행 없이 Pages 배포만으로 끝나요. FR-4 는 템플릿 안 스크립트(FR-4a)만 넣고 `axis check` · MCP 연동(FR-4b)은 후속 WI 예요.
- AC2 를 `apply`(create-next-app 위 덮어쓰기)에서 `init`(빈 디렉터리, WI-0037 이 보장하는 경로)으로 바꿨어요. `apply` 대상에 config 가 이미 있는 경우는 AC9 로 따로 봐요.
- 각 AC 에 실측 방법과 음성 대조를 붙였어요.
- 디자인 원본이 v0.28(2026-10-22 확정, 사용자 로컬 사본)까지 나온 것을 확인했고, 화면 정본을 v0.28 로 정했어요(1.5, D4).
- 결정 D1 ~ D11 을 2.0 에 모았어요(/goal 진행 중 권장안으로 확정).

---

## 1. 개요

### 1.1 배경
- 「온톨로지 플랫폼(가칭)」 프로토타입은 업무용 콘솔 화면 문법(바탕 위 사이드바 240px + 흰 콘텐츠 카드 한 장, 높이 고정, 카드 안 스크롤, 머리 · 레일 · 브레드크럼 없음)과 화면 패턴(목록 페이지 · depth 상세 · 2분할 · 통합 뷰 보조 상자 · 검토 패널 · 칸반 · 노드 캔버스 · 마크다운 편집기 · 에이전트 대화 · 기록)을 가지고 있어요.
- 이 패턴들은 제품 성격이 강해 WI-0025 에서 AXIS core 범위에서 뺐고, 템플릿으로 제공해요.
- AXIS 에는 `apps/web/templates/<slug>/`(template.json + files) 체계, 생성기 `apps/web/scripts/build-template-index.mjs`, `axis template list|info|apply|init|diff`, MCP `axis.list_templates` · `get_template` · `apply_template` · `diff_template` 가 있어요. cli · mcp 는 템플릿 JSON 을 실행 때 `https://axis-design-system.pages.dev/templates` 에서 받으므로(동봉 없음) 템플릿 추가는 Pages 배포만으로 반영돼요.

### 1.2 목표
- 온톨로지 콘솔 화면 문법을 AXIS core 컴포넌트와 `ontology` 브랜드로 조립한 템플릿 `ontology-console` 을 제공해요.
- 새 온톨로지 계열 제품이 `axis template init ontology-console` 한 번으로 같은 룩의 골격을 얻어요. 결과 앱은 처음부터(서버 HTML 부터) `data-brand="ontology"` 로 렌더돼요.

### 1.3 범위

**MVP(이번 WI 배포 단위, D3)**
- 앱 셸: 사이드바 240px(워크스페이스 이름 · 대메뉴 한 번에 하나만 펼침 · 하위 메뉴) + 콘텐츠 카드 한 장, 100vh 고정 · 카드 안 스크롤, 1199px 이하 1열
- 통합 뷰(`/`): 인사 · 현황 카드 · 보조 상자 420px
- 목록 페이지(`/entities`): ListHead · 도구줄(검색 + 필터 칩, `entity-list.tsx` 안) · Table, 줄을 누르면 depth 상세로
- depth 상세(`/entities/[id]`): DetailHead(뒤로 · 이전 · 다음), 절 사이 40px, 탭은 세그먼트
- 프로젝트 상세 2분할(`/projects/[id]`): 카드 안 왼쪽 열 300px + 오른쪽 본문
- 가상 예시 데이터(`lib/demo-data.ts`), 실데이터 · 인증 없음
- 템플릿 자체 규칙 검사 스크립트(`scripts/check-ontology.mjs`, 앱 안에서 `npm run check:ontology`). 결정적 규칙만(엠 대시 · 느낌표 · 한쪽 색 선 · 카드 그림자 · 팔레트 밖 리터럴 색). cli · mcp 는 바꾸지 않음(D2)
- 갤러리 category `console`(D1), template-smoke 기본 목록을 `index.json` 에서 계산(D9)

**후속(별도 WI)**
- 수정 화면(사이드바 없음 · EditBar + 변경 사유 팝업), 검토 패널, 마크다운 편집기, 칸반, 에이전트 대화, 기록, 로그인, 노드 캔버스 정적 배치, v0.26 ~ v0.28 신규 계열(Context · Use Case 편집 · CQ · 용어 · Source)
- FR-4b: template.json `checks` 필드와 `axis check` · MCP `axis.check_project` 연동(cli · mcp minor 발행)
- FR-5: 갤러리 · 상세 화면 미리보기 이미지 렌더링
- 해요체 · 금지 표현 검사(판정 기준이 레포에 없음, Q8)
- AC5b: 템플릿 결과 앱 axe 게이트의 CI 연결(D7)

**제외**: 노드 캔버스 편집(드래그 · 연결 그리기), 실제 데이터 연동 · 인증

### 1.4 v0.5 전제 정정 (2026-10-26 실측)

| v0.5 서술 | 실측 | 정정 |
|---|---|---|
| FR-2 「기존 템플릿 4개는 `@axis-ds/*` 에 의존하지 않고 Tailwind 로 직접 구현」 | 4종 template.json · files/package.json 모두 `@axis-ds/tokens ^1.7.0` · `pretendard ^1.3.9`(WI-0067 #200). `@axis-ds/ui-react` · `@axis-ds/theme` 의존은 0건(파일 내용 grep, 양성 대조 tokens 8건) | 「`@axis-ds/tokens` 의존은 이미 있음. ui-react · theme 를 의존하는 템플릿은 처음」. landing-page description 의 「AXIS 컴포넌트 패키지 없이」는 지금도 맞는 문장이라 고치지 않음 |
| FR-1 「ThemeProvider 는 defaultTheme · storageKey 만 받음, 1.3.0 배포 전제」 | `packages/axis-theme/src/index.ts:34` `defaultBrand?`, `:36` `brandStorageKey?`. 초기값 우선순위 저장값 > 마크업 data-brand > defaultBrand(WI-0068, theme 1.7.0) | 전제 충족. 단 서버 HTML 에 속성을 넣으려면 마크업 data-brand 가 필요(FR-1, D5) |
| FR-2 의존 버전 「1.3.0 이상」 | 밀도 토큰은 1.7.0(WI-0026), 마크업 우선은 theme 1.7.0, ontology 대비 값은 1.8.2(#228). 발행본 theme · ui-react 는 tokens 를 정확한 버전으로 고정해 가져감(`npm view @axis-ds/theme@1.8.1 dependencies` → `@axis-ds/tokens: 1.8.1`) | tokens · ui-react · theme 모두 `^1.8.2`(D6). 하한을 실제로 보장하는 것은 ui-react · theme 범위라 셋을 같이 맞춤 |
| FR-4 「axis check 와 MCP 는 고정 5개 항목」 | cli `template-check.ts:37-65` · mcp `tools/template.ts:392-452` 모두 고정 5 + 조건부 4(brand · brand.activation · tailwind.content · animation) | 「5 + 조건부 4」. 템플릿별 검사 확장 지점은 여전히 0건이라 신설은 후속(FR-4b) |
| FR-4 「WI-0028 FR-5 와 같은 runCheck 를 고침, 순서는 Q4」 | WI-0028 완료(2026-10-24, prd 머리말), brand 항목이 이미 runCheck 에 있음 | Q4 해소. Q4' 로 대체하고 D2 로 결정 |
| AC5 「a11y 게이트는 문서 사이트 9페이지, CI 미연결」 | `a11y-routes.cjs --count` 59경로 x 4조합 = 236건, frontend.yml 「E2E a11y」 단계로 CI 연결 · 건수 가드 | 문서 사이트 게이트는 CI 에 있음. **템플릿 결과 앱** 게이트가 없는 것은 그대로(D7) |
| AC2 「빈 Next 프로젝트에 apply 후 pnpm build」 | WI-0037 이 보장하는 경로는 빈 디렉터리 `init`(template-smoke). apply 위 빌드는 WI-0037 범위 밖으로 남김 | AC2 를 `init` 기준으로. apply 는 config 충돌 행만 AC9 |
| A1 「정본 v0.24, v0.26 은 Q7」 | 사용자 로컬에 v0.28(2026-10-22 확정) · 버전 목록(v0.29 작업본)까지 있음. 레포에 v0.28 언급 0건 | 1.5 표, 정본 v0.28(D4) |
| FR-1 category 「허용 5개」 | `template-types.ts:3` 그대로 5개. `templates/page.tsx:54` 탭은 `templateCategories` 키에서만 만듦. `TemplateCategory` 정의는 web 한 곳(cli · mcp · registry-core grep 0건, mcp 는 `z.string()`) | 유효. `console` 신설(D1) |

### 1.5 디자인 원본 (2026-10-26 실측, 사용자 로컬 사본 · 레포 밖)

| 판 | 위치 | 화면 수(버전 목록 기록) | `:root` 변수 | hex 집합 | `o-*` 클래스 | 240 · 420 · 300px 출현 |
|---|---|---|---|---|---|---|
| v0.24 | `Downloads/K-FDE Studio/온톨로지플랫폼_프로토타입_v0.24.html` | 31 | 64 | 기준 | - | - |
| v0.26 | 같은 폴더 `_v0.26.html` | 40 | 64(값 차이 0) | 차이 0 | 1039 | 7 · 7 · 18 |
| v0.28 | 같은 폴더 `Re__(v0.26)온톨로지_플랫폼_프로토타입.zip` 안 | 40 | 64(v0.26 대비 값 차이 0) | 차이 0 | 1088(+53 · -4, 주로 Use Case 편집 · Context) | 8 · 8 · 19 |

- MVP 화면이 쓰는 v0.28 셸 규칙(측정, `proto.css` 부분): `.o-app` 은 `grid-template-columns: var(--nav-w) minmax(0, 1fr); padding: 16px 18px 16px 0; column-gap: 8px`, `--nav-w: 240px`, `.o-nav` 왼쪽 안쪽 여백 18px, `.o-card` 는 `border-radius: var(--r-lg)`(12px) · `box-shadow: none`, `.o-split` 은 `var(--pane-w)`(300px) + 1px 선, `.o-content.open .o-side` 는 `width: 420px`, `.o-sec` 절 사이 40px, `@media (max-width: 1199px)` 에서 `.o-split` · 그리드가 1열.
- 「디자인 시스템 온톨로지 플랫폼」(claude.ai Design System 아티팩트, 예시 화면 18장)은 이 세션에서 열 수 없었어요(목록에 없음). A1 의 그 부분은 **확인 불가**.
- 프로토타입에는 실제 고객사 이름의 예시 데이터가 들어 있어요. 템플릿에는 옮기지 않고 가상 데이터를 써요(Q1).

---

## 2. 요구사항

### 2.0 결정 (2026-10-26, /goal 진행 중 권장안으로 확정)

| ID | 결정 | 근거 요약 |
|---|---|---|
| D1 | category `console` 신설(`apps/web/src/lib/template-types.ts` 유니온 · 맵 + `apps/web/src/app/templates/page.tsx` 아이콘) | `app` 은 외부 블록 15개가 차지해 그 속에 묻혀요. cli · mcp 는 category 를 문자열로 다뤄 발행이 따라오지 않아요 |
| D2 | FR-4 는 템플릿 안 스크립트 `npm run check:ontology` 만(FR-4a). `axis check` · MCP 연동(FR-4b)은 후속 | 목표 경로에 cli · mcp 변경이 필요 없어요. 4차 재계획(project-todo)의 「WI-0027 위에서 runCheck 확장」 순서는 이 결정으로 바뀌어, 배치 8(WI-0087 ~ 0090)은 WI-0027 과 병렬로 해도 돼요 |
| D3 | MVP 화면 = 셸 + 통합 뷰 + 목록 + depth 상세 + 프로젝트 상세 2분할 | AC4 치수(240 · 420 · 300)를 모두 덮는 최소 범위예요. 나머지 화면은 v0.27 ~ 0.28 에서도 계속 바뀌는 중이에요 |
| D4 | 화면 정본 v0.28 | 토큰은 세 판이 같고 MVP 화면 치수도 남아 있어요. 디자인 시스템 아티팩트 대조는 디자인 오너 몫으로 남겨요 |
| D5 | 브랜드는 `<html data-brand="ontology">` 마크업 + `ThemeProvider defaultBrand="ontology"` | 서버 HTML 로 판정할 수 있고 `setBrand` 도 유지돼요. theme 1.7.0 부터 마크업이 defaultBrand 보다 앞서고 check brand.activation 도 PASS 예요 |
| D6 | `@axis-ds/tokens` · `@axis-ds/ui-react` · `@axis-ds/theme` 모두 `^1.8.2` | 발행본 theme · ui-react 가 tokens 를 정확한 버전으로 고정해서, 하한은 셋을 같이 맞춰야 보장돼요. 착수 · PR CI 는 1.8.2 발행 전에도 돼요(apps/web 은 `workspace:*`). **머지는 npm 1.8.2 발행 · 재측정 뒤**여야 해요(먼저 머지하면 공개된 템플릿의 install 이 ETARGET) |
| D7 | 템플릿 결과 앱 axe 게이트는 로컬 측정 + testplan 기록, CI 연결은 후속 | npm install · next build · 브라우저가 필요해 template-smoke 처럼 CI 밖이 현실적이에요 |
| D8 | `apps/web` dependencies 에 `@axis-ds/theme: workspace:*` 명시 | type-check · next build 가 템플릿 파일을 함께 컴파일하는데 theme 는 hoist 로만 풀렸어요 |
| D9 | template-smoke 기본 목록을 `index.json` 의 로컬 템플릿에서 계산하고, slug 별 추가 판정(data-brand)은 표로 둠 | 자라는 목록을 복제하면 다음 템플릿에서 다시 빠져요 |
| D10 | `files/axis.config.json` 은 기본 config 다섯 필드(`$schema` · `template` · `componentsDir` · `tailwindConfig` · `globalCss`) + `brand` | init 은 config 가 있으면 만들지 않으므로(`template-apply.ts:295-300`) 이 파일이 그대로 쓰여요. 다섯 필드가 다 있어야 check · add 가 종전대로 돌아요 |
| D11 | Tailwind 3 `content` 는 `./node_modules/@axis-ds/ui-react/dist/**/*.{js,mjs}` 형태로 고정 | `axis check` tailwind.content 가 단독 앱에서 제안하는 형태와 같아요. WI-0090(모노레포 루트 설치본) 은 init 으로 만든 단독 앱에 해당하지 않아요 |

### 2.1 기능 요구사항
- FR-1: `apps/web/templates/ontology-console/template.json`(category `console`) 과 `files/` 를 작성해요. 루트 레이아웃은 `<html lang="ko" data-brand="ontology" suppressHydrationWarning>` 로 서버 HTML 에 브랜드를 넣고 `<ThemeProvider defaultBrand="ontology">` 로 감싸 런타임 `setBrand` · `setTheme` 를 쓸 수 있게 해요. `globals.css` 는 `@axis-ds/tokens/css` · `@axis-ds/tokens/css/shadcn` · `@axis-ds/tokens/css/brands/ontology` 3줄을 `@tailwind` 앞에 둬요(주석 아님). `files/axis.config.json` 은 D10 형식이에요.
- FR-2: 화면 패턴은 템플릿 내부 컴포넌트(`files/components/ontology/*`)로 두고 AXIS core(Button · Badge · Card · Table · Tabs · Input)를 조립해요. 새 core 컴포넌트는 만들지 않아요. 기존 4종은 `@axis-ds/tokens` 만 쓰므로 `@axis-ds/ui-react` · `@axis-ds/theme` 의존은 이 템플릿이 처음이에요. template.json 과 `files/package.json` 에 같은 범위로 적어요(생성기 `build-template-index.mjs` 가 다르면 빌드 실패). Tailwind 3 `content` 는 D11, `tailwindcss-animate` 를 `plugins` 와 devDependencies 에 둬요(ui-react 를 쓰면 check animation 항목). `lib/utils.ts`(cn) 를 넣어 `axis check` utils 항목이 PASS 가 되게 해요. 템플릿 안 import 는 상대 경로로 써요(`apps/web` 의 tsc 가 템플릿 파일을 함께 검사하고 `@/*` 가 `apps/web/src` 를 가리킴, 측정).
- FR-3: 레이아웃 규칙. 높이 100vh 고정, 카드 안 스크롤, 브레드크럼 없음, 1199px 이하 1열(Q6 결정 유지, 프로토타입 v0.24 · v0.26 · v0.28 모두 `@media (max-width: 1199px)` 17 · 22 · 21건. v0.28 처럼 사이드바는 남기고 카드 안 분할 · 보조 상자 · 그리드가 1열), 메뉴 첫 화면은 목록 페이지, 줄을 누르면 depth 상세(시트는 잠깐 보는 곳에만), 탭은 세그먼트, 요소 타일은 회색 하나 + 아이콘.
- FR-4a(MVP): 템플릿 앱 안의 규칙 검사 스크립트 `scripts/check-ontology.mjs` 와 `package.json` 의 `check:ontology` 스크립트. 대상은 앱의 `app/` · `components/` · `lib/` 소스(인자로 다른 디렉터리를 줄 수 있음). 규칙은 결정적인 것만: 엠 대시(U+2014) · 느낌표(한글이 든 JSX 문구 · 문자열) · 한쪽 색 선(`border-l` · `border-r` · `border-s` · `border-e` 와 중립이 아닌 테두리 색 클래스 조합, CSS `border-left` · `border-right` 색 지정) · 카드 그림자(`<Card` · `bg-card` · 카드 모양(`rounded-*` + `border`) 과 `shadow-*` 조합, `<Card style` 의 `boxShadow`, 선택자에 card 가 든 CSS `box-shadow`) · 팔레트 밖 리터럴 색(hex · `rgb()` · `hsl()` 숫자 리터럴, CSS 이름 색, Tailwind 기본 팔레트 클래스 `*-red-500` · `*-white` 등). 클래스 조합은 문자열 하나뿐 아니라 `className={...}` 표현식과 `cn()` · `clsx()` · `cva()` · `twMerge()` 인자 안의 문자열 전체를 합쳐 봐요(v0.6.1). 한쪽 색 선은 style 객체 `borderLeft` · `borderRight` 등도 봐요. 소스 정적 판정이라 변수에 담아 넘긴 클래스 · 런타임에 조립한 문자열은 보지 않아요(README 한계). 위반이 있으면 rc 1 과 `파일:줄`, 검사한 파일이 0개면 rc 2(측정 실패). cli · mcp 는 바꾸지 않아요.
- FR-4b(후속 WI): template.json `checks` 필드와 실행 규약, `axis check` · MCP `axis.check_project` 가 적용된 템플릿의 검사를 찾아 실행. 사용자 프로젝트의 스크립트를 실행하는 동작 변경이라 별도 설계 · 발행(cli · mcp minor)이 필요해요.
- FR-5(후속 WI): 갤러리 · 상세 화면 미리보기. 지금 `preview?: string` 타입(`template-types.ts:29`, cli `types.ts`)만 있고 값 · 자산 · 렌더링 코드는 0건(측정)이라 그대로예요.
- FR-6: `scripts/template-smoke.mjs` 의 기본 slug 목록을 `apps/web/public/templates/index.json`(또는 `--templates-dir`)의 로컬 템플릿(`type` 이 `external` 이 아니고 `<slug>.json` 이 있는 항목)에서 계산해요(D9). `ontology-console` 에는 빌드 HTML(`.next/server/app/index.html`)의 `data-brand="ontology"` 1건 이상을 판정에 더해요(slug 별 추가 판정 표).
- FR-7: 갤러리 등록. `template-types.ts` 의 `TemplateCategory` · `templateCategories` 와 `templates/page.tsx` 의 `categoryIconMap` 에 `console` 을 더해요. 생성 결과(`public/templates/ontology-console.json` · `index.json`)는 내용 diff 를 커밋하고, 기존 4종 JSON 에 `updatedAt` 만 바뀐 것과 `build:registry` 의 r/ version churn 은 되돌려요.

### 2.2 비기능 요구사항
- 라이트 · 다크 모두 axe 위반 0(AC5)
- 템플릿 의존성은 기존 템플릿과 같은 버전대(Next `^15.1.0` · React `^19.0.0` · Tailwind `^3.4.0` · `tailwind-merge ^2.6.0`)
- 예시 데이터에 실제 고객명 · 개인 이름 없음
- 발행 패키지(tokens · ui-react · theme · agentic-ui · cli · mcp · registry-core) 소스 변경 0, changeset 없음(`@ax/web` 미발행)

---

## 3. 수용 기준 (AC)

| AC | 기준 | 실측 방법 | 음성 대조 |
|---|---|---|---|
| AC1 | 배포 뒤 pages.dev 색인에 `ontology-console` 이 있고, 발행본 cli `axis template list` 와 MCP `axis.list_templates` 에 나와요 | `curl -s https://axis-design-system.pages.dev/templates/index.json` 에서 slug 추출(로컬 4종이 함께 잡히는지가 양성 대조). `npx @axis-ds/cli@<발행본> template list`, MCP 는 발행본 `@axis-ds/mcp` 의 `handleListTemplates` | 배포 전 같은 조회에서 0건(2026-10-26 측정: 로컬 4종 잡힘 · ontology 0건 · total 42) |
| AC2 | cli 로 빈 디렉터리 `axis template init ontology-console --dir <d>` → `npm install` → `next build` 가 모두 rc 0 이고, 생성 CSS 에 `@tailwind` 0 · `.bg-background` 1건 이상 · `--axis-*` 정의 1건 이상, 빌드 HTML 에 `data-brand="ontology"` 1건 이상 | 머지 전: `node scripts/template-smoke.mjs ontology-console`(AXIS_TEMPLATE_URL 주입 전제), PR Preview URL 을 `AXIS_TEMPLATE_URL` 로 준 발행본 cli(주입 측정, 최종 판정 아님). 배포 뒤: 새 HOME · 환경변수 없이 `npx @axis-ds/cli@<발행본>` 로 pages.dev 실경로, pnpm(isolated 단독 앱)으로도 1회 | `files/postcss.config.mjs` 를 뺀 JSON 을 `--templates-dir` 로 주면 FAIL(WI-0037 방식), layout 의 data-brand 를 지운 JSON 은 data-brand 판정 FAIL |
| AC3 | 결과 앱의 서버 HTML 과 실행 화면에 `data-brand="ontology"` 가 있고, `--primary` 계산값이 설치된 tokens 의 ontology 값과 같아요 | 빌드 HTML grep(FR-6), Chromium 에서 `document.documentElement.dataset.brand` · `getComputedStyle(...).getPropertyValue('--primary')` 를 설치본 `@axis-ds/tokens/css/brands/ontology` 값과 대조 | layout 의 data-brand 를 지운 사본: 서버 HTML 0건, 하이드레이션 뒤에는 defaultBrand 로 붙음(두 단계를 따로 기록). 브랜드 import 를 주석으로 돌린 사본: `--primary` 가 기본값 |
| AC4 | 1440x900 에서 레이아웃 치수가 사이드바 240 · 바탕 여백 16/18 · 카드 둥글기 12 · 보조 상자 420 · 프로젝트 왼쪽 열 300px 와 같아요 | Playwright 로 각 요소 `getBoundingClientRect` · 계산 스타일 측정(눈 비교 아님), MVP 4화면(통합 뷰 · 목록 · depth 상세 · 프로젝트 상세) | 1199px 폭에서 1열로 바뀌는지(규칙이 실제로 걸리는지) |
| AC5 | MVP 4화면을 ontology 라이트 · 다크에서 axe 검사해 위반 0 | 템플릿 결과 앱을 `next start` 로 띄워 `@axe-core/playwright` 실행(로컬 스크립트, 결과는 testplan). CI 연결은 후속(D7) | 대비가 모자란 색 클래스를 하나 넣은 사본에서 위반 1건 이상(게이트가 실제로 잡는지) |
| AC6 | `npm run check:ontology` 가 템플릿 자체 소스에서 0건, cli `axis check` 가 fail 0 · brand · brand.activation PASS | init 결과 앱에서 실행, rc 와 출력 줄을 함께 기록. npm 레이아웃과 pnpm isolated 단독 앱 두 곳 | 엠 대시 · `shadow-md` 카드 · `border-l-4 border-primary` · 팔레트 클래스 · 느낌표 문구를 하나씩 넣은 사본에서 각각 rc 1 · 해당 줄 보고 |
| AC7 | CI 초록: lint · type-check(템플릿 파일 포함) · test · build(생성기 의존성 일치 검사 포함) · E2E | PR CI frontend.yml, 로컬은 turbo `--force` | template.json 과 files/package.json 의 범위를 하나 다르게 한 사본에서 생성기 rc 1 |
| AC8 | 배포 뒤 `templates/ontology-console.json` 이 커밋본과 `updatedAt` 외 동일 | pages.dev JSON 과 커밋본 비교(WI-0067 AC9 방식) | 커밋본 한 줄을 바꾼 사본과의 비교가 차이를 잡는지 |
| AC9 | `axis template apply ontology-console` 대상에 `axis.config.json` 이 이미 있을 때 동작을 기록하고(덮는지 · 건너뛰는지 · 경고하는지), 사용자 config 를 말없이 덮으면 결함으로 후속 WI 에 등록해요 | 사용자 config(다른 `componentsDir` · brand 없음)를 둔 디렉터리에 apply, 전후 config 해시와 cli 출력 비교 | config 가 없는 디렉터리 apply(템플릿 config 가 그대로 생기는지) |

---

## 4. Assumptions
- A1: 화면 정본은 프로토타입 v0.28 HTML(1.5 표, D4)이고, 디자인 시스템 아티팩트(예시 화면 18장)는 디자인 오너 쪽에서 확인해요.
- A2: cli · mcp 는 템플릿 JSON 을 pages.dev 에서 실행 때 받아요(`registry-client.ts`, mcp `tools/template.ts:89`). MVP 는 npm 발행 없이 Pages 배포로 반영돼요.
- A3: `apps/web` 의 type-check · next build 는 템플릿 파일을 함께 컴파일해요(tsc listFiles 로 템플릿 24개 확인). `@axis-ds/theme` 는 D8 로 `apps/web` 의존에 명시해요.

## 5. Open questions

- Q1: 예시 데이터는 가상으로 바꿔요(실제 고객명 금지). **유지**
- Q2: 노드 캔버스 편집은 별도 WI. **후속 확정**
- Q3: category. **결정 D1**(`console` 신설)
- Q4: (해소) WI-0028 FR-5 는 완료
- Q4': FR-4 의 `axis check` · MCP 연동 범위. **결정 D2**(템플릿 안 스크립트만, 연동은 후속)
- Q5: 템플릿 결과 앱 axe 게이트 CI 연결. **결정 D7**(로컬 + testplan, CI 는 후속)
- Q6: 1199px 이하 1열 유지(결정됨)
- Q7: 정본 판 · 화면 범위. **결정 D3 · D4**(v0.28, MVP 4화면)
- Q8: 「금지 표현」 목록과 「해요체」 판정 기준의 출처. 레포에 목록이 없어요(grep 0건, 「세 계열」 서술은 `theme-customization.md:628` 에 있음). MVP 에서 빼고 디자인 오너에게 목록을 받아 후속. **유지**
- Q9: tokens 의존 범위. **결정 D6**(셋 모두 `^1.8.2`, 머지는 발행 뒤)
- Q10: template-smoke 기본 목록. **결정 D9**(`index.json` 에서 계산)
- Q11: `apps/web` 의 theme 해석. **결정 D8**(`workspace:*` 명시)

## 6. 위험
- Release(#229) 머지와 WI-0027 머지를 붙여 push 하면 frontend.yml `cancel-in-progress` 로 앞 run 의 Deploy Production 이 취소될 수 있어요. 단독 push 후 Deploy Production 완료를 확인해요.
- 템플릿이 `^1.8.2` 를 요구하므로 npm 에 1.8.2 가 없을 때 머지 · 배포하면 사용자 install 이 ETARGET 으로 실패해요(D6).
- `apps/web` tsc 는 템플릿 코드를 워크스페이스 소스 dist 로 검사하고 사용자는 npm 발행본을 받아요. 워크스페이스가 앞서 있으면 CI 는 초록인데 발행본 빌드가 깨질 수 있어 발행본 실경로 init → build 를 따로 재요.
- 템플릿은 `^` 범위로 설치되므로 이후 tokens · ui-react 변경이 다음 설치부터 들어가요. AC3 은 버전이 아니라 설치본 값과 대조해요.
- WI-0079 D9 의 Progress warning 노랑(`--axis-progress-fill-warning`)은 v1 「세 계열」 밖이에요. 템플릿은 Progress warning 을 쓰지 않아요.
- `axis template apply` 는 사용자 package.json 을 덮어써 packageManager 가 사라지는 결함(WI-0088)이 남아 있어요. config 도 같은 부류일 수 있어 AC9 로 기록해요.
- template-smoke · 템플릿 axe 측정이 CI 밖이라 PR 초록이 템플릿 실경로 동작을 증명하지 않아요. `scripts/**` 변경은 CI 를 트리거하지만 template-smoke 자체는 CI 에서 돌지 않아요. testplan 에 로컬 실행 rc · 표 · 음성 대조를 남겨요.
- 생성기가 빌드마다 모든 템플릿 JSON 의 `updatedAt` 을 바꿔요. 기존 4종은 `updatedAt` 만 바뀌면 되돌려요.
- 디자인 원본이 v0.29 작업본까지 계속 바뀌는 중이에요. AC4 기준은 v0.28 로 고정해요(D4).

## 7. 변경 이력

| 버전 | 날짜 | 내용 |
|---|---|---|
| v0.1 ~ v0.3 | 2026-10-15 ~ | 최초 작성(세부 이력은 남아 있지 않음. v0.4 머리말 기준 화면 기준은 프로토타입 v0.22) |
| v0.4 | 2026-10-16 | 디자인 오너 개정 r2 반영, 화면 기준 v0.24(디자인 시스템 v1), Q6 |
| v0.5 | 2026-10-20 | 디자인 오너 개정 r3(기준 v0.26) 화면 범위 병합(WI-0043), Q7 |
| v0.6 | 2026-10-26 | 낡은 전제 9건 정정(1.4), MVP · 후속 분리(1.3), FR-4 를 4a · 4b 로 분리, AC2 를 init 기준으로, AC 별 실측 · 음성 대조, AC9(apply 위 config) 추가, 정본 v0.28, 결정 D1 ~ D11 반영 |
| v0.6.1 | 2026-10-26 | 구현 검토 반영: FR-4a 판정 범위를 클래스 묶음(className 표현식 · cn() 인자) · style 객체 · CSS 이름 색 · 카드 모양 div 로 넓힘, 앵커 `#add` 오탐 제외. 1.3 의 ListToolbar 를 실제 구조(entity-list 안 도구줄)로, 요지의 D1 ~ D9 를 D1 ~ D11 로 정정 |
