# AI 툴 설정 가이드: Claude Code vs Cline

## 1. 현재 구현 상태 (Claude Code 전용)

### 구현된 파일 구조

```
.claude/
├── rules/                      # AI 협업 규칙
│   ├── 00-general.md           # 언어, 날짜, 작업 실행 원칙
│   ├── 10-code-conventions.md  # Import, 네이밍, 스타일링
│   ├── 20-quality.md           # 품질 게이트, 테스트
│   └── 30-security.md          # 민감 정보 보호
├── agents/                     # 전문 에이전트 5개
├── commands/                   # ax-* 커맨드 8개
└── settings.json               # Hooks 설정

docs/templates/                 # 산출물 템플릿
├── component-prd.md            # 컴포넌트 PRD
├── component-spec.md           # 컴포넌트 스펙
├── release-notes.md            # 릴리스 노트
├── adr.md                      # 아키텍처 결정 기록
├── todo.md                     # TODO 체크리스트
├── plan.md                     # 구현 계획
└── testplan.md                 # 테스트 계획

CLAUDE.md                       # 간소화된 프로젝트 가이드
```

---

## 2. Claude Code 사용법

### 2.1 규칙 자동 로드

Claude Code는 `.claude/rules/*.md` 파일을 **자동으로 로드**합니다.
별도 설정 없이 대화 시작 시 모든 규칙이 적용됩니다.

### 2.2 커맨드 실행

```
/ax-health          # 프로젝트 상태 점검
/ax-component       # 새 컴포넌트 개발
/ax-build           # 빌드 및 검증
/ax-dev             # 개발 환경 시작
/ax-release         # 릴리스 준비
/ax-wrap-up         # 작업 마무리
/ax-library         # 라이브러리 관리
/ax-mcp             # MCP 서버 관리
```

### 2.3 템플릿 활용

새 컴포넌트 작업 시:
```
"Button 컴포넌트 PRD를 docs/templates/component-prd.md 템플릿으로 작성해줘"
```

릴리스 노트 작성 시:
```
"docs/templates/release-notes.md 템플릿으로 v0.8.0 릴리스 노트 작성해줘"
```

---

## 3. Cline 설정

### 3.1 Cline vs Claude Code 핵심 차이

| 영역 | Claude Code | Cline |
|------|-------------|-------|
| 규칙 위치 | `.claude/rules/` | `.clinerules/` |
| 프로젝트 메모리 | `CLAUDE.md` | `AGENTS.md` |
| 워크플로 | commands + skills | `.clinerules/workflows/` |
| 실행 방식 | `/ax-*` 커맨드 | `/workflow-name.md` |
| 제외 설정 | `.gitignore` 활용 | `.clineignore` |

### 3.2 Cline 파일 구조

```
AGENTS.md                       # 공용 컨텍스트 (단일 소스)
.clineignore                    # 제외 파일 목록
.clinerules/
├── 00-core.md                  # 핵심 원칙
├── 10-quality.md               # 품질 게이트
├── 20-security.md              # 보안 규칙
└── workflows/                  # 워크플로 스크립트
    ├── wi-pipeline.md          # 전체 파이프라인
    ├── wi-prd.md               # PRD 작성
    ├── wi-todo.md              # TODO 생성
    ├── wi-implement.md         # 구현
    ├── wi-test.md              # 테스트
    └── wi-release-notes.md     # 릴리스 노트
```

### 3.3 Cline 워크플로 실행

```
/wi-pipeline.md WI-0001 button "Button 컴포넌트 개발"
/wi-prd.md WI-0001 button "PRD 작성"
/wi-todo.md WI-0001 button
/wi-implement.md WI-0001 button
/wi-test.md WI-0001 button
/wi-release-notes.md WI-0001 button
```

**특징:**
- 워크플로는 "필요할 때만" 로드되어 토큰 효율적
- 규칙은 "항상" 적용됨

### 3.4 Work Item 기반 개발

Cline의 제안 구조는 **Work Item(WI) 단위** 운영:

```
docs/workitems/
└── WI-0001-button/
    ├── prd.md           # 요구사항
    ├── todo.md          # 실행 체크리스트
    ├── plan.md          # 구현 계획
    ├── testplan.md      # 테스트 계획
    └── release-notes.md # 릴리스 노트
```

**원칙:**
1. PRD 없이 TODO 생성 금지
2. TODO 없이 구현 시작 금지
3. 테스트 없이 완료 처리 금지
4. 릴리스 노트 없이 배포 금지

---

## 4. 권장 사용 시나리오

### Claude Code

- 일상적인 컴포넌트 개발
- 빠른 버그 수정
- 문서 작성/업데이트
- 코드 리뷰

### Cline

- 대규모 기능 개발 (Work Item 추적)
- PRD → 구현 → 테스트 전체 파이프라인
- 팀 협업 시 문서 기반 진행 상황 공유

---

## 5. 공용 컨텍스트 (AGENTS.md)

`AGENTS.md`는 Claude Code와 Cline 모두에서 참조하는 단일 소스입니다:

- 프로젝트 명령어 (install, dev, build, lint, type-check)
- Work Item 운영 규칙
- Doc-driven Development 원칙
- 브랜치/커밋 컨벤션
- Definition of Done
- 보안 규칙
