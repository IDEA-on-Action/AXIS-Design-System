# Test Plan — <기능명>

> WI: <WI_ID> | 작성일: YYYY-MM-DD

---

## 1. 테스트 범위

### In Scope

- 테스트 대상 1
- 테스트 대상 2

### Out of Scope

- 제외 대상 1

---

## 2. 자동화 테스트

### Unit Tests

| 테스트 케이스 | 파일 | 상태 |
|---------------|------|------|
| 케이스 1 | `path/to/test.spec.ts` | ⬜ |
| 케이스 2 | | ⬜ |

### Integration Tests

| 테스트 케이스 | 파일 | 상태 |
|---------------|------|------|
| 케이스 1 | | ⬜ |

### E2E Tests (해당 시)

| 테스트 플로우 | 파일 | 상태 |
|---------------|------|------|
| 플로우 1 | | ⬜ |

---

## 3. 수동 QA

### 테스트 시나리오

1. **시나리오 1: <설명>**
   - 단계:
     1. Step 1
     2. Step 2
   - 기대 결과:

2. **시나리오 2: <설명>**
   - 단계:
   - 기대 결과:

---

## 4. Edge Cases / Regression

### Edge Cases

- [ ] 빈 값 처리
- [ ] 최대값 처리
- [ ] 특수 문자 처리

### Regression

- [ ] 기존 기능 A 정상 동작
- [ ] 기존 기능 B 정상 동작

---

## 5. 테스트 데이터 / Fixtures

### 테스트 데이터

- 데이터 1:
- 데이터 2:

### Mock / Fixtures

- Mock 서버:
- Fixture 파일:

---

## 6. 테스트 실행

```bash
# 타입 체크
pnpm type-check

# 린트
pnpm lint

# 빌드
pnpm build

# 테스트 (해당 시)
pnpm test
```
