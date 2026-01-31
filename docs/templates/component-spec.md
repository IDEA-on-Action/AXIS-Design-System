# 컴포넌트 스펙 — <컴포넌트명>

> 버전: 0.1.0 | 최종 수정: YYYY-MM-DD

---

## 1. 개요

간단한 설명 (1-2문장)

---

## 2. 설치

```bash
npx @axis-ds/cli add <component-name>
```

---

## 3. API

### 3.1 Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `prop1` | `string` | - | (필수) 설명 |
| `prop2` | `number` | `0` | 설명 |

### 3.2 Slots / Children

- `children`: 기본 컨텐츠

### 3.3 Events

| Event | Payload | Description |
|-------|---------|-------------|
| `onClick` | `MouseEvent` | 클릭 시 |

---

## 4. 사용 예시

### 4.1 기본 사용

```tsx
import { ComponentName } from '@axis-ds/ui-react'

export function Example() {
  return <ComponentName>내용</ComponentName>
}
```

### 4.2 변형 (Variants)

```tsx
<ComponentName variant="primary">Primary</ComponentName>
<ComponentName variant="secondary">Secondary</ComponentName>
```

### 4.3 크기 (Sizes)

```tsx
<ComponentName size="sm">Small</ComponentName>
<ComponentName size="md">Medium</ComponentName>
<ComponentName size="lg">Large</ComponentName>
```

---

## 5. 스타일링

### 5.1 CSS 변수

```css
--axis-component-bg: var(--axis-color-bg);
--axis-component-text: var(--axis-color-text);
```

### 5.2 Tailwind 클래스

기본 스타일은 Tailwind 유틸리티 클래스로 구성됩니다.

---

## 6. 접근성 (Accessibility)

- 키보드 네비게이션: Tab, Enter, Space
- ARIA 속성:
  - `role`: 해당 시
  - `aria-label`: 해당 시
- 스크린 리더 지원: ✅

---

## 7. 디자인 토큰

| 토큰 | 용도 |
|------|------|
| `color.primary` | 주요 색상 |
| `spacing.md` | 내부 패딩 |

---

## 8. 관련 컴포넌트

- `RelatedComponent1`: 설명
- `RelatedComponent2`: 설명

---

## 9. 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|-----------|
| 0.1.0 | YYYY-MM-DD | 초기 버전 |
