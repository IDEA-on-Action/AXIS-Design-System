# AXIS Design System 문서 인덱스

> 프로젝트 문서 네비게이션

**버전**: 0.7.1 | **마지막 업데이트**: 2026-01-24

---

## 핵심 문서 (루트)

| 문서 | 설명 |
|------|------|
| [README.md](../README.md) | 프로젝트 개요 및 빠른 시작 |
| [CLAUDE.md](../CLAUDE.md) | AI 협업 규칙 및 개발 가이드 |
| [changelog.md](../changelog.md) | 버전별 변경 이력 |

---

## 가이드 (docs/guides/)

| 문서 | 설명 |
|------|------|
| [monorepo-setup.md](guides/monorepo-setup.md) | pnpm workspace + Turborepo 설정 가이드 |
| [agentic-ui-design.md](guides/agentic-ui-design.md) | Agentic UI 디자인 시스템 기획서 |

---

## 패키지 문서

| 패키지 | 컴포넌트 수 | 설명 |
|--------|----------|------|
| `@axis-ds/tokens` | - | 디자인 토큰 - 색상, 타이포그래피, 간격 |
| `@axis-ds/ui-react` | **15개** | React UI 컴포넌트 라이브러리 |
| `@axis-ds/agentic-ui` | **10개** | AI/Agent 전용 UI 컴포넌트 |
| `@axis-ds/theme` | - | 테마 설정 및 다크모드 |
| `@axis-ds/cli` | - | 컴포넌트 설치 CLI |
| `@axis-ds/mcp` | - | MCP 서버 (AI 연동) |

---

## 컴포넌트 현황

### Core UI (`@axis-ds/ui-react`) - 15개

| 컴포넌트 | 문서 | 설명 |
|---------|------|------|
| Button | ✅ | 다양한 스타일/크기 버튼 |
| Card | ✅ | 콘텐츠 그룹화 카드 |
| Input | ✅ | 텍스트 입력 필드 |
| Label | ✅ | 폼 필드 레이블 |
| Select | ✅ | 드롭다운 선택 |
| Dialog | ✅ | 모달 다이얼로그 |
| Badge | ✅ | 상태 표시 뱃지 |
| Tabs | ✅ | 탭 네비게이션 |
| Separator | ✅ | 구분선 |
| Toast | ✅ | 알림 토스트 |
| Avatar | ✅ | 이미지/이니셜 아바타 |
| Tooltip | ✅ | 호버 툴팁 |
| Skeleton | ✅ | 로딩 플레이스홀더 |
| Alert | ✅ | 알림 배너 |
| Progress | ✅ | 진행 상태 바 |

### Agentic UI (`@axis-ds/agentic-ui`) - 10개

| 컴포넌트 | 문서 | 설명 |
|---------|------|------|
| StreamingText | ✅ | 실시간 텍스트 스트리밍 |
| ToolCallCard | ✅ | AI 도구 호출 표시 |
| ApprovalCard | ✅ | 사용자 승인 요청 |
| SurfaceRenderer | ✅ | 다양한 컨텐츠 렌더링 |
| RunProgress | ✅ | 에이전트 실행 진행 |
| StepTimeline | ✅ | 단계별 타임라인 |
| SourcePanel | ✅ | AI 응답 출처 표시 |
| RecoveryBanner | ✅ | 에러 복구 배너 |
| AgentAvatar | ✅ | AI 에이전트 아바타 |
| ThinkingIndicator | ✅ | AI 생각 중 인디케이터 |

---

## KPI 현황

| 지표 | 목표 | 현재 | 상태 |
|------|------|------|------|
| 총 컴포넌트 | 25개 | 25개 | ✅ |
| 문서 완성도 | 100% | 100% | ✅ |
