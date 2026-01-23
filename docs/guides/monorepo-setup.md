# Monorepo Setup Guide

AXIS Design System은 **pnpm workspace** 기반 Monorepo 구조로 구성되어 있습니다.

## 프로젝트 구조

```
axis-design-system/
├── apps/
│   └── web/                    # Next.js 문서 사이트
├── packages/
│   ├── axis-tokens/            # @axis-ds/tokens - 디자인 토큰
│   ├── axis-ui-react/          # @axis-ds/ui-react - React 컴포넌트
│   ├── axis-agentic-ui/        # @axis-ds/agentic-ui - Agentic UI
│   ├── axis-theme/             # @axis-ds/theme - 테마 시스템
│   ├── axis-cli/               # axis-cli - CLI 도구
│   └── axis-mcp/               # @axis-ds/mcp - MCP 서버
├── pnpm-workspace.yaml         # pnpm workspace 설정
├── package.json                # Root package.json
└── turbo.json                  # Turborepo 설정
```

## 기술 스택

- **Package Manager**: pnpm 9.15.4+
- **Build Tool**: Turborepo 2.3.3+
- **Framework**: Next.js 15, React 19
- **Language**: TypeScript 5.7+
- **Styling**: Tailwind CSS 4

## 설치 및 실행

### 1. 사전 요구사항

- Node.js 20+
- pnpm 9.15.4+

### 2. 설치

```bash
# 저장소 클론
git clone https://github.com/AX-BD-Team/axis-design-system.git
cd axis-design-system

# 의존성 설치
pnpm install
```

### 3. 개발 서버 실행

```bash
# 웹 문서 사이트 실행
pnpm dev:web
```

### 4. 빌드

```bash
# 전체 빌드
pnpm build

# 웹앱만 빌드
pnpm build:web
```

## 패키지 의존성

```
axis-tokens ─┐
             ├─> axis-ui-react ─┐
axis-theme ──┘                  │
                                ├─> apps/web
axis-agentic-ui ────────────────┘
```

## Workspace 명령어

```bash
# 특정 패키지에서 명령 실행
pnpm --filter @axis-ds/ui-react build

# 모든 패키지에서 명령 실행
pnpm -r build
```
