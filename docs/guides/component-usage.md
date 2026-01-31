# 컴포넌트 사용 가이드

AXIS Design System 컴포넌트의 기본 사용법을 설명합니다.

---

## 1. Import 방법

### 배럴 Import

하나의 진입점에서 여러 컴포넌트를 한 번에 가져옵니다.

```tsx
import { Button, Card, CardHeader, CardContent, Input } from "@axis-ds/ui-react";
```

간단하고 직관적이지만, 번들러가 트리쉐이킹을 완벽히 처리하지 못하는 환경에서는 번들 크기가 커질 수 있습니다.

### 서브패스 Import

개별 컴포넌트 경로에서 직접 가져옵니다. 트리쉐이킹 최적화에 유리합니다.

```tsx
import { Button } from "@axis-ds/ui-react/button";
import { Card, CardHeader, CardContent } from "@axis-ds/ui-react/card";
import { Input } from "@axis-ds/ui-react/input";
```

번들 크기에 민감한 프로덕션 환경에서 권장합니다. `@axis-ds/ui-react`는 `package.json`의 `exports` 필드를 통해 모든 컴포넌트의 서브패스 진입점을 제공합니다.

---

## 2. asChild 패턴

### 개념

`asChild`는 Radix UI의 `Slot` 패턴을 기반으로 합니다. 컴포넌트의 스타일과 동작을 자식 요소에 위임하여, 렌더링되는 HTML 태그를 자유롭게 변경할 수 있습니다.

### 기본 사용법

```tsx
import { Button } from "@axis-ds/ui-react";

// 일반 버튼 - <button> 태그로 렌더링
<Button variant="primary">클릭</Button>

// asChild 사용 - <a> 태그로 렌더링되지만 버튼 스타일 적용
<Button asChild>
  <a href="/dashboard">대시보드로 이동</a>
</Button>
```

`asChild`를 사용하면 `Button`은 자체 `<button>` 태그를 렌더링하지 않고, 자식 요소인 `<a>`에 버튼의 스타일과 props를 병합합니다.

### Next.js Link와 함께 사용

```tsx
import Link from "next/link";
import { Button } from "@axis-ds/ui-react";

<Button asChild variant="outline" size="sm">
  <Link href="/settings">설정</Link>
</Button>
```

### 주의사항

- `asChild` 사용 시 자식 요소는 반드시 **하나**여야 합니다.
- 자식 요소는 `ref`와 props 전달을 지원하는 React 요소여야 합니다.

---

## 3. className 커스터마이징

### Tailwind CSS 클래스 추가

모든 컴포넌트는 `className` prop을 통해 Tailwind CSS 클래스를 추가로 적용할 수 있습니다.

```tsx
import { Button } from "@axis-ds/ui-react";

<Button className="mt-4 w-full">확인</Button>
<Button variant="outline" className="rounded-full px-8">둥근 버튼</Button>
```

### cn() 유틸리티

`cn()`은 `clsx`와 `tailwind-merge`를 결합한 클래스 병합 유틸리티입니다. 조건부 클래스 적용과 Tailwind 클래스 충돌 해결을 동시에 처리합니다.

```tsx
import { cn } from "@axis-ds/ui-react";

// 조건부 클래스 적용
<div className={cn(
  "rounded-lg border p-4",
  isActive && "border-blue-500 bg-blue-50",
  isDisabled && "opacity-50 cursor-not-allowed"
)} />

// Tailwind 클래스 충돌 해결
cn("px-4 py-2", "px-6")  // 결과: "py-2 px-6" (px-4가 px-6으로 대체됨)
```

커스텀 컴포넌트를 만들 때 기본 스타일과 외부 className을 안전하게 병합하는 데 활용합니다.

```tsx
import { cn } from "@axis-ds/ui-react";

interface StatusBadgeProps {
  status: "success" | "error";
  className?: string;
}

function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
      status === "success" && "bg-green-100 text-green-700",
      status === "error" && "bg-red-100 text-red-700",
      className
    )}>
      {status}
    </span>
  );
}
```

---

## 4. CSS 변수 (디자인 토큰) 활용

### 개요

`@axis-ds/tokens` 패키지는 색상, 타이포그래피, 간격, 반지름 등의 디자인 토큰을 `--axis-*` 접두사의 CSS 변수로 제공합니다. `:root`에 선언되어 프로젝트 전체에서 일관된 스타일을 유지할 수 있습니다.

### 주요 토큰 카테고리

| 카테고리 | CSS 변수 예시 | 설명 |
|----------|---------------|------|
| 색상 | `--axis-color-blue-500` | 색상 팔레트 |
| 반지름 | `--axis-radius-md` | 모서리 둥글기 |
| 폰트 크기 | `--axis-font-size-base` | 타이포그래피 |
| 폰트 패밀리 | `--axis-font-family-sans` | 서체 |

### CSS에서 직접 사용

```css
.custom-card {
  background-color: var(--axis-color-gray-50);
  border-radius: var(--axis-radius-lg);
  font-size: var(--axis-font-size-sm);
}
```

### Tailwind CSS와 함께 사용

Tailwind의 임의 값(arbitrary values) 문법으로 CSS 변수를 참조합니다.

```tsx
<div className="bg-[var(--axis-color-blue-50)] rounded-[var(--axis-radius-lg)]">
  토큰 기반 스타일링
</div>

<p className="text-[var(--axis-color-gray-700)] text-[var(--axis-font-size-sm)]">
  디자인 토큰을 활용한 텍스트
</p>
```

### 테마 커스터마이징

CSS 변수를 오버라이드하여 프로젝트에 맞는 테마를 적용할 수 있습니다.

```css
:root {
  --axis-color-blue-500: #4F46E5; /* 브랜드 색상으로 변경 */
  --axis-radius-md: 0.5rem;       /* 기본 반지름 조정 */
}
```

---

## 5. 접근성 기본 가이드

### WAI-ARIA 패턴 준수

AXIS Design System의 모든 컴포넌트는 WAI-ARIA 디자인 패턴을 준수합니다. Radix UI 프리미티브를 기반으로 하여 적절한 ARIA 역할(role), 상태(state), 속성(property)이 자동으로 적용됩니다.

### 키보드 네비게이션

모든 인터랙티브 컴포넌트는 키보드만으로 조작할 수 있습니다.

| 키 | 동작 |
|----|------|
| `Tab` | 포커스 가능한 요소 간 이동 |
| `Enter` / `Space` | 버튼 클릭, 체크박스 토글 |
| `Escape` | Dialog, Popover 등 오버레이 닫기 |
| `Arrow Keys` | Select, RadioGroup, Tabs 등에서 항목 이동 |

### aria-label 활용

텍스트가 없는 아이콘 버튼이나 추가 맥락이 필요한 요소에 `aria-label`을 지정합니다.

```tsx
import { Button } from "@axis-ds/ui-react";
import { Search, X } from "lucide-react";

// 아이콘 버튼에 aria-label 필수
<Button variant="ghost" size="icon" aria-label="검색">
  <Search className="h-4 w-4" />
</Button>

<Button variant="ghost" size="icon" aria-label="닫기">
  <X className="h-4 w-4" />
</Button>
```

### aria-describedby 활용

폼 요소에 추가 설명이나 에러 메시지를 연결합니다.

```tsx
import { Input, Label } from "@axis-ds/ui-react";

<div>
  <Label htmlFor="email">이메일</Label>
  <Input
    id="email"
    type="email"
    aria-describedby="email-help"
    placeholder="name@example.com"
  />
  <p id="email-help" className="mt-1 text-sm text-gray-500">
    업무용 이메일을 입력하세요.
  </p>
</div>
```

### 에러 상태 전달

```tsx
import { Input, Label } from "@axis-ds/ui-react";

<div>
  <Label htmlFor="password">비밀번호</Label>
  <Input
    id="password"
    type="password"
    aria-invalid={hasError}
    aria-describedby={hasError ? "password-error" : undefined}
  />
  {hasError && (
    <p id="password-error" role="alert" className="mt-1 text-sm text-red-600">
      비밀번호는 8자 이상이어야 합니다.
    </p>
  )}
</div>
```

### 접근성 체크리스트

- 모든 아이콘 버튼에 `aria-label` 지정
- 폼 요소에 `<Label>` 연결 (`htmlFor` + `id`)
- 에러 메시지에 `role="alert"` 및 `aria-describedby` 연결
- 색상만으로 정보를 전달하지 않기 (아이콘, 텍스트 병행)
- 충분한 색상 대비 유지 (WCAG 2.1 AA 기준)
