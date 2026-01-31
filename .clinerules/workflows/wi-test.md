# WI: 테스트 (Test)

## Usage

```
/wi-test.md WI-0001 button
```

## Steps

1. WI의 prd/todo/plan을 읽고 테스트 범위를 정리한다.

2. testplan.md에 작성:
   - Unit Tests (단위 테스트)
   - Integration Tests (통합 테스트)
   - E2E Tests (해당 시)
   - Manual QA (수동 테스트)
   - Edge cases / Regression

3. 필요한 테스트를 구현한다.

4. 테스트 명령 실행 (AGENTS.md 참조):
   ```bash
   pnpm type-check
   pnpm lint
   pnpm build
   ```

5. 실패 시 수정 → 재실행 → 통과 시 todo.md 체크 반영.

6. 마지막에 다음 추천 커맨드:
   - `/wi-release-notes.md <WI_ID> <slug>`

---

## SSDD Gate 3 체크

테스트 완료 전 아래 항목을 확인합니다:

- [ ] testplan.md 작성됨
- [ ] 모든 테스트 통과
- [ ] 품질 게이트 통과 (`pnpm type-check && pnpm lint && pnpm build`)

---

## 현행화

테스트 완료 후 수행:

### 1. testplan.md 결과 기록

테스트 실행 결과를 기록:

```markdown
## 테스트 결과

| 테스트 유형 | 결과 | 실행일 |
|-------------|------|--------|
| Unit Tests | ✅ 통과 | 2025-01-26 |
| Type Check | ✅ 통과 | 2025-01-26 |
| Lint | ✅ 통과 | 2025-01-26 |
| Build | ✅ 통과 | 2025-01-26 |
```

### 2. WI todo.md 테스트 항목 체크

```markdown
- [x] 단위 테스트 작성
- [x] 타입 체크 통과
- [x] 린트 통과
- [x] 빌드 성공
```

### 3. 실패 시 조치

테스트 실패 시:
1. 실패 내용을 todo.md에 이슈 항목으로 추가
2. 수정 후 재실행
3. 통과 시 체크 상태 업데이트
