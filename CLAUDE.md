# AXIS Design System 개발 가이드

> Claude와의 개발 협업을 위한 프로젝트 핵심 문서

**현재 버전**: 1.0.0 | **상태**: ✅ Active Development
**npm 배포**: v1.1.1 배포 완료 (2026-02-01)

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
- **Shell 격리**: Claude Code Bash 도구는 별도 프로세스 - 사용자 터미널의 환경변수 미공유. `NPM_TOKEN` 등은 시스템 환경변수로 등록하거나 명령에 `export`로 포함 필요
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

# npm 배포 (NPM_TOKEN 환경변수 필요)
pnpm release                    # build + changeset publish (전체 패키지)
pnpm publish -r --access public --no-git-checks  # 수동 배포
```

---

## 📦 npm 배포 참고

- **npm 스코프**: `@axis-ds` (npmjs.com 조직)
- **인증**: `.npmrc`에서 `${NPM_TOKEN}` 환경변수 참조 - 미설정 시 모든 npm 명령 401 에러
- **Changesets**: linked 설정 (tokens, ui-react, agentic-ui, theme 동시 버전 관리)
- **publish 부수효과**: 각 패키지 디렉토리에 `.npmrc` 복사본 생성됨 - 커밋 불필요, 삭제 권장
- **CI 배포**: `.github/workflows/publish.yml` - `NPM_TOKEN` GitHub Secret 필요
- **현재 배포 버전**: 1.1.1 (2026-02-01 배포 완료)

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
