---
name: prompt-template
category: _templates
description: 새 프롬프트 작성을 위한 표준 템플릿
variables:
  - name: "{{PROMPT_NAME}}"
    description: 프롬프트 이름
    example: feature-plan
  - name: "{{CATEGORY}}"
    description: 카테고리 (planning, quality, documentation, workflow)
    example: planning
---

# 프롬프트 작성 가이드

이 템플릿을 사용하여 새로운 재사용 가능한 프롬프트를 작성합니다.

## YAML 프론트매터

모든 프롬프트는 다음 형식의 프론트매터로 시작합니다:

```yaml
---
name: [프롬프트 고유 이름, kebab-case]
category: planning | quality | documentation | workflow
description: [한 줄 설명]
variables:
  - name: "{{VARIABLE_NAME}}"
    description: 변수 설명
    example: 예시 값
    required: true | false  # 선택사항, 기본값 true
---
```

## 표준 섹션 구조

### 1. 목표 (필수)

프롬프트가 달성하고자 하는 목표를 명확히 기술합니다.

```markdown
## 목표

[이 프롬프트의 목적과 달성하고자 하는 결과를 설명]
```

### 2. 입력 정보 (필수)

필요한 입력 정보와 변수를 나열합니다.

```markdown
## 입력 정보

| 변수 | 설명 | 필수 | 예시 |
|------|------|------|------|
| `{{VAR_1}}` | 설명 | Y | 예시 |
| `{{VAR_2}}` | 설명 | N | 예시 |
```

### 3. 수행 단계 (필수)

작업 수행 절차를 단계별로 기술합니다.

```markdown
## 수행 단계

### 단계 1: [단계명]

[상세 설명]

### 단계 2: [단계명]

[상세 설명]
```

### 4. 출력 형식 (권장)

예상 결과물의 형식을 템플릿으로 제공합니다.

```markdown
## 출력 형식

\`\`\`markdown
# {{TITLE}}

## 섹션 1
[내용]

## 섹션 2
[내용]
\`\`\`
```

### 5. 검증 방법 (권장)

결과물의 완성도를 검증하는 체크리스트입니다.

```markdown
## 검증 방법

- [ ] 검증 항목 1
- [ ] 검증 항목 2
- [ ] 검증 항목 3
```

### 6. 예시 (선택)

실제 사용 예시를 제공합니다.

```markdown
## 예시

### 입력
- COMPONENT_NAME: Button
- FEATURE: 다크모드 지원

### 출력
[예시 결과]
```

## 변수 명명 규칙

| 규칙 | 설명 | 올바른 예 | 잘못된 예 |
|------|------|-----------|-----------|
| SCREAMING_SNAKE_CASE | 변수명은 대문자+언더스코어 | `{{COMPONENT_NAME}}` | `{{componentName}}` |
| 명확한 이름 | 용도가 명확해야 함 | `{{TARGET_FILE_PATH}}` | `{{PATH}}` |
| 영문 사용 | 변수명은 영문 | `{{FILE_NAME}}` | `{{파일명}}` |

## 범용성 체크리스트

새 프롬프트 작성 시 아래 항목을 확인합니다:

- [ ] 프로젝트 특정 경로가 하드코딩되지 않았는가?
- [ ] 프로젝트 특정 기술 스택에 종속되지 않았는가?
- [ ] 모든 동적 값이 플레이스홀더로 표기되었는가?
- [ ] 변수 설명이 충분한가?
- [ ] 다른 프로젝트에서 바로 사용 가능한가?

## 카테고리별 특성

### planning

- 목표와 범위 정의 필수
- 단계별 작업 분류
- 우선순위 표기

### quality

- 체크리스트 형식 권장
- 심각도 레벨 정의
- 자동화 명령어 포함

### documentation

- 출력 형식 상세히 정의
- 예시 포함 필수
- 마크다운 형식 준수

### workflow

- 실행 절차 명확히 기술
- 옵션/인자 정의
- 사용 시점 명시
