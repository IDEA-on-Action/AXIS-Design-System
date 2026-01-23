# ax-library

외부 컴포넌트를 수집하고 AXIS Design System에 배치합니다.

## 사용법

```
/ax-library [작업] [소스]
```

## 작업 유형

| 작업 | 설명 |
|------|------|
| `search` | shadcn 레지스트리에서 컴포넌트 검색 |
| `add` | 컴포넌트 추가 |
| `list` | 현재 등록된 컴포넌트 목록 |
| `update` | 컴포넌트 업데이트 |

## 컴포넌트 검색

### shadcn 레지스트리 검색
MCP 도구 `mcp__shadcn__search_items_in_registries` 사용:
- 레지스트리: `["@shadcn"]`
- 쿼리: 검색어

### 예시 사용
MCP 도구로 컴포넌트를 검색하고 예제를 확인합니다.

## 컴포넌트 추가 워크플로우

### 1. 컴포넌트 정보 확인
MCP 도구 `mcp__shadcn__view_items_in_registries` 사용

### 2. 예제 확인
MCP 도구 `mcp__shadcn__get_item_examples_from_registries` 사용

### 3. 추가 명령어 확인
MCP 도구 `mcp__shadcn__get_add_command_for_items` 사용

### 4. 컴포넌트 설치
```bash
npx shadcn@latest add [컴포넌트명]
```

### 5. AXIS 스타일 적용
- 디자인 토큰 적용
- 네이밍 규칙 통일
- 문서화

## 레지스트리 관리

### 현재 레지스트리 확인
```bash
pnpm build:registry
```

### registry.json 위치
`packages/axis-cli/registry.json`

## 컴포넌트 커스터마이징 체크리스트

- [ ] AXIS 디자인 토큰 적용 (@axis-ds/tokens)
- [ ] 컴포넌트 네이밍 규칙 준수
- [ ] TypeScript 타입 정의 완료
- [ ] 접근성(a11y) 확인
- [ ] 다크모드 지원 확인
- [ ] 문서화 완료

## 출력 형식

```
## 라이브러리 작업 결과

### 작업: [search/add/list/update]

### 결과:
[작업별 상세 결과]

### 다음 단계:
[권장 조치사항]
```
