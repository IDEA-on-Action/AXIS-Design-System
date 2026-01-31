---
name: accessibility-plan
category: planning
description: WCAG 기반 접근성 개선 계획서 템플릿
variables:
  - name: "{{TARGET_COMPONENT}}"
    description: 접근성 개선 대상 컴포넌트
    example: Button
  - name: "{{WCAG_LEVEL}}"
    description: 목표 WCAG 준수 레벨 (A, AA, AAA)
    example: AA
  - name: "{{SCOPE}}"
    description: 개선 범위 (component, page, application)
    example: component
---

# 접근성 개선 계획서

## 목표

{{TARGET_COMPONENT}}의 WCAG {{WCAG_LEVEL}} 접근성 기준을 충족하도록 개선합니다.

## 입력 정보

| 변수 | 설명 | 필수 | 예시 |
|------|------|------|------|
| `{{TARGET_COMPONENT}}` | 개선 대상 | Y | Button |
| `{{WCAG_LEVEL}}` | 목표 WCAG 레벨 | Y | AA |
| `{{SCOPE}}` | 개선 범위 | N | component |

## 수행 단계

### 단계 1: 현재 상태 분석

1. 자동화 도구로 접근성 검사
   - axe DevTools
   - WAVE
   - Lighthouse Accessibility
2. 수동 테스트 수행
   - 키보드 네비게이션
   - 스크린 리더 테스트
3. 현재 이슈 목록 작성

### 단계 2: WCAG 기준 매핑

접근성 개선 항목을 WCAG 원칙에 매핑:

| 원칙 | 설명 | 해당 기준 |
|------|------|-----------|
| 인식의 용이성 | 정보와 UI를 인식할 수 있어야 함 | 1.1, 1.3, 1.4 |
| 운용의 용이성 | UI와 내비게이션이 운용 가능해야 함 | 2.1, 2.4, 2.5 |
| 이해의 용이성 | 정보와 UI가 이해 가능해야 함 | 3.1, 3.2, 3.3 |
| 견고성 | 다양한 기술로 해석 가능해야 함 | 4.1 |

### 단계 3: 개선 계획 수립

1. 이슈별 우선순위 결정
2. 수정 방안 도출
3. 영향 범위 분석
4. 구현 순서 결정

### 단계 4: 구현 및 검증

1. 코드 수정
2. 자동화 테스트
3. 수동 테스트
4. 스크린 리더 테스트

## 출력 형식

```markdown
# {{TARGET_COMPONENT}} 접근성 개선 계획

## 개요

- **대상**: {{TARGET_COMPONENT}}
- **목표 레벨**: WCAG {{WCAG_LEVEL}}
- **범위**: {{SCOPE}}
- **상태**: 계획 수립

## 현재 상태 분석

### 자동화 검사 결과
- 심각: N개
- 경고: N개
- 정보: N개

### 수동 테스트 결과
- 키보드 네비게이션: [통과/실패]
- 스크린 리더: [통과/실패]
- 색상 대비: [통과/실패]

## 개선 항목

### Phase 1: 필수 개선 (WCAG A)

| # | WCAG | 항목 | 현재 | 목표 | 상태 |
|---|------|------|------|------|------|
| 1 | 1.1.1 | 대체 텍스트 | 없음 | aria-label 추가 | ⬜ |
| 2 | 2.1.1 | 키보드 접근 | 일부 | 전체 지원 | ⬜ |

### Phase 2: 권장 개선 (WCAG AA)

| # | WCAG | 항목 | 현재 | 목표 | 상태 |
|---|------|------|------|------|------|
| 1 | 1.4.3 | 색상 대비 | 3.5:1 | 4.5:1 이상 | ⬜ |
| 2 | 2.4.7 | 포커스 표시 | 없음 | 명확한 표시 | ⬜ |

## 수정 대상 파일

| 파일 | 변경 내용 |
|------|-----------|
| component.tsx | ARIA 속성 추가 |
| component.css | 포커스 스타일 |

## 구현 상세

### 1. ARIA 속성 추가

```tsx
// Before
<button onClick={handleClick}>
  {icon}
</button>

// After
<button
  onClick={handleClick}
  aria-label="{{ACCESSIBLE_NAME}}"
  aria-pressed={isActive}
>
  {icon}
</button>
```

### 2. 키보드 네비게이션

```tsx
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    handleClick()
  }
}
```

### 3. 포커스 스타일

```css
:focus-visible {
  outline: 2px solid var(--focus-color);
  outline-offset: 2px;
}
```

## 검증 계획

### 자동화 테스트
- [ ] axe-core 테스트 통과
- [ ] Lighthouse 접근성 90점 이상

### 수동 테스트
- [ ] Tab 키로 모든 요소 접근 가능
- [ ] Enter/Space로 활성화 가능
- [ ] 포커스 상태 시각적으로 구분 가능

### 스크린 리더 테스트
- [ ] NVDA/VoiceOver로 컴포넌트 인식
- [ ] 역할/상태/값 올바르게 전달
```

## 검증 방법

- [ ] 모든 WCAG {{WCAG_LEVEL}} 기준이 검토되었는가?
- [ ] 각 이슈에 대한 해결 방안이 명확한가?
- [ ] 자동화 및 수동 테스트 계획이 있는가?
- [ ] 스크린 리더 테스트가 포함되었는가?

## WCAG 주요 기준 참조

### Level A (필수)
- 1.1.1 비텍스트 콘텐츠
- 2.1.1 키보드
- 4.1.2 이름, 역할, 값

### Level AA (권장)
- 1.4.3 명암비 (최소)
- 2.4.7 식별 가능한 포커스
- 1.4.11 비텍스트 명암비
