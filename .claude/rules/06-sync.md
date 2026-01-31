# 현행화 규칙 (Synchronization Rules)

## 정의

작업 완료 후 프로젝트 상태를 문서에 반영하는 규칙입니다.

---

## 작업 완료 후 필수 현행화

모든 작업 완료 시 다음을 업데이트합니다:

### 1. project-todo.md 업데이트

| 상황 | 조치 |
|------|------|
| 작업 완료 | 상태를 🔄 → ✅ 로 변경 |
| 완료일 | 완료 날짜 기록 |
| Phase 진행률 | 재계산 후 갱신 |

### 2. WI 산출물 동기화

| 파일 | 동기화 항목 |
|------|-------------|
| todo.md | 완료 항목 체크 ([ ] → [x]) |
| testplan.md | 테스트 결과 기록 |
| release-notes.md | 변경사항 반영 |

### 3. 커밋 메시지 규칙

```
<type>(<scope>): <subject>

Refs: WI-NNNN
```

- WI 작업 시 반드시 `Refs: WI-NNNN` 포함
- 타입: feat, fix, docs, refactor, test, chore

---

## 현행화 트리거

다음 스킬/워크플로우 완료 시 현행화 단계를 실행합니다:

| 트리거 | 현행화 대상 |
|--------|-------------|
| ax-wi-start | project-todo.md (상태 🔄 확인) |
| ax-wi-end | WI todo.md, project-todo.md (진행률/완료) |
| ax-wrap-up | project-todo.md, WI todo.md |
| ax-release | project-todo.md, CHANGELOG.md |
| ax-build | WI todo.md (빌드 관련 항목) |
| wi-pipeline 완료 | project-todo.md, 전체 WI 산출물 |
| wi-release-notes 완료 | project-todo.md (완료 처리) |

---

## 검증 방법

현행화가 올바르게 수행되었는지 확인:

```bash
# project-todo.md와 WI 폴더 상태 비교
# 1. 완료된 WI의 todo.md 체크리스트 확인
# 2. project-todo.md의 상태와 일치 여부 확인
```

---

## 예외 사항

- 탐색/리서치 작업: 현행화 불필요
- 단순 질의응답: 현행화 불필요
- 실험적 작업 (미완료): 현행화 보류
