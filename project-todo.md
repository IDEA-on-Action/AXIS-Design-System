# AXIS Design System - Project TODO

> 프로젝트 진행 상황 및 다음 단계

**현재 버전**: 1.2.1 (npm 패키지 v1.2.1)
**마지막 업데이트**: 2026-10-17
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
| 38 | 밀도 토큰(컨트롤 높이 · 글자 크기 · 단계별 둥글기) | WI-0026 (#85) | P17 | P2 | ⏳ |
| 39 | 온톨로지 콘솔 템플릿 `ontology-console` | WI-0027 (#86) | P17 | P2 | ⏳ |
| 40 | CLI · MCP 브랜드 명령(`axis theme list\|add\|info`, `axis.list_brands` · `axis.get_brand`) | WI-0028 (#87) | P17 | P3 | 🔄 cli · mcp 1.2.0 배포(2026-10-19, #123 · run 39257199603). AC2(b) 는 cli 1.2.1 배포본으로 통과(2026-10-20, init -> theme add ontology -> install -> build rc 0, check brand PASS), AC2(a) 는 minu.best 403 해소 뒤 기본 레지스트리로 재확인 |
| 41 | 기본 테마 흰 글자 대비 미달 해소 (기본 Button #3B82F6 위 3.68:1 등) | WI-0029 (#94) | P18 | P2 | ⏳ |
| 43 | NPM_TOKEN 만료 대응: npm Trusted Publishing(OIDC) 전환 (cli · mcp 등록은 다음 릴리스 직전) | WI-0031 (#96) | P18 | P2 | ✅ |
| 44 | `.claude/worktrees/` 경로 gitignore | WI-0032 (#97) | P18 | P3 | ✅ |
| 45 | 다크 모드 component 토큰 재정의 누락 해소 (Card 흰 바탕 등, WI-0025 M3 머지 전 선행) | WI-0033 (#99) | P18 | P1 | ✅ |
| 46 | 라이브러리 패키지(tokens · ui-react · agentic-ui) lint · type-check 스크립트 공백 해소 | WI-0034 (#100) | P18 | P2 | ✅ |
| 49 | 템플릿 원형 빌드 실패(`app/` 디렉터리 · postcss 설정 없음, theme-only 실측, 나머지 3개 확인 필요) | WI-0037 (#119) | P18 | P2 | ⏳ |
| 51 | cli · mcp `type-check` · `lint` 스크립트 도입과 기존 오류 정리(cli tsc 20건 · eslint 2건) | WI-0039 (#125) | P18 | P3 | ⏳ |
| 52 | 라이브러리 수집 데이터(`apps/web/public/library/**` 8개)의 `npx axis-cli` 실행 안내 정리(typosquat 위험, WI-0038 에서 분리) | WI-0040 (#127) | P18 | P2 | ⏳ |
| 53 | `axis init` 재실행 시 `axis.config.json` 덮어쓰기로 brand 등 설정 소실 | WI-0041 (#128) | P18 | P3 | ⏳ |
| 57 | `axis add` 가 레지스트리를 조회하지 않고 하드코딩된 button 하나만 설치(그 button 도 preset 의존 shadcn 원형), WI-0044 실측에서 발견 | WI-0045 (#136) | P18 | P1 | ✅ 완료(2026-10-22). cli 1.5.0 배포(#152 · #153, run 39795328665, provenance), pages.dev /r version 1.5.0 반영. 배포본 실측: init · list(원격) · add · next build rc 0, 28/28 설치 후 빌드 |
| 58 | 애니메이션 플러그인(tailwindcss-animate) 의존 미선언(7개 컴포넌트 0/26) · accordion · progress keyframes 부재 | WI-0046 (#137) | P18 | P2 | ⏳ |
| 59 | 레지스트리 항목 의존성 누락(button.json 의 @radix-ui/react-slot 등) 전수 점검 · 빌드 검사 | WI-0047 (#138) | P18 | P2 | ✅ WI-0045 에 흡수해 완료(2026-10-22, #152 로 닫힘) |
| 60 | 문서 기술 스택 표기 드리프트(Tailwind CSS 4 표기 vs 실제 3.4) · 문서 라우트 점검 | WI-0048 (#139) | P18 | P3 | ⏳ |
| 61 | `axis init` 의 globalCss 기본 경로(`./src/app/globals.css`)가 src 없는 프로젝트에서 없는 경로로 기록됨(WI-0044 후속 검증에서 발견) | WI-0049 (#140) | P18 | P3 | ⏳ |
| 63 | `axis check` · MCP 의 dependencies 항목이 선언만 보고 「설치되어 있습니다」로 표시(WI-0044 배포본 확인에서 발견) | WI-0051 (#144) | P18 | P3 | ⏳ |
| 64 | agentic-ui `StreamingText` 가 첫 글자를 빼고 끝에 `undefined` 를 붙여 표시(WI-0050 검증에서 발견) | WI-0052 (#146) | P18 | P2 | ✅ 완료(2026-10-24). agentic-ui 1.5.1(#160 · #163), 배포본 React 19 StrictMode 켬 · 끔 모두 「스트리밍 완료 문장」(1.5.0 은 undefined 반복 · 빈 화면) |
| 65 | 서브패스 타입 해석 실패: moduleResolution node 에서 `@axis-ds/ui-react/avatar` 등 타입 미해석(typesVersions 부재, WI-0050 검증에서 발견) | WI-0053 (#147) | P18 | P2 | ✅ 완료(2026-10-24). tokens · ui-react · agentic-ui 1.5.1(#161 · #163), 배포본으로 Next 가 만든 node tsconfig 앱 next build rc 0, 필수 prop 누락은 rc 1 |
| 66 | `Avatar` 가 하이드레이션 전에 난 이미지 로드 오류를 fallback 으로 바꾸지 못함(WI-0050 검증에서 발견) | WI-0054 (#148) | P18 | P3 | ⏳ |
| 67 | MCP `axis.install_component` · `list_components` 가 레지스트리를 읽지 않고 하드코딩 5개만 설치(WI-0045 실측에서 분리) | WI-0055 (#150) | P18 | P2 | ✅ 완료(2026-10-24). mcp 1.3.0 · cli 1.5.2(#164 · #163), 배포본 list 28 · install 기본 배치, D13 config 사설 주소 요청 0건(env 양성 대조 3건) |
| 68 | `axis.minu.best`(403) 참조가 레지스트리 밖 경로(템플릿 기본 주소 · `$schema` · add 안내 링크 · library 수집기 · 루트 components.json 별칭 · mcp template)에 남음(WI-0045 검증에서 분리) | WI-0056 (#151) | P18 | P2 | ✅ 완료(2026-10-23). cli 1.5.1 · mcp 1.2.3 배포(#154 · #156, run 39869322957, provenance), pages.dev schema.json 200 · ajv 검증 통과, 배포본 template list · mcp list_templates 42개. 정식 주소 pages.dev 유지(Pages 프로젝트 삭제 · 이름 변경 금지) |
| 69 | library 데이터(`apps/web/public/library/**`)에 지금 없는 agentic 항목 6개가 남고 approval-card 문서 링크 경로가 틀려 404(WI-0056 검증에서 분리) | WI-0057 (#155) | P18 | P3 | ✅ 완료(2026-10-24). cli 1.5.2(#162 · #163), 프로덕션 library 링크 109개 모두 2xx, 오프라인 검사 위반 0 |
| 70 | 문서 사이트 `/agentic/streaming-text` 가 실제 컴포넌트가 아니라 mock 을 써서 컴포넌트 결함이 드러나지 않음(WI-0052 에서 분리) | WI-0058 (#157) | P18 | P3 | ⏳ |
| 71 | node10 해석에서 ui-react cva 변형 prop 타입이 any 로 떨어짐(`class-variance-authority/types`, WI-0053 에서 분리) | WI-0059 (#158) | P18 | P2 | ✅ 완료(2026-10-24). ui-react · agentic-ui 1.5.2(#165 · #166, run 40044378744, provenance), 배포본 Next(node) `variant="nope"` rc 1 · 올바른 값 rc 0. 업데이트 뒤 타입 오류 가능성은 CHANGELOG 에 안내 |
| 72 | library 데이터 slug 충돌 10개로 shadcn 상세에 axis 코드 표시(WI-0057 에서 분리) | WI-0060 (#159) | P18 | P3 | ⏳ |
| 73 | ui-react 만 릴리스하면 cli 가 「원격 · 포함본 version 다름」을 매번 안내(레지스트리 version 이 ui-react 를 따름, WI-0059 배포 확인에서 발견) | WI-0061 (#167) | P18 | P2 | ✅ 완료(2026-10-24). cli 1.5.3 · mcp 1.3.1(#168 · #169, run 40048194529, provenance), pages.dev 1.5.2 대상 배포본 list 안내 없음(cli 1.5.2 는 「version 이 다릅니다」) |

### 완료

| # | 항목 | GitHub Issue | Phase | 완료일 |
|---|------|--------------|-------|--------|
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
| 4 | ⑧ WI-0037 머지(WI-0028 AC2(b) 실경로 빌드 검증의 선행) → ⑨ WI-0028 머지(1.3.0 배포 뒤, ontology 실데이터로 재확인) → cli · mcp 1.2.0 배포 ∥ ⑩ WI-0029 머지(1.3.0 뒤, a11y 기준선 축소와 함께) | 병렬 (패키지 겹침 없음) | 1.3.0 배포 · ⑨는 ⑧ | cli · mcp 1.2.0 · tokens patch(WI-0029) |
| 5 | WI-0027 | 순차 | M3 · WI-0026 · WI-0028 | 템플릿 배포 |

- 브랜치 기준: WI-0028 · WI-0029 · WI-0030 · WI-0035 · WI-0036 · WI-0037은 main에서, WI-0026은 M3가 머지됐으므로 main에서 시작합니다(종전 계획은 `feat/wi-0025-m3-ontology-v2` 위, 아직 착수 전). WI-0028은 main의 M2 브랜드 빌드(`build-brands.mjs`)와 테스트 fixture로 개발했고, M3가 머지됐으므로 실제 `ontology` 프리셋 확인은 이제 main에서 할 수 있습니다. WI-0029는 기본 출력을 바꾸므로 1.3.0의 「기본 출력 불변(AC3)」 근거를 흐리지 않도록 1.3.0 뒤에 머지합니다. WI-0035는 tokens patch changeset만 담고 따로 배포하지 않습니다(1.2.2 취소, M4와 함께 1.3.0). M3는 #116이 먼저 머지된 main을 받아 squash 머지됐고, 계획했던 「병합 커밋 뒤 #116 step 삭제」는 M3 브랜치에서 하지 않아 main `ci` job에 pack-smoke step이 2개(M3 AC4 「Pack smoke (외부 npm 소비 검증, AC4)」 · WI-0036) 남아 있습니다. 중복은 별도 PR(②′)로 #116 step을 지워 정리합니다.
- WI-0029 정본 수치(2026-10-17 기록, ⑩ 머지 때 기준선 축소의 근거): 기본 테마 흰 글자 대비. 정본 수치: 기본 브랜드 a11y 기준선 12건 · 26노드(라이트 · 다크 각 6페이지 13노드, `#ffffff`/`#3b82f6` 24 · `#ffffff`/`#ef4444` 2), 측정 조건은 2026-10-17 `--force` 빌드 `apps/web/out`을 static 서버로 띄운 Chromium, WI-0025 PRD AC8 기준선 조항. 2026-10-18 WI-0025 M4 갱신: a11y 대상에 브랜드 전환 데모(`/docs/brand-demo/`)를 더해 10페이지 · 40건이 되면서 기준선은 14건 · 40노드(라이트 · 다크 각 7페이지 20노드, `#3b82f6` 36 · `#ef4444` 4), 데모 페이지가 실제 agentic-ui 컴포넌트를 그리며 드러난 기본 토큰 결함 쌍(라이트 흰 글자/`#22c55e` 2.27:1 PlanCard 승인 버튼 · `#ef4444`/`#f3f4f6` 3.41:1 거절 버튼 hover 바탕으로 측정, 다크 흰 글자/`#22c55e` 2.27:1 · `#6b7280` `text-tertiary` 4.16 · 4.11:1)을 WI-0029 대상에 더함(데모 경로 한정 기준선 라이트 2 · 다크 4노드, 측정 조건 같음, PRD AC8 변경 주석). 이전 기록 15건 · 144노드(f64825d)는 측정 조건이 달라 쓰지 않음. 추가로 기본 브랜드 PlanCard 거부 버튼 hover 글자 라이트 3.01 · 다크 4.34:1(4.5 미달, 미달은 이전부터. 1.2.1 은 hover 옅은 바탕이 투명해 `surface-secondary` 위 글자 3.42 · 4.71:1 이었고, 1.3.0 에서 바탕이 생겨 조금 더 낮아짐. 측정 조건: 2026-10-18 b9f225f 에서 다시 빌드한 기본 `variables.css` 값으로 node WCAG 계산, 글자 `plan-card-reject-hover-text` = `status-error` #EF4444, 바탕은 하단 영역 `surface-secondary`(라이트 #F3F4F6 · 다크 #111827) 위 `status-error` 10% sRGB 합성. axe 기준선에는 hover 상태가 없어 위 12건에 들지 않음)
- 동시 진행: 2026-10-19 M3 · WI-0036 머지 뒤 남은 착수 단위가 M4 포함 7개라 병렬 상한(3)을 넘습니다. 한 번에 구현하는 단위는 3개 이하로 두고, 나머지는 설계 · PRD 확인 단계에 둡니다.
- 임계 경로: ~~WI-0033 보정 → NPM_TOKEN 교체(사용자) → WI-0033 머지 · 1.2.1 배포~~ ✅ → ~~M2 → WI-0034~~ ✅ → ~~WI-0036 → M3(디자인 오너 사후 확인)~~ ✅ → Version Packages PR(#120, mcp 1.1.5) → pack-smoke 중복 제거(#121) → ~~WI-0030(#114)~~ ✅ → WI-0035(#118) → M4(#110) → Version Packages PR(1.3.0) → WI-0037 → WI-0028 · WI-0026 → WI-0027
- 착수 전: WI-0025 부록 B(2026-10-16 v0.24 · 디자인 시스템 v1 기준: 라이트 보조 글자 `sub` 1개 값 보정, 미달 쌍 처리, 입력 테두리 1.40:1 유지 여부, PlanCard 색 선 두께, 에이전트 상태 색 접기) 2026-10-16 사용자 대리 승인, 디자인 오너 사후 확인 8건 완료(2026-10-19, M3 머지 전) ✅
- 착수: `/ax-wi start <WI>` 로 WI마다 진행

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
