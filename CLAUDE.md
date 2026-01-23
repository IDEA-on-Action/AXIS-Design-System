# AXIS Design System 개발 가이드

> Claude와의 개발 협업을 위한 프로젝트 핵심 문서

**현재 버전**: 0.7.0 | **상태**: ✅ Active Development

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
| **Styling** | Tailwind CSS | 4 |
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
├── pnpm-workspace.yaml         # pnpm workspace 설정
├── turbo.json                  # Turborepo 설정
└── package.json                # 루트 패키지
```

---

## 🤖 AI 협업 규칙

### 언어 원칙

- **모든 출력은 한글로 작성**: 코드 주석, 커밋 메시지, 문서, 대화 응답
- **예외**: 코드 변수명, 함수명, 기술 용어는 영문 유지

### 날짜/시간 원칙

- **기준 시간대**: KST (Korea Standard Time, UTC+9)
- **날짜 표기**: YYYY-MM-DD 형식

### 작업 실행 원칙

- **병렬 작업 우선**: 독립적인 작업은 항상 병렬로 진행
- **효율성 극대화**: 의존성 없는 도구 호출은 동시에 실행

### 코드 컨벤션

- **Import Alias**: `@/` → `src/`
- **컴포넌트**: PascalCase
- **함수/훅**: camelCase
- **파일명**: kebab-case
- **CSS**: Tailwind CSS 유틸리티 클래스 사용

---

## 🔢 버전 관리

**형식**: Major.Minor.Patch (Semantic Versioning)

| 버전 | 변경 기준 |
|------|-----------|
| Major (X.0.0) | Breaking Changes |
| Minor (0.X.0) | 새로운 기능 추가 |
| Patch (0.0.X) | 버그 수정 |

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

# 레지스트리 빌드
pnpm build:registry
```

---

## 📝 참고사항

- **문서 인덱스**: [docs/INDEX.md](docs/INDEX.md)
- **Monorepo 설정**: [docs/guides/monorepo-setup.md](docs/guides/monorepo-setup.md)
- **Agentic UI 디자인**: [docs/guides/agentic-ui-design.md](docs/guides/agentic-ui-design.md)

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
