# AXIS Design System 실행 계획서
> 생각과 행동 — Agentic eXperience Interface System

**작성일**: 2026-01-23  
**버전**: v1.0 (Implementation Ready)  
**기반 문서**: thoughtandaction_axis_ds_mcp_package_plan_v0.2.md

---

## 1. 현재 상태 분석 (As-Is)

### 1.1 기존 자산 (ax-discovery-portal)

```
packages/ui/
├── src/
│   ├── agentic/              # ✅ 재사용 가능한 Agentic UI 컴포넌트
│   │   ├── AARTemplateCard.tsx
│   │   ├── ActivityPreviewCard.tsx
│   │   ├── AgentRunContainer.tsx
│   │   ├── ApprovalDialog.tsx        # AXIS Core
│   │   ├── CollectorHealthBar.tsx
│   │   ├── FileUploadZone.tsx
│   │   ├── SeminarChatPanel.tsx
│   │   ├── StepIndicator.tsx         # AXIS Core
│   │   ├── StreamingText.tsx         # AXIS Core
│   │   ├── SurfaceRenderer.tsx       # AXIS Core
│   │   └── ToolCallCard.tsx          # AXIS Core
│   └── components/           # ✅ 기본 UI 컴포넌트 (shadcn 기반)
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── select.tsx
│       ├── separator.tsx
│       ├── tabs.tsx
│       └── toast.tsx
```

### 1.2 추출 가능 컴포넌트 분류

| 카테고리 | 컴포넌트 | 우선순위 |
|---------|---------|---------|
| **Core UI** | Button, Input, Card, Dialog, Badge | P0 |
| **Agentic Core** | StepIndicator, ApprovalDialog, StreamingText | P0 |
| **Agentic Extended** | SurfaceRenderer, ToolCallCard, AgentRunContainer | P1 |
| **Domain-specific** | AARTemplateCard, CollectorHealthBar | P2 (참조용) |

---

## 2. 목표 아키텍처 (To-Be)

```
@thoughtandaction/axis
├── packages/
│   ├── axis-tokens/          # 디자인 토큰 (CSS Variables + JSON)
│   ├── axis-theme/           # 테마 Provider + 다크모드
│   ├── axis-ui-react/        # 기본 UI 컴포넌트
│   ├── axis-agentic-ui/      # Agentic 전용 컴포넌트
│   ├── axis-cli/             # shadcn 호환 CLI
│   └── axis-mcp/             # MCP 서버 (검색/설치)
├── apps/
│   ├── docs/                 # Docusaurus 문서 사이트
│   ├── registry/             # Registry JSON 생성기
│   └── storybook/            # 컴포넌트 데모
├── connectors/
│   ├── shadcn/               # shadcn 호환 래퍼
│   └── monet/                # monet.design 연동
└── third_party/
    ├── ATTRIBUTION.md
    └── manifest.json
```

---

## 3. 실행 로드맵 (8주 MVP)

### Phase 0: 프로젝트 부트스트랩 (Week 1)

#### 0.1 GitHub Repository 설정

```bash
# 1. 저장소 생성
gh repo create thoughtandaction/axis --public --description "AXIS Design System"

# 2. Monorepo 초기화
pnpm init
npx turbo init

# 3. 패키지 스코프 설정
npm login --scope=@thoughtandaction --registry=https://registry.npmjs.org

# 4. 라이선스 파일
echo "MIT License..." > LICENSE
```

#### 0.2 초기 디렉토리 구조

```bash
mkdir -p packages/{axis-tokens,axis-theme,axis-ui-react,axis-agentic-ui,axis-cli,axis-mcp}
mkdir -p apps/{docs,registry,storybook}
mkdir -p connectors/{shadcn,monet}
mkdir -p third_party
```

#### 0.3 오픈소스 필수 문서

| 파일 | 용도 |
|-----|-----|
| `CLAUDE.md` | Claude Code 컨텍스트 |
| `CONTRIBUTING.md` | 기여 가이드 |
| `CODE_OF_CONDUCT.md` | 행동 강령 |
| `SECURITY.md` | 보안 정책 |
| `LICENSE` | MIT 라이선스 |

#### 0.4 Cloudflare 연결

```bash
# Cloudflare Pages 프로젝트 생성
wrangler pages project create axis-docs
wrangler pages project create axis-registry

# Workers 프로젝트 (검색 API)
wrangler init axis-search-api
```

**산출물**: GitHub 저장소 + Cloudflare 연동 완료

---

### Phase 1: Tokens & Theme (Week 2)

#### 1.1 토큰 계층 구조

```
axis-tokens/
├── src/
│   ├── primitives/           # 원시값 (색상 팔레트, 스케일)
│   │   ├── colors.json
│   │   ├── spacing.json
│   │   └── typography.json
│   ├── semantic/             # 의미적 토큰 (surface, text, border)
│   │   ├── light.json
│   │   └── dark.json
│   └── component/            # 컴포넌트 토큰 (button-bg, input-border)
│       └── components.json
├── dist/
│   ├── css/
│   │   └── variables.css     # CSS Custom Properties
│   ├── js/
│   │   └── tokens.js         # JS 객체
│   └── json/
│       └── tokens.json       # 원본 JSON
└── package.json
```

#### 1.2 토큰 네이밍 컨벤션

```css
/* Primitives: --axis-{category}-{scale} */
--axis-color-blue-500: #3B82F6;
--axis-space-4: 1rem;

/* Semantic: --axis-{role}-{variant} */
--axis-surface-default: var(--axis-color-white);
--axis-text-primary: var(--axis-color-gray-900);

/* Component: --axis-{component}-{property}-{state} */
--axis-button-bg-default: var(--axis-color-blue-500);
--axis-button-bg-hover: var(--axis-color-blue-600);
```

#### 1.3 빌드 스크립트 (Style Dictionary)

```javascript
// build-tokens.js
const StyleDictionary = require('style-dictionary');

StyleDictionary.extend({
  source: ['src/**/*.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'dist/css/',
      files: [{ destination: 'variables.css', format: 'css/variables' }]
    },
    js: {
      transformGroup: 'js',
      buildPath: 'dist/js/',
      files: [{ destination: 'tokens.js', format: 'javascript/module' }]
    }
  }
}).buildAllPlatforms();
```

**산출물**: `@thoughtandaction/axis-tokens` v0.1.0 배포

---

### Phase 2: Core UI Components (Week 3-4)

#### 2.1 MVP 컴포넌트 목록 (15개)

| 컴포넌트 | 소스 | 비고 |
|---------|-----|-----|
| Button | shadcn fork | 토큰 적용 |
| Input | shadcn fork | 토큰 적용 |
| Label | shadcn fork | |
| Card | shadcn fork | |
| Dialog | shadcn fork | |
| Badge | shadcn fork | |
| Select | shadcn fork | |
| Tabs | shadcn fork | |
| Toast | 신규 | Sonner 기반 |
| Separator | shadcn fork | |
| Avatar | 신규 | |
| Tooltip | 신규 | |
| Skeleton | 신규 | |
| Alert | 신규 | |
| Progress | 신규 | |

#### 2.2 컴포넌트 표준 구조

```typescript
// packages/axis-ui-react/src/button/button.tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-[var(--axis-button-bg-default)] text-white hover:bg-[var(--axis-button-bg-hover)]",
        secondary: "bg-[var(--axis-surface-secondary)] hover:bg-[var(--axis-surface-secondary-hover)]",
        ghost: "hover:bg-[var(--axis-surface-secondary)]",
        destructive: "bg-[var(--axis-color-red-500)] hover:bg-[var(--axis-color-red-600)]",
      },
      size: {
        sm: "h-8 px-3",
        default: "h-10 px-4",
        lg: "h-12 px-6",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return <Comp className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

#### 2.3 접근성 체크리스트

- [ ] 키보드 네비게이션 (Tab, Enter, Escape)
- [ ] ARIA 속성 적용
- [ ] 포커스 인디케이터 (focus-visible)
- [ ] 색상 대비 4.5:1 이상
- [ ] Screen reader 테스트

**산출물**: `@thoughtandaction/axis-ui-react` v0.1.0 배포

---

### Phase 3: Agentic UI Pack (Week 5-6)

#### 3.1 AXIS Agentic 컴포넌트

| 컴포넌트 | 용도 | 기존 소스 |
|---------|-----|---------|
| **RunProgress** | 에이전트 실행 진행률 | StepIndicator 확장 |
| **StepTimeline** | 단계별 타임라인 | 신규 |
| **ApprovalCard** | 사용자 승인 요청 | ApprovalDialog 리팩토링 |
| **SourcePanel** | AI 근거/출처 표시 | 신규 |
| **RecoveryBanner** | 오류 복구 안내 | 신규 |
| **StreamingText** | 실시간 텍스트 스트리밍 | 기존 재사용 |
| **ToolCallCard** | 도구 호출 표시 | 기존 재사용 |
| **SurfaceRenderer** | 동적 Surface 렌더링 | 기존 재사용 |
| **AgentAvatar** | 에이전트 아바타 | 신규 |
| **ThinkingIndicator** | "생각 중" 표시 | 신규 |

#### 3.2 Agentic 패턴 가이드

```typescript
// 패턴 1: 진행 상태 표시
<RunProgress
  status="running"
  steps={[
    { id: "plan", label: "계획 수립", status: "complete" },
    { id: "execute", label: "실행 중", status: "running" },
    { id: "review", label: "검토", status: "pending" },
  ]}
  onCancel={() => {}}
/>

// 패턴 2: 승인 요청
<ApprovalCard
  title="파일 삭제 확인"
  description="다음 파일을 삭제하시겠습니까?"
  severity="warning"
  actions={[
    { label: "취소", variant: "ghost" },
    { label: "삭제", variant: "destructive" },
  ]}
/>

// 패턴 3: 근거 표시
<SourcePanel
  sources={[
    { type: "web", url: "https://...", title: "참고 문서" },
    { type: "file", path: "/docs/spec.md", snippet: "..." },
  ]}
  expandable
/>
```

**산출물**: `@thoughtandaction/axis-agentic-ui` v0.1.0 배포

---

### Phase 4: Registry & CLI (Week 6-7)

#### 4.1 Registry JSON 스키마 (shadcn 호환)

```json
// registry.json
{
  "$schema": "https://ui.shadcn.com/schema/registry.json",
  "name": "axis",
  "homepage": "https://axis.thoughtandaction.dev",
  "items": [
    {
      "name": "button",
      "type": "registry:ui",
      "description": "Primary button component",
      "dependencies": ["@radix-ui/react-slot"],
      "devDependencies": ["class-variance-authority"],
      "registryDependencies": [],
      "files": [
        {
          "path": "ui/button.tsx",
          "type": "registry:ui"
        }
      ],
      "tailwind": {
        "config": {}
      },
      "cssVars": {
        "light": { "--axis-button-bg-default": "#3B82F6" },
        "dark": { "--axis-button-bg-default": "#2563EB" }
      }
    }
  ]
}
```

#### 4.2 CLI 명령어

```bash
# 초기화
npx axis-cli init

# 컴포넌트 추가
npx axis-cli add button
npx axis-cli add approval-card --agentic

# 목록 조회
npx axis-cli list
npx axis-cli list --category agentic

# 업데이트 체크
npx axis-cli check
```

#### 4.3 Registry 배포 (Cloudflare Pages)

```
apps/registry/
├── public/
│   └── r/
│       ├── registry.json     # 전체 인덱스
│       ├── button.json       # 개별 컴포넌트
│       ├── approval-card.json
│       └── ...
├── build.ts                  # 빌드 스크립트
└── wrangler.toml
```

**산출물**: `axis-cli` v0.1.0 + Registry 배포

---

### Phase 5: MCP Server (Week 7-8)

#### 5.1 MCP 서버 구조

```typescript
// packages/axis-mcp/src/server.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new Server({
  name: "axis-design-system",
  version: "0.1.0",
}, {
  capabilities: { tools: {} }
});

// Tool 1: 컴포넌트 검색
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "search_components",
      description: "Search AXIS components by keyword or category",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string" },
          category: { type: "string", enum: ["core", "agentic", "layout"] }
        }
      }
    },
    {
      name: "add_component",
      description: "Add a component to the project",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string" },
          path: { type: "string", default: "./src/components/ui" }
        },
        required: ["name"]
      }
    },
    {
      name: "get_component_docs",
      description: "Get documentation for a component",
      inputSchema: {
        type: "object",
        properties: { name: { type: "string" } },
        required: ["name"]
      }
    }
  ]
}));
```

#### 5.2 MCP 설정 예시 (claude_desktop_config.json)

```json
{
  "mcpServers": {
    "axis": {
      "command": "npx",
      "args": ["-y", "@thoughtandaction/axis-mcp"],
      "env": {
        "AXIS_REGISTRY_URL": "https://axis.thoughtandaction.dev/r"
      }
    }
  }
}
```

#### 5.3 사용 시나리오

```
User: "승인 버튼이 있는 카드 컴포넌트가 필요해"

Claude: [axis.search_components] { query: "approval card" }
→ "ApprovalCard 컴포넌트를 찾았습니다. 설치할까요?"

User: "응, 설치해줘"

Claude: [axis.add_component] { name: "approval-card" }
→ "src/components/ui/approval-card.tsx 생성 완료"
```

**산출물**: `@thoughtandaction/axis-mcp` v0.1.0

---

## 4. 외부 DS 연동 전략

### 4.1 shadcn/ui 연동

```typescript
// connectors/shadcn/sync.ts
// shadcn 컴포넌트를 AXIS 토큰으로 매핑

const tokenMapping = {
  // shadcn CSS 변수 → AXIS 토큰
  "--background": "var(--axis-surface-default)",
  "--foreground": "var(--axis-text-primary)",
  "--primary": "var(--axis-color-blue-500)",
  "--primary-foreground": "var(--axis-color-white)",
  // ...
};
```

### 4.2 monet.design 연동 (Link-only)

```json
// connectors/monet/manifest.json
{
  "name": "monet-connector",
  "type": "link-only",
  "registry": "https://monet.design/registry",
  "components": [
    { "name": "ColorPicker", "status": "reference", "license": "pending" }
  ],
  "note": "라이선스 확인 후 import 결정"
}
```

### 4.3 Attribution 관리

```json
// third_party/manifest.json
{
  "dependencies": [
    {
      "name": "shadcn/ui",
      "source": "https://github.com/shadcn-ui/ui",
      "version": "0.8.0",
      "license": "MIT",
      "files": ["button", "input", "card", "dialog"],
      "modifications": "AXIS 토큰 시스템 적용"
    },
    {
      "name": "Radix UI",
      "source": "https://github.com/radix-ui/primitives",
      "license": "MIT",
      "usage": "headless primitives"
    }
  ]
}
```

---

## 5. CI/CD 파이프라인

### 5.1 GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  lint-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm build

  a11y-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install
      - run: pnpm test:a11y  # axe 기반 접근성 테스트

  license-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npx license-checker --production --onlyAllow "MIT;Apache-2.0;BSD-3-Clause"
```

### 5.2 Release Workflow

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags: ['v*']

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm build
      - run: pnpm publish -r --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

  deploy-registry:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm build:registry
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}
          command: pages deploy apps/registry/dist --project-name=axis-registry
```

---

## 6. 문서화 계획

### 6.1 Docusaurus 구조

```
apps/docs/
├── docs/
│   ├── getting-started/
│   │   ├── installation.md
│   │   ├── theming.md
│   │   └── cli.md
│   ├── components/
│   │   ├── button.mdx
│   │   └── ...
│   ├── agentic/
│   │   ├── overview.md
│   │   ├── patterns.md
│   │   └── components/
│   └── contributing/
│       ├── guidelines.md
│       └── development.md
├── src/
│   └── components/
│       └── ComponentPreview.tsx
└── docusaurus.config.js
```

### 6.2 AI-Readable 문서

```markdown
<!-- llms.txt -->
# AXIS Design System

## Quick Reference
- Install: `npm i @thoughtandaction/axis-ui-react`
- Add component: `npx axis-cli add [name]`
- MCP: Configure in claude_desktop_config.json

## Component Categories
- Core UI: button, input, card, dialog, badge, select, tabs, toast
- Agentic UI: run-progress, step-timeline, approval-card, source-panel, streaming-text

## Rules
- Always use AXIS tokens (--axis-*) instead of hardcoded colors
- Agentic components require axis-agentic-ui package
- Follow accessibility guidelines (WCAG 2.1 AA)
```

---

## 7. 성공 지표 (KPIs)

| 지표 | MVP 목표 (8주) | 6개월 목표 |
|-----|--------------|----------|
| npm 주간 다운로드 | 100+ | 1,000+ |
| GitHub Stars | 50+ | 500+ |
| 컴포넌트 수 | 25개 | 50개 |
| 문서 페이지 | 30+ | 100+ |
| 기여자 수 | 3명 | 10명 |

---

## 8. 결정 필요 사항 체크리스트

- [ ] npm 스코프 확정: `@thoughtandaction` vs `@axis-ds`
- [ ] 도메인 확정: `axis.thoughtandaction.dev` vs `axis-ds.dev`
- [ ] 라이선스: MIT (권장) vs Apache 2.0
- [ ] shadcn fork vs wrap 방식 결정
- [ ] MCP 범위: 로컬 전용 vs 원격 API 포함
- [ ] Storybook vs 자체 문서 사이트 우선순위

---

## 9. 다음 액션 아이템

### 즉시 실행 (이번 주)

1. **GitHub 저장소 생성** — `thoughtandaction/axis`
2. **Monorepo 초기화** — pnpm workspace + Turborepo
3. **기본 문서 작성** — CLAUDE.md, CONTRIBUTING.md, LICENSE
4. **Cloudflare 프로젝트 생성** — Pages 2개, Workers 1개

### Week 2 시작 전 준비

1. **토큰 네이밍 확정** — 프리미티브/시맨틱/컴포넌트 계층
2. **컬러 팔레트 정의** — 브랜드 색상 + 시스템 색상
3. **기존 컴포넌트 분석** — ax-discovery-portal에서 추출할 코드 목록

---

## 부록: 참고 자료

- [shadcn/ui Registry 스키마](https://ui.shadcn.com/docs/registry)
- [MCP 명세](https://modelcontextprotocol.io/)
- [Style Dictionary](https://amzn.github.io/style-dictionary/)
- [Cloudflare Pages 배포](https://developers.cloudflare.com/pages/)
- [AXIS 프레임워크 원본](https://github.com/thoughtandaction/axis-framework)
