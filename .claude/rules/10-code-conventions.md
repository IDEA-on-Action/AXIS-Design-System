# 코드 컨벤션 (Code Conventions)

## Import 규칙

- **Import Alias**: `@/` → `src/`
- **정렬 순서**: 외부 패키지 → 내부 모듈 → 상대 경로

## 네이밍 규칙

| 대상 | 규칙 | 예시 |
|------|------|------|
| 컴포넌트 | PascalCase | `Button`, `AgentAvatar` |
| 함수/훅 | camelCase | `useTheme`, `handleClick` |
| 파일명 | kebab-case | `button.tsx`, `agent-avatar.tsx` |
| 상수 | SCREAMING_SNAKE_CASE | `DEFAULT_THEME`, `API_URL` |
| 타입/인터페이스 | PascalCase | `ButtonProps`, `ThemeConfig` |

## 스타일링

- **CSS Framework**: Tailwind CSS 유틸리티 클래스 사용
- **커스텀 스타일**: CSS-in-JS 대신 Tailwind 확장 권장
- **반응형**: mobile-first 접근법

## 컴포넌트 구조

```tsx
// 1. imports
import { ... } from 'react'

// 2. types
interface ComponentProps { ... }

// 3. component
export function Component({ ... }: ComponentProps) {
  // hooks
  // handlers
  // render
}
```

## 버전 관리

- **형식**: Major.Minor.Patch (Semantic Versioning)
- Major: Breaking Changes
- Minor: 새로운 기능 추가
- Patch: 버그 수정
