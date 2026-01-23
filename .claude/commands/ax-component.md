# ax-component

새 컴포넌트를 스캐폴딩합니다.

## 사용법

```
/ax-component [타입] [컴포넌트명]
```

### 타입
- `ui` - @axis-ds/ui-react 컴포넌트 (기본값)
- `agentic` - @axis-ds/agentic-ui 컴포넌트

### 예시
```
/ax-component ui Button
/ax-component agentic ChatMessage
```

## UI 컴포넌트 구조 (ui)

`packages/axis-ui-react/src/[컴포넌트명]/` 폴더 생성:

### index.ts
```typescript
export { [컴포넌트명] } from './[컴포넌트명]'
export type { [컴포넌트명]Props } from './[컴포넌트명]'
```

### [컴포넌트명].tsx
```typescript
import * as React from 'react'
import { cn } from '../lib/utils'

export interface [컴포넌트명]Props extends React.HTMLAttributes<HTMLDivElement> {
  // props 정의
}

const [컴포넌트명] = React.forwardRef<HTMLDivElement, [컴포넌트명]Props>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('[기본 스타일]', className)}
        {...props}
      />
    )
  }
)
[컴포넌트명].displayName = '[컴포넌트명]'

export { [컴포넌트명] }
```

## Agentic 컴포넌트 구조 (agentic)

`packages/axis-agentic-ui/src/components/[컴포넌트명]/` 폴더 생성:

### index.ts
```typescript
export { [컴포넌트명] } from './[컴포넌트명]'
export type { [컴포넌트명]Props } from './[컴포넌트명]'
```

### [컴포넌트명].tsx
```typescript
import * as React from 'react'
import { cn } from '../../lib/utils'

export interface [컴포넌트명]Props {
  // AI/Agent 관련 props
}

export function [컴포넌트명]({ ...props }: [컴포넌트명]Props) {
  return (
    <div className={cn('[기본 스타일]')}>
      {/* 컴포넌트 내용 */}
    </div>
  )
}
```

## 생성 후 작업

1. **exports 추가**: 패키지 index.ts에 export 추가
2. **타입 체크**: `pnpm type-check` 실행
3. **스토리 작성** (선택): Storybook 스토리 파일 생성

## 체크리스트

- [ ] 컴포넌트 파일 생성
- [ ] index.ts export 추가
- [ ] 패키지 index.ts에 export 추가
- [ ] 타입 체크 통과
- [ ] 필요시 registry.json 업데이트

## 네이밍 규칙

- 컴포넌트명: PascalCase (예: Button, ChatMessage)
- 파일명: PascalCase 또는 kebab-case (프로젝트 규칙 따름)
- Props 인터페이스: [컴포넌트명]Props
