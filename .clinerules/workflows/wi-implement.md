# WI: 구현 (Implement)

## Usage

```
/wi-implement.md WI-0001 button
```

## Steps

1. WI의 prd.md / todo.md / (있으면) plan.md를 읽는다.

2. plan.md가 없으면 생성한다:
   - 기술 접근 방식
   - 변경 대상 파일/모듈
   - 롤아웃 계획
   - 리스크 및 완화 방안

3. TODO를 우선순위대로 구현한다.

4. 구현 중간중간:
   - 타입 체크/린트 실행 (AGENTS.md 명령)
   - TODO 체크 상태 업데이트

5. 구현이 끝나면:
   - testplan.md 업데이트 제안
   - release-notes.md 초안 항목 미리 기록

6. 마지막에 다음 추천 커맨드:
   - `/wi-test.md <WI_ID> <slug>`

---

## 현행화

구현 진행 중/완료 시 수행:

### 1. WI todo.md 동기화

구현 완료된 항목을 체크:

```markdown
- [x] 컴포넌트 기본 구조 생성
- [x] 스타일링 적용
- [ ] 테스트 작성 (다음 단계)
```

### 2. project-todo.md 진행률 갱신

Phase 진행률을 재계산하여 업데이트:

```markdown
### Phase 1 진행률: 60% (3/5)
```

### 3. 커밋 시 WI 참조

구현 커밋에 WI ID 포함:

```
feat(button): 기본 버튼 컴포넌트 구현

Refs: WI-0001
```
