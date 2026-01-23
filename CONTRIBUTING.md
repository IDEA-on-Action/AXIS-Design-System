# Contributing to AXIS Design System

AXIS Design System에 기여해 주셔서 감사합니다!

## 개발 환경 설정

### 필수 조건

- Node.js >= 20.0.0
- pnpm >= 9.0.0

### 설치

```bash
# 저장소 클론
git clone https://github.com/thoughtandaction/axis.git
cd axis

# 의존성 설치
pnpm install

# 모든 패키지 빌드
pnpm build
```

## 개발 워크플로

### 브랜치 전략

- `main`: 프로덕션 브랜치
- `develop`: 개발 브랜치
- `feature/*`: 기능 개발
- `fix/*`: 버그 수정

### 커밋 컨벤션

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type**:
- `feat`: 새로운 기능
- `fix`: 버그 수정
- `docs`: 문서 수정
- `style`: 코드 포맷팅
- `refactor`: 리팩토링
- `test`: 테스트 추가
- `chore`: 빌드, 설정 변경

**Scope**: `tokens`, `theme`, `ui-react`, `agentic-ui`, `cli`, `mcp`, `docs`

### Pull Request

1. `develop` 브랜치에서 feature 브랜치 생성
2. 변경 사항 커밋
3. 테스트 통과 확인 (`pnpm test`)
4. PR 생성 및 리뷰 요청

## 코드 스타일

### TypeScript

- 엄격한 타입 체크 사용
- `any` 타입 사용 금지
- 인터페이스에 JSDoc 주석 추가

### React 컴포넌트

- 함수형 컴포넌트 사용
- `forwardRef` 패턴 적용
- Props 인터페이스 명시적 정의

```typescript
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "ghost";
  size?: "sm" | "default" | "lg";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "default", size = "default", ...props }, ref) => {
    return <button ref={ref} {...props} />;
  }
);
Button.displayName = "Button";
```

### CSS/스타일링

- AXIS 토큰 변수 사용 (`--axis-*`)
- Tailwind CSS 유틸리티 클래스 사용
- 하드코딩된 색상값 금지

## 테스트

```bash
# 전체 테스트
pnpm test

# 특정 패키지 테스트
pnpm --filter @axis-ds/ui-react test

# 접근성 테스트
pnpm test:a11y
```

## 문서화

- 모든 컴포넌트에 Storybook 스토리 작성
- Props 문서화 (JSDoc)
- 사용 예제 포함

## 라이선스

기여하신 코드는 MIT 라이선스로 배포됩니다.
