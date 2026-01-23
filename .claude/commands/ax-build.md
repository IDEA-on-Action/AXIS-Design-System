# ax-build

전체 빌드 워크플로우를 자동화합니다.

## 빌드 순서

### 1. 사전 정리
```bash
pnpm clean
```

### 2. 의존성 확인
```bash
pnpm install
```

### 3. 타입 체크
```bash
pnpm type-check
```
- 오류 발생 시 중단하고 보고

### 4. 전체 빌드
```bash
pnpm build
```

### 5. 레지스트리 빌드 (선택적)
```bash
pnpm build:registry
```

## 빌드 옵션

| 인자 | 설명 |
|------|------|
| (없음) | 전체 빌드 |
| `tokens` | @axis-ds/tokens만 빌드 |
| `ui` | @axis-ds/ui-react만 빌드 |
| `agentic` | @axis-ds/agentic-ui만 빌드 |
| `web` | apps/web만 빌드 |
| `registry` | 레지스트리만 빌드 |

## 패키지별 빌드

인자에 따라 특정 패키지만 빌드:

### tokens
```bash
pnpm --filter @axis-ds/tokens build
```

### ui
```bash
pnpm --filter @axis-ds/ui-react build
```

### agentic
```bash
pnpm --filter @axis-ds/agentic-ui build
```

### web
```bash
pnpm --filter web build
```

### registry
```bash
pnpm build:registry
```

## 출력 형식

```
## 빌드 결과

### 빌드 대상: [전체/특정 패키지]

| 패키지 | 상태 | 시간 |
|--------|------|------|
| @axis-ds/tokens | ✅ | - |
| @axis-ds/ui-react | ✅ | - |
| ... | ... | ... |

### 결과: ✅ 성공 / ❌ 실패
[실패 시 오류 내용]
```

## 주의사항

- 빌드 전 항상 타입 체크 수행
- 의존성 순서: tokens → theme → ui-react → agentic-ui → cli → web
