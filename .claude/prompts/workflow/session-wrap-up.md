---
name: session-wrap-up
category: workflow
description: 작업 세션 종료 시 변경사항 정리 및 요약
variables:
  - name: "{{SESSION_GOAL}}"
    description: 이번 세션의 목표
    example: Button 컴포넌트 접근성 개선
    required: false
  - name: "{{MODE}}"
    description: 출력 모드 (basic, commit, detailed)
    example: basic
    required: false
---

# 세션 정리 가이드

## 목표

작업 세션에서 수행한 작업을 정리하고 요약하여 진행 상황을 명확히 합니다.

## 입력 정보

| 변수 | 설명 | 필수 | 예시 |
|------|------|------|------|
| `{{SESSION_GOAL}}` | 세션 목표 | N | Button 접근성 개선 |
| `{{MODE}}` | 출력 모드 | N | basic |

## 수행 단계

### 단계 1: 변경사항 수집

Git 상태 및 변경사항을 확인합니다:

```bash
# 현재 상태
git status

# 변경 통계
git diff --stat

# 최근 커밋 (이번 세션)
git log --oneline -10
```

### 단계 2: 작업 분류

수행한 작업을 카테고리별로 분류합니다:

| 카테고리 | 설명 |
|----------|------|
| 기능 추가 | 새로운 기능 구현 |
| 버그 수정 | 오류 해결 |
| 리팩토링 | 코드 구조 개선 |
| 문서화 | 문서 작성/수정 |
| 테스트 | 테스트 추가/수정 |
| 설정 | 환경/설정 변경 |

### 단계 3: 요약 작성

변경사항을 구조화된 형식으로 요약합니다.

### 단계 4: 다음 단계 식별

미완료 작업과 권장 후속 조치를 정리합니다.

## 출력 형식

### 기본 모드 (basic)

```markdown
## 세션 요약

**목표**: {{SESSION_GOAL}}
**일시**: YYYY-MM-DD HH:MM (KST)

### 수행한 작업

1. [작업 1 설명]
2. [작업 2 설명]
3. [작업 3 설명]

### 변경된 파일

| 파일 | 변경 유형 | 설명 |
|------|-----------|------|
| path/to/file1.ts | 수정 | [변경 내용] |
| path/to/file2.ts | 생성 | [파일 목적] |
| path/to/file3.ts | 삭제 | [삭제 이유] |

### 커밋 내역

- `abc1234` feat: 새 기능 추가
- `def5678` fix: 버그 수정

### 미완료 작업

- [ ] [남은 작업 1]
- [ ] [남은 작업 2]

### 다음 단계 권장사항

1. [권장 작업 1]
2. [권장 작업 2]

### 주의사항

- [있다면 작성]

---
세션 종료: YYYY-MM-DD HH:MM KST
```

### 커밋 모드 (commit)

기본 모드 + 커밋 제안:

```markdown
### 커밋 제안

미커밋 변경사항이 있습니다:

**스테이지된 파일**:
- path/to/staged.ts

**스테이지되지 않은 파일**:
- path/to/unstaged.ts

**제안 커밋 메시지**:
```
feat({{SCOPE}}): {{SUMMARY}}

{{BODY}}

Co-Authored-By: Claude <noreply@anthropic.com>
```

커밋하시겠습니까? (Y/n)
```

### 상세 모드 (detailed)

기본 모드 + 상세 변경 내역:

```markdown
### 상세 변경 내역

#### path/to/file.ts

- **추가된 라인**: +XX
- **삭제된 라인**: -XX
- **주요 변경**:
  - 함수 A 리팩토링
  - 타입 B 추가
  - 에러 처리 개선

**변경 전후 비교**:
```diff
- const oldCode = ...
+ const newCode = ...
```
```

## 검증 방법

- [ ] 모든 변경 파일이 나열되었는가?
- [ ] 각 변경의 목적이 명확한가?
- [ ] 미완료 작업이 식별되었는가?
- [ ] 다음 단계가 구체적인가?

## 사용 시점

| 시점 | 설명 |
|------|------|
| 세션 종료 | 하루 작업 마무리 시 |
| 작업 전환 | 다른 작업으로 전환 전 |
| 진행 공유 | 팀원에게 상황 공유 필요 시 |
| 커밋 전 | 변경사항 리뷰 후 커밋 시 |

## 커밋 메시지 규칙

### 형식

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type

| Type | 설명 |
|------|------|
| feat | 새로운 기능 |
| fix | 버그 수정 |
| docs | 문서 변경 |
| style | 코드 포맷팅 |
| refactor | 리팩토링 |
| test | 테스트 추가/수정 |
| chore | 빌드/설정 변경 |

### 예시

```
feat(button): 다크모드 지원 추가

- ThemeProvider 연동
- 색상 토큰 적용
- 스토리북 예제 추가

Co-Authored-By: Claude <noreply@anthropic.com>
```
