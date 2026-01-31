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

---

## 6. 빌드 후 현행화

빌드 성공 시 관련 WI 산출물을 업데이트합니다.

### 6.1 WI todo.md 동기화

현재 작업 중인 WI가 있는 경우:

1. `docs/workitems/<WI_ID>/todo.md` 확인
2. 빌드 관련 항목 체크 완료:

```markdown
- [x] 타입 체크 통과
- [x] 린트 통과
- [x] 빌드 성공
```

### 6.2 testplan.md 결과 기록

빌드 검증 결과를 testplan.md에 기록:

```markdown
## 빌드 검증 결과

| 검증 항목 | 결과 | 일시 |
|-----------|------|------|
| pnpm type-check | ✅ | 2025-01-26 |
| pnpm lint | ✅ | 2025-01-26 |
| pnpm build | ✅ | 2025-01-26 |
```

### 6.3 현행화 체크리스트

```
### 빌드 현행화 확인
- [ ] WI todo.md 빌드 항목 체크
- [ ] testplan.md 빌드 결과 기록
- [ ] 빌드 실패 시 이슈 항목 추가
```
