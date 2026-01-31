# ax-library

외부 컴포넌트(shadcn 등)를 AXIS Design System에 맞게 커스터마이징하는 가이드입니다.

## 사용법

```
/ax-library [컴포넌트명]
```

## 컴포넌트 검색/추가

shadcn 레지스트리 검색 및 컴포넌트 추가는 MCP 도구 또는 CLI를 직접 사용하세요:

| 작업 | 방법 |
|------|------|
| 검색 | MCP `mcp__shadcn__search_items_in_registries` 또는 shadcn 문서 참조 |
| 상세 확인 | MCP `mcp__shadcn__view_items_in_registries` |
| 예제 보기 | MCP `mcp__shadcn__get_item_examples_from_registries` |
| 설치 | `npx shadcn@latest add [컴포넌트명]` |

## AXIS 커스터마이징 체크리스트

컴포넌트 추가 후 아래 항목을 반드시 적용합니다:

### 1. 디자인 토큰 교체
- [ ] 하드코딩된 색상 → `@axis-ds/tokens` CSS 변수 또는 Tailwind 토큰 클래스
- [ ] 하드코딩된 간격/폰트 → 토큰 값

### 2. 컴포넌트 구조 표준화
- [ ] `displayName` 추가 (`Component.displayName = 'Component'`)
- [ ] `forwardRef` 적용
- [ ] Props 인터페이스 명시 (`ComponentProps`)
- [ ] `className` prop 지원 (cn 유틸리티 사용)

### 3. 접근성 확인
- [ ] 키보드 네비게이션 동작 확인
- [ ] ARIA 속성 적절성 검토
- [ ] 스크린 리더 테스트

### 4. 다크모드 지원
- [ ] 다크모드에서 색상/배경 토큰이 올바르게 전환되는지 확인

### 5. Export 설정
- [ ] `packages/axis-ui-react/src/index.ts`에 export 추가
- [ ] 레지스트리 빌드 확인: `pnpm build:registry`

### 6. 문서화
- [ ] `apps/web/src/app/components/[컴포넌트명]/` 페이지 생성
- [ ] 기본 사용 예제, Props 테이블, 변형(Variants) 예시 포함

## 레지스트리 관리

```bash
# 레지스트리 빌드
pnpm build:registry
```

registry.json 위치: `packages/axis-cli/registry.json`

## 출력 형식

```
## AXIS 커스터마이징 결과: [컴포넌트명]

### 적용 항목
| 항목 | 상태 |
|------|------|
| 디자인 토큰 교체 | ✅ / ❌ |
| displayName | ✅ / ❌ |
| forwardRef | ✅ / ❌ |
| 접근성 | ✅ / ❌ |
| 다크모드 | ✅ / ❌ |
| Export | ✅ / ❌ |
| 문서화 | ✅ / ❌ |

### 다음 단계
[권장 조치사항]
```
