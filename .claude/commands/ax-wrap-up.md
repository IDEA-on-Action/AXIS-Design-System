# 작업 정리 스킬 (ax-wrap-up)

현재 작업 세션을 정리하고 커밋합니다.

## 실행 조건
- 작업이 완료된 상태
- 테스트/빌드 통과 필요

---

## 단계별 실행

### Phase 1: SSDD 문서 점검

1. **package.json 버전 확인**
   - 루트 package.json의 version 필드 읽기

2. **CLAUDE.md 버전 동기화 확인**
   - CLAUDE.md의 "현재 버전" 확인
   - package.json 버전과 일치하는지 검증

3. **project-todo.md 상태 점검**
   - 완료된 항목 확인
   - 진행중인 항목 목록

4. **changelog.md 최신화 확인**
   - 최근 변경사항이 기록되어 있는지 확인

### Phase 2: 코드 품질 검증

순차적으로 실행하고 결과 확인:

```bash
pnpm type-check
pnpm lint
pnpm build
```

- 모든 검증이 통과해야 다음 단계 진행
- 오류 발생 시 수정 필요 항목 리포트

### Phase 3: Git Commit

1. **변경 파일 확인**
   ```bash
   git status
   git diff --staged
   git diff
   ```

2. **커밋 메시지 생성**
   - 변경 파일 분석
   - 커밋 메시지 규칙 준수: `type(scope): 설명`
   - 타입: feat, fix, docs, style, refactor, test, chore

3. **커밋 실행**
   ```bash
   git add <변경된 파일들>
   git commit -m "커밋 메시지"
   ```

### Phase 4: GitHub Project 동기화

1. **GitHub Issues 조회**
   ```bash
   gh issue list --state all --limit 50
   ```

2. **project-todo.md와 비교**
   - GitHub에만 있는 이슈
   - project-todo.md에만 있는 항목
   - 상태 불일치 (완료 vs 열림)

3. **불일치 항목 리포트 생성**

---

## 출력 형식

### 리포트 예시

```
## ax-wrap-up 실행 결과

**실행 시간**: 2026-01-23 15:30 KST

### 문서 점검 ✅
- package.json: v0.7.0
- CLAUDE.md: v0.7.0 ✅ (동기화됨)
- project-todo.md: 3개 완료, 5개 진행중
- changelog.md: 최신 ✅

### 코드 품질 ✅
- type-check: ✅ 통과
- lint: ✅ 통과
- build: ✅ 성공

### Git Commit ✅
- 변경 파일: 4개
- 커밋: abc1234 "feat(web): 컴포넌트 상세 페이지 개선"

### GitHub 동기화 ⚠️
- 불일치 항목: 2개
  - #15: GitHub 열림 / TODO 완료
  - "Library 페이지 구현": TODO에만 존재
```

---

## 주의사항

- 빌드 실패 시 커밋하지 않음
- 민감한 파일(.env 등)은 커밋에서 제외
- 커밋 메시지는 한글로 작성 (CLAUDE.md 규칙)
