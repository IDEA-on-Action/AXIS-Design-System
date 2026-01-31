# Reusable Prompt Library

> 프로젝트 독립적인 범용 프롬프트 라이브러리

## 개요

이 라이브러리는 다양한 프로젝트에서 재사용할 수 있는 표준화된 프롬프트 템플릿을 제공합니다.

## 카테고리

| 카테고리 | 설명 | 프롬프트 |
|----------|------|----------|
| `_templates/` | 메타 템플릿 | 새 프롬프트 작성용 표준 템플릿 |
| `planning/` | 계획 수립 | 기능 계획, 리팩토링, 접근성 개선 |
| `quality/` | 품질 관리 | 코드 리뷰, 보안 점검, 성능 점검 |
| `documentation/` | 문서화 | 컴포넌트 문서, API 문서, 변경 로그 |
| `workflow/` | 워크플로우 | 세션 정리, PR 설명, 커밋 메시지 |

## 사용법

### 1. 프롬프트 선택

필요한 작업에 맞는 프롬프트를 선택합니다:

```
.claude/prompts/planning/feature-plan.md    # 새 기능 구현 계획
.claude/prompts/quality/code-review.md      # 코드 리뷰 수행
.claude/prompts/workflow/session-wrap-up.md # 세션 정리
```

### 2. 변수 치환

프롬프트 내 `{{변수명}}` 형식의 플레이스홀더를 실제 값으로 대체합니다:

```markdown
# Before
{{COMPONENT_NAME}} 컴포넌트의 구현을 시작합니다.

# After
Button 컴포넌트의 구현을 시작합니다.
```

### 3. 컨텍스트 추가

필요시 프로젝트별 컨텍스트를 추가합니다:

```markdown
## 프로젝트 컨텍스트
- 프레임워크: Next.js 15
- 스타일링: Tailwind CSS 4
- 테스트: Vitest
```

## 변수 명명 규칙

| 형식 | 용도 | 예시 |
|------|------|------|
| `{{COMPONENT_NAME}}` | 컴포넌트명 | Button, Modal |
| `{{FILE_PATH}}` | 파일 경로 | src/components/button.tsx |
| `{{FEATURE_NAME}}` | 기능명 | 다크모드 지원 |
| `{{TARGET_VERSION}}` | 대상 버전 | 1.0.0 |

## 새 프롬프트 추가

1. `_templates/prompt-template.md`를 복사
2. 적절한 카테고리 폴더에 배치
3. YAML 프론트매터 작성
4. 섹션별 내용 작성
5. 변수 문서화

## 프롬프트 목록

### Planning
- `feature-plan.md` - 기능 구현 계획서
- `accessibility-plan.md` - 접근성 개선 계획서

### Quality
- `code-review.md` - 코드 리뷰 체크리스트

### Workflow
- `session-wrap-up.md` - 세션 정리 템플릿

## 자동 프롬프트 정제

### 개요

세션 중 사용된 프롬프트를 자동으로 판별하고 정제하여 재사용 가능한 리소스로 저장할 수 있습니다.

### 사용법

```bash
# 프롬프트 후보 탐지
/ax-prompt detect

# 텍스트 분석
/ax-prompt analyze "분석할 텍스트..."

# 정제 및 저장
/ax-prompt save --name=my-prompt --category=planning
```

### 판별 기준

| 항목 | 배점 | 설명 |
|------|------|------|
| 반복성 | 25점 | 구조화된 패턴 존재 |
| 범용성 | 30점 | 프로젝트 종속성 낮음 |
| 독립성 | 25점 | 컨텍스트 없이 동작 가능 |
| 명확성 | 20점 | 목표/절차 명확 |

**후보 기준**: 70점 이상

### 정제 과정

1. **탐지**: 재사용 패턴 식별
2. **분석**: 구조 분석 및 점수화
3. **정제**: 프로젝트 종속성 → 변수화
4. **검증**: 품질 검사 및 중복 확인
5. **저장**: 표준 형식으로 저장

### 세션 종료 시 자동 감지

`/ax-wi wrap-up` 실행 시 자동으로 프롬프트 후보를 탐지하고 저장을 제안합니다.

---

## 기여 가이드

1. 프로젝트 특정 경로/이름 사용 금지
2. 모든 동적 값은 플레이스홀더로 표기
3. 명확한 변수 설명 필수
4. 예시 포함 권장
