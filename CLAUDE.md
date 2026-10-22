# AXIS Design System 개발 가이드

> Claude와의 개발 협업을 위한 프로젝트 핵심 문서

**현재 버전**: 1.5.0 | **상태**: ✅ Active Development
**npm 배포**: v1.5.0 배포 완료 (2026-10-21, Next 서버 컴포넌트 호환 · "use client" 경계), cli 1.5.0 (2026-10-22, axis add 레지스트리 기반 설치) · mcp 1.2.2 (2026-10-20, Tailwind 4 안내 · 검사)

---

## 📋 프로젝트 개요

**AXIS Design System**은 React 기반 컴포넌트 라이브러리 및 디자인 토큰 시스템입니다.

### 핵심 패키지

| 패키지 | 설명 |
|--------|------|
| `@axis-ds/tokens` | 디자인 토큰 (색상, 타이포그래피, 간격 등) |
| `@axis-ds/ui-react` | React UI 컴포넌트 라이브러리 |
| `@axis-ds/agentic-ui` | AI/Agent 전용 UI 컴포넌트 |
| `@axis-ds/theme` | 테마 설정 및 다크모드 지원 |
| `@axis-ds/cli` | 컴포넌트 설치 CLI 도구 |

---

## 🛠️ 기술 스택

| 레이어 | 기술 | 버전 |
|--------|------|------|
| **Runtime** | Node.js | 20+ |
| **Package Manager** | pnpm | 9.15.4+ |
| **Build** | Turborepo | 2.3.3+ |
| **Framework** | React | 19 |
| **Styling** | Tailwind CSS | 3.4 |
| **Type** | TypeScript | 5.7+ |
| **Web App** | Next.js | 15 |

---

## 📁 프로젝트 구조

```
axis-design-system/
├── apps/
│   └── web/                    # Next.js 문서 사이트
├── packages/
│   ├── axis-tokens/            # @axis-ds/tokens
│   ├── axis-ui-react/          # @axis-ds/ui-react
│   ├── axis-agentic-ui/        # @axis-ds/agentic-ui
│   ├── axis-theme/             # @axis-ds/theme
│   ├── axis-cli/               # @axis-ds/cli
│   └── axis-mcp/               # MCP 서버
├── docs/                       # 문서
│   └── templates/              # 산출물 템플릿
├── .claude/
│   ├── rules/                  # AI 협업 규칙
│   ├── agents/                 # 전문 에이전트
│   └── commands/               # ax-* 커맨드
└── package.json                # 루트 패키지
```

---

## 🤖 AI 협업 규칙

> 상세 규칙은 `.claude/rules/`에서 관리됩니다.

| 규칙 파일 | 내용 |
|-----------|------|
| `00-general.md` | 언어, 날짜, 작업 실행 원칙 |
| `05-ssdd.md` | SSDD 파이프라인, WI 산출물 구조 |
| `06-sync.md` | 작업 완료 후 현행화 규칙 |
| `10-code-conventions.md` | Import, 네이밍, 스타일링 규칙 |
| `20-quality.md` | 품질 게이트, 테스트 원칙 |
| `30-security.md` | 민감 정보, 보안 규칙 |

---

## ⚠️ 환경 참고

- **OS**: Windows - 경로에 `\` 사용, bash 명령 호환성 주의
- **Shell**: PowerShell/Git Bash 환경에서 pnpm 스크립트 실행
- **Shell 격리**: Claude Code Bash 도구는 별도 프로세스 - 사용자 터미널의 환경변수 미공유. 인증 토큰 등은 시스템 환경변수로 등록하거나 명령에 `export`로 포함 필요
- **Windows + bash 루프**: `for` 루프에서 Windows 경로 `\`가 변수 보간과 충돌 - 개별 명령으로 분리하여 실행
- **개발 서버**: `pnpm dev:web` → `localhost:3100`
- **배포**: Cloudflare Pages (`@opennextjs/cloudflare`)
- **상태관리**: Zustand 5 + TanStack React Query 5
- **아이콘**: Lucide React

---

## 🚀 개발 명령어

```bash
# 의존성 설치
pnpm install

# 개발 서버 실행
pnpm dev:web

# 빌드
pnpm build

# 타입 체크
pnpm type-check

# 린트
pnpm lint

# 웹앱 빌드 (template index 자동 생성 후 next build)
pnpm build:web

# 레지스트리 빌드
pnpm build:registry

# npm 배포 (CI는 publish.yml의 npm Trusted Publishing(OIDC), npm 토큰은 모두 삭제됨)
pnpm release                    # build + changeset publish (전체 패키지)  (평소 배포는 CI 경로)
pnpm publish -r --access public --no-git-checks  # 비상용 수동 배포: 로컬은 대화형 2FA(OTP) 필요, provenance 없음. 평소에는 CI(OIDC) 경로를 씀
```

---

## 📦 npm 배포 참고

- **npm 스코프**: `@axis-ds` (npmjs.com 조직)
- **인증**: npm Trusted Publishing(OIDC). `publish.yml`이 `id-token: write`와 `npm@11.19.1`로 발행 (1.2.1에서 실측, 2026-10-17). `NPM_TOKEN` secret과 npm granular 토큰은 삭제함(2026-10-17). Publishing access는 linked 4패키지만 「disallow bypass 2fa tokens」로 바꿨고(사용자 설정, 2026-10-17), cli · mcp는 1.1.4 OIDC publish를 확인했으니(2026-10-17) 같은 설정으로 변경할 차례. 프로젝트 `.npmrc`에는 인증 라인 없음
- **Trusted publisher**: linked 4패키지(tokens · ui-react · agentic-ui · theme) 와 cli · mcp 모두 등록(`IDEA-on-Action/AXIS-Design-System` · `publish.yml`). cli · mcp는 2026-10-17 등록 후 1.1.4를 OIDC로 첫 발행해 확정(#106)
- **Changesets**: linked 설정 (tokens, ui-react, agentic-ui, theme 동시 버전 관리)
- **publish 부수효과**(로컬 수동 배포 때만): 각 패키지 디렉토리에 `.npmrc` 복사본 생성됨 - 커밋 불필요, 삭제 권장
- **CI 배포**: `.github/workflows/publish.yml` - main push 시 changesets/action이 OIDC로 발행 (npm 인증용 GitHub Secret 불필요)
- **현재 배포 버전**: cli 1.5.0 (2026-10-22 배포, run 39795328665, cli 단독 minor, axis add 레지스트리 기반 설치 · 원격 pages.dev 우선 · 동봉본 폴백, provenance). linked 4패키지 1.5.0 (2026-10-21 배포, run 39496056901, linked 4패키지 minor, 서버 컴포넌트 호환 · 모듈 보존 빌드, provenance 4/4). 이전 1.4.0 (2026-10-20 배포, run 39413301099, linked 4패키지 minor, Tailwind 4 연동, provenance 4/4). cli 1.4.0 · mcp 1.2.2 (같은 run, init 안내 · check WARN, provenance 2/2). 이전 1.3.0 (2026-10-19, run 39238361098), cli 1.3.0 · mcp 1.2.1 (2026-10-20, run 39351203366)

---

## 📝 참고사항

### 문서
- **문서 인덱스**: [docs/INDEX.md](docs/INDEX.md)
- **Monorepo 설정**: [docs/guides/monorepo-setup.md](docs/guides/monorepo-setup.md)
- **Agentic UI 디자인**: [docs/guides/agentic-ui-design.md](docs/guides/agentic-ui-design.md)

### 커스텀 커맨드 (ax-*)
- `ax-build`, `ax-component`, `ax-dev`, `ax-health`, `ax-library`
- `ax-mcp`, `ax-prompt`, `ax-release`, `ax-wi`

### 전문 에이전트
- `design-system-architect`, `component-dev`, `code-reviewer`
- `docs-writer`, `test-engineer`

### 템플릿
- **컴포넌트 PRD**: [docs/templates/component-prd.md](docs/templates/component-prd.md)
- **컴포넌트 스펙**: [docs/templates/component-spec.md](docs/templates/component-spec.md)
- **릴리스 노트**: [docs/templates/release-notes.md](docs/templates/release-notes.md)
- **ADR**: [docs/templates/adr.md](docs/templates/adr.md)

---

# important-instruction-reminders

Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files.

# Context Engineering

당신은 최신 스택이 빠르게 변하는 프로젝트에서 작업하는 AI 개발자입니다.

1. **환경 파악**: package.json, 구성 파일을 읽고 프레임워크·라이브러리 버전 확인
2. **버전 차이 대응**: 릴리스 노트 참조, 최신 권장사항 확인
3. **설계 시 체크**: 네트워크 리소스, 인증/데이터 레이어 호환성 고려
4. **구현 중 검증**: 린트/타입/빌드 명령 실행, 예상 오류 미리 보고
5. **결과 전달**: 버전 차이 반영 사항, 추가 확인 항목 명시
