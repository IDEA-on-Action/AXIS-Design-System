# ax-wi-end

WI 작업 구간 종료 시 SSDD 산출물과 project-todo.md를 현행화합니다.

## 사용법

```
/ax-wi-end             # WI ID를 컨텍스트에서 추론
/ax-wi-end WI-0003     # WI ID 직접 지정
/ax-wi-end commit      # 현행화 후 커밋까지 진행
```

---

## 수행 작업

### 1. WI 식별 + 변경사항 수집

- 인자로 WI ID가 전달되면 사용
- 없으면 대화 컨텍스트 또는 git diff 경로에서 추론
- 변경사항 수집:

```bash
git status
git diff --stat
```

### 2. todo.md 현행화

1. `docs/workitems/WI-NNNN-slug/todo.md` 읽기
2. 이번 작업에서 완료된 항목 식별 (변경 파일, 대화 컨텍스트 기반)
3. 완료 항목: `[ ]` → `[x]` 갱신
4. Definition of Done 체크:

```markdown
- [x] 타입 체크 통과
- [x] 린트 통과
- [x] 빌드 성공
- [x] 관련 문서 업데이트
```

### 3. project-todo.md 동기화

1. 해당 WI의 todo.md 진행률 계산 (완료/전체)
2. Phase 진행률 재계산
3. 전체 완료 시:
   - 상태 🔄 → ✅ 변경
   - 완료일 기록 (YYYY-MM-DD)
4. 미완료 시:
   - 상태 🔄 유지
   - 진행률만 갱신

### 4. 커밋 메시지 제안

WI 참조를 포함한 커밋 메시지를 제안합니다:

```
<type>(<scope>): <subject>

- [변경 요약 1]
- [변경 요약 2]

Refs: WI-NNNN
```

`commit` 옵션 시 사용자 확인 후 커밋 실행.

### 5. 다음 단계 안내

1. 남은 TODO 항목 목록
2. 다음 SSDD Gate 필요 여부:
   - 구현 완료 → testplan.md 작성 안내
   - 테스트 완료 → release-notes.md 작성 안내
3. 관련 스킬 안내 (`/ax-build`, `/ax-release` 등)

---

## 출력 형식

```
## WI 작업 종료: WI-NNNN-slug

### 변경사항 요약
| 파일 | 변경 유형 | 설명 |
|------|-----------|------|
| path/to/file.ts | 수정 | [변경 내용] |
| path/to/new.ts | 생성 | [파일 목적] |

### todo.md 현행화
- 갱신 항목: N개 ([ ] → [x])
- 전체 진행률: M/T (XX%)

| 갱신된 항목 |
|-------------|
| [x] [완료된 Task 1] |
| [x] [완료된 Task 2] |

### project-todo.md 동기화
- WI 상태: 🔄 진행 중 / ✅ 완료
- Phase 진행률: XX% → YY%
- 완료일: [전체 완료 시 날짜]

### 커밋 메시지 제안
```
feat(scope): subject

- 변경 요약

Refs: WI-NNNN
```

### 다음 단계
- 남은 Task: K개
  - [ ] [남은 Task 1]
  - [ ] [남은 Task 2]
- 다음 Gate: [testplan / release-notes / 없음]
- 권장 스킬: [/ax-build, /ax-release 등]

---
작업 종료: [현재 시간 KST]
```

---

## 옵션

| 인자 | 설명 |
|------|------|
| (없음) | WI ID 컨텍스트에서 추론, 현행화만 수행 |
| `<WI-ID>` | WI ID 직접 지정 (예: `/ax-wi-end WI-0003`) |
| `commit` | 현행화 후 커밋 메시지 제안 + 사용자 확인 후 커밋 |

---

## ax-wrap-up과의 관계

- **ax-wrap-up**: 세션 전체 요약 (다수 WI 포함 가능)
- **ax-wi-end**: 특정 WI 산출물 현행화에 집중
- 세션 종료 시에는 `/ax-wi-end` → `/ax-wrap-up` 순서로 실행 권장

---

## 주의사항

- todo.md 갱신 전 현재 상태를 반드시 확인 (이미 체크된 항목 중복 방지)
- project-todo.md 상태 변경은 todo.md 전체 완료 시에만 ✅ 처리
- 커밋 실행은 반드시 사용자 확인 후 진행
