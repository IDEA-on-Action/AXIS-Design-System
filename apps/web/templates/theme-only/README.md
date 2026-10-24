# AXIS Theme Only 템플릿

CSS 변수(HSL) 기반 테마와 다크모드 토글만 담은 최소 구성 Next.js 스타터 템플릿입니다.
아직 AXIS 토큰 패키지(`@axis-ds/tokens`)를 쓰지 않고 `app/globals.css` 의 자체 변수를 씁니다(AXIS 토큰 전환은 WI-0067).

## 포함 기능

- CSS 변수(HSL) 기반 자체 테마
- 다크모드 토글
- Tailwind CSS 3 설정(PostCSS 포함)
- TypeScript 지원

## 설치

빈 디렉터리에 만드는 것을 기준으로 합니다(기존 프로젝트에 `axis template apply` 하면 Tailwind major 나 `src/app` 구조가 다를 때 경고만 합니다).

```bash
npx @axis-ds/cli template init theme-only --dir my-app
cd my-app
npm install
```

## 사용법

```bash
npm run dev
```

`http://localhost:3000`에서 확인할 수 있습니다.

## 구조

```
├── app/
│   ├── layout.tsx       # 루트 레이아웃
│   ├── page.tsx         # 메인 페이지
│   ├── theme-toggle.tsx # 다크모드 토글 컴포넌트
│   └── globals.css      # 글로벌 스타일 + 테마 변수
├── tailwind.config.ts   # Tailwind 설정
├── postcss.config.mjs   # PostCSS 설정(tailwindcss · autoprefixer)
├── tsconfig.json        # TypeScript 설정
└── package.json         # 의존성
```
