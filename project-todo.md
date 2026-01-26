# AXIS Design System - Project TODO

> 프로젝트 진행 상황 및 다음 단계

**현재 버전**: 0.7.0
**마지막 업데이트**: 2026-01-26
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

| # | 항목 | WI ID | Phase | 우선순위 | 상태 |
|---|------|-------|-------|----------|------|
| 1 | 컴포넌트 문서화 | [WI-0001](docs/workitems/WI-0001-component-docs/) | P3 | P1 | 🔄 |
| 2 | 라이브러리 페이지 구현 | [WI-0002](docs/workitems/WI-0002-library-page/) | P3 | P1 | 🔄 |

### 완료

| # | 항목 | WI ID | Phase | 완료일 |
|---|------|-------|-------|--------|
| 1 | Monorepo 구조 설정 | - | P0 | 2026-01-20 |
| 2 | 기본 컴포넌트 구현 | - | P1 | 2026-01-21 |
| 3 | CLI 도구 구현 | - | P2 | 2026-01-22 |
| 4 | MCP 서버 구현 | - | P2 | 2026-01-22 |

---

## 📊 로드맵 진행률

| Phase | 설명 | 완료 | 전체 | 진행률 |
|-------|------|------|------|--------|
| Phase 0 | 프로젝트 초기화 | 5 | 5 | 100% |
| Phase 1 | Core 컴포넌트 | 8 | 8 | 100% |
| Phase 2 | 인프라 구축 | 8 | 8 | 100% |
| Phase 3 | Agentic UI | 8 | 10 | 80% |
| Phase 4 | 템플릿 골격 + 갤러리 | 0 | 4 | 0% |
| Phase 5 | Template Engine + CLI | 0 | 8 | 0% |
| Phase 6 | MCP 연동 고도화 | 0 | 6 | 0% |
| Phase 7 | 외부 DS 연합형 확장 | 0 | 4 | 0% |
| **전체** | - | **29** | **53** | **55%** |

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
<summary>Phase 3: Agentic UI (80%)</summary>

- [x] AgentAvatar 컴포넌트
- [x] ThinkingIndicator 컴포넌트
- [x] AgentMessageBubble 컴포넌트
- [x] ToolCallCard 컴포넌트
- [x] CodeBlock 컴포넌트
- [x] ArtifactRenderer 컴포넌트
- [x] ProgressStepper 컴포넌트
- [x] 접근성 WCAG 2.1 AA 지원
- [ ] 컴포넌트 문서화 완성 (WI-0001)
- [ ] 라이브러리 페이지 구현 (WI-0002)

</details>

<details>
<summary>Phase 4: 템플릿 골격 + 갤러리 (0%)</summary>

- [ ] templates/ 디렉토리 구조 설계 (WI-0003)
- [ ] template.json 스키마 정의 (WI-0004)
- [ ] 최소 템플릿 구현 (Theme-only) (WI-0005)
- [ ] 템플릿 갤러리 UI 기본 구현 (WI-0006)

</details>

<details>
<summary>Phase 5: Template Engine + CLI (0%)</summary>

- [ ] axis template list 명령어 (WI-0007)
- [ ] axis template info 명령어 (WI-0008)
- [ ] axis template apply 명령어 (WI-0009)
- [ ] axis template init 명령어 (WI-0010)
- [ ] axis template diff 명령어 (WI-0011)
- [ ] axis check 명령어 (WI-0012)
- [ ] postInstall patch 시스템 (WI-0013)
- [ ] 샘플 템플릿 추가 (landing/dashboard/agentic) (WI-0014)

</details>

<details>
<summary>Phase 6: MCP 연동 고도화 (0%)</summary>

- [ ] list_templates MCP tool (WI-0015)
- [ ] get_template MCP tool (WI-0016)
- [ ] apply_template MCP tool (WI-0017)
- [ ] diff_template MCP tool (WI-0018)
- [ ] check_project MCP tool (WI-0019)
- [ ] IDE/Claude Code 워크플로 문서화 (WI-0020)

</details>

<details>
<summary>Phase 7: 외부 DS 연합형 확장 (0%)</summary>

- [ ] shadcn 블록 링크 템플릿 (WI-0021)
- [ ] monet 리소스 link-only 연동 (WI-0022)
- [ ] 커뮤니티 기여 가이드 (WI-0023)
- [ ] 라이선스 게이트 자동화 (WI-0024)

</details>

---

## 🔜 다음 단계

### Phase 3 완료 (현재)
1. 컴포넌트 문서 페이지 완성 (WI-0001)
2. 라이브러리 페이지 구현 (WI-0002)

### Phase 4 준비
3. templates/ 디렉토리 구조 설계 (WI-0003)
4. template.json 스키마 정의 (WI-0004)

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

## 📝 WI 연동 안내

> SSDD 원칙에 따라 모든 작업은 Work Item(WI)으로 관리됩니다.

**WI 폴더 위치**: `docs/workitems/<WI_ID>-<slug>/`

**WI 산출물**:
- prd.md (요구사항)
- todo.md (체크리스트)
- plan.md (구현 계획)
- testplan.md (테스트 계획)
- release-notes.md (릴리스 노트)

상세 규칙: `.claude/rules/05-ssdd.md` 또는 `.clinerules/05-ssdd.md` 참조
