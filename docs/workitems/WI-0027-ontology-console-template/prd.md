# WI-0027: 온톨로지 콘솔 템플릿 PRD

> 작성일: 2026-10-15 | 버전: v0.4(2026-10-16, 디자인 기준 v0.24 교체) | 작성자: Sinclair Seo | WI: WI-0027 | GitHub: #86 | 상태: Draft
> 선행: WI-0025(ontology 브랜드 프리셋, FR-6 `defaultBrand` · FR-8 `brands/ontology`), WI-0026(밀도 토큰). 기존 템플릿 체계(WI-0007 · 0008 · 0009)의 메타데이터 형식(template.json) · 인덱스 빌드 · `axis template` 명령은 그대로 쓰지만, `@axis-ds/*` 패키지에 의존하는 템플릿은 이번이 처음이라 새 패턴을 더합니다(FR-2). `axis check` 확장(FR-4)은 CLI · MCP 변경을 함께 포함합니다.
> v0.4 변경 요지: 디자인 오너 개정본(r2, 2026-10-16)에 따라 화면 기준을 프로토타입 v0.22에서 v0.24(디자인 시스템 v1)로 바꿨습니다. 배경 · 범위(사이드바 240px + 콘텐츠 카드 한 장 셸, 목록 페이지 · depth 상세 · 통합 뷰 · 프로젝트 상세) · FR-3 레이아웃 규칙 · FR-4 CSS 검사 항목 · AC3 치수 · A1 정본을 v0.24 기준으로 고쳤습니다. FR-3의 「1199px 이하 1열」은 r2에 없지만 레포 값을 유지하고 Q6로 확인합니다.

---

## 1. 개요

### 1.1 배경
- 「온톨로지 플랫폼(가칭)」 프로토타입 v0.24(디자인 시스템 v1)는 업무용 콘솔 화면 문법(바탕 위 사이드바 240px + 흰 콘텐츠 카드 한 장, 높이 고정, 카드 안 스크롤, 머리 · 레일 · 브레드크럼 없음)과 화면 패턴(목록 페이지 · depth 상세 · 통합 뷰 보조 상자 · 칸반 · 노드 캔버스 · 에이전트 대화 · 기록)을 가지고 있습니다. v0.22의 머리 · 레일 · 호버 메뉴 · 왼쪽 패널 구조는 없어졌습니다.
- 이 패턴들은 AXIS core 컴포넌트로 넣기에는 제품 성격이 강하므로, WI-0025에서 core 범위에서 뺐습니다.
- AXIS에는 이미 `apps/web/templates/<slug>/`(template.json + files) 템플릿 체계와 `axis template list|info|apply|init|diff`, MCP template 도구가 있습니다.

### 1.2 목표
- 온톨로지 콘솔 화면 문법을 AXIS 컴포넌트와 `ontology` 브랜드로 조립한 템플릿 `ontology-console`을 제공합니다.
- 새 온톨로지 계열 제품이 `axis template apply ontology-console` 한 번으로 같은 룩의 골격을 얻게 합니다.

### 1.3 범위
- 포함: 앱 셸(사이드바 240px · 워크스페이스 · 한 번에 하나만 펼치는 메뉴 · 콘텐츠 카드 한 장), 목록 페이지(ListHead · StatusChips · ListToolbar · Table), depth 상세(DetailHead 뒤로 · 이전 · 다음, 절 사이 40px), 통합 뷰(인사 · 현황 카드 · 보조 상자 420px), 프로젝트 상세(카드 안 좌우 분할 300px), 수정 화면(사이드바 없음 · EditBar + 변경 사유 팝업), 칸반, 에이전트 대화, 기록, 로그인 화면
- 제외: 노드 캔버스의 편집 기능(드래그 · 연결 그리기)은 정적 배치까지만 넣습니다. 실제 데이터 연동 · 인증은 넣지 않습니다.

---

## 2. 요구사항

### 2.1 기능 요구사항
- FR-1: `apps/web/templates/ontology-console/template.json`(category: `console`)과 `files/`를 작성합니다. 현재 허용 category는 `minimal` · `landing-page` · `dashboard` · `app` · `agentic` 5개뿐이므로, `apps/web/src/lib/template-types.ts`의 `TemplateCategory` 유니온과 `templateCategories` 맵(name · description · icon)에 `console`을 추가하고, 필요하면 `apps/web/src/app/templates/page.tsx`의 `categoryIconMap`에 아이콘을 추가합니다(추가하지 않으면 빌드는 통과하지만 갤러리 카테고리 탭에서 빠지고 전체 목록에만 나옵니다). 앱은 `ThemeProvider defaultBrand="ontology"`로 시작합니다. 현재 `ThemeProvider`는 `defaultTheme` · `storageKey`만 받으므로, 이 API는 WI-0025 FR-6(`defaultBrand`)과 FR-8(`brands/ontology` 프리셋)이 완료되어 1.3.0으로 배포된 것을 전제로 합니다.
- FR-2: 화면 패턴은 템플릿 내부 컴포넌트(`files/components/ontology/*`)로 두고, AXIS core(Button · Badge · Card · Table · Sheet · Dialog · Tabs · Input)를 조립해 만듭니다. 새 core 컴포넌트는 만들지 않습니다. 기존 템플릿 4개(dashboard · hr-dashboard · landing-page · theme-only)는 `@axis-ds/*`에 의존하지 않고 화면을 Tailwind로 직접 구현하므로, `ontology-console`의 template.json과 `files/package.json` dependencies에 `@axis-ds/ui-react` · `@axis-ds/theme`(브랜드 CSS를 직접 import하면 `@axis-ds/tokens`도)를 WI-0025 배포 버전(1.3.0 이상)으로 넣는 새 패턴을 씁니다.
- FR-3: 레이아웃 규칙을 템플릿에 반영합니다. 높이 100vh 고정, 카드 안 스크롤, 브레드크럼 없음, 1199px 이하 1열(Q6 확인 전 잠정), 메뉴 첫 화면은 목록 페이지, 줄을 누르면 depth 상세로 이동(시트는 잠깐 보는 곳에만), 탭은 세그먼트, 요소 타일은 회색 하나 + 아이콘.
- FR-4: 문구 규칙 검사(엠 대시 · 금지 표현 · 해요체 · 느낌표)와 CSS 검사(「한쪽 색 선 금지」 · 「카드 그림자 금지」 · 세 계열 밖 색 금지)를 템플릿의 `check` 스크립트로 넣고, `axis check`에서 실행되게 합니다. 현재는 템플릿 단위 check 스크립트 체계가 없습니다. template.json에 check 관련 필드가 없고, `axis check`(`packages/axis-cli/src/template/template-check.ts` `runCheck`)와 MCP `axis.check_project`(`packages/axis-mcp/src/tools/template.ts` `handleCheckProject`)는 고정된 5개 항목만 검사합니다. 따라서 이 WI 범위에 ① template.json 스키마 필드(예: `checks`)와 실행 규약 신설 ② `axis check`와 MCP `axis.check_project`가 적용된 템플릿의 검사를 찾아 실행하도록 확장하는 작업이 들어갑니다. WI-0028 FR-5도 `axis check`에 브랜드 검사를 더하므로, 두 WI가 같은 `runCheck`를 고칩니다. 이 WI가 확장 지점(템플릿 검사 실행)을 만들고 WI-0028은 그 위에 브랜드 검사 항목을 더하는 순서를 기본으로 하며, 순서와 릴리스 묶음은 Q4에서 정합니다.
- FR-5: 템플릿 갤러리와 문서에 미리보기 이미지와 설명을 추가합니다. 현재 미리보기는 `TemplateMetadata`(`apps/web/src/lib/template-types.ts`)와 CLI 타입(`packages/axis-cli/src/template/types.ts`)의 `preview?: string` 필드만 있고, 값을 가진 템플릿 · 이미지 자산 · 갤러리와 상세 화면의 렌더링 코드는 없습니다. 따라서 미리보기 이미지 자산 제작, `preview` 값 채우기, 갤러리 카드와 상세 화면의 이미지 렌더링 UI 구현이 범위에 들어갑니다.

### 2.2 비기능 요구사항
- 라이트 · 다크 모두 a11y 게이트 통과
- 템플릿 의존성은 기존 템플릿과 같은 버전대(Next 15 · React 19 · Tailwind 3.4)

---

## 3. 수용 기준 (Acceptance Criteria)

- AC1: `axis template list`와 MCP template 목록에 `ontology-console`이 나옵니다.
- AC2: 빈 Next 프로젝트에 `axis template apply ontology-console` 후 `pnpm build`가 통과합니다.
- AC3: 적용 결과를 1440x900에서 캡처하면 디자인 시스템 「온톨로지 플랫폼」 예시 화면(목록 페이지 · depth 상세 · 통합 뷰 · 수정 화면 · 프로젝트 상세)과 레이아웃 치수(사이드바 240 · 바탕 여백 16/18 · 카드 둥글기 12 · 보조 상자 420 · 프로젝트 왼쪽 열 300px)가 일치합니다.
- AC4: 템플릿 `check` 스크립트가 템플릿 자체 소스에서 0건입니다.
- AC5: 템플릿 적용 결과를 라이트 · 다크에서 axe로 검사해 위반 0건입니다. 현재 axe 게이트(`apps/web/e2e/a11y.spec.ts`)는 문서 사이트 페이지 9개만 검사하고 CI에 연결되어 있지 않으므로, 템플릿 적용 결과용 axe 게이트(적용한 앱 또는 갤러리 미리보기 경로를 대상으로 하는 spec)를 이 WI에서 새로 만듭니다.

---

## 4. Assumptions

- A1: 화면 패턴의 정본은 디자인 시스템 「온톨로지 플랫폼」(v0.24 기준)의 컴포넌트 미리보기 · `bundle.css` · 예시 화면 18장입니다. v0.24는 HTML 프로토타입만 받았으므로 원본 `screens/*.css`는 없습니다.

## 5. Risks / Open questions

- Q1: 예시 데이터(실제 고객명)를 공개 저장소에 넣을 수 없으므로 가상의 예시 데이터로 바꿔야 합니다.
- Q2: 노드 캔버스 편집을 넣으려면 그래프 라이브러리 도입이 필요해 별도 WI로 분리할지 정해야 합니다.
- Q3: category를 새 값 `console`로 추가할지(FR-1의 유니온 · 맵 · 아이콘 변경 포함), 기존 값 `app`을 쓸지 정해야 합니다.
- Q4: `axis check` 확장을 WI-0027 FR-4와 WI-0028 FR-5 중 어느 쪽이 먼저 만들지, CLI · MCP 릴리스를 함께 묶을지 정해야 합니다. 이 WI의 CLI · MCP 변경은 `@axis-ds/cli` · `@axis-ds/mcp` 릴리스를 필요로 합니다.
- Q5: 템플릿 적용 결과용 axe 게이트(AC5)를 CI workflow에 연결할지, 기존 게이트처럼 로컬 수동 실행으로 둘지 정해야 합니다.
- Q6: FR-3의 「1199px 이하 1열」은 v0.22 기준에서 정한 규칙이고 r2에는 없습니다. v0.24 구조(사이드바 240px + 콘텐츠 카드 한 장, 프로젝트 상세 300px 분할)에서도 이 규칙을 유지할지 디자인 오너 확인이 필요합니다.
