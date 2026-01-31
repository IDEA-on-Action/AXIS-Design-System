# AXIS Theme Only 템플릿

AXIS 디자인 토큰과 테마 시스템만 적용된 최소 구성 스타터 템플릿입니다.

## 포함 기능

- AXIS 디자인 토큰 (CSS 변수)
- 다크모드 토글
- Tailwind CSS 설정
- TypeScript 지원

## 설치

```bash
# 프로젝트 생성
npx create-next-app@latest my-app

# 템플릿 파일 복사 후 의존성 설치
cd my-app
pnpm install
```

## 사용법

```bash
pnpm dev
```

`http://localhost:3000`에서 확인할 수 있습니다.

## 구조

```
├── layout.tsx           # 루트 레이아웃
├── page.tsx             # 메인 페이지
├── theme-toggle.tsx     # 다크모드 토글 컴포넌트
├── globals.css          # 글로벌 스타일 + 디자인 토큰
├── tailwind.config.ts   # Tailwind 설정
├── tsconfig.json        # TypeScript 설정
└── package.json         # 의존성
```
