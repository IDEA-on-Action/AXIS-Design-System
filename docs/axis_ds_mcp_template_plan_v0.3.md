# (개발계획서) AXIS OSS Design System Template Kit — MCP/Plugin + 디자인 템플릿(Theme/Blocks) 배포 계획서 v0.3
> **핵심 변화(v0.2 → v0.3)**  
> - 특정 사업체/조직 명칭(‘생각과 행동’)을 문서/패키지 컨텍스트에서 제거하고, **오픈소스 형태로 “팀/조직이 템플릿으로 포크해서 쓰는 DS 킷”**으로 재정의  
> - 타 프로젝트가 DS를 “컴포넌트”뿐 아니라 **특정 디자인(예: deepcon.ai 같은 룩앤필)로 구성된 ‘템플릿’을 선택/적용**할 수 있도록 **기능 개발 항목 + 사용자 가이드**를 추가

---

## 0. 문서 정보
- 문서명: AXIS OSS Design System Template Kit — MCP/Plugin + 템플릿 배포 계획서
- 버전: v0.3 (OSS 템플릿화 + 디자인 템플릿 선택/적용 기능 반영)
- 작성일: 2026-01-26
- 대상 독자
  - 오픈소스 유지관리자(Maintainers)
  - DS를 도입/확장하려는 팀·조직(프로덕트/디자인/FE)
  - DS를 “템플릿”으로 가져다 쓰려는 프로젝트 리드/개발자(Next.js/Vite 등)

---

## 1. 한 장 요약(Executive Summary)
### 1.1 결론
AI 시대의 UI/UX는 “정적 화면”이 아니라 **에이전트와 사용자가 함께 일하는 인터페이스(Agentic UI)**로 이동하고 있으며, 이때 디자인 시스템은 문서가 아니라 **배포 가능한 코드 자산 + AI가 읽는 컨텍스트**여야 한다.  
따라서 본 프로젝트는 **AXIS(Agentic eXperience Interface System) 기반 오픈소스 DS 킷**을 구축하고, 타 프로젝트가 아래 3가지 방식으로 쉽게 연동해 사용할 수 있도록 한다.

- **(A) npm 패키지**: 런타임에서 토큰/테마/컴포넌트 사용
- **(B) 코드 레지스트리(Registry)**: “블록/페이지/템플릿”을 **파일(코드)로 설치/업데이트**
- **(C) MCP/Plugin**: Claude Code/IDE/에이전트가 자연어로 **검색→선택→적용**

그리고 v0.3에서 추가로, **템플릿(Theme/Blocks/Pages) 선택·적용 기능**을 1급 기능으로 정의한다.  
즉, “DS를 쓰되, 프로젝트 목적에 맞는 룩앤필 템플릿을 선택해서 곧바로 적용”할 수 있게 만든다(예: 컨퍼런스 랜딩 룩, SaaS 대시보드 룩, 딥테크 다크 룩 등).

### 1.2 성공 기준(KPI)
- **채택(Adoption)**: 월간 활성 설치 프로젝트 수, 업데이트 수, 템플릿 적용 수
- **재사용(Reuse)**: 공통 컴포넌트/블록/패턴 사용률, 블록 재사용률
- **품질(Quality)**: 접근성/시각회귀/런타임 오류 감소, UI 일관성 지표
- **AI-정렬(AI Compliance)**: AI 생성/수정 결과가 토큰·패턴·금지룰을 준수하는 비율(자동 검증)

---

## 2. 요구사항 및 제약(업데이트 반영)
### 2.1 필수 요구사항
1) **오픈소스 형태로 제공**: 특정 조직/사업체에 종속되지 않으며, 팀/조직이 “템플릿 repo”로 사용(포크/Use this template) 가능해야 함  
2) **연동 방식**: 타 프로젝트에서 **MCP 또는 Plugin 형태로 손쉽게 연동**(= 탐색/선택/설치/업데이트 경험이 좋아야 함)  
3) **템플릿 선택·적용**: DS에서 제공하는 템플릿(테마+블록+페이지)을 **선택 후 적용**할 수 있어야 함  
4) **외부 DS 리소스 연동**: 다른 DS(예: shadcn/ui, monet.design 등)에서 리소스를 **import** 또는 **link** 방식으로 흡수/재사용할 수 있어야 함(단, 라이선스 준수)  
5) **개발/배포/서비스**: Claude Code 중심 개발 → GitHub로 배포(릴리즈/패키지/레지스트리) → Cloudflare에서 Docs/Registry 서비스

### 2.2 핵심 설계 원칙(의사결정 기준)
- **Template-first Adoption**: “컴포넌트 설치”보다 “템플릿 적용”이 더 빠르게 가치 도달하도록
- **Composable & Portable**: 복사/설치/부분 도입/부분 교체가 쉬운 구조
- **AI-Readable by Default**: 문서뿐 아니라 LLM이 읽는 규칙/예시/금지룰/메타데이터를 기본 포함
- **Federated(연합형)**: 외부 DS를 연결·정렬·재패키징할 수 있어야 함
- **License-first**: 외부 리소스는 라이선스 확인 후 import, 불명확하면 link-only

---

## 3. 목표 아키텍처(Target Architecture)
> “패키지(런타임)” + “레지스트리(코드 설치)” + “MCP/Plugin(자연어 연동)” + “템플릿 갤러리(선택/적용)”

### 3.1 배포 단위 4종(동시 운영)
#### A) Runtime Packages (npm)
- 목적: 앱 런타임에서 직접 사용(토큰/테마/컴포넌트)
- 패키지(예시, 실제 scope는 OSS org에 맞춰 확정)
  - `@axis/axis-tokens`
  - `@axis/axis-theme`
  - `@axis/axis-ui-react`
  - `@axis/axis-agentic-ui` (AXIS 확장: 진행/승인/근거/복구/로그)

#### B) Code Registry (shadcn 호환 지향)
- 목적: 프로젝트에 “파일(코드)”을 설치/업데이트(블록/템플릿/훅/룰 포함)
- 구현 전략: **shadcn registry 방식/스키마와 호환**을 최대화(온보딩 비용 최소화)
- 제공물
  - `registry.json`(인덱스)
  - `r/<item>.json`(아이템 payload)
  - (선택) `schema/` 또는 `$schema` URL 제공

#### C) MCP/Plugin
- 목적: Claude Code/IDE/에이전트가 자연어로 “검색→선택→설치→조합”
- 구성
  - `axis-mcp-server`(로컬 실행형): 로컬 프로젝트 파일에 변경을 가하는 설치/업데이트 작업 담당
  - `axis-registry-mcp`(원격/읽기전용): 레지스트리/템플릿 검색 및 메타 조회(Cloudflare Workers)

#### D) Template Gallery + Template Engine (v0.3 핵심)
- 목적: 사용자가 “디자인 템플릿(Theme/Blocks/Pages)”을 **보고 선택**하고, CLI/MCP로 **한 번에 적용**
- 구성
  - Docs 사이트(Cloudflare Pages)에 **템플릿 갤러리/프리뷰/적용 가이드**
  - `axis-cli template apply <templateId>` (또는 MCP tool)로 프로젝트에 반영

---

## 4. 템플릿 시스템 설계(신규 핵심)
### 4.1 템플릿이란?
본 문서에서 **템플릿(Template)**은 다음 3요소의 “묶음”이다.
1) **Theme**: 디자인 토큰/폰트/아이콘/모션 등 룩앤필(look & feel)  
2) **Blocks**: Hero, Pricing, FAQ, Dashboard shell 같은 재사용 가능한 섹션/구성요소  
3) **Pages/Routes(선택)**: 랜딩/대시보드/문서 레이아웃 등 페이지 단위  

> 즉, 템플릿은 “한 프로젝트의 UI 골격 + 분위기”를 빠르게 이식하기 위한 패키지다.

### 4.2 템플릿 타입(권장 분류)
- **Template:Theme**: 토큰/테마만 적용(프로젝트 구조 변화 최소)
- **Template:Landing**: 랜딩 페이지 블록 세트(Hero, Pricing, CTA 등)
- **Template:Dashboard**: 앱 쉘/네비/데이터 테이블 패턴 등
- **Template:Agentic**: Agentic UI 패턴(진행/승인/근거/복구) 중심 템플릿
- **Template:Starter**: 특정 프레임워크(Next.js/Vite 등) 스타터 앱(가장 빠른 온보딩)

### 4.3 템플릿 메타 스펙(예시)
템플릿은 레지스트리 아이템과 별도로 **템플릿 매니페스트**로 관리한다.

`templates/<id>/template.json`
```json
{
  "$schema": "https://<your-domain>/schema/template.json",
  "id": "conference-dark-neon",
  "name": "Conference Dark Neon",
  "description": "딥테크/컨퍼런스 분위기의 다크 네온 랜딩 템플릿",
  "tags": ["landing", "dark", "conference"],
  "compat": { "frameworks": ["nextjs", "vite"], "ui": ["react"] },

  "theme": {
    "type": "registry:theme",
    "registryItem": "theme-conference-dark-neon"
  },

  "includes": [
    { "type": "registry:block", "items": ["hero-conference", "pricing-simple", "faq-accordion"] },
    { "type": "registry:page", "items": ["landing-page-conference"] }
  ],

  "postInstall": [
    { "action": "edit", "target": "app/layout.tsx", "patch": "addThemeProvider" },
    { "action": "copy", "source": "assets/fonts", "target": "public/fonts" }
  ],

  "license": {
    "template": "MIT",
    "thirdParty": [
      { "name": "shadcn/ui", "mode": "link", "license": "MIT" }
    ]
  },
  "attribution": [
    { "type": "inspiration", "url": "https://deepcon.ai/", "note": "UI 룩앤필 참고. 로고/텍스트/브랜드 자산은 포함하지 않음." }
  ]
}
```

> **주의(법/윤리 가드레일)**  
> - deepcon.ai 같은 “특정 브랜드 사이트”를 템플릿으로 만들 때, **로고/텍스트/브랜드 자산/고유 레이아웃을 그대로 복제**하면 문제될 수 있다.  
> - OSS로 공개할 템플릿은 **(a) 오리지널 디자인**, 또는 **(b) 명시적으로 라이선스/허용된 리소스**만 포함해야 한다.  
> - “영감을 받은(inspired-by) 스타일”로만 제공하고, 출처/영감 링크를 `attribution`으로 남긴다.

### 4.4 템플릿 적용(프로젝트 소비자 경험)
#### 적용 방식 1) CLI(권장)
- 신규 프로젝트:
  - `axis init --template conference-dark-neon`
- 기존 프로젝트:
  - `axis template apply conference-dark-neon`

CLI가 수행하는 작업(개념)
1) 템플릿 매니페스트 로드
2) theme/blocks/pages 레지스트리 아이템 resolve(원격 포함)
3) 필요한 npm deps 설치
4) 파일 생성/패치(postInstall 적용)
5) `axis check`로 토큰/규칙/접근성 최소 점검

#### 적용 방식 2) MCP(에이전트/IDE 연동)
예: Claude Code에서
- “이 프로젝트에 conference-dark-neon 템플릿 적용해줘. 기존 tailwind 설정은 유지하고 테마만 적용해.”  
→ MCP tool이 템플릿을 적용하고 변경 요약(diff) + 롤백 지점을 제공

### 4.5 템플릿 “선택” 경험(갤러리/프리뷰)
Docs 사이트에 **템플릿 갤러리**를 제공한다.
- 템플릿 카드: 이름/태그/미리보기 이미지/지원 프레임워크
- 상세 페이지: 토큰 요약(주요 색/폰트/라운드), 포함 블록/페이지, 설치 명령어, 마이그레이션 주의사항
- “Apply” 버튼(복사 가능한 CLI 명령 / MCP 연결 안내)

---

## 5. 기능 개발 항목(템플릿 선택/적용을 위한 구현)
### 5.1 `axis-cli` 기능(필수)
- `axis template list` : 템플릿 목록/태그 필터/검색
- `axis template info <id>` : 포함 항목/의존성/라이선스/지원 프레임워크 표시
- `axis template apply <id>` : 기존 프로젝트에 템플릿 적용(안전장치 포함)
- `axis template init <id>` : 템플릿 기반 새 프로젝트 생성
- `axis template diff <id>` : 적용 전 변경 예상(diff) 출력(안전)
- `axis check` : 토큰 하드코딩/금지룰/접근성 최소 검사

### 5.2 템플릿 엔진(필수)
- **파일 배치**: registry item의 files를 프로젝트 경로로 설치
- **패치 시스템**: 레이아웃/프로바이더 추가 같은 반복 수정은 안전한 patch로 적용
  - (권장) AST 기반 codemod 또는 규칙 기반 patch(실패 시 수동 안내)
- **롤백 포인트**: 적용 전 snapshot/backup(또는 git clean working tree 요구)

### 5.3 MCP tools(필수)
- `list_templates`, `get_template`, `apply_template`, `diff_template`, `check_project`
- (선택) `preview_template` : docs URL/이미지/설명 제공(IDE 내 프리뷰)

### 5.4 레지스트리 스키마 확장(권장)
- 템플릿 자체를 레지스트리 아이템으로도 표현할 수 있게 `registry:template` 타입(프로젝트 내부 스키마) 추가 고려
- 단, shadcn 호환을 우선하면 “템플릿은 별도 manifest + registry item 묶음”이 구현 난이도가 낮음

---

## 6. 외부 DS 리소스 연동 전략(Import / Link / Wrap)
> 템플릿을 늘리려면 “외부 DS 자산을 안전하게 연결”하는 능력이 필요하다.

### 6.1 연동 모드
- **Link-only(기본)**: 외부 레지스트리/URL을 의존성으로 선언(복제하지 않음)
- **Import(제한적)**: 라이선스 호환 + attribution 필수 + 변경기록 필수
- **Wrap(어댑터)**: 외부 컴포넌트를 AXIS API/토큰 규칙에 맞게 감싼다
- **Token Bridge**: 외부 토큰을 AXIS semantic 토큰으로 매핑

### 6.2 템플릿 관점에서의 이점
- 템플릿은 “필요한 블록”을 외부에서 링크해 가져올 수 있음
- AXIS는 “템플릿 레벨에서 조합”하고, 팀은 프로젝트 맥락에 맞게 블록을 선택

---

## 7. 오픈소스 프로젝트 운영(Template Repo로서의 UX)
### 7.1 GitHub Template Repository 모드(필수)
이 저장소는 “라이브러리”이기도 하지만 동시에 **Template Repo**로 동작해야 한다.
- “Use this template”로 새 DS를 시작할 수 있어야 함
- 포크 후 해야 할 최소 작업을 문서화
  - 패키지 scope 변경
  - 토큰/테마 교체
  - 레지스트리 도메인/배포 파이프라인 설정

### 7.2 권장 저장소 구조(요약)
- `packages/` (tokens/theme/ui/agentic/cli/mcp)
- `apps/docs/` (갤러리/문서/프리뷰)
- `apps/registry/` (registry build output)
- `templates/` (템플릿 매니페스트 + theme/blocks/pages)
- `connectors/` (shadcn/monet 등 외부 연동 어댑터)
- `third_party/` (attribution, license manifest)
- `CLAUDE.md` (Claude Code 운영 가이드)

---

## 8. 개발 방식(Claude Code 중심)
- `CLAUDE.md`에 다음을 명시(필수)
  - 프로젝트 구조 / 자주 쓰는 명령 / 코드 스타일 / 금지사항(토큰 하드코딩 금지 등)
  - “템플릿 추가” 표준 작업 절차(체크리스트)
  - 릴리즈/배포 절차(Changesets, Cloudflare deploy)

- 권장 작업 흐름
  1) “템플릿 추가” 이슈 생성(목표/디자인 레퍼런스/라이선스 상태 포함)
  2) 토큰→테마→블록→페이지→프리뷰 순서로 구현
  3) `axis template diff/apply`로 실제 적용 테스트
  4) 갤러리 프리뷰 업데이트(스크린샷/데모)
  5) 릴리즈 노트 작성 후 배포

---

## 9. CI/CD & 배포(GitHub → Cloudflare)
- GitHub Actions
  - 테스트/린트/라이선스 스캔/빌드/레지스트리 산출물 생성
  - 릴리즈(Changesets) 기반 npm publish
- Cloudflare Pages
  - Docs(템플릿 갤러리) + Registry 정적 JSON 배포
- Cloudflare Workers(선택)
  - 템플릿 검색 API, 원격 MCP read-only endpoint, 리다이렉트/프록시

---

## 10. 로드맵(업데이트 반영)
### Phase 0 (1~2주): 템플릿 골격 + 갤러리
- `templates/` 구조 및 `template.json` 스키마 확정
- Docs에 템플릿 갤러리(목록/상세/설치 명령어) 기본 구현
- 최소 템플릿 1개(Theme-only) 공개

### Phase 1 (3~6주): Template Engine + CLI
- `axis template list/info/apply/diff` 구현
- postInstall patch 시스템(안전 적용) 구현
- 샘플 템플릿 2~3개(landing/dashboard/agentic) 추가

### Phase 2 (2~4주): MCP 연동 고도화
- MCP tools로 템플릿 적용/검증
- IDE/Claude Code 워크플로 문서화

### Phase 3 (상시): 외부 DS 연합형 템플릿 확장
- shadcn 기반 블록/페이지 링크 템플릿 확대
- monet 등 외부 리소스는 link-only 우선 + 라이선스 게이트 강화
- 커뮤니티 기여(템플릿 PR) 온보딩 개선

---

## 11. 소비자 가이드(핵심만)
### 11.1 이 프로젝트를 “DS 템플릿 repo”로 사용하는 방법(팀/조직용)
1) GitHub에서 “Use this template”로 새 repo 생성
2) 패키지 scope/이름 변경
3) 토큰/테마를 조직 브랜딩에 맞게 교체
4) Cloudflare Pages로 docs/registry 배포 연결
5) 내부 프로젝트에서 `axis-cli`로 템플릿 적용 시작

### 11.2 기존 프로젝트에 “디자인 템플릿” 적용(개발자용)
1) `axis template list`로 템플릿 탐색
2) `axis template diff <id>`로 변경 예상 확인
3) `axis template apply <id>`로 적용
4) `axis check`로 최소 기준 통과 확인

### 11.3 “특정 디자인(예: deepcon.ai 분위기)”로 템플릿 만드는 방법(유지관리자용)
> 아래는 “영감을 받은 룩앤필”로 만드는 절차이며, OSS 공개 시 브랜드 자산은 포함하지 않는 것을 기본 원칙으로 한다.

1) 레퍼런스 정의: 색/타입/무드(키워드) + 타겟(landing/dashboard)
2) 토큰 설계: 브랜드 프리미티브(색/타입/라운드/그림자/모션) → semantic 토큰 매핑
3) Theme 생성: light/dark CSS vars 생성 + 폰트 적용 방식 결정
4) Blocks 구성: Hero/Pricing/FAQ 등 3~5개 블록 구현
5) Page 조립: landing 페이지 1장으로 조합
6) 프리뷰: 갤러리 스크린샷/데모 링크 추가
7) 라이선스/attribution 확인: third_party manifest 업데이트 후 공개

---

## 12. 리스크 및 대응
1) **브랜드/저작권(템플릿) 리스크**
   - OSS 템플릿은 오리지널 또는 라이선스 허용 리소스만
   - “특정 브랜드 룩”은 inspired-by로 제공 + 로고/텍스트/에셋 제외
2) **템플릿 적용 실패(프로젝트마다 구조가 다름)**
   - diff/rollback 제공 + patch 실패 시 수동 가이드
3) **오픈소스 운영 부담**
   - 템플릿/기여 가이드 표준화, 자동 테스트/게이트 강화

---

## 참고 링크(사용자 제공 예시 포함)
- deepcon.ai(룩앤필 예시): https://deepcon.ai/
- shadcn/ui: https://ui.shadcn.com/
- monet.design: https://www.monet.design/
