# (개발계획서) 생각과 행동 — AXIS Design System 구축 및 MCP/Plugin 연동형 배포 계획서 v0.2
> **프로젝트 성격 변경 반영**: 본 계획서는 **kt ds 내부 구축**이 아닌, 사용자의 개인 사업체 **‘생각과 행동’**에서 **오픈소스**로 독자 구축하고, 타 프로젝트가 **패키지(npm) + Registry + MCP/Plugin** 방식으로 쉽게 연동해 쓰도록 하는 구조를 전제로 한다.

---

## 0. 문서 정보
- 문서명: 생각과 행동 — AXIS Design System 구축 및 MCP/Plugin 연동형 배포 계획서
- 버전: v0.2 (개인 사업체/오픈소스/Cloudflare/GitHub/Claude Code 반영)
- 작성일: 2026-01-23
- 작성자: (생각과 행동) AXIS DS Owner
- 대상 독자
  - 내부: 생각과 행동(기획/디자인/개발/운영)
  - 외부: 오픈소스 사용자(프로젝트 리드/FE/디자이너), 협업자, 기여자(Contributors)

---

## 1. 한 장 요약(Executive Summary)
### 1.1 결론
AI 시대의 UI/UX는 “정적 화면”이 아니라 **에이전트와 사용자가 함께 일하는 인터페이스(Agentic UI)**로 이동하고 있다. 이때 **디자인 시스템(DS)**은 “스타일 가이드”를 넘어, **AI가 읽고 사용할 수 있는 컨텍스트 + 배포 가능한 코드 자산**이어야 한다.  
→ 따라서 ‘생각과 행동’은 **AXIS(Agentic eXperience Interface System)** 기반 DS를 오픈소스로 구축하고, 타 프로젝트가 **(1) npm 패키지**, **(2) shadcn 호환 Registry(코드 배포)**, **(3) MCP/Plugin(자연어로 탐색·설치·조합)** 형태로 손쉽게 연동해 사용하도록 한다.

### 1.2 성공 기준(KPI)
- **채택(Adoption)**: 월간 활성 사용 프로젝트 수, 신규 설치/업데이트 수
- **재사용(Reuse)**: 공통 컴포넌트/블록/패턴 사용률
- **품질(Quality)**: 접근성/시각회귀/런타임 오류 감소, UI 일관성 지표
- **AI-정렬(AI Compliance)**: AI 생성/수정 결과가 토큰·패턴·금지룰을 준수하는 비율(자동 검증)

---

## 2. 요구사항 및 제약(요청 사항 반영)
### 2.1 필수 요구사항
1) **구축 주체**: kt ds 조직이 아닌, 개인 사업체 **‘생각과 행동’**에서 독자 구축  
2) **연동 방식**: 타 프로젝트에서 **MCP 형태 또는 Plugin 형태**로 쉽게 연동(= 설치·검색·추가·업데이트가 쉬워야 함)  
3) **오픈소스**: 공개 저장소, 기여 프로세스, 명확한 라이선스/저작권 정책  
4) **외부 DS 리소스 연동**
   - 타 디자인 시스템/레지스트리에서 **리소스를 import(복제/포크)하거나**
   - **링크 기반(의존성/참조)**으로 필요한 것을 라이브러리화
   - 예: monet.design, shadcn/ui 등  
5) **개발/배포/호스팅**
   - 개발: **Claude Code** 중심  
   - 배포: **GitHub**(소스/릴리즈/패키지/이슈/PR)  
   - 서비스: **Cloudflare**(Docs/Registry/검색 API/MCP endpoint 등)  

### 2.2 핵심 설계 원칙(의사결정 기준)
- **Composable & Portable**: 복사/설치/부분 도입이 쉬운 구조(프로젝트별 커스터마이즈 가능)
- **AI-Readable by Default**: 사람용 문서뿐 아니라, LLM/IDE가 읽는 컨텍스트(규칙/예시/금지룰/메타데이터)를 기본 산출물로 포함
- **Federated(연합형) DS**: 우리 DS는 “완전 신규”가 아니라, 외부 DS를 **연결·정렬·재패키징**할 수 있어야 함
- **License-first**: 외부 리소스는 라이선스/저작권 확인 후 import(복제) / 아니면 link-only로 참조

---

## 3. 목표 아키텍처(Target Architecture)
> “패키지로 쓰는 DS” + “코드 레지스트리로 배포하는 DS” + “MCP/Plugin으로 AI·IDE 연동되는 DS”를 동시에 제공

### 3.1 배포 단위 3종(동시 운영)
#### A) Runtime Packages (npm)
- 목적: 앱 런타임에서 직접 사용(토큰/테마/컴포넌트)
- 예시 패키지(scope는 GitHub org에 맞춰 확정)
  - `@thoughtandaction/axis-tokens`
  - `@thoughtandaction/axis-theme`
  - `@thoughtandaction/axis-ui-react`
  - `@thoughtandaction/axis-agentic-ui` (AXIS 확장: 진행/승인/근거/복구/로그)

#### B) Code Registry (shadcn 호환)
- 목적: 프로젝트에 “파일(코드)”로 설치/업데이트(블록/템플릿/훅/룰 포함)
- 구현 전략: **shadcn registry 스키마/방식과 호환**되도록 구성  
  - 장점: 타 프로젝트가 shadcn 생태계(Registry/CLI)를 그대로 활용 가능 → 진입장벽 최소화
  - 레지스트리 항목은 JSON으로 정의하고, 빌드 후 정적 파일로 제공

#### C) MCP/Plugin
- 목적: Claude Code/IDE/에이전트가 자연어로 “검색→선택→설치→조합”을 수행하도록
- 구성
  - `axis-mcp-server`(로컬 실행형): 로컬 프로젝트 파일 시스템에 접근하여 설치/업데이트 수행
  - `axis-registry-mcp`(원격/읽기전용): 레지스트리 검색/메타 조회(Cloudflare Workers로 제공 가능)
  - (옵션) IDE Plugin(예: VS Code 확장) 또는 CLI plugin

### 3.2 서비스 구성(Cloudflare)
- **Cloudflare Pages**
  - DS Portal(문서/Storybook/가이드) 호스팅
  - Registry 정적 JSON 호스팅(`/r/registry.json`, `/r/[name].json` 등)
- **Cloudflare Workers**
  - 검색 API(인덱싱/태그/카테고리), MCP read-only endpoint, 리다이렉트/프록시
  - 필요 시 Node.js 호환 옵션(compat flag) 사용
- **GitHub**
  - 소스/릴리즈/패키지/문서/이슈/PR
  - GitHub Actions로 CI/CD 및 패키지 배포

---

## 4. 외부 디자인 시스템 리소스 연동 전략(Import / Link / Wrap)
> “남의 것을 베끼자”가 아니라, **합법적(license)·재사용 가능(technical)·정렬 가능(on-brand)**한 방식으로 “연결”한다.

### 4.1 리소스 유형 분류(정책)
1) **Link-only(참조/의존)**
   - 외부 컴포넌트를 복제하지 않고, 레지스트리 의존성/URL로 연결
   - 장점: 라이선스 민감도↓, 업데이트 추적 용이
2) **Import(복제/포크)**
   - 라이선스가 명확하고 호환 가능할 때만(예: MIT/Apache 등)
   - 반드시 **원 출처/라이선스/변경사항 기록(Attribution Manifest)** 포함
3) **Wrap(래핑/어댑터)**
   - 외부 컴포넌트의 API/스타일을 우리 토큰/패턴에 맞게 얇게 감싸 제공
   - 장점: 사용자 프로젝트는 “AXIS API”만 사용, 내부에서 외부 변경 흡수
4) **Token Bridge(토큰 매핑)**
   - 외부 DS의 토큰/테마를 AXIS 토큰으로 매핑하여 일관된 브랜딩 유지

### 4.2 기술 메커니즘(Registry Dependencies)
- 레지스트리 항목은 **의존성을 ‘이름/네임스페이스/URL’로 선언**할 수 있어, shadcn/ui 또는 외부 레지스트리의 컴포넌트를 연결 가능
- AXIS 레지스트리 아이템은 다음을 허용:
  - `['button', 'input']` (shadcn 기본 아이템)
  - `['@acme/input-form']` (네임스페이스 아이템)
  - `['https://example.com/r/hello-world.json']` (외부 URL 기반 아이템)

### 4.3 대상 예시(요청 링크 반영)
- **shadcn/ui**: 레지스트리/CLI/MCP 문서가 잘 정리되어 있어 AXIS의 배포 모델로 채택하기 적합
- **monet.design**: 컴포넌트 레퍼런스/레지스트리 성격. AXIS는 link-only 우선, 라이선스 확인 후 import

### 4.4 License/Attribution 운영(필수)
- `third_party/manifest.json` + `ATTRIBUTION.md` 운영
  - source URL, commit hash/version, license, 변경사항 요약, 적용 범위 기록
- PR 게이트
  - 라이선스 파일 존재 여부/호환 여부 체크 + SPDX 기반 스캔

---

## 5. 오픈소스 프로젝트 운영 설계
### 5.1 저장소 구조(권장: monorepo)
- `axis/` (GitHub 공개 저장소)
  - `packages/`
    - `axis-tokens/`
    - `axis-theme/`
    - `axis-ui-react/`
    - `axis-agentic-ui/`
    - `axis-cli/`
    - `axis-mcp/`
  - `apps/`
    - `docs/`
    - `registry/`
  - `connectors/`
    - `shadcn/`
    - `monet/`
  - `third_party/`
    - `ATTRIBUTION.md`
    - `manifest.json`
  - `CLAUDE.md`
  - `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `LICENSE`

### 5.2 이슈/PR/RFC 프로세스
- Issue 템플릿: 버그/기능/컴포넌트 요청/외부 리소스 import 요청(라이선스 포함)
- RFC: 토큰 구조 변경, 공용 API 변경, registry schema 변경

---

## 6. 개발 방식(Claude Code 중심)
### 6.1 Claude Code 운영 파일 세트
- `CLAUDE.md`(필수): 프로젝트 구조/명령어/규칙/금지사항/릴리즈 절차
- `llms.txt`(선택): AI가 DS를 이해하기 위한 요약 인덱스
- `prompts/`(선택): 반복 작업 프롬프트 템플릿화

### 6.2 개발 규칙(추천)
- “토큰 우선”: 색상/간격/타입 하드코딩 금지 → lint로 강제
- “접근성 우선”: 최소 a11y 기준 미달 시 merge 금지(axe 기반 자동검사)
- “UI 생성은 레지스트리 우선”: AI가 임의로 만들기보다 레지스트리에서 검색→조합(MCP/CLI)

---

## 7. CI/CD & 배포(GitHub → Cloudflare)
### 7.1 CI(품질 게이트)
- Unit test (Vitest/Jest)
- Accessibility test(axe)
- Lint/Format(ESLint/Prettier)
- License scan(외부 리소스 import 검증)
- (선택) Visual regression(Chromatic 등)

### 7.2 패키지 배포
- GitHub Actions로 태그 기반 릴리즈
- npm public publish 또는 GitHub Packages 병행
- SemVer + CHANGELOG 자동화(Changesets 권장)

### 7.3 Cloudflare 배포
- Cloudflare Pages: docs/registry 정적 배포
- Cloudflare Workers: 검색 API/원격 MCP endpoint(wrangler)

---

## 8. 로드맵(12~16주 예시, 1인/소규모 기준)
### Phase 0 (1~2주): 골격 + 배포 파이프라인
- GitHub repo/모노레포 구성, 오픈소스 라이선스(MIT 권장) 확정
- Cloudflare Pages 연결(docs/registry 기본 배포 성공)
- `CLAUDE.md` / CONTRIBUTING / SECURITY 초기화

### Phase 1 (3~4주): Tokens & Theme MVP
- 토큰 계층/네이밍 확정
- `axis-tokens`, `axis-theme` v0.1 공개(라이트/다크 + 상태 토큰)
- Storybook/Docs 문서화

### Phase 2 (4~6주): Core Components MVP(15~20개)
- Button/Input/Form/Table/Modal/Toast/Navigation/Loading/Empty 등
- 접근성/키보드/상태 표준화
- `axis-ui-react` v0.1 공개

### Phase 3 (2~3주): Registry & CLI
- shadcn 호환 registry.json + item json 생성
- `axis-cli`로 init/add/check 제공
- Cloudflare Pages에 `/r/registry.json` 배포

### Phase 4 (2~4주): AXIS Agentic UI Pack + MCP
- RunProgress/StepTimeline/Approval/SourcePanel/Recovery
- `axis-mcp` 로컬 서버 제공(Claude Code/IDE에서 검색/설치)
- read-only MCP endpoint(Workers) 제공 여부 결정

### Phase 5 (상시): 외부 DS 커넥터 고도화
- shadcn 의존성 연결
- monet 연동 link-only 우선(라이선스 명확한 리소스만 import)
- Attribution 자동화/대시보드

---

## 9. 타 프로젝트 연동 가이드(요약)
### 9.1 npm 패키지로 쓰기(런타임)
1) 설치: `npm i @thoughtandaction/axis-theme @thoughtandaction/axis-ui-react`
2) 테마 적용: CSS variables / ThemeProvider 적용
3) 컴포넌트 사용

### 9.2 Registry로 코드 설치(추천)
- `shadcn` CLI 또는 `axis-cli`로 “블록/템플릿”을 코드로 설치/업데이트

### 9.3 MCP/Plugin으로 AI·IDE 연동
- MCP 연결 후 자연어로 “검색→선택→설치→조합” 수행(수동 복붙 최소화)

---

## 10. 리스크 및 대응
1) 외부 라이선스 리스크 → License Gate + Attribution + link-only 우선
2) 오픈소스 운영 부담 → 템플릿/자동화 + 지원 범위 명시
3) AI 코드 품질 편차 → 레지스트리 기반 조합 + 토큰/린트/테스트 게이트
4) Cloudflare 제약 → 정적 우선, 동적 최소화(필요 시 Node 호환)

---

## 11. 결정이 필요한 사항(다음 회의 아젠다)
- 패키지 scope/프로젝트 네이밍(예: `@thoughtandaction/*`)
- 라이선스 및 외부 리소스 import 정책 확정
- MCP 범위(전용 MCP vs 기존 생태계 활용) 결정
- 초기 MVP(컴포넌트/블록/agentic 패턴) 확정
- Cloudflare Workers 사용 범위(검색 API/원격 MCP endpoint) 결정

---

## 참고 링크(요청 자료)
- Vercel: https://vercel.com/blog/ai-powered-prototyping-with-design-systems
- GeekNews: https://news.hada.io/topic?id=25972
- 2026 Vibe Design: https://junghyeonsu.com/posts/2026-vibe-design/
- shadcn/ui: https://ui.shadcn.com/
- monet.design: https://www.monet.design/
