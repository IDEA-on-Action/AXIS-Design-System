# AGENTS.md

> Cline + Claude Code 공용 컨텍스트 (단일 소스 오브 트루스)

---

## 0) Project Commands

| 용도 | 명령어 |
|------|--------|
| Install | `pnpm install` |
| Dev | `pnpm dev:web` |
| Build | `pnpm build` |
| Lint | `pnpm lint` |
| Type Check | `pnpm type-check` |
| Registry Build | `pnpm build:registry` |

---

## 1) Work Item (WI) 단위 운영

모든 변경은 Work Item 폴더에 귀속합니다.

```
docs/workitems/<WI_ID>-<slug>/
├── prd.md           # 요구사항 정의
├── todo.md          # 실행 체크리스트
├── plan.md          # 구현 계획
├── testplan.md      # 테스트 계획
└── release-notes.md # 릴리스 노트
```

예시:
- `docs/workitems/WI-0001-button/`
- `docs/workitems/WI-0002-avatar/`

---

## 1-1) SSDD 원칙

**SSDD (Single Source of Design Document)**: 모든 작업은 문서에서 시작하고 문서로 끝난다.

Claude Code와 Cline 모두 동일한 SSDD 파이프라인을 따릅니다:

```
PRD → TODO → 구현 → 테스트 → Release Notes
```

### 핵심 규칙

1. **PRD 우선**: 코드 작성 전 PRD 작성/확인
2. **TODO 기반**: PRD 없는 TODO 금지
3. **테스트 필수**: 테스트 없이 "완료" 불가
4. **릴리스 강제**: 머지/배포 전 릴리스 노트 필수

> 상세 규칙: `.claude/rules/05-ssdd.md`

---

## 3) 브랜치/커밋 컨벤션

- **Branch**: `wi/<WI_ID>-<slug>` (예: `wi/WI-0001-button`)
- **Commit**: Conventional Commits
  - `feat:` 새 기능
  - `fix:` 버그 수정
  - `refactor:` 리팩터링
  - `test:` 테스트
  - `docs:` 문서
- **참조**: 커밋/PR 본문에 `Refs: WI-0001` 형태로 연결

---

## 4) Definition of Done (품질 게이트)

> 상세 규칙: `.claude/rules/20-quality.md`

---

## 5) 보안/데이터 취급

> 상세 규칙: `.claude/rules/30-security.md`

---

## 6) 프로젝트 구조 참고

```
axis-design-system/
├── apps/web/              # Next.js 문서 사이트
├── packages/
│   ├── axis-tokens/       # @axis-ds/tokens
│   ├── axis-ui-react/     # @axis-ds/ui-react
│   ├── axis-agentic-ui/   # @axis-ds/agentic-ui
│   ├── axis-theme/        # @axis-ds/theme
│   └── axis-cli/          # @axis-ds/cli
├── docs/                  # 문서 및 템플릿
└── .claude/               # Claude Code 설정
```

---

## 7) 커맨드/워크플로 매핑

Claude Code와 Cline의 SSDD 파이프라인 단계별 도구:

| 단계 | 작업 | Claude Code | Cline |
|------|------|-------------|-------|
| 1 | PRD 작성 | 수동 작성 | `/wi-prd.md` |
| 2 | TODO 생성 | 수동 작성 | `/wi-todo.md` |
| 3 | 구현 | 직접 코딩 | `/wi-implement.md` |
| 4 | 테스트 | `/ax-build` | `/wi-test.md` |
| 5 | 릴리스 노트 | `/ax-release` | `/wi-release-notes.md` |
| 전체 | 파이프라인 | - | `/wi-pipeline.md` |

### Claude Code 커맨드

| 커맨드 | 용도 |
|--------|------|
| `/ax-build` | 빌드 및 품질 검증 |
| `/ax-dev` | 개발 서버 실행 |
| `/ax-health` | 프로젝트 상태 점검 |
| `/ax-release` | 릴리스 노트 생성 |
| `/ax-component` | 컴포넌트 생성 |
| `/ax-library` | 라이브러리 관리 |
| `/ax-wrap-up` | 작업 마무리 |

### Cline 워크플로

| 워크플로 | 용도 |
|----------|------|
| `/wi-pipeline.md` | 전체 WI 파이프라인 |
| `/wi-prd.md` | PRD 작성 |
| `/wi-todo.md` | TODO 생성 |
| `/wi-implement.md` | 구현 |
| `/wi-test.md` | 테스트 |
| `/wi-release-notes.md` | 릴리스 노트 |

---

## 8) project-todo.md 연동

진행 중인 작업은 `project-todo.md`에서 WI ID로 추적합니다.

**형식:**
```markdown
| # | 항목 | WI ID | Phase | 우선순위 | 상태 |
|---|------|-------|-------|----------|------|
| 1 | 작업명 | WI-0001 | P3 | P1 | 🔄 |
```

**로드맵 연동:**
- project-todo.md의 Phase 열은 프로젝트 로드맵 Phase를 참조
- 진행률은 Phase별로 집계
