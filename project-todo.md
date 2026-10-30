# AXIS Design System - Project TODO

> 프로젝트 진행 상황 및 다음 단계

**현재 버전**: 1.2.1 (npm 패키지 v1.2.1)
**마지막 업데이트**: 2026-10-29
**상태**: ✅ Active Development

---

## 📦 패키지 현황

| 패키지 | 상태 | 설명 |
|--------|------|------|
| `@axis-ds/tokens` | ✅ 완료 | 디자인 토큰 |
| `@axis-ds/ui-react` | ✅ 완료 | React 컴포넌트 |
| `@axis-ds/agentic-ui` | ✅ 완료 | AI/Agent UI |
| `@axis-ds/theme` | ✅ 완료 | 테마 시스템 |
| `@axis-ds/cli` | ✅ 완료 | CLI 도구 |
| `@axis-ds/mcp` | ✅ 완료 | MCP 서버 |

---

## 📌 현재 작업

### 진행 중

없음

### 할 일

| # | 항목 | WI ID | Phase | 우선순위 | 상태 |
|---|------|-------|-------|----------|------|
| 38 | 밀도 토큰(컨트롤 높이 · 글자 크기 · 단계별 둥글기) | WI-0026 (#85) | P17 | P2 | ✅ 2026-10-25 (#198, 1.7.0) |
| 39 | 온톨로지 콘솔 템플릿 `ontology-console` | WI-0027 (#86) | P17 | P2 | ✅ 2026-10-26 (#232, Pages 배포 · npm 발행 없음) |
| 40 | CLI · MCP 브랜드 명령(`axis theme list\|add\|info`, `axis.list_brands` · `axis.get_brand`) | WI-0028 (#87) | P17 | P3 | ✅ 완료(2026-10-24, 배포 없음). cli · mcp 1.2.0 배포(2026-10-19, #123 · run 39257199603). AC2(a) 재확인 조건을 pages.dev 기본 레지스트리 배포본 재측정으로 바꿈(사용자 결정, PRD D-AC2a-2). npm cli 1.5.4 · mcp 1.3.2 로 AC1 ~ AC4 · T7-2 · T7-4 재측정 통과: theme-only 7파일 차이 0 · 2회차 해시 차이 0, App Router build rc 0 · data-brand 5건, brand 어긋남 WARN(CLI · MCP), 토큰 표 12/12 (testplan T8) |
| 41 | 기본 테마 흰 글자 대비 미달 해소 (기본 Button #3B82F6 위 3.68:1 등) | WI-0029 (#94) | P18 | P2 | ✅ 완료(2026-10-24). linked 4패키지 1.6.0 · cli 1.5.4 · mcp 1.3.2(#172 · #173, run 40089793369, provenance 6/6). 기본 브랜드 a11y 위반 0(기준선 46노드 해소), pages.dev · npm 배포본 실측. 잔여는 WI-0062 · WI-0063 |
| 43 | NPM_TOKEN 만료 대응: npm Trusted Publishing(OIDC) 전환 (cli · mcp 등록은 다음 릴리스 직전) | WI-0031 (#96) | P18 | P2 | ✅ |
| 44 | `.claude/worktrees/` 경로 gitignore | WI-0032 (#97) | P18 | P3 | ✅ |
| 45 | 다크 모드 component 토큰 재정의 누락 해소 (Card 흰 바탕 등, WI-0025 M3 머지 전 선행) | WI-0033 (#99) | P18 | P1 | ✅ |
| 46 | 라이브러리 패키지(tokens · ui-react · agentic-ui) lint · type-check 스크립트 공백 해소 | WI-0034 (#100) | P18 | P2 | ✅ |
| 49 | 템플릿 원형 빌드 실패(`app/` 디렉터리 · postcss 설정 없음, theme-only 실측, 나머지 3개 확인 필요) | WI-0037 (#119) | P18 | P2 | ✅ 완료(2026-10-25). cli 1.6.0 · mcp 1.3.3(#186 · #187, run 40110014386, provenance), 배포본 실측 통과(브랜드 적용 · 템플릿 4종 · 문서 사이트) |
| 51 | cli · mcp `type-check` · `lint` 스크립트 도입과 기존 오류 정리(cli tsc 20건 · eslint 2건) | WI-0039 (#125) | P18 | P3 | ✅ 완료(2026-10-24, 브랜치 `chore/wi-0039-cli-mcp-quality-gate` 머지 대기, changeset · 배포 없음). cli lint · type-check, mcp · registry-core lint 를 turbo 에 등록(lint 태스크 4 → 7). 재측정 cli tsc 19 · cli eslint 25 · mcp eslint 11 · registry-core eslint 1 → 0, 양성 대조 4/4 rc 비0, `--force` 게이트 rc 0(cli 661 · mcp 138 유지). theme 은 범위 밖 |
| 52 | 라이브러리 수집 데이터(`apps/web/public/library/**` 8개)의 `npx axis-cli` 실행 안내 정리(typosquat 위험, WI-0038 에서 분리) | WI-0040 (#127) | P18 | P2 | ✅ 완료(2026-10-24, 배포 없음). 데이터는 WI-0057(006836a)에서 0건. guidance.test.ts 가 library JSON 을 이스케이프를 풀어 검사, 006836a~1 조각 양성 대조 fixture. 006836a~1 데이터 복원 시 14곳 모두 잡혀 실패 |
| 53 | `axis init` 재실행 시 `axis.config.json` 덮어쓰기로 brand 등 설정 소실 | WI-0041 (#128) | P18 | P3 | ✅ 완료(2026-10-25). cli 1.6.0 · mcp 1.3.3(#186 · #187, run 40110014386, provenance), 배포본 실측 통과(브랜드 적용 · 템플릿 4종 · 문서 사이트) |
| 57 | `axis add` 가 레지스트리를 조회하지 않고 하드코딩된 button 하나만 설치(그 button 도 preset 의존 shadcn 원형), WI-0044 실측에서 발견 | WI-0045 (#136) | P18 | P1 | ✅ 완료(2026-10-22). cli 1.5.0 배포(#152 · #153, run 39795328665, provenance), pages.dev /r version 1.5.0 반영. 배포본 실측: init · list(원격) · add · next build rc 0, 28/28 설치 후 빌드 |
| 58 | 애니메이션 플러그인(tailwindcss-animate) 의존 미선언(7개 컴포넌트 0/26) · accordion · progress keyframes 부재 | WI-0046 (#137) | P18 | P2 | ✅ 완료(2026-10-25). tokens · ui-react · agentic-ui 1.6.2(#185 · #187, run 40110014386, provenance), 배포본 실측 통과(브랜드 적용 · 템플릿 4종 · 문서 사이트) |
| 59 | 레지스트리 항목 의존성 누락(button.json 의 @radix-ui/react-slot 등) 전수 점검 · 빌드 검사 | WI-0047 (#138) | P18 | P2 | ✅ WI-0045 에 흡수해 완료(2026-10-22, #152 로 닫힘) |
| 60 | 문서 기술 스택 표기 드리프트(Tailwind CSS 4 표기 vs 실제 3.4) · 문서 라우트 점검 | WI-0048 (#139) | P18 | P3 | ✅ 완료(2026-10-24, 배포 없음). README · monorepo-setup · .claude/prompts 를 「개발 · 문서 사이트 3.4, 소비자 3 · 4 지원(1.4.0+)」 두 축으로, quick-start:208 을 pages.dev 절대 URL(200)로. 대상 13개 파일 링크 6개 깨짐 0 |
| 61 | `axis init` 의 globalCss 기본 경로(`./src/app/globals.css`)가 src 없는 프로젝트에서 없는 경로로 기록됨(WI-0044 후속 검증에서 발견) | WI-0049 (#140) | P18 | P3 | ✅ 완료(2026-10-25). cli 1.6.0 · mcp 1.3.3(#186 · #187, run 40110014386, provenance), 배포본 실측 통과(브랜드 적용 · 템플릿 4종 · 문서 사이트) |
| 63 | `axis check` · MCP 의 dependencies 항목이 선언만 보고 「설치되어 있습니다」로 표시(WI-0044 배포본 확인에서 발견) | WI-0051 (#144) | P18 | P3 | ✅ 2026-10-25 (#196, cli 1.6.1 · mcp 1.3.4) |
| 64 | agentic-ui `StreamingText` 가 첫 글자를 빼고 끝에 `undefined` 를 붙여 표시(WI-0050 검증에서 발견) | WI-0052 (#146) | P18 | P2 | ✅ 완료(2026-10-24). agentic-ui 1.5.1(#160 · #163), 배포본 React 19 StrictMode 켬 · 끔 모두 「스트리밍 완료 문장」(1.5.0 은 undefined 반복 · 빈 화면) |
| 65 | 서브패스 타입 해석 실패: moduleResolution node 에서 `@axis-ds/ui-react/avatar` 등 타입 미해석(typesVersions 부재, WI-0050 검증에서 발견) | WI-0053 (#147) | P18 | P2 | ✅ 완료(2026-10-24). tokens · ui-react · agentic-ui 1.5.1(#161 · #163), 배포본으로 Next 가 만든 node tsconfig 앱 next build rc 0, 필수 prop 누락은 rc 1 |
| 66 | `Avatar` 가 하이드레이션 전에 난 이미지 로드 오류를 fallback 으로 바꾸지 못함(WI-0050 검증에서 발견) | WI-0054 (#148) | P18 | P3 | ✅ 완료(2026-10-24). ui-react · agentic-ui 1.6.1(#177 · #179, run 40100713780, provenance), npm 배포본 avatar.mjs 에 마운트 판정 포함 확인 |
| 67 | MCP `axis.install_component` · `list_components` 가 레지스트리를 읽지 않고 하드코딩 5개만 설치(WI-0045 실측에서 분리) | WI-0055 (#150) | P18 | P2 | ✅ 완료(2026-10-24). mcp 1.3.0 · cli 1.5.2(#164 · #163), 배포본 list 28 · install 기본 배치, D13 config 사설 주소 요청 0건(env 양성 대조 3건) |
| 68 | `axis.minu.best`(403) 참조가 레지스트리 밖 경로(템플릿 기본 주소 · `$schema` · add 안내 링크 · library 수집기 · 루트 components.json 별칭 · mcp template)에 남음(WI-0045 검증에서 분리) | WI-0056 (#151) | P18 | P2 | ✅ 완료(2026-10-23). cli 1.5.1 · mcp 1.2.3 배포(#154 · #156, run 39869322957, provenance), pages.dev schema.json 200 · ajv 검증 통과, 배포본 template list · mcp list_templates 42개. 정식 주소 pages.dev 유지(Pages 프로젝트 삭제 · 이름 변경 금지) |
| 69 | library 데이터(`apps/web/public/library/**`)에 지금 없는 agentic 항목 6개가 남고 approval-card 문서 링크 경로가 틀려 404(WI-0056 검증에서 분리) | WI-0057 (#155) | P18 | P3 | ✅ 완료(2026-10-24). cli 1.5.2(#162 · #163), 프로덕션 library 링크 109개 모두 2xx, 오프라인 검사 위반 0 |
| 70 | 문서 사이트 `/agentic/streaming-text` 가 실제 컴포넌트가 아니라 mock 을 써서 컴포넌트 결함이 드러나지 않음(WI-0052 에서 분리) | WI-0058 (#157) | P18 | P3 | ✅ 완료(2026-10-25). Pages 배포(npm 없음)(#184 · #187, run 40110014386, provenance), 배포본 실측 통과(브랜드 적용 · 템플릿 4종 · 문서 사이트) |
| 71 | node10 해석에서 ui-react cva 변형 prop 타입이 any 로 떨어짐(`class-variance-authority/types`, WI-0053 에서 분리) | WI-0059 (#158) | P18 | P2 | ✅ 완료(2026-10-24). ui-react · agentic-ui 1.5.2(#165 · #166, run 40044378744, provenance), 배포본 Next(node) `variant="nope"` rc 1 · 올바른 값 rc 0. 업데이트 뒤 타입 오류 가능성은 CHANGELOG 에 안내 |
| 72 | library 데이터 slug 충돌 10개로 shadcn 상세에 axis 코드 표시(WI-0057 에서 분리) | WI-0060 (#159) | P18 | P3 | ✅ 2026-10-25 (#204, cli 1.6.2) |
| 73 | ui-react 만 릴리스하면 cli 가 「원격 · 포함본 version 다름」을 매번 안내(레지스트리 version 이 ui-react 를 따름, WI-0059 배포 확인에서 발견) | WI-0061 (#167) | P18 | P2 | ✅ 완료(2026-10-24). cli 1.5.3 · mcp 1.3.1(#168 · #169, run 40048194529, provenance), pages.dev 1.5.2 대상 배포본 list 안내 없음(cli 1.5.2 는 「version 이 다릅니다」) |
| 74 | 텍스트 대비 잔여 쌍(Toast opacity · tertiary hover/focus · AgentAvatar · RunProgress pending · DiffViewer 등)과 a11y 측정 범위 확대(PAGES 밖 11페이지 · axe incomplete, WI-0029 조사에서 분리) | WI-0062 (#170) | P18 | P2 | ✅ 2026-10-25 (#207, 1.8.0) |
| 75 | 비텍스트 대비(WCAG 1.4.11) 미달: 폼 컨트롤 경계 · 포커스 링 · Progress 막대 · 상태 아이콘(WI-0029 조사에서 분리) | WI-0063 (#171) | P18 | P3 | ✅ 2026-10-25 (#207, 1.8.0, ontology 경계 · Progress success · warning 값 결정 남음) |
| 76 | 브랜드 테마 가이드 현행화: 1.6.0 사실 반영(249 → 263개), Tailwind 4 컴포넌트 tailwind.css 누락, Tailwind 3 preset · shadcn CSS, defaultBrand · 다크 하위 요소 · 첫 화면 깜빡임 실측 함정(2026-10-24 브랜드 적용 점검에서 발견) | WI-0064 (#174) | P18 | P2 | ✅ 완료(2026-10-25). 문서(npm 없음)(#188 · #187, run 40110014386, provenance), 배포본 실측 통과(브랜드 적용 · 템플릿 4종 · 문서 사이트) |
| 77 | cli `theme add` · `check` 가 브랜드 적용 전제(Provider · 기본 토큰 CSS · preset · content 경로 · 패키지 매니저)를 처리 · 판정하지 않아 cli 만으로는 Button 이 투명(2026-10-24 브랜드 적용 점검에서 발견) | WI-0065 (#175) | P18 | P2 | ✅ 완료(2026-10-25). cli 1.6.0 · mcp 1.3.3(#186 · #187, run 40110014386, provenance), 배포본 실측 통과(브랜드 적용 · 템플릿 4종 · 문서 사이트) |
| 78 | 문서 사이트 `/components` mock 페이지(avatar · alert · skeleton · tooltip)를 실제 컴포넌트로(progress 는 WI-0046 에서, 배치 2 브리프에서 분리) | WI-0066 (#180) | P18 | P3 | ✅ 2026-10-25 (#195, Pages) |
| 79 | 템플릿 4종을 AXIS 토큰 · 컴포넌트 기반으로 전환(원본 `@axis-ds` 참조 0건 실측, WI-0037 에서 분리) | WI-0067 (#181) | P18 | P3 | ✅ 2026-10-25 (#200, Pages · 템플릿 4종 AXIS 토큰 · ontology 켜기 안내) |
| 80 | ThemeProvider `defaultBrand` 사용 시 `setBrand(undefined)` 해제가 새로고침 뒤 풀림(WI-0064 에서 분리) | WI-0068 (#182) | P18 | P3 | ✅ 2026-10-25 (#196, theme 1.7.0) |
| 81 | agentic-ui 비대비 a11y 결함(aria-prohibited-attr · scrollable-region-focusable · 시각 포맷 하이드레이션, WI-0058 브리프에서 분리) | WI-0069 (#183) | P18 | P2 | ✅ 2026-10-25 (#207, 1.8.0 · cli 1.6.2 · mcp 1.3.5) |
| 82 | cli `check` · `theme add` 판정 정확도: animation(import 만 있고 plugins 비어도 PASS) · globals.css(자체 HSL 변수에도 PASS) 거짓 PASS, 재실행 「브랜드 앞」 문구, Tailwind 3 body 글꼴 안내(배치 2 배포 후 재측정에서 발견, 배치 3 WI-0051 과 합류) | WI-0070 (#189) | P18 | P2 | ✅ 2026-10-25 (#196, cli 1.6.1 · mcp 1.3.4) |
| 83 | 움직임 줄이기 설정에서 로딩 · 진행 표시(스피너 · Progress 불확정 · Skeleton · ThinkingIndicator 등 11곳)가 멈춰 앱이 멈춘 것처럼 보임 → 멈추지 않고 2~3배 느리게, 열고 닫기 · Accordion 11곳은 계속 정지(2026-10-25 사용자 결정, WI-0046 후속) | WI-0071 (#190) | P18 | P2 | ✅ 완료(2026-10-25). ui-react · agentic-ui 1.6.3(#192 · #193, run 40127935334, provenance), npm 배포본에 reduce 느린 주기(2.5 · 3 · 4 · 5초) 클래스 확인 |
| 84 | Tailwind 3 CJS 설정에서 `require("@axis-ds/tokens/tailwind")` preset 이 적용되지 않음(1.5.1 · 1.6.2 실측 colors 0 · keyframes 0, cli 가 이 문구를 안내) | WI-0072 (#191) | P18 | P1 | ✅ 2026-10-25 (#196, tokens 1.7.0) |
| 85 | Tooltip 이 스크롤에 닫혀 화면 밖 트리거로 Tab 이동 시 바로 사라짐(WCAG 1.4.13 후보, WI-0066 브리프에서 발견) | WI-0073 (#194) | P18 | P3 | ✅ 2026-10-25 (#207, ui-react 1.8.0) |
| 86 | `check` 의 기존 설치본 판독(Tailwind 판정 · TW4 안내)을 상위 디렉터리 탐색으로(WI-0051 에서 분리, 기준선 재측정 필요) | WI-0074 (#199) | P18 | P3 | ✅ 2026-10-26 (#214, cli 1.7.0 · mcp 1.4.0) |
| 87 | `axis template init` 을 `--dir` 없이 비대화형으로 부르면 아무것도 만들지 않고 rc 0(WI-0067 실경로 검증에서 발견) | WI-0075 (#201) | P18 | P2 | ✅ 2026-10-26 (#214, cli 1.7.0, 실제 터미널 대화형 1회(사람) 남음) |
| 88 | MCP 동봉 토큰 데이터가 실제 tokens 값과 어긋남(생성 이후 미갱신, 배치 4 반박 검토에서 발견) | WI-0076 (#202) | P18 | P3 | ✅ 2026-10-26 (#214, mcp 1.4.0) |
| 89 | Tailwind 3 quick-start 예시에서 border 테두리가 다크 · 브랜드에서도 회색(preflight 순서, WI-0067 에서 발견) | WI-0077 (#203) | P18 | P3 | ✅ 2026-10-26 (#214, linked 1.8.1) |
| 90 | library 상세 화면 데이터 fetch 경로(`library/components/<id>.json`)를 지키는 E2E 스모크가 없음(WI-0060 검토에서 발견) | WI-0078 (#206) | P18 | P3 | ✅ 2026-10-26 (#214, Pages · npm 발행 없음) |
| 91 | ontology 브랜드의 남은 대비 미달(컨트롤 경계 1.10~1.42 · Progress success · warning 채움 1.93 · 1.62 · 라이트 placeholder 2.60) 값 결정, 디자인 오너 확인 필요(배치 4 에서 ontology 값 불변으로 남김) | WI-0079 (#208) | P18 | P2 | ✅ 2026-10-26 (#228, linked 1.8.2 · cli 1.7.3 · mcp 1.4.3) |
| 92 | 호이스팅 모노레포에서 check 의 Tailwind 3 content 판정이 실제 위치(`../../node_modules/...`)를 인정하지 않음(WI-0074 브리프에서 분리) | WI-0080 (#209) | P18 | P3 | ✅ 2026-10-26 (#219, cli 1.7.1 · mcp 1.4.1, changeset 검사 push 모드 정착 확정 run 40269191762) |
| 93 | `detectInstallCommand` 가 lockfile 을 한 층만 봐서 npm 워크스페이스에서 pnpm 명령을 안내함(WI-0074 브리프에서 분리) | WI-0081 (#210) | P18 | P3 | ✅ 2026-10-26 (#219, cli 1.7.1 · mcp 1.4.1) |
| 94 | Select 의 placeholder 색 클래스가 button 에 붙어 효과가 없음(placeholder 가 입력한 값처럼 진하게 보임, WI-0079 검토에서 발견, WI-0079 반영과 같은 발행) | WI-0082 (#211) | P18 | P3 | ✅ 2026-10-26 (#228, linked 1.8.2) |
| 95 | library 대표 선택이 상세 JSON 129개를 모두 읽음 · TW3 preset 테스트가 dist 진입점을 검사하지 않음(배치 6 검토 후속, 배치 6b) | WI-0083 (#212) | P18 | P3 | ✅ 2026-10-26 (#220, npm 발행 없음) |
| 96 | Windows Git Bash 에서 대화형 판정(stdin isTTY) 실측과 보강 검토(cli 1.7.0 WI-0075 후속, README 안내만 반영) | WI-0084 (#213) | P18 | P3 | ⏳ |
| 97 | detectInstallCommand 를 거치지 않는 pnpm 고정 안내 정리 · packageManager 신호 검토(WI-0081 브리프에서 분리) | WI-0085 (#217) | P18 | P3 | ✅ 2026-10-26 (#225, cli 1.7.2 · mcp 1.4.2) |
| 98 | tailwind-core 의 hasDependency 를 dependencies-core 와 합쳐 루트 선언 인정 일관화(WI-0081 검토에서 분리) | WI-0086 (#218) | P18 | P3 | ✅ 2026-10-26 (#225, cli 1.7.2 · mcp 1.4.2) |
| 99 | theme add 가 워크스페이스 루트에 선언된 의존성을 앱 package.json 에 다시 씀(WI-0086 범위에서 분리, 쓰기 경로 rollback 범위) | WI-0087 (#222) | P18 | P3 | ✅ 2026-10-27 (#233, cli 1.7.5) |
| 100 | template apply · MCP apply_template 이 사용자 package.json 을 덮어써 packageManager 필드가 사라짐(WI-0085 검토에서 분리) | WI-0088 (#223) | P18 | P3 | 🔄 배치 10 |
| 102 | pnpm 기본 레이아웃에서 상위 설치본을 가리키는 content glob 을 check 가 거짓 FAIL(배치 6c 재측정에서 발견, 종전부터) | WI-0090 (#227) | P18 | P3 | ✅ 2026-10-26 (#230, cli 1.7.4 · mcp 1.4.4) |
| 103 | check 가 Yarn PnP 에서 루트에만 선언한 패키지를 설치됨으로 판정(앱에서 해석 불가, WI-0087 브리프에서 발견) | WI-0091 (#234) | P18 | P3 | ✅ 2026-10-28 (#245, cli 1.7.6 · mcp 1.4.5) |
| 104 | Tailwind 4 check animation 이 CSS import 만 보고 선언 · 설치본을 보지 않음(WI-0087 측정 V12) | WI-0092 (#235) | P18 | P3 | ✅ 2026-10-28 (#245, cli 1.7.6 · mcp 1.4.5) |
| 105 | theme list · info · MCP 브랜드 도구의 미설치 안내가 선언 여부와 상관없이 add 명령(WI-0087 측정) | WI-0093 (#236) | P18 | P3 | ✅ 2026-10-28 (#246, cli 1.7.6 · mcp 1.4.5) |
| 106 | check dependencies 의 @axis-ds/* 설치 확인 대상에 루트 선언을 넣을지 재결정(배치 6c 경계, WI-0087 조사) | WI-0094 (#237) | P18 | P3 | ✅ 2026-10-28 (#245, cli 1.7.6 · mcp 1.4.5) |
| 107 | PnP 루트 선언 경계를 init · theme add · add · template apply 로 넓히기(WI-0091 조사에서 분리, 사용자 결정 Q2) | WI-0095 (#239) | P18 | P3 | ⏳ |
| 108 | npm 워크스페이스 루트 선언의 설치 위치 안내를 theme add · init · check 에 반영(WI-0093 조사에서 분리, 사용자 결정 Q15) | WI-0096 (#240) | P18 | P3 | 🔄 배치 10 |
| 109 | check 가 해석되지 않는 CSS import 를 안내 · 인정함(TW4 B1 · globals.css tokens import)(WI-0091 · 0094 조사에서 발견) | WI-0097 (#241) | P18 | P3 | ✅ 2026-10-29 (#253, cli 1.7.7 · mcp 1.4.6) |
| 110 | Yarn PnP 에서 node_modules content glob 이 아무것도 스캔하지 않는데 check 가 PASS(WI-0091 조사에서 발견) | WI-0098 (#242) | P18 | P3 | ✅ 2026-10-29 (#252, cli 1.7.7 · mcp 1.4.6) |
| 111 | init 이 다른 애니메이션 패키지만 설치된 경우 안내하지 않음(S9)(WI-0092 조사에서 발견) | WI-0099 (#243) | P18 | P3 | ⏳ |
| 112 | check · init 의 전역 CSS 파일 선택이 고정 후보만 보고 axis.config globalCss 를 쓰지 않음(WI-0092 조사에서 발견) | WI-0100 (#244) | P18 | P3 | ✅ 2026-10-29 (#250 · #255, cli 1.7.7 · mcp 1.4.6) |
| 114 | Yarn PnP 에서 컴포넌트 tailwind.css 를 import 해도 컴포넌트 클래스가 생성되지 않음(@source 가 zip 안을 가리킴, WI-0097 Q22 실빌드에서 발견, 사용자 결정 Q40) | WI-0102 (#249) | P18 | P3 | 🔄 배치 10 |
| 116 | Tailwind 3 preset 판정이 tokens 설치본의 exports(./tailwind)를 보지 않아 실빌드가 실패하는 레이아웃에서 PASS(WI-0101 · 0103 병합 검증에서 발견, 2026-10-30 사용자 결정) | WI-0104 (#260) | P18 | P3 | 🔄 배치 10 |

### 완료

| # | 항목 | GitHub Issue | Phase | 완료일 |
|---|------|--------------|-------|--------|
| 115 | check 의 패키지 CSS import 를 exports · 중첩 설치본(그림자)까지 보고 풂, npm cli v1.7.8 · mcp v1.4.7 릴리스 (#257 · Version PR #259) | #254 | P18 | 2026-10-30 |
| 113 | Tailwind 3 preset 의 tokens 를 이 앱에서 해석될 때만 인정(CJS · ESM · .ts 모양 무관, 설치 안내 ^1.7.0), npm cli v1.7.8 · mcp v1.4.7 릴리스 (#256 · Version PR #259) | #248 | P18 | 2026-10-30 |
| 101 | MCP 브랜드 도구가 같은 서버 세션의 tokens 변경을 따라감(내용 sha 감지 · Worker 격리 해석 · 폴백 stale 표시), npm cli v1.7.8 · mcp v1.4.7 릴리스 (#258 · Version PR #259) | #224 | P18 | 2026-10-30 |
| 112 | check · init 의 전역 CSS 선택이 axis.config `globalCss` 를 먼저 씀(0100a) · 전역 CSS 의 상대 `@import` 를 펼쳐 근거로 인정 · 순환 WARN · 깊이 32(0100b), npm cli v1.7.7 · mcp v1.4.6 릴리스 (#250 · #255 · #251, publish run 40811479954, provenance 2/2) | WI-0100 (#244) | P18 | 2026-10-29 |
| 109 | check 가 Tailwind 4 컴포넌트 `tailwind.css` 줄 · tokens CSS import 를 「이 앱에서 해석되는가」로 판정(해석되지 않는 줄은 안내 · 인정하지 않음), npm cli v1.7.7 · mcp v1.4.6 릴리스 (#253 · #251, publish run 40811479954, provenance 2/2) | WI-0097 (#241) | P18 | 2026-10-29 |
| 110 | Yarn PnP 의 Tailwind 3 content 판정이 실제 빌드와 맞음(node_modules glob WARN · unplugged 실경로 인정) · theme add PnP 안내, npm cli v1.7.7 · mcp v1.4.6 릴리스 (#252 · #251, publish run 40811479954, provenance 2/2) | WI-0098 (#242) | P18 | 2026-10-29 |
| 99 | theme add 가 루트 선언 tokens 를 앱 package.json 에 다시 쓰지 않음 · 루트 theme 선언이면 ThemeProvider 안내 끔 · Tailwind 4 루트 선언 컴포넌트 tailwind.css 는 설치본에 파일이 있을 때만, init 애니메이션 안내 3갈래(PnP · 자체 lockfile 은 종전), npm cli v1.7.5 릴리스 (#233 · #238, publish run 40396533945, provenance 1/1) | WI-0087 (#222) | P18 | 2026-10-27 |
| 39 | 온톨로지 콘솔 템플릿 `ontology-console` MVP(셸 · 통합 뷰 · 목록 · depth 상세 · 프로젝트 상세 2분할, ontology 기본 적용, check:ontology), Pages 배포(run 40318288781), 발행본 cli 1.7.4 init → install → build rc 0 · data-brand 확인 | WI-0027 (#232) | P17 | 2026-10-26 |
| 102 | pnpm 기본 레이아웃에서 실경로가 같은 상위 설치본 · 스토어 상대 실경로 content glob 을 인정(다른 실경로는 FAIL + 이유), npm cli v1.7.4 · mcp v1.4.4 릴리스 (#230 · #231, publish run 40316401629, provenance 2/2) | WI-0090 (#227) | P18 | 2026-10-26 |
| 94 | Select 의 placeholder 색을 trigger 안 값 표시에 적용, npm linked v1.8.2 릴리스 (#228 · #229, publish run 40302972775) | WI-0082 (#211) | P18 | 2026-10-26 |
| 91 | ontology 브랜드의 남은 대비 미달을 확인 문서 권장 묶음으로 반영(경계 · 트랙 · Progress 채움 · placeholder), npm linked v1.8.2 · cli v1.7.3 · mcp v1.4.3 릴리스 (#228 · #229, publish run 40302972775) | WI-0079 (#208) | P18 | 2026-10-26 |
| 98 | 의존성 선언 판정이 워크스페이스 루트 선언을 봄(tailwind-core · init utils · add · MCP install 공용 헬퍼) · 심링크 --dir 실경로 기준, npm cli v1.7.2 · mcp v1.4.2 릴리스 (#225 · #226, publish run 40271807118, provenance 2/2) | WI-0086 (#218) | P18 | 2026-10-26 |
| 97 | 설치 · 실행 안내가 매니저별(npm · yarn · pnpm) · lockfile 이 없으면 packageManager 필드를 따름, npm cli v1.7.2 · mcp v1.4.2 릴리스 (#225 · #226, publish run 40271807118, provenance 2/2) | WI-0085 (#217) | P18 | 2026-10-26 |
| 95 | library 대표 선택이 대표 3개 상세 JSON 만 읽음 · check-library-links code 모양 판정 · TW3 preset dist 세 진입점 테스트, npm 발행 없음 (#220) | WI-0083 (#212) | P18 | 2026-10-26 |
| 93 | 설치 안내 명령이 워크스페이스 루트 lockfile 을 따름 · 루트에만 선언한 의존성 인정과 출처 표시, npm cli v1.7.1 · mcp v1.4.1 릴리스 (#219 · #221, publish run 40247657745, provenance 2/2) | WI-0081 (#210) | P18 | 2026-10-26 |
| 92 | 호이스팅 모노레포의 Tailwind 3 content 를 실제 설치 위치로 판정 · theme add 안내, registry-core 변경에 cli · mcp changeset 동반 CI 검사, npm cli v1.7.1 · mcp v1.4.1 릴리스 (#219 · #221, publish run 40247657745, provenance 2/2) | WI-0080 (#209) | P18 | 2026-10-26 |
| 90 | library 상세 화면 데이터 fetch 경로를 지키는 E2E 스모크(대표 3 + 404 자기 검사) · CI 건수 가드 library:4 · a11y READY 좁힘, Pages 배포만 (#214) | WI-0078 (#206) | P18 | 2026-10-26 |
| 89 | Tailwind 3 preset 기본 테두리색이 AXIS `--border` 를 따름 · README 예시 정정, npm linked 4패키지 v1.8.1 릴리스 (#214 · #216, publish run 40205738223, provenance 6/6) | WI-0077 (#203) | P18 | 2026-10-26 |
| 88 | MCP 토큰 데이터를 tokens dist 에서 빌드 때 생성(309개 · 다크 값 · 미발견 isError), npm mcp v1.4.0 릴리스 (#214 · #216, publish run 40205738223, provenance 6/6) | WI-0076 (#202) | P18 | 2026-10-26 |
| 87 | 비대화형 실행에서 질문을 띄우지 않고 기본값 진행 또는 rc 1 안내, `template init -y`, npm cli v1.7.0 릴리스 (#214 · #216, publish run 40205738223, provenance 6/6) | WI-0075 (#201) | P18 | 2026-10-26 |
| 86 | check 의 Tailwind · AXIS 설치본 판독을 상위 디렉터리 탐색으로(호이스팅 모노레포), npm cli v1.7.0 · mcp v1.4.0 릴리스 (#214 · #216, publish run 40205738223, provenance 6/6) | WI-0074 (#199) | P18 | 2026-10-26 |
| 85 | Tooltip 이 포커스 스크롤에 닫히지 않게(ui-react 래퍼), npm linked 4패키지 v1.8.0 릴리스 (#207 · #205, publish run 40179615916, provenance 6/6) | WI-0073 (#194) | P18 | 2026-10-25 |
| 81 | agentic-ui · ui-react 비대비 a11y 결함(role · region · aria-controls · 시각 하이드레이션 #418), npm linked 4패키지 v1.8.0 · cli v1.6.2 · mcp v1.3.5 릴리스 (#207 · #205, publish run 40179615916, provenance 6/6) | WI-0069 (#183) | P18 | 2026-10-25 |
| 75 | 기본 테마 비텍스트 대비(폼 컨트롤 경계 · 트랙 · 포커스 링 · Progress · 상태 점, 새 토큰 6개), npm linked 4패키지 v1.8.0 릴리스 (#207 · #205, publish run 40179615916, provenance 6/6) | WI-0063 (#171) | P18 | 2026-10-25 |
| 74 | 기본 테마 텍스트 대비 잔여 쌍 + a11y 게이트 59경로 x 4 확대, npm linked 4패키지 v1.8.0 · cli v1.6.2 · mcp v1.3.5 릴리스 (#207 · #205, publish run 40179615916, provenance 6/6) | WI-0062 (#170) | P18 | 2026-10-25 |
| 72 | library 상세 데이터를 항목 id 파일로, 같은 주소의 shadcn 5개에 새 slug, npm cli v1.6.2 릴리스 (#204 · #205, publish run 40179615916, provenance) | WI-0060 (#159) | P18 | 2026-10-25 |
| 62 | Next 서버 컴포넌트 호환: ui-react · agentic-ui 모듈 보존 빌드 + 선택 "use client"(Avatar · Command · agentic 7개), avatarVariants 분리, theme 지시문, agentic exports 서브패스 6개, G1 정적 · G2 RSC 하네스 게이트, npm linked 4패키지 v1.5.0 릴리스 (#145 · #149, publish run 39496056901, provenance 4/4, 배포본 서버 page 빌드 · 상호작용 · 서버 cn/Variants 실측 통과) | WI-0050 (#143) | P18 | 2026-10-21 |
| 56 | Tailwind 4 연동: tokens `css/tailwind4`(preset 에서 생성한 @theme inline) · ui-react · agentic-ui `tailwind.css`(@source) · axis init 안내 · axis check/MCP WARN, npm linked 4패키지 v1.4.0 · cli v1.4.0 · mcp v1.2.2 릴리스 (#141 · #142, publish run 39413301099, provenance 6/6, 배포본 실앱 Playwright · CLI/MCP 실측 통과) | WI-0044 (#134) | P18 | 2026-10-20 |
| 54 | `axis check` · MCP `axis.check_project` 의 Tailwind 4 tailwind.config 오탐 수정(CSS 의 `@import "tailwindcss"` 로 판정, Tailwind 3 `.mjs` · `.cjs` 인정) + FAIL 시 종료 코드 1, npm cli v1.3.0 · mcp v1.2.1 릴리스 (#133 · #135, publish run 39351203366, provenance, 배포본 check rc 0/1 · MCP PASS 실측). AXIS 색 클래스 실제 적용은 WI-0044 | WI-0042 (#131) | P18 | 2026-10-20 |
| 55 | Ontology Platform 디자인 테마 v0.26 반영: 프로토타입 v0.24 · v0.26 대조로 토큰 변경 0건 확인(프리셋 변경 없음), WI-0027 PRD v0.5에 r3 화면 범위 병합(정본 전환은 WI-0027 Q7), WI-0025 머리말 갱신 | WI-0043 (#132) | P18 | 2026-10-20 |
| 50 | `axis init -y` 가 쓰는 utils.ts 의존성(`clsx` · `tailwind-merge`) 추가 · 안내 + `npx axis-cli` 안내 정정, npm cli v1.2.1 릴리스 (#129 · #130, publish run 39345179364, provenance, 배포본 init -> install -> build rc 0, npm `axis-cli@99.0.0` 선점 · deprecate) | WI-0038 (#124) | P18 | 2026-10-20 |
| 37 | 브랜드 테마 축(`data-brand`, brands 빌드 · brand.json, ThemeProvider brand) + ontology 프리셋 + 브랜드 전환 데모, npm v1.3.0 릴리스 (linked 4패키지, publish run 39238361098, provenance 4/4, 데모 `/docs/brand-demo/` 프로덕션 200) | WI-0025 M2~M4 (#84) | P16 | 2026-10-19 |
| 42 | `apps/web` tailwind content 경로에 `src/lib` 추가 (#114, cad9398) | WI-0030 (#95) | P18 | 2026-10-19 |
| 47 | tokens ESM 진입점 `dist/js/tokens.mjs` 문법 오류(1.1.0~1.2.1) 수정, 1.3.0 에 포함 (#118, 배포본 설치 스모크 1.3.0 rc 0 · 1.2.1 rc 1) | WI-0035 (#113) | P18 | 2026-10-19 |
| 48 | `@axis-ds/mcp` 데이터 경로 결함(ENOENT, 1.1.0~1.1.4 레지스트리 도구 6개) 수정 + tarball stdio 스모크, npm mcp v1.1.5 릴리스 (#116, publish run 39237376712, provenance, 배포본 실행 스모크 rc 0) | WI-0036 (#115) | P18 | 2026-10-19 |
| 36 | 토큰 정합: 정의 누락 변수 · agentic-ui primitive 직접 참조 해소 + 참조 검사 CI, npm v1.2.1 릴리스 (linked 4패키지, Trusted Publishing OIDC, WI-0033 다크 수정 포함) | WI-0025 M1 (#83) | P16 | 2026-10-17 |
| 35 | npm v1.2.0 릴리스 (linked 4패키지, CI NPM_TOKEN 인증 실측 검증) | #80 | P15 | 2026-08-07 |
| 34 | Pretendard 대표 폰트 적용 (tokens sans 스택 + preset fontFamily + web 동적 서브셋 번들) | #79 | P15 | 2026-08-07 |
| 33 | Publish/Sync 워크플로 결함 수정 (npm EOTP 토큰 + pnpm/CLI 3중) | #78 | P14 | 2026-07-07 |
| 32 | npm v1.1.3 릴리스 (cli/mcp 도메인 fix 반영, Automation 토큰) | WI-0024 (#77) | P14 | 2026-07-07 |
| 31 | 죽은 도메인 참조 정리 + 레지스트리 URL/경로 정합 | WI-0024 (#76) | P14 | 2026-07-07 |
| 30 | 다크 모드 a11y E2E + 코드블록 다크 구문색 | WI-0023 (#74) | P13 | 2026-06-30 |
| 29 | E2E a11y baseline 해소 + 엄격 게이트 | WI-0022 (#72) | P13 | 2026-06-30 |
| 28 | E2E Playwright a11y 도입 | WI-0021 (#71) | P13 | 2026-06-30 |
| 27 | axe 컴포넌트 a11y 테스트 + CI 게이트 | WI-0020 (#69,#70) | P13 | 2026-06-30 |
| 26 | 문서 Accessibility 섹션 (48p) | WI-0019 (#66,#68) | P12 | 2026-06-30 |
| 25 | 문서 순서·명칭 심화 표준화 | WI-0018 (#65) | P12 | 2026-06-30 |
| 24 | 문서 사이트 검색 (Pagefind) | WI-0017 (#63,#64) | P12 | 2026-06-30 |
| 23 | 문서 페이지 레이아웃 표준화 | WI-0016 (#62) | P12 | 2026-06-30 |
| 22 | 홈페이지 리뉴얼 | WI-0015 | P11 | 2026-02-01 |
| 21 | 문서 사이트 핵심 컴포넌트 | WI-0014 | P11 | 2026-02-01 |
| 20 | 문서 사이트 기반 인프라 | WI-0013 | P11 | 2026-02-01 |
| 19 | npm 정식 배포 실행 | WI-0012 | P10 | 2026-02-01 |
|---|------|--------------|-------|--------|
| 18 | 외부 프로젝트 연동 패키지 설정 | — | P9 | 2026-02-01 |
| 17 | v1.0 안정화 | WI-0011 | P8 | 2026-02-01 |
| 1 | Monorepo 구조 및 패키지 설정 | [#45](https://github.com/IDEA-on-Action/AXIS-Design-System/issues/45) | P0 | 2026-01-22 |
| 2 | 디자인 시스템 리소스 연동 | [#46](https://github.com/IDEA-on-Action/AXIS-Design-System/issues/46) | P2 | 2026-01-23 |
| 3 | 사이트 구현 및 배포 | [#47](https://github.com/IDEA-on-Action/AXIS-Design-System/issues/47) | P2 | 2026-01-23 |
| 4 | 프로젝트 정리 및 Library 기능 | [#48](https://github.com/IDEA-on-Action/AXIS-Design-System/issues/48) | P3 | 2026-01-23 |
| 5 | Core UI 기본 컴포넌트 10개 | [#49](https://github.com/IDEA-on-Action/AXIS-Design-System/issues/49) | P1 | 2026-01-22 |
| 6 | Agentic UI 기본 컴포넌트 10개 | [#50](https://github.com/IDEA-on-Action/AXIS-Design-System/issues/50) | P3 | 2026-01-22 |
| 7 | 문서 사이트 개선 | [#41](https://github.com/IDEA-on-Action/AXIS-Design-System/issues/41) | P3 | 2026-01-31 |
| 8 | 템플릿 시스템 기반 구축 | [#51](https://github.com/IDEA-on-Action/AXIS-Design-System/issues/51) | P4 | 2026-02-01 |
| 9 | axis-cli 기능 확장 | [#42](https://github.com/IDEA-on-Action/AXIS-Design-System/issues/42) | P2 | 2026-02-01 |
| 10 | Core UI 컴포넌트 확장 (30개) | [#39](https://github.com/IDEA-on-Action/AXIS-Design-System/issues/39) | P1 | 2026-02-01 |
| 11 | npm 배포 준비 | [#43](https://github.com/IDEA-on-Action/AXIS-Design-System/issues/43) | P2 | 2026-02-01 |
| 12 | CLI Template 명령어 구현 | [#52](https://github.com/IDEA-on-Action/AXIS-Design-System/issues/52) | P5 | 2026-02-01 |
| 13 | DX 개발자 경험 향상 | [#44](https://github.com/IDEA-on-Action/AXIS-Design-System/issues/44) | P2 | 2026-02-01 |
| 14 | Agentic UI 추가 구현 | [#40](https://github.com/IDEA-on-Action/AXIS-Design-System/issues/40) | P3 | 2026-02-01 |
| 15 | MCP 템플릿 Tools 구현 | [#53](https://github.com/IDEA-on-Action/AXIS-Design-System/issues/53) | P6 | 2026-02-01 |
| 16 | 외부 DS 연합형 확장 | [#54](https://github.com/IDEA-on-Action/AXIS-Design-System/issues/54) | P7 | 2026-02-01 |

---

## 📊 로드맵 진행률

| Phase | 설명 | 완료 | 전체 | 진행률 |
|-------|------|------|------|--------|
| Phase 0 | 프로젝트 초기화 | 5 | 5 | 100% |
| Phase 1 | Core 컴포넌트 | 8 | 8 | 100% |
| Phase 2 | 인프라 구축 | 8 | 8 | 100% |
| Phase 3 | Agentic UI | 10 | 10 | 100% |
| Phase 4 | 템플릿 골격 + 갤러리 | 4 | 4 | 100% |
| Phase 5 | Template Engine + CLI | 8 | 8 | 100% |
| Phase 6 | MCP 연동 고도화 | 6 | 6 | 100% |
| Phase 7 | 외부 DS 연합형 확장 | 4 | 4 | 100% |
| Phase 8 | v1.0 안정화 | 6 | 6 | 100% |
| Phase 9 | 외부 연동 패키지 설정 | 6 | 6 | 100% |
| Phase 11 | 문서 사이트 리뉴얼 | 3 | 3 | 100% |
| Phase 12 | 문서 사이트 표준화 (레이아웃·검색·구조·a11y) | 4 | 4 | 100% |
| Phase 13 | 접근성 자동 보장 (axe 단위·E2E 라이트/다크·게이트) | 4 | 4 | 100% |
| **전체** | - | **76** | **76** | **100%** |

### Phase별 상세

<details>
<summary>Phase 0: 프로젝트 초기화 (100%)</summary>

- [x] Monorepo 구조 설정
- [x] 패키지 구조 정의
- [x] 빌드 파이프라인 구성
- [x] 개발 환경 설정
- [x] CI/CD 기본 설정

</details>

<details>
<summary>Phase 1: Core 컴포넌트 (100%)</summary>

- [x] 디자인 토큰 정의
- [x] Button 컴포넌트
- [x] Input 컴포넌트
- [x] Avatar 컴포넌트
- [x] Badge 컴포넌트
- [x] Card 컴포넌트
- [x] Alert 컴포넌트
- [x] 테마 시스템 구현

</details>

<details>
<summary>Phase 2: 인프라 구축 (100%)</summary>

- [x] CLI 도구 개발
- [x] MCP 서버 구현
- [x] 레지스트리 시스템
- [x] 문서 사이트 기본 구조
- [x] 패키지 배포 준비
- [x] 컴포넌트 스토리북
- [x] 타입 정의 완성
- [x] 접근성 기본 지원

</details>

<details>
<summary>Phase 3: Agentic UI (100%) ✅</summary>

- [x] AgentAvatar 컴포넌트
- [x] ThinkingIndicator 컴포넌트
- [x] AgentMessageBubble 컴포넌트
- [x] ToolCallCard 컴포넌트
- [x] CodeBlock 컴포넌트
- [x] ArtifactRenderer 컴포넌트
- [x] ProgressStepper 컴포넌트
- [x] 접근성 WCAG 2.1 AA 지원
- [x] 컴포넌트 문서화 완성 (#41)
- [x] 라이브러리 페이지 구현 (#41)

</details>

<details>
<summary>Phase 4: 템플릿 골격 + 갤러리 (100%) ✅ - #51</summary>

- [x] templates/ 디렉토리 구조 설계
- [x] template.json 스키마 정의
- [x] 최소 템플릿 구현 (Theme-only)
- [x] 템플릿 갤러리 UI 기본 구현

</details>

<details>
<summary>Phase 5: Template Engine + CLI (100%) ✅ - #52</summary>

- [x] axis template list 명령어
- [x] axis template info 명령어
- [x] axis template apply 명령어
- [x] axis template init 명령어
- [x] axis template diff 명령어
- [x] axis check 명령어
- [x] postInstall patch 시스템
- [x] 샘플 템플릿 추가 (landing/dashboard)

</details>

<details>
<summary>Phase 6: MCP 연동 고도화 (100%) ✅ - #53</summary>

- [x] list_templates MCP tool
- [x] get_template MCP tool
- [x] apply_template MCP tool
- [x] diff_template MCP tool
- [x] check_project MCP tool
- [x] IDE/Claude Code 워크플로 문서화

</details>

<details>
<summary>Phase 7: 외부 DS 연합형 확장 (100%) - #54</summary>

- [x] shadcn 블록 링크 템플릿
- [x] monet 리소스 link-only 연동
- [x] 커뮤니티 기여 가이드
- [x] 라이선스 게이트 자동화

</details>

<details>
<summary>Phase 8: v1.0 안정화 (100%) ✅ - WI-0011</summary>

- [x] 테스트 커버리지 확보 (ui-react, agentic-ui)
- [x] 문서 사이트 전수 검수
- [x] npm dry-run 배포 검증
- [x] CHANGELOG v1.0.0 작성
- [x] 전 패키지 버전 1.0.0 범핑
- [x] npm 정식 배포

</details>

<details>
<summary>Phase 9: 외부 연동 패키지 설정 (100%) ✅</summary>

- [x] Dark mode CSS Variables 빌드 추가
- [x] shadcn 호환 CSS Variables (shadcn-compat.css) 생성
- [x] Tailwind CSS Preset 생성
- [x] 패키지 메타데이터 개선 (sideEffects, exports)
- [x] 예제 프로젝트 (examples/nextjs-app)
- [x] npm 배포 changeset 준비

</details>

<details>
<summary>Phase 11: 문서 사이트 리뉴얼 (100%) ✅ - WI-0013/0014/0015</summary>

- [x] 다크모드 토글 (next-themes + ThemeProvider)
- [x] 네비게이션 데이터 구조 (config/docs.ts)
- [x] 레이아웃 시스템 재설계 (Route Group, 사이드바, TOC, DocPager)
- [x] CodeBlock + shiki 구문 강조
- [x] 컴포넌트 프리뷰 시스템 (ComponentExample + 레지스트리)
- [x] Props 테이블 개선 (Required 뱃지, 모바일 카드형)
- [x] 홈페이지 리뉴얼 (Hero, Features, Showcase, Install)

</details>

<details>
<summary>Phase 12: 문서 사이트 표준화 (100%) ✅ - WI-0016~0019</summary>

- [x] DocPageLayout/DocSection 공용 컴포넌트 + 48p 레이아웃 마이그레이션 (WI-0016)
- [x] Pagefind 검색 (⌘K, data-pagefind-body 인덱싱, 프로덕션 E2E 검증) (WI-0017)
- [x] 섹션 순서 정규화(Usage 2번째) + 데모 명칭 통일 + Type 패턴 (WI-0018)
- [x] KeyboardTable + 48p Accessibility 섹션 (Radix WAI-ARIA 단언 / 커스텀·agentic 가이드) (WI-0019)

</details>

<details>
<summary>Phase 13: 접근성 자동 보장 (100%) ✅ - WI-0020~0023</summary>

- [x] agentic a11y 노트 실제 aria 동기화 (WI-0019 후속, #68)
- [x] jest-axe 컴포넌트 a11y 테스트 38개 + Slider 썸 라벨 수정 (WI-0020, #69)
- [x] CI Test 스텝 추가 (a11y 회귀 게이트, #70)
- [x] E2E Playwright a11y 인프라 (WI-0021, #71)
- [x] E2E baseline 위반 전부 해소 + 엄격 게이트 (WI-0022, #72)
- [x] 다크 모드 a11y E2E + 코드블록 다크 구문색 수정 (WI-0023, #74)

</details>

---

## 🔜 다음 단계

### 문서 사이트 표준화 + 접근성 보장 ✅ 완료 (Phase 12·13, 2026-06-30)
- ✅ Phase 12: 레이아웃·검색·구조·a11y 섹션 (WI-0016~0019)
- ✅ Phase 13: axe 단위·E2E(라이트/다크)·CI 게이트로 a11y 자동 보장 (WI-0020~0023)

### 브랜드 테마 · 온톨로지 실행 계획 (Phase 16·17, 2026-10-15 수립, 2026-10-19 재계획)

> 2026-10-16 재계획: M1은 머지됐으나 1.2.1 publish가 NPM_TOKEN 만료로 실패해 npm은 1.2.0입니다. 다크 모드 component 토큰 결함(WI-0033)을 1.2.1에 포함하기로 해 실패한 publish run은 다시 돌리지 않고, WI-0033 머지 push로 새 publish를 실행합니다. M3는 `feat/wi-0025-m3-ontology`에서 구현 중이고, WI-0028은 PRD v0.4의 「M2 이후 착수」 조건에 따라 배치 2에 둡니다.
>
> 2026-10-17: 배치 0 · 0' 완료. NPM_TOKEN 교체 대신 WI-0031(npm Trusted Publishing, OIDC) 머지 push로 publish가 실행되어 1.2.1이 배포됐습니다(run 38992207088, provenance 4/4). npm은 1.2.1입니다.

> 2026-10-17: 배치 1 · 1' 완료. M2(#91)와 WI-0034(#104)가 머지됐고, M3는 새 main(988294a) 위로 옮긴 `feat/wi-0025-m3-ontology-v2`에서 2차 구현을 이어갑니다(기존 `feat/wi-0025-m3-ontology`는 백업).

> 2026-10-19 재계획(`/ax:todo plan`): M3(#107)는 2차 구현이 끝나 디자인 오너 사후 확인 8건만 남았고(2026-10-19 완료), M4(#110)는 데모 · AC7을 마쳐 가이드 · 1.3.0 문서가 남았습니다. 사용자 결정으로 WI-0026 · WI-0028 · WI-0029 · WI-0030을 지금 함께 착수하되, **착수와 머지를 분리**해 충돌을 머지 순서로 관리합니다. 근거는 실측입니다: WI-0030이 고칠 `apps/web/tailwind.config.ts` content 배열은 M3 · M4 브랜치가 이미 고쳤고(registry · 패키지 경로 추가), WI-0029가 바꿀 기본 테마 색은 M3 · M4의 a11y 기준선(WI-0029 상한 7, `DEMO_KNOWN_PAIRS`)에 묶여 있습니다. WI-0028은 `packages/axis-cli` · `axis-mcp`만 고쳐 M3 · M4 변경과 겹치는 파일이 0건입니다. WI-0028 선행 조건은 PRD(「1.3.0 배포 이후 착수」)와 이 표(「M3와 병렬」)가 어긋나 있어 「개발은 지금, cli · mcp 배포는 1.3.0 뒤」로 맞추고 PRD 4행을 고쳤습니다.

> 2026-10-19 추가 결정: 새로 등록한 WI-0035(tokens ESM, #118) · WI-0036(mcp 데이터 경로, #116) · WI-0037(템플릿 원형 빌드, 이슈 #119)을 배치에 넣습니다. WI-0035는 별도 1.2.2 patch를 취소하고 1.3.0에 합칩니다. 1.2.1 배포(`014e8ac`) 뒤 main에 머지된 M2(89ab33a, ThemeProvider `brand` · `ThemeContextValue` 필수 멤버 추가)가 changeset 없이 들어 있어 main에서 1.2.2를 내면 그 기능과 타입 변경이 patch 번호로 나가기 때문입니다(실측: `git diff 014e8ac origin/main -- packages/axis-theme/src/index.ts`). `publish.yml`은 main에서만 OIDC로 발행하므로 1.2.1 태그 기반 release 브랜치도 인프라 변경이 필요해 택하지 않았고, 결함은 1.1.0부터 배포본 6개 전부에 있었으나 보고는 0건입니다. #118의 tokens patch changeset은 M4의 minor changeset과 합쳐져 linked 4패키지 1.3.0이 됩니다. #118을 일찍 머지하면 Version Packages PR이 1.2.2를 제안하므로 M4 바로 앞에 둡니다. M3의 라이트 브랜드 선택자는 `[data-brand="x"][data-brand="x"]`(0,2,0)로 확정했고(하위 요소 브랜드 지원 유지, CI 건수 가드 tokens 22 동반 수정), PR CI pack-smoke는 M3(#107)의 step(Build 직후, 패키지 수 가드 포함)을 남기고 WI-0036이 추가한 step은 #116 머지 뒤 M3 브랜치에 main을 병합할 때 지웁니다. 두 브랜치 사이에는 충돌이 없어(`git merge-tree --write-tree` rc 0, 병합 트리의 `frontend.yml`에 `- name: Pack smoke` 2개) 병합만으로는 #116 step이 신호 없이 남으므로, 충돌 해소가 아니라 명시적 단계로 지웁니다. `publish.yml`은 changesets/action이라 #116 머지만으로는 발행되지 않고 Version Packages PR이 열리므로, 그 PR(mcp 1.1.5)을 M3 앞에서 머지합니다. 이 PR이 #118 머지 뒤까지 열려 있으면 tokens patch가 함께 실려 linked 4패키지 1.2.2를 제안합니다.

> 2026-10-19 머지 결과: #116(WI-0036, c5964e8)과 #107(M3, squash 8253a82)이 머지됐습니다. M3는 디자인 오너 사후 확인 8건을 받은 뒤 머지했고, 계획과 달리 mcp 1.1.5 Version Packages PR(#120)보다 먼저 들어갔습니다. #120은 `@axis-ds/mcp` 1.1.5만 담고 있어(M3는 changeset 없음) 순서가 바뀌어도 릴리스 내용은 같습니다. M3 브랜치에서 #116 step을 지우는 단계는 수행되지 않아 main `frontend.yml`의 `ci` job에 pack-smoke step이 2개 남았고, 이 중복은 별도 PR로 지웁니다. 이어서 #114(WI-0030, cad9398)도 계획과 달리 #120 · #121보다 먼저 머지됐습니다(2026-10-19 재조회 기준 #120 · #121은 열려 있음).

| 배치 | 단위 | 형태 | 선행 조건 | 릴리스 |
|------|------|------|----------|--------|
| 0 ✅ | NPM_TOKEN 교체(사용자) → WI-0033 PR 머지 → publish 자동 실행 → 1.2.1 확인 · M1 후속 정리 (2026-10-17 완료, 토큰 교체 대신 WI-0031 OIDC로 배포) | 순차 | WI-0033 보정 완료 | 1.2.1 (tokens · ui-react · agentic-ui · theme, WI-0033 포함) |
| 0' ✅ | PR #98 머지 · WI-0031(Trusted Publishing 전환, #102) (2026-10-17 완료) | 배치 0과 독립 | 없음 | - |
| 1 ✅ | WI-0025 M2(#91) rebase(WI-0033 위, 다크 전처리 한 줄) · 머지 (2026-10-17 완료, 89ab33a) | 순차 | 배치 0 | 1.3.0 누적 |
| 1' ✅ | WI-0034 라이브러리 lint · type-check 스크립트 (2026-10-17 완료, #104 988294a) | 순차 (M2와 같은 `package.json`) | 배치 1 | - |
| 2 | 🔄 WI-0025 M3(#107) 머지 ✅(2026-10-19, 8253a82) ∥ M4(#110) 마무리 ∥ WI-0028(#117) 착수 (2026-10-19) ∥ WI-0030(#114) 머지 ✅(2026-10-19, cad9398) ∥ WI-0026 · WI-0029 착수 예정(브랜치 없음, 2026-10-19 실측) ∥ WI-0035(#118) · WI-0036(#116, 머지 ✅ 2026-10-19 c5964e8) · WI-0037 착수 (2026-10-19 등록) | 병렬 착수, 머지는 아래 순서 | M3 디자인 오너 사후 확인 8건 완료(2026-10-19) | - |
| 3 | 머지 순서(2026-10-19 현재): ① WI-0036(#116) ✅ 2026-10-19 머지(c5964e8) → ② M3(#107) ✅ 2026-10-19 squash 머지(8253a82, 디자인 오너 사후 확인 완료(2026-10-19), 계획과 달리 ①′보다 먼저 머지) → ①′ changesets/action이 연 Version Packages PR(#120, mcp 1.1.5만) 머지 · npm에서 `@axis-ds/mcp` 1.1.5 확인 → ②′ pack-smoke 중복 제거 PR(#121, `ci/dedupe-pack-smoke`, main `frontend.yml`의 `ci` job에서 #116 step 「Pack smoke (외부 npm 소비 · mcp 실행 검증, WI-0036)」 삭제, `python3 -c`의 `yaml.safe_load`로 읽어 `run`에 `pack-smoke`를 포함한 step 수가 정확히 1) → ③ WI-0030(#114, M3가 고친 content 배열 위로 main을 받아 정리) ✅ 2026-10-19 머지(cad9398), 계획과 달리 ①′ · ②′보다 먼저 머지 → ④ WI-0035(#118, M4 바로 앞, tokens patch changeset, #120 머지 뒤) → ⑤ M4(#110, 1.3.0 minor changeset 포함) → ⑥ Version Packages PR(1.3.0) → ⑦ WI-0026(M3 머지로 main에서 시작, 종전 계획은 M3 브랜치 위) | 순차 | ①′ npm 1.1.5 확인 · ④는 ①′ · ⑤ WI-0035 머지 | mcp 1.1.5(①′ Version Packages PR 머지 시점) · 1.3.0(⑥ Version Packages PR 머지 시점, WI-0035 포함, 1.2.2 취소) |
| 4 | (2026-10-24 대체: 아래 「WI 배치 계획」. ⑩ WI-0029 ✅ 1.6.0, WI-0028 은 종결 대상, WI-0037 은 WI-0027 의 선행) ⑧ WI-0037 머지(WI-0028 AC2(b) 실경로 빌드 검증의 선행) → ⑨ WI-0028 머지(1.3.0 배포 뒤, ontology 실데이터로 재확인) → cli · mcp 1.2.0 배포 ∥ ⑩ WI-0029 머지(1.3.0 뒤, a11y 기준선 축소와 함께) | 병렬 (패키지 겹침 없음) | 1.3.0 배포 · ⑨는 ⑧ | cli · mcp 1.2.0 · tokens patch(WI-0029) |
| 5 | WI-0027 (2026-10-24 대체: 아래 「WI 배치 계획」 배치 5) | 순차 | ~~M3 · WI-0026 · WI-0028~~ → WI-0037 · WI-0046 · WI-0051 · WI-0026 · WI-0062 | 템플릿 배포 |

- 브랜치 기준: WI-0028 · WI-0029 · WI-0030 · WI-0035 · WI-0036 · WI-0037은 main에서, WI-0026은 M3가 머지됐으므로 main에서 시작합니다(종전 계획은 `feat/wi-0025-m3-ontology-v2` 위, 아직 착수 전). WI-0028은 main의 M2 브랜드 빌드(`build-brands.mjs`)와 테스트 fixture로 개발했고, M3가 머지됐으므로 실제 `ontology` 프리셋 확인은 이제 main에서 할 수 있습니다. WI-0029는 기본 출력을 바꾸므로 1.3.0의 「기본 출력 불변(AC3)」 근거를 흐리지 않도록 1.3.0 뒤에 머지합니다. WI-0035는 tokens patch changeset만 담고 따로 배포하지 않습니다(1.2.2 취소, M4와 함께 1.3.0). M3는 #116이 먼저 머지된 main을 받아 squash 머지됐고, 계획했던 「병합 커밋 뒤 #116 step 삭제」는 M3 브랜치에서 하지 않아 main `ci` job에 pack-smoke step이 2개(M3 AC4 「Pack smoke (외부 npm 소비 검증, AC4)」 · WI-0036) 남아 있습니다. 중복은 별도 PR(②′)로 #116 step을 지워 정리합니다.
- WI-0029 정본 수치(2026-10-17 기록, ⑩ 머지 때 기준선 축소의 근거): 기본 테마 흰 글자 대비. 정본 수치: 기본 브랜드 a11y 기준선 12건 · 26노드(라이트 · 다크 각 6페이지 13노드, `#ffffff`/`#3b82f6` 24 · `#ffffff`/`#ef4444` 2), 측정 조건은 2026-10-17 `--force` 빌드 `apps/web/out`을 static 서버로 띄운 Chromium, WI-0025 PRD AC8 기준선 조항. 2026-10-18 WI-0025 M4 갱신: a11y 대상에 브랜드 전환 데모(`/docs/brand-demo/`)를 더해 10페이지 · 40건이 되면서 기준선은 14건 · 40노드(라이트 · 다크 각 7페이지 20노드, `#3b82f6` 36 · `#ef4444` 4), 데모 페이지가 실제 agentic-ui 컴포넌트를 그리며 드러난 기본 토큰 결함 쌍(라이트 흰 글자/`#22c55e` 2.27:1 PlanCard 승인 버튼 · `#ef4444`/`#f3f4f6` 3.41:1 거절 버튼 hover 바탕으로 측정, 다크 흰 글자/`#22c55e` 2.27:1 · `#6b7280` `text-tertiary` 4.16 · 4.11:1)을 WI-0029 대상에 더함(데모 경로 한정 기준선 라이트 2 · 다크 4노드, 측정 조건 같음, PRD AC8 변경 주석). 이전 기록 15건 · 144노드(f64825d)는 측정 조건이 달라 쓰지 않음. 추가로 기본 브랜드 PlanCard 거부 버튼 hover 글자 라이트 3.01 · 다크 4.34:1(4.5 미달, 미달은 이전부터. 1.2.1 은 hover 옅은 바탕이 투명해 `surface-secondary` 위 글자 3.42 · 4.71:1 이었고, 1.3.0 에서 바탕이 생겨 조금 더 낮아짐. 측정 조건: 2026-10-18 b9f225f 에서 다시 빌드한 기본 `variables.css` 값으로 node WCAG 계산, 글자 `plan-card-reject-hover-text` = `status-error` #EF4444, 바탕은 하단 영역 `surface-secondary`(라이트 #F3F4F6 · 다크 #111827) 위 `status-error` 10% sRGB 합성. axe 기준선에는 hover 상태가 없어 위 12건에 들지 않음)
- 동시 진행: 2026-10-19 M3 · WI-0036 머지 뒤 남은 착수 단위가 M4 포함 7개라 병렬 상한(3)을 넘습니다. 한 번에 구현하는 단위는 3개 이하로 두고, 나머지는 설계 · PRD 확인 단계에 둡니다.
- 임계 경로: ~~WI-0033 보정 → NPM_TOKEN 교체(사용자) → WI-0033 머지 · 1.2.1 배포~~ ✅ → ~~M2 → WI-0034~~ ✅ → ~~WI-0036 → M3(디자인 오너 사후 확인)~~ ✅ → Version Packages PR(#120, mcp 1.1.5) → pack-smoke 중복 제거(#121) → ~~WI-0030(#114)~~ ✅ → WI-0035(#118) → M4(#110) → Version Packages PR(1.3.0) → WI-0037 → WI-0028 · WI-0026 → WI-0027
- 착수 전: WI-0025 부록 B(2026-10-16 v0.24 · 디자인 시스템 v1 기준: 라이트 보조 글자 `sub` 1개 값 보정, 미달 쌍 처리, 입력 테두리 1.40:1 유지 여부, PlanCard 색 선 두께, 에이전트 상태 색 접기) 2026-10-16 사용자 대리 승인, 디자인 오너 사후 확인 8건 완료(2026-10-19, M3 머지 전) ✅
- 착수: `/ax-wi start <WI>` 로 WI마다 진행

### WI 배치 계획 (2026-10-25 재계획, 배치 1 · 2 완료 뒤)

> 근거: 미완료 WI 11건을 main 3368786(linked 1.6.2 · cli 1.6.0 · mcp 1.3.3)에서 재실측, 비판 검토 major 1 · minor 4 반영. 종료 후보 0. 배치 1 ✅(#176~#179) · 배치 2 ✅(#184~#188, #187). 지난 계획(2026-10-24) 대비: WI-0060 을 배치 3 → 4(library 사본 14개가 WI-0071 뒤 재생성 필요), 새 WI-0066~0070 · 0072 배정. 진행 중 WI-0071(#190)은 배치와 별도로 먼저 머지 · 배포.

| 배치 | 묶음(브랜치) | 릴리스 | 머지 순서 · 근거 |
|------|------|------|------|
| 3 | ✅ 2026-10-25 완료(#195 · #196 · #198, Release #197 → linked 1.7.0 · cli 1.6.1 · mcp 1.3.4, 발행본 재측정 불일치 0) ① WI-0051 + 0070 + 0068 + 0072 check · 브랜드 판정 · CJS preset(template-check.ts · mcp template.ts · brand-core 사본 · 가이드 4절 · tokens tailwind 진입점) ② WI-0026 밀도 토큰 ③ WI-0066 문서 mock 4페이지 | linked minor(1.7.0) · cli · mcp patch | ③ → ① → ②. brand-core.ts(cli · mcp 바이트 사본)는 ① 소유, ② 는 KEY_TOKENS 를 고를 때만 ① 머지 뒤 rebase · cp. ② 는 착수 직전 WI-0071 브랜치가 packages/axis-tokens 를 건드리지 않는지 재측정. quick-start 는 WI-0071 과 ① 이 다른 hunk 를 고침(나중 머지가 rebase) |
| 4 | ✅ 2026-10-25 완료(#200 · #204 · #207, Release #205 → linked 1.8.0 · cli 1.6.2 · mcp 1.3.5, 발행본 재측정 불일치 0) ① WI-0060 library slug ② WI-0062 + 0063 + 0069 + 0073 대비 · 비대비 · Tooltip ③ WI-0067 템플릿 AXIS 전환 | linked minor 또는 patch · cli patch | 전제: WI-0071 머지(그 PR 에 public/templates churn 이 없는지 확인). ③ → ① → ②. ② 는 ontology-pairs.mjs(줄 번호 대조 표)를 커밋마다 갱신 |
| 5 | WI-0027 온톨로지 콘솔 템플릿(4차 재계획에서 배치 6 뒤 배치 7 로 이동) | Pages 만(PRD v0.6 D2: FR-4 는 템플릿 안 스크립트, cli · mcp 연동은 후속) | 선행 WI-0051 + 0070 + 0068 · 0026 · 0062 · 0063 · 0067. PRD 전제(defaultBrand · 고정 5항목 · AC5 게이트)는 PRD v0.6 1.4 에서 정정(2026-10-26) |
| 6 | ✅ 2026-10-26 완료(#214 · 규칙 #215, Release #216 → linked 1.8.1 · cli 1.7.0 · mcp 1.4.0, publish run 40205738223, provenance 6/6, 발행본 재측정 불일치 0) WI-0074 check 상위 탐색 · WI-0075 비대화형 · WI-0076 MCP 토큰 생성 · WI-0077 TW3 기본 테두리 · WI-0078 library 상세 스모크 | linked patch(1.8.1) · cli minor(1.7.0) · mcp minor(1.4.0) | WI-0078 → 0076 → 0074 → 0075 → 0077 을 한 PR(#214)로. 다음은 배치 6b WI-0080 · 0081 · 0083 |
| 6b | ✅ 2026-10-26 완료(#219 · #220, Release #221 → cli 1.7.1 · mcp 1.4.1, publish run 40247657745, provenance 2/2, 발행본 재측정 불일치 0) WI-0080 TW3 content 설치 위치 판정 · WI-0081 워크스페이스 루트 lockfile · 루트 선언 인정 · WI-0083 테스트 보강 | cli · mcp patch(linked 4패키지 1.8.1 그대로) | WI-0080 · 0081 을 한 PR(#219), WI-0083 은 별도 PR(#220, 발행 없음). 다음은 WI-0085 · 0086(registry-core, push 모드 검사 확인) · WI-0079 · 0082 |
| 6c | ✅ 2026-10-26 완료(#225, Release #226 → cli 1.7.2 · mcp 1.4.2, publish run 40271807118, provenance 2/2, 발행본 재측정 불일치 0) WI-0086 루트 선언 판정 일관화 · 실경로 기준 · WI-0085 매니저별 안내 · lockfile 이 없으면 packageManager | cli · mcp patch(linked 4패키지 1.8.1 그대로) | 한 PR(#225, 커밋 WI-0086 → WI-0085), 단독 push 로 changeset 검사 push 모드 정착 확정(run 40269191762). 다음은 WI-0079 · 0082 → 배치 7 WI-0027 |

- 배치 3 결정(2026-10-25, 브리프 · 반박 검토 뒤 권장안 일괄 채택): ① WI-0072 tokens CJS 진입점이 preset 자체를 내보냄(이름 내보내기 non-enumerable · .d.cts) + cli 안내 CJS 는 `.default` + check 는 module.exports · .cjs 일 때만 WARN(결함은 1.1.0 부터). WI-0068 해제 센티널 "" · 초기값 저장값 > 마크업 data-brand > defaultBrand(사용자 결정: 마크업 우선) · check 는 theme 버전 분기. WI-0051 설치본 상위 탐색 + WARN, 판독 함수 registry-core 하나. WI-0070 plugins 배열 판독 · globals.css 는 AXIS 근거(--axis- · tokens CSS import · 레이아웃 JS import) 필요(템플릿 4종 WARN 은 WI-0067 까지 수용) ② WI-0026 Q3 (나) 대상 8개 직접 참조 · Sheet 제외 · component 최상위 토큰 · 리터럴 fallback · 아이콘 버튼 control-h-md · ontology lg 42/15 · Select field 36 · Toggle 미덮어씀 · field 둥글기 별도 · 표 머리 전용 토큰 · KEY_TOKENS 미추가 ③ WI-0066 mock 교체만 · PAGES 유지. 릴리스: theme minor 로 linked 1.7.0, cli · mcp patch. 새 WI-0073(#194) Tooltip 지속성은 배치 4 a11y 묶음
- 배치 4 결정(2026-10-25, 브리프 · 반박 검토 뒤): ③ WI-0067 ✅(#200, Pages, 글꼴 pretendard 추가). ① WI-0060 은 충돌 5개(accordion · button · collapsible · command · toggle)의 shadcn 항목만 새 slug(`shadcn-<slug>`), 나머지 124 URL 유지, 데이터 파일 `components/<id>.json`, 코드 없는 외부 항목 화면은 범위 밖. ② a11y 는 권장안 일괄(D1 혼합 · D3 기본 브랜드만 컨트롤 경계 3:1 · D4 새 ui-react 비대비 결함도 WI-0069 · D5 locale · timeZone prop · D6 Tooltip 래퍼 제어, Radix 업스트림 이슈는 초안만), a11y 게이트는 문서 정적 전 경로 + 동적 라우트 대표 1개씩 · CI 건수 가드는 경로 목록에서 계산. 릴리스는 ② 머지 뒤 한 번에(linked 1.8.0 · cli 1.6.2 · mcp 1.3.5). 순서 ① → ②
- 재계획(2026-10-25, `/ax:todo plan` 3차): 배치 4 = ① WI-0060(진행 중) → ② WI-0062 · 0063 · 0069 · 0073 → linked 1.8.0 · cli 1.6.2 · mcp 1.3.5 한 번에 발행. 배치 5 = WI-0027 온톨로지 콘솔 템플릿(선행 WI-0062 · 0063 · 0067 충족 뒤, 착수 전 PRD FR-2 「기존 템플릿은 @axis-ds 에 의존하지 않음」 전제 갱신). 배치 6 = cli · mcp 정확도 묶음 WI-0074 · 0075 · 0076 + 문서 WI-0077(배치 5 의 FR-4 가 check 를 건드리면 그 뒤에 rebase). 새 WI 3건(WI-0075 #201 · WI-0076 #202 · WI-0077 #203) 등록
- 재계획(2026-10-25, `/ax:todo plan` 4차, 사용자 결정): 배치 5 · 6 순서를 바꿔 ② 머지 · 발행 뒤 **배치 6 을 먼저** 해요(작은 결함을 cli · mcp patch 로 먼저 내고, WI-0027 은 PRD 갱신 뒤 그 위에서 `runCheck` 를 확장해 rebase 부담을 큰 작업 쪽에 두지 않음). WI-0076 은 ② 가 tokens 값을 바꾸므로 ② 뒤가 전제. 새 WI-0078(#206) library 상세 E2E 스모크를 배치 6 에 추가. 배치 6 = WI-0074 · 0075 · 0076 · 0077 · 0078, 배치 7 = WI-0027(종전 배치 5)
- 배치 4 뒤 결정(2026-10-25, 사용자): ① ontology 남은 대비 미달은 새 WI-0079(#208)로 등록하고 디자인 오너 확인을 받아 배치 7(WI-0027) 앞에서 반영 ② Radix 업스트림 이슈는 보류(초안은 `docs/workitems/WI-0073-tooltip-scroll-persistence/radix-issue-draft.md`, 게시 전 중복 검색 필요) ③ pages.dev CDN 에 남은 옛 slug 상세 JSON(예: `/library/components/accordion.json`, s-maxage 7일)은 자연 만료를 기다리고 2026-11-01 뒤 404 를 한 번 확인 ④ a11y E2E 236건으로 PR CI 15~17분(a11y 8.7분)은 지금대로 유지
- 재계획(2026-10-25, `/ax:todo plan` 5차, 사용자 결정): 배치 6(WI-0074 · 0075 · 0076 · 0077 · 0078, 브리프 진행 중)과 WI-0079 후보 값 정리(읽기 전용, 디자인 오너 확인용)를 병렬로 진행. 두 작업은 고치는 파일이 겹치지 않고, WI-0076 이 MCP 토큰 데이터를 빌드 때 생성하게 되면 WI-0079 의 ontology 값 변경을 자동으로 따라가요. WI-0079 반영은 승인 뒤 배치 7(WI-0027) 앞. 2026-11-01 뒤 CDN 옛 slug 404 확인
- 배치 6 결정(2026-10-25, 브리프 · 반박 검토 뒤 권장안 일괄 채택): WI-0075 비대화형은 성격별(기본값 있고 파괴적이지 않으면 기본값 진행 + 1줄 안내, 덮어쓰기 확인 · 기본값 없는 입력은 rc 1 + 플래그 안내), `template init -y` 추가(질문 기본값 + 비어 있지 않은 디렉터리 진행, apply -y 와 같은 뜻), 가드는 공통 헬퍼 + parseAsync 안전망, v0 · monet 도 rc 1 안내. WI-0076 은 tokens dist 에서 빌드 때 생성 · 일치 테스트, 기존 41경로 유지 + tokens 토큰 추가, 다크 값 필드, 출처 없는 5건 제거, 미발견 isError, 브랜드는 axis.get_brand 에 맡김, 생성본은 dist 에만. WI-0077 은 TW3 preset 에 기본 테두리색(fallback 포함) 추가, tailwind4 생성기는 borderColor 건너뛰기 명시, 문서는 낡은 서술과 ui-react README 정정. WI-0074 는 detectTailwind · installedVersion 만 상위 탐색(isPnpProject 가드), check 밖 호출지 전이 기록, brand-core 통합은 미룸. 인접 결함은 WI-0080(#209) · WI-0081(#210)로 분리. WI-0078 은 새 spec(양성 3 + 감지기 자기 검사) + 건수 가드 + a11y READY 를 로드 뒤 요소로. 순서 WI-0078 → 0076 → 0074 → 0075 → 0077, 한 Release PR 로 linked 1.8.1 · cli 1.7.0 · mcp 1.4.0
- 재계획(2026-10-25, `/ax:todo plan` 6차, 사용자 결정): 순서 배치 6(진행 중, linked 1.8.1 · cli 1.7.0 · mcp 1.4.0) → 배치 6b WI-0080 · 0081(registry-core, WI-0074 상위 탐색 위, cli · mcp patch, 배치 6 발행 직후) → WI-0079 · 0082(디자인 오너 답 뒤, ontology 토큰 · ui-react Select, linked patch) → 배치 7 WI-0027. WI-0080 은 WI-0027 과 같은 tailwind-core.ts 를 고치므로 먼저 끝내 rebase 부담을 줄임. 디자인 오너 확인 문서: https://claude.ai/artifact/Vp7EKAQMwffXXoM4MZQmjx (레포 사본 docs/workitems/WI-0079-ontology-contrast-residual/)
- 배치 6 검토 뒤 결정(2026-10-25, 사용자): cli 1.7.0 · mcp 1.4.0 은 minor 유지(동작 변경은 changeset · README 업그레이드 안내), WI-0078 은 빈 changeset 을 두지 않음(@ax/web 미발행), Windows Git Bash 판정은 README 안내 + 후속 WI-0084 실측, 테스트 보강 2건은 WI-0083 으로 배치 6b 에 포함
- 릴리스 규칙(2026-10-25, 사용자 지시): `@axis-ds/tokens` 를 올리는 changeset 이 있으면 같은 발행에 `@axis-ds/mcp` patch 이상을 넣어요(mcp 가 빌드 때 tokens 값을 동봉하고 devDependency 라 tokens 만으로는 재발행되지 않음, WI-0076 구현 중 실측). CLAUDE.md 「npm 배포 참고」와 CI `pnpm check-changeset-mcp-tokens`(scripts/check-changeset-mcp-tokens.mjs)로 강제
- 릴리스 규칙 확장(2026-10-26, 배치 6b 사용자 결정 · WI-0080): `packages/axis-registry-core/` 를 바꾸는 PR 은 changeset 에 `@axis-ds/cli` 와 `@axis-ds/mcp` 를 모두 올려요(같은 검사, CLAUDE.md 「npm 배포 참고」). PR 모드는 #219 PR CI 에서 실제로 돌았어요(기준 merge-base 6d455f7 · registry-core 3파일 · cli · mcp changeset 각 2개로 통과). **main push 모드는 2026-10-26 정착 확정**: #225 main push run 40269191762 success 에서 기준 `github.event.before` e2a9725 · 바뀐 파일 43개 · registry-core 4개 · cli · mcp changeset 각 2개로 「통과(registry-core → cli · mcp)」(PR 모드는 #219 에서 확인). 이전 기록: #219 push run 40246073020 은 #220 push 에 취소되어 검사 단계 skipped, #220 push run 40246082456 은 기준 `github.event.before` 79c3208 · registry-core 0개로 통과라, registry-core 변경이 있는 push 에서는 아직 돈 적이 없어요. 다음 registry-core 머지(WI-0085 · 0086)를 단독 push 로 보내 그 run 의 검사 단계가 skipped 가 아니라 실제로 돌았는지 확인해요
- 배치 6b 결정(2026-10-26, 브리프 · 반박 검토 뒤): WI-0080 은 findInstalledPackage 기준 상대 표본 · 제안(PnP · 미설치는 종전), `**` 가 `../` 를 넘는 판독과 절대경로 판독도 함께 고침, cwd 기준은 문서 한 줄. WI-0081 은 lockfile 을 앱 층 → 워크스페이스 루트까지(.git 에서 중단) 탐색, 루트에만 선언한 의존성은 인정하고 출처 표시(사용자 결정, 그런 앱의 check rc 1→0), packageManager 필드는 쓰지 않음, pnpm 고정 안내는 WI-0085(#217)로, tailwind-core hasDependency 일관화는 WI-0086(#218)로 분리, findInstalledPackage 에는 멈춤을 두지 않음, 단위 테스트는 cli 아래. 버전은 patch(cli 1.7.1 · mcp 1.4.1, 사용자 결정). registry-core 를 바꾸는 PR 은 changeset 에 cli · mcp 를 모두 두도록 CI 검사를 넓힘(사용자 결정). WI-0083 은 대표 후보만 읽기 · check-library-links 에 code 모양 판정 · 루트 스크립트에 테스트 연결 · makeConsumer 재사용(변이는 빌드 파이프라인 쪽) · TW4 는 testplan 기록, changeset 없음, 별도 PR. 순서 WI-0080 → 0081 → Release, WI-0083 독립
- 재계획(2026-10-26, 사용자 결정): 배치 6b 완료 뒤 WI-0079 디자인 오너 답을 기다리는 동안 배치 6c WI-0085 · 0086(registry-core 후속, cli · mcp patch)을 진행. 6c 머지는 앞뒤 머지와 간격을 두고 단독 push 해 changeset 검사의 push 모드(registry-core 변경)를 실제로 확인. 순서 6c → WI-0079 · 0082 → 배치 7 WI-0027
- 배치 6c 결정(2026-10-26, 브리프 · 반박 검토 뒤): WI-0085 는 lockfile 이 없을 때만 packageManager 필드를 신호로 씀(lockfile 다음 순위, 사용자 결정. 배치 6b D2 · WI-0081 AC5 의 「packageManager 는 보지 않음」을 이 순위로 바꿈), 매니저별 워크스페이스 실행 명령 · 의존성 따옴표 · -D 헬퍼를 registry-core project.ts 한 곳에, accordion 데모 문구는 그대로, U6 은 버전 범위 결정이었음을 주석 · WI-0081 문서에 정정. WI-0086 은 declaredDependency 공용 헬퍼(쓰기는 앱 pkg 로만)로 tailwind-core 7곳 · init utils · cli add · MCP install 의 루트 선언 판단을 합치고(사용자 결정), theme add 쓰기 경로는 WI-0087 로 분리, declaredAxisPackages 는 앱 선언만 유지, realpath 는 공개 함수 진입부에서 한 번(절대 glob x 심링크 행을 AC 에 추가). 한 PR(커밋 WI-0086 → WI-0085) · 한 Release(cli 1.7.2 · mcp 1.4.2 patch), 단독 push 후 push run 완료를 확인하고 Release 머지
- ontology 테마 완료 목표(2026-10-26, 사용자 결정): 범위는 WI-0079 · 0082(남은 대비 · Select placeholder) 발행 + WI-0027 온톨로지 콘솔 템플릿 배포. WI-0079 는 디자인 오너 답을 기다리지 않고 확인 문서의 권장 묶음으로 반영(경계 · 트랙 = 라이트 sub #6B7280 · 다크 muted #7A828D, Progress success · warning = ink-2 · bad, Input placeholder = 라이트 sub-aa #5F6673 · 다크 sub #9CA3AD). 오너가 나중에 다른 값을 고르면 다시 발행. 순서: 배치 6c(진행 중) → WI-0079 · 0082 → WI-0027
- WI-0079 세부 결정(2026-10-26, 사용자): Q4 placeholder 는 권장안(sub-aa)으로 바꾸며 WI-0025 부록 B ②(2026-10-19 디자인 오너 승인 「muted 는 placeholder 에만」)를 철회한다고 release-notes · 부록 B 에 기록, Q5 Input 테두리는 부록 B ③ 예외 유지(바꾸지 않음), 디자인 오너에게는 확인 문서 맨 위에 「권장안으로 먼저 반영 · 다른 값이면 다시 발행」 안내를 넣음
- WI-0079 Q3 추가 결정(2026-10-26, 사용자): Progress warning 을 bad 로 바꾸면 destructive(red-500)와 같은 빨강이 되므로 ontology 의 --axis-progress-fill-destructive 를 bad-dark(라이트 #A8281F · 다크 #F49890)로 나눔(확인 문서 Q3 C안의 destructive 부분)
- WI-0079 검토 뒤 결정(2026-10-26, 사용자): ① Progress warning 을 노랑으로, 라이트 AXIS 원시색 yellow-700 #A16207 · 다크 yellow-500 #EAB308(종전 값), destructive bad-dark · success ink-2 그대로(빨강 두 단계의 휘도 대비 1.33 · 1.26 이 약하다는 검토 지적) ② WI-0082 changeset 에 @axis-ds/cli patch 를 더해 동봉 레지스트리 사본에 새 select 소스를 실음(cli 1.7.3) ③ ontology brand.json a11y.status 를 「권장안 선반영 · 부록 B ② 철회 · 디자인 오너 재확인 대기」로 갱신
- 배치 6c 검토 뒤 결정(2026-10-26, 사용자): init 애니메이션 안내 · theme add 컴포넌트 tailwind.css 목록의 루트 선언 처리는 WI-0087(#222)에 합침, template apply 의 packageManager 소실은 WI-0088(#223), MCP 판독 캐시 낡음은 WI-0089(#224)로 등록
- 재계획(2026-10-26, `/ax:todo plan`, 사용자 결정): ontology 테마 완료 목표를 먼저. 순서 WI-0079 · 0082(구현 · 검토 중, linked 1.8.2 · mcp patch) → 배치 7 WI-0027 온톨로지 콘솔 템플릿(착수 전 PRD 갱신) → 배치 8 cli 후속 WI-0087 · 0088 · 0089 · 0090(WI-0027 이 tailwind-core · 템플릿 경로를 먼저 바꾼 위에서). 2026-10-26 갱신: WI-0027 PRD v0.6 D2 로 WI-0027 이 cli · mcp(tailwind-core · runCheck)를 건드리지 않게 되어 배치 8 은 WI-0027 과 병렬로 해도 돼요. WI-0084 는 Windows 실기 측정이 필요해 사람 확인 대기
- WI-0027 착수 결정(2026-10-26, /goal 진행 중 반박 검토 권장안으로 정함, 사용자가 바꾸면 재진행): MVP 화면 = 사이드바 셸 + 통합 뷰 + 목록 + depth 상세 + 프로젝트 상세 2분할(AC 치수 240 · 420 · 300), 정본 v0.28(v0.26 과 토큰 · hex 차이 0, 원본은 레포 밖), FR-4 는 템플릿 안 스크립트(npm run check:ontology)만이고 axis check · MCP 연동은 후속 WI(앞선 「WI-0027 위에서 runCheck 확장」 순서를 바꿈, cli · mcp 발행 없음, 배치 8 은 WI-0027 과 병렬 가능), category console 신설, 브랜드는 html data-brand + ThemeProvider defaultBrand, 의존 ^1.8.2 통일, apps/web 에 @axis-ds/theme 명시, template-smoke 목록은 index.json 에서 계산, 머지 전 Preview + AXIS_TEMPLATE_URL 사전 측정, npm 1.8.2 발행 확인 뒤 단독 push 머지
- ontology 테마 완료 목표 달성(2026-10-26): WI-0079 · 0082(#228, Release #229 → linked 1.8.2 · cli 1.7.3 · mcp 1.4.3, 발행본 대비 실측) + WI-0027(#232, Pages, 발행본 cli 1.7.4 실경로). 후속 후보: a11y 경로에 /templates/ontology-console/ 추가(236 → 240), registry-core axis-config.ts 주석 「brand 는 theme add 만」 정정, MCP apply_template · cli apply -y 의 axis.config.json 덮어쓰기(WI-0088 범위), v0.28 보조 상자 기본 닫힘 · 폰 폭(디자인 오너 확인), FR-4b axis check · MCP 연동
- 배치 6 완료(2026-10-26): PR #214 머지 4a5e185 · 규칙 PR #215 머지 8aaa9aa(tokens 를 올리는 changeset 에 mcp 동반 강제) · Release PR #216 머지 61ae674, publish run 40205738223 success, npm tokens · theme · ui-react · agentic-ui 1.8.1 · cli 1.7.0 · mcp 1.4.0, provenance 6/6. 발행본 재측정 5건 통과(불일치 0, 각 WI testplan). 남은 것: WI-0075 실제 터미널 대화형 1회(사람), WI-0074 d-rootonly 계열 rc 1 · npm 워크스페이스 init 의 pnpm 안내는 WI-0081 축, WI-0076 tokens 1.8.0 · 1.8.1 CSS dist 가 같아 버전 동반은 출처 줄로만 확인, WI-0078 pages.dev 응답의 커밋 해시는 따로 확인하지 않음
- 배치 6b 완료(2026-10-26): PR #219 머지 79c3208(WI-0080 · 0081 + registry-core changeset 동반 검사) · PR #220 머지 3591f9b(WI-0083, 발행 없음) · Release PR #221 머지 cb8f27c, publish run 40247657745 success, npm cli 1.7.1 · mcp 1.4.1, provenance 2/2, linked 4패키지는 1.8.1 그대로. PR CI #219 13m47s · #220 19m45s · #221 14m3s. 발행본 재측정 9항목 통과(불일치 0): WI-0080 매트릭스 cli · mcp 각 24/24(대조 12/24) · 음성 대조 10/10 · theme add 안내, WI-0081 npm · yarn 안내 8줄 · 루트 선언 4앱 rc 1→0 · 워크스페이스 밖 FAIL 유지(각 WI testplan). 남은 것: changeset 검사 main push 모드 정착 대기(WI-0085 · 0086 단독 push 로 확인, 배치 6c 에서 정착 확정), yarn 은 미설치 상태로만 측정(실제 yarn 설치 위 check 는 미측정)
- 배치 6c 완료(2026-10-26): PR #225 머지 7d1915b(WI-0086 루트 선언 판정 일관화 · 실경로 기준, WI-0085 매니저별 안내 · lockfile 이 없으면 packageManager) · Release PR #226 머지 37b73d0, publish run 40271807118 success, npm cli 1.7.2 · mcp 1.4.2, provenance 2/2, linked 4패키지는 1.8.1 그대로. PR CI #225 15m7s · #226 14m7s. changeset 검사 push 모드 정착 확정: #225 main push run 40269191762 success, 기준 `github.event.before` e2a9725 · 바뀐 파일 43개 · registry-core 4개 · cli · mcp changeset 각 2개로 통과. 발행본 재측정 12항목 통과: WI-0086 85행 매트릭스 구현 산출물과 바이트 일치 · 링크 행 60/60(구판 37/60) · 루트 선언 TW3 앱 판정 6칸 x 3레이아웃이 실제 빌드 정답과 일치 · 루트 TW4 미설치 rc 1→0 · init · add · MCP install 루트 선언 재기록 0, WI-0085 15픽스처 x 11칸 구현 기대값과 cmp rc 0 · 매니저 오차 0/285(구판 171/285) · rc 변화 0, cli · mcp 불일치 0(각 WI testplan). 기준 파일과 다른 것 2건은 설명됨(init-after.json 은 첫 구현 산출물이라 I5 후속 2줄 차이, 정답 축 분모 402 vs PRD 388). 남은 것: pnpm 기본 앱 선언 c1-appdecl-up 의 content 거짓 FAIL 후보(신구 같음, 새 WI 여부 사용자 결정), 새 HOME corepack 의 pnpm 12 실경로 미측정, yarn 실제 설치 · npm 7 미만 · Corepack 탐색 미측정
- check 판정 묶음 완료(2026-10-29): WI-0100a #250 머지 293500e · WI-0098 #252 머지 be61b74 · WI-0097 #253 머지 e2701fe · WI-0100b #255 머지 cdc7a71 · Version PR #251 머지 1e8da06, publish run 40811479954 success, npm cli 1.7.7 · mcp 1.4.6, provenance 2/2, linked 4패키지는 1.8.2 그대로. 발행본 재측정: 코드 dist 가 main 빌드와 바이트 같음(cli 46 · mcp 36개 파일, 다른 것은 CI 가 다시 만든 레지스트리 version 필드뿐), CLI = MCP 174/174(출력 빈 것 0), 1.7.6 대비 판정이 바뀐 fixture 91개(0100 계열 66 · 0097 4 · 0098 PnP 앱 21/21). 결정 Q21 ~ Q60 은 각 WI 문서. 후속 WI-0101 · 0102 · 0103 등록
- 재계획(2026-10-29, `/ax:todo plan`, 사용자 결정): 배치 9(병렬) WI-0101 ∥ 0103 ∥ 0089 → 배치 10(병렬) WI-0088 ∥ 0096 ∥ 0102(원인 측정 · 범위 결정) → 배치 11(순차) WI-0099 → 0095. WI-0099 는 0096 과 animation 경로가 겹쳐 0096 머지 뒤, WI-0095 는 0088 · 0096 · 0099 가 고친 호출지 위에서 경계를 넓혀 마지막. WI-0084 는 Windows 실기 측정 대기로 보류. 배치마다 Version PR 하나(cli · mcp patch, 0102 가 ui-react 를 고치면 linked 동반). 배치 9 는 다음 세션에서 착수
- 배치 9 완료(2026-10-30): WI-0103 #257 머지 c166b8a · WI-0101 #256 머지 6441a14(0103 과의 테스트 2파일 충돌을 병합 커밋으로 해소, 독립 검증 3관점 통과) · WI-0089 #258 머지 5860185 · Version PR #259 머지 2445270, publish run 41062612171 success, npm cli 1.7.8 · mcp 1.4.7(latest), provenance 2/2, linked 4패키지는 1.8.2 그대로. 결정 Q61a · Q61b · Q65a(0101) · Q86 · Q87(0089)는 모두 권장안 확정. 병합 검증에서 발견한 Tailwind 3 preset 의 exports 공백은 WI-0104(#260)로 등록하고 배치 10 에 추가(사용자 결정): 배치 10(병렬) WI-0088 ∥ 0096 ∥ 0102 ∥ 0104
- WI 별 설계 결정은 배치 시작 때 브리프로 모아 정해요(WI-0026 Q1 · Q3~Q6 · fallback, WI-0068 해제 저장 방식, WI-0051 심각도, WI-0060 URL 체계, WI-0062 · 0063 고치는 층 등)

### 향후 후보
- E2E a11y 별도 워크플로우(야간/수동, 브라우저 설치 비용으로 main CI 미포함)
- 검색 인덱싱 확장 (인덱스/랜딩 페이지)
- `apps/web/public/library` 사본과 src 의 일치 검사 상설화 (WI-0025 4 결정 6, 2026-10-18 M3 에서는 일회성 대조만 수행: 당시 레지스트리 84/84 일치, library 사본 `check-token-refs` 위반 0). 레지스트리는 WI-0045 부터 `apps/web/public/r` 하나이고(루트 `public/r` · `packages/*/registry/r` 사본은 삭제), `build-registry` 가 src 에서 생성하며 CI 가 다시 만들어 배포하고 G1 이 검사합니다. library 사본은 생성기 대신 줄 단위로 갱신해 와서 src 와 다른 줄이 경고 없이 쌓일 수 있음
- `apps/web/public/templates/*.json` 5개(index.json · dashboard · hr-dashboard · landing-page · theme-only)가 생성기와 어긋남: `pnpm build`(@ax/web `build:web`의 template index 생성)가 매번 다시 써서 `updatedAt`과 index.json `total` 39 → 42가 바뀜. 커밋된 색인이 소스보다 낡았다는 신호이고, 지금은 로컬 build 뒤마다 되돌리는 중 (2026-10-18 WI-0025 M3 에서 반복 관찰, 이번 WI 범위 밖)

---

## 📅 버전 계획

| 버전 | Phase | 주요 내용 |
|------|-------|-----------|
| v0.7.x | Phase 3 완료 | Agentic UI 문서화 완료 |
| v0.8.0 | Phase 4 완료 | 템플릿 시스템 기반 |
| v0.9.0 | Phase 5 완료 | CLI template 명령어 |
| v0.10.0 | Phase 6 완료 | MCP 템플릿 도구 |
| v1.0.0 | Phase 7 안정화 | 정식 릴리스 |

---

## 📝 GitHub 프로젝트 연동

> 모든 작업 항목은 GitHub 프로젝트와 동기화됩니다.

**프로젝트**: [IDEA-on-Action/projects/4](https://github.com/orgs/IDEA-on-Action/projects/4)

**동기화 원칙**:
- 이슈 번호로 작업 추적 (예: #42)
- 상태는 GitHub 프로젝트 보드와 일치
- Done/In Progress/Todo 상태 반영
