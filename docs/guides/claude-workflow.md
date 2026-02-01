# Claude Code 워크플로 가이드

AXIS Design System의 AI 기반 개발 워크플로를 설명합니다. MCP 서버, 커스텀 커맨드, Hook 자동화를 활용하여 설계부터 릴리스까지 일관된 개발 경험을 제공합니다.

---

## 1. 개요

AXIS DS는 세 가지 AI 협업 레이어를 제공합니다:

| 레이어 | 설명 | 구성 요소 |
|--------|------|-----------|
| **MCP 서버** | AI 에이전트가 호출하는 도구 API | 16개 도구 (컴포넌트·토큰·템플릿·프롬프트) |
| **커스텀 커맨드** | `/ax-*` 형태의 워크플로 자동화 | 9개 커맨드 |
| **Hook 자동화** | 파일 수정·커밋 시 자동 검증 | PreToolUse, PostToolUse, 커스텀 명령 |

추가로 5개 **전문 에이전트**가 역할별 전문성을 분리하여 아키텍처 설계, 컴포넌트 개발, 코드 리뷰, 문서 작성, 테스트를 담당합니다.

---

## 2. MCP 서버 설정

### Claude Desktop

`claude_desktop_config.json`에 AXIS 서버를 등록합니다:

```json
{
  "mcpServers": {
    "axis": {
      "command": "node",
      "args": ["packages/axis-mcp/dist/index.js"],
      "cwd": "<프로젝트 루트 경로>"
    }
  }
}
```

### Claude Code

`.claude/mcp.json`에 설정이 이미 포함되어 있습니다:

```json
{
  "axis": {
    "type": "local",
    "command": "node",
    "args": ["packages/axis-mcp/dist/index.js"]
  }
}
```

### 연결 확인

```bash
/ax-mcp status
```

AXIS MCP 외에 다음 서버도 연동 가능합니다:

| 서버 | 타입 | 용도 |
|------|------|------|
| `shadcn` | npx | shadcn 컴포넌트 레지스트리 |
| `monet` | remote | Monet Design 원격 서버 |
| `confluence` | Python | Confluence 문서 연동 |
| `teams` | Python | MS Teams 메시지 전송 |

---

## 3. MCP 도구 레퍼런스

### 3.1 컴포넌트 도구

| 도구 | 파라미터 | 설명 |
|------|----------|------|
| `axis.list_components` | `category?`: core·agentic·form·layout | 전체 컴포넌트 목록 조회 |
| `axis.search_components` | `query`, `category?` | 이름·설명 기반 컴포넌트 검색 |
| `axis.get_component` | `name` | 컴포넌트 상세 정보 (Props, 예제, 파일 구조) |
| `axis.install_component` | `name`, `targetDir` | 컴포넌트를 프로젝트에 설치 |

### 3.2 토큰 도구

| 도구 | 파라미터 | 설명 |
|------|----------|------|
| `axis.list_tokens` | `category?`: color·typography·spacing·radius·shadow·animation | 디자인 토큰 목록 조회 |
| `axis.get_token` | `path` | 토큰 상세 정보 (값, CSS 변수명) |

### 3.3 템플릿 도구

| 도구 | 파라미터 | 설명 |
|------|----------|------|
| `axis.list_templates` | `category?` | 템플릿 목록 조회 |
| `axis.get_template` | `name` | 템플릿 상세 정보 (파일 목록, 의존성) |
| `axis.apply_template` | `name`, `targetDir`, `dryRun?` | 템플릿 적용 (파일 생성 + postInstall 패치) |
| `axis.diff_template` | `name`, `targetDir?` | 로컬 vs 원격 템플릿 파일 비교 |
| `axis.check_project` | `targetDir?` | 프로젝트 AXIS 설정 검증 |

### 3.4 프롬프트 도구

| 도구 | 파라미터 | 설명 |
|------|----------|------|
| `axis.prompt.detect` | `context`, `minScore?`, `maxCandidates?` | 세션 컨텍스트에서 재사용 가능 프롬프트 탐지 |
| `axis.prompt.analyze` | `text` | 텍스트 재사용 가능성 분석 |
| `axis.prompt.refine` | `text`, `name?`, `category?` | 범용 프롬프트로 정제 (변수화) |
| `axis.prompt.validate` | `promptText`, `checkDuplicate?` | 프롬프트 품질 검증 |
| `axis.prompt.save` | `promptText`, `name`, `category`, `force?` | 프롬프트 파일 저장 및 인덱스 갱신 |

**PromptCategory**: `planning`, `quality`, `documentation`, `workflow`

---

## 4. 커스텀 커맨드 (ax-*)

Claude Code에서 `/ax-*` 형태로 실행하는 워크플로 커맨드입니다.

| 커맨드 | 설명 | 주요 서브커맨드 |
|--------|------|-----------------|
| `/ax-wi` | WI 라이프사이클 관리 | start, end, status, wrap-up |
| `/ax-build` | 빌드 워크플로우 | 사전 점검 → 빌드 → 레지스트리 → 현행화 |
| `/ax-component` | 컴포넌트 스캐폴딩 | UI/Agentic 컴포넌트 생성 |
| `/ax-dev` | 개발 서버 시작 | web, all 모드 |
| `/ax-health` | 프로젝트 상태 점검 | 의존성, 타입, 린트, 빌드, Git |
| `/ax-library` | 외부 컴포넌트 커스터마이징 | shadcn → AXIS 토큰 교체 |
| `/ax-mcp` | MCP 서버 관리 | status, list, test |
| `/ax-prompt` | 프롬프트 관리 | detect, save, analyze, list, show, refine |
| `/ax-release` | 릴리스 준비 | 품질 확인 → 버전 범프 → 현행화 |

### /ax-wi 스마트 모드

인자 없이 `/ax-wi`를 호출하면 자동으로 WI를 감지합니다:

1. 대화 컨텍스트에서 WI-ID 탐색
2. `project-todo.md`에서 진행 중인 WI 확인
3. `git diff` / 최근 커밋에서 WI 참조 검색
4. WI가 1개면 즉시 선택, 2개 이상이면 목록 제시
5. `todo.md` 상태와 git 변경사항 기반으로 서브커맨드 자동 결정

---

## 5. 실전 워크플로 시나리오

### 시나리오 A: 신규 컴포넌트 개발

```
1. /ax-wi start WI-0015-dropdown     ← WI 착수, todo.md 생성
2. axis.search_components("dropdown") ← 유사 컴포넌트 검색
3. /ax-component Dropdown             ← 스캐폴딩 생성
4. (구현)
5. /ax-build                          ← 빌드 + 레지스트리 갱신
6. /ax-wi end                         ← WI 종료, 현행화
```

### 시나리오 B: 템플릿 적용

```
1. axis.list_templates()             ← 사용 가능한 템플릿 목록
2. axis.get_template("dashboard")    ← 상세 정보 확인
3. axis.diff_template("dashboard")   ← 현재 프로젝트와 차이 비교
4. axis.apply_template("dashboard", "./src", dryRun: true)  ← 미리보기
5. axis.apply_template("dashboard", "./src")  ← 실제 적용
6. axis.check_project()              ← 설정 검증
```

### 시나리오 C: 프롬프트 재사용

```
1. axis.prompt.detect(context)       ← 세션에서 재사용 후보 탐지
2. axis.prompt.refine(text)          ← 범용 프롬프트로 정제
3. axis.prompt.validate(promptText)  ← 품질 검증 + 중복 검사
4. axis.prompt.save(promptText, name, category)  ← 저장 및 인덱스 갱신
```

---

## 6. Hook과 자동화

`.claude/settings.json`에 정의된 Hook이 파일 수정과 커밋 시 자동으로 실행됩니다.

### PreToolUse

| 트리거 | 실행 명령 | 동작 |
|--------|-----------|------|
| `git commit*` | `pnpm type-check` | 커밋 전 타입 체크 (경고) |

### PostToolUse

| 트리거 | 실행 명령 | 동작 |
|--------|-----------|------|
| `.tsx` 파일 수정 (`packages/axis-*/src/**/*.tsx`) | `pnpm type-check` | 컴포넌트 수정 시 타입 검증 |
| `registry.json` 수정 | `pnpm build:registry` | 레지스트리 자동 빌드 |

### 커스텀 명령

| 명령 | 실행 내용 |
|------|-----------|
| `status` | `git status && pnpm type-check` |
| `components` | `npx @axis-ds/cli list` |
| `registry` | `pnpm build:registry` |
| `clean` | `pnpm clean` |

---

## 7. 전문 에이전트

`.claude/agents/`에 정의된 5개 전문 에이전트가 역할별로 작업을 수행합니다.

| 에이전트 | 역할 | 활용 시나리오 |
|----------|------|---------------|
| `design-system-architect` | 아키텍처 설계 | 토큰 구조, 컴포넌트 계층, 모노레포 관리 |
| `component-dev` | 컴포넌트 개발 | React 19 + Tailwind + Radix UI, 접근성 |
| `code-reviewer` | 코드 품질 검사 | 디자인 토큰 사용 검증, WCAG 2.1 AA |
| `docs-writer` | 문서화 | API 문서, Props 테이블, 설치 가이드 |
| `test-engineer` | 테스트 전략 | E2E (Playwright), 컴포넌트 (Vitest), 접근성 (Axe) |

에이전트 간 협업:
- `design-system-architect` ↔ `component-dev`: 컴포넌트 구조 설계
- `component-dev` ↔ `test-engineer`: 테스트 가능한 구조 설계
- `component-dev` ↔ `docs-writer`: API 문서화
- `code-reviewer` ↔ 모든 에이전트: 코드 품질 검증

---

## 8. 문제 해결

### MCP 연결 실패

```bash
# 1. MCP 서버 빌드 상태 확인
pnpm --filter @axis-ds/mcp build

# 2. 연결 상태 확인
/ax-mcp status

# 3. 로그 확인
/ax-mcp test
```

### Hook 실행 오류

```bash
# Hook 설정 확인
cat .claude/settings.json

# 타입 체크 수동 실행
pnpm type-check

# 레지스트리 빌드 수동 실행
pnpm build:registry
```

### 커맨드 WI 감지 실패

`/ax-wi`가 WI를 자동 감지하지 못하는 경우:

```bash
# WI-ID를 명시적으로 지정
/ax-wi start WI-0015-dropdown

# project-todo.md에서 진행 중인 WI 확인
# '🔄' 상태의 항목이 있는지 확인

# 대화에서 WI-ID를 먼저 언급한 뒤 /ax-wi 실행
```
