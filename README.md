# AXIS Design System

> React 기반 컴포넌트 라이브러리 및 디자인 토큰 시스템

**Status**: ✅ Active Development | **Version**: 0.7.0

## 📦 패키지

| 패키지 | 버전 | 설명 |
|--------|------|------|
| `@axis-ds/tokens` | 0.1.0 | 디자인 토큰 (색상, 타이포그래피, 간격) |
| `@axis-ds/ui-react` | 0.1.0 | React UI 컴포넌트 라이브러리 |
| `@axis-ds/agentic-ui` | 0.1.0 | AI/Agent 전용 UI 컴포넌트 |
| `@axis-ds/theme` | 0.1.0 | 테마 설정 및 다크모드 지원 |
| `@axis-ds/cli` | 0.1.0 | 컴포넌트 설치 CLI 도구 |

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+
- **pnpm** 9.15.4+

### Installation

```bash
# 저장소 클론
git clone https://github.com/AX-BD-Team/axis-design-system.git
cd axis-design-system

# 의존성 설치
pnpm install

# 개발 서버 실행
pnpm dev:web
```

**접속**: http://localhost:3000

### CLI로 컴포넌트 설치

```bash
# 프로젝트에 컴포넌트 추가
npx @axis-ds/cli add button
npx @axis-ds/cli add card dialog
```

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
├── pnpm-workspace.yaml         # pnpm workspace
├── turbo.json                  # Turborepo
└── package.json
```

## 🛠️ 기술 스택

| 기술 | 버전 |
|------|------|
| React | 19 |
| Next.js | 15 |
| TypeScript | 5.7+ |
| Tailwind CSS | 4 |
| pnpm | 9.15.4+ |
| Turborepo | 2.3.3+ |

## 🔧 개발 명령어

```bash
# 개발 서버
pnpm dev:web

# 빌드
pnpm build

# 타입 체크
pnpm type-check

# 린트
pnpm lint

# 레지스트리 빌드
pnpm build:registry
```

## 📖 문서

- [Monorepo 설정 가이드](docs/guides/monorepo-setup.md)
- [Agentic UI 디자인 가이드](docs/guides/agentic-ui-design.md)

## 📄 License

MIT License
