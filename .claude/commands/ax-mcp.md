# ax-mcp

MCP(Model Context Protocol) 서버를 관리합니다.

## 사용법

```
/ax-mcp [작업]
```

## 작업 유형

| 작업 | 설명 |
|------|------|
| `status` | MCP 서버 상태 확인 |
| `list` | 사용 가능한 MCP 도구 목록 |
| `test` | MCP 연결 테스트 |

## MCP 설정 파일

`.claude/mcp.json` 파일에서 MCP 서버 설정을 관리합니다.

### 설정 파일 확인
```bash
cat .claude/mcp.json
```

## 사용 가능한 MCP 서버

### shadcn MCP
컴포넌트 레지스트리 검색 및 관리

**제공 도구:**
- `mcp__shadcn__get_project_registries` - 프로젝트 레지스트리 확인
- `mcp__shadcn__list_items_in_registries` - 레지스트리 아이템 목록
- `mcp__shadcn__search_items_in_registries` - 컴포넌트 검색
- `mcp__shadcn__view_items_in_registries` - 컴포넌트 상세 정보
- `mcp__shadcn__get_item_examples_from_registries` - 사용 예제
- `mcp__shadcn__get_add_command_for_items` - 추가 명령어

## MCP 서버 테스트

### 레지스트리 연결 테스트
MCP 도구 `mcp__shadcn__get_project_registries` 호출

### 검색 테스트
MCP 도구 `mcp__shadcn__search_items_in_registries` 호출:
- registries: ["@shadcn"]
- query: "button"

## 출력 형식

### status
```
## MCP 서버 상태

| 서버 | 상태 | 도구 수 |
|------|------|---------|
| shadcn | ✅ 연결됨 | 6 |

### 사용 가능한 도구
- mcp__shadcn__search_items_in_registries
- ...
```

### list
```
## MCP 도구 목록

### shadcn
| 도구 | 설명 |
|------|------|
| search_items_in_registries | 컴포넌트 검색 |
| ... | ... |
```

## 문제 해결

### MCP 연결 실패 시
1. `.claude/mcp.json` 설정 확인
2. MCP 서버 프로세스 확인
3. 네트워크 연결 확인

### 도구 호출 실패 시
1. 파라미터 형식 확인
2. 레지스트리 이름 확인 (예: "@shadcn")
