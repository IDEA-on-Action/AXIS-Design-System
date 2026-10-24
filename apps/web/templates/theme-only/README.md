# AXIS Theme Only 템플릿

AXIS 토큰(`@axis-ds/tokens` 의 CSS 변수와 Tailwind preset)과 다크모드 토글만 담은 최소 구성 Next.js 스타터 템플릿입니다.
색 · 둥글기 · 글꼴은 `app/globals.css` 의 토큰 CSS import 와 `tailwind.config.ts` 의 `presets: [axisPreset]` 이 정하고, 템플릿이 따로 정의하는 색 변수는 없습니다(WI-0067).

## 포함 기능

- AXIS 토큰 기반 테마(`@axis-ds/tokens/css` · `@axis-ds/tokens/css/shadcn` · `@axis-ds/tokens/tailwind`)
- Pretendard 글꼴(`pretendard` 패키지, AXIS 문서 사이트와 같은 동적 서브셋)
- 다크모드 토글(`<html class="dark">`)
- ontology 브랜드 켜기 안내(아래 「ontology 브랜드 켜기」)
- Tailwind CSS 3 설정(PostCSS 포함)
- TypeScript 지원

## 설치

빈 디렉터리에 만드는 것을 기준으로 합니다(기존 프로젝트에 `axis template apply` 하면 Tailwind major 나 `src/app` 구조가 다를 때 경고만 합니다).

```bash
npx @axis-ds/cli template init theme-only --dir my-app
cd my-app
npm install
npx @axis-ds/cli check   # tailwind.config · globals.css 가 PASS 인지 확인
```

## 사용법

```bash
npm run dev
```

`http://localhost:3000`에서 확인할 수 있습니다.

## ontology 브랜드 켜기

1. `app/globals.css` 의 `/* @import "@axis-ds/tokens/css/brands/ontology"; */` 주석을 풉니다(또는 `npx @axis-ds/cli theme add ontology`).
2. `app/layout.tsx` 의 `<html>` 에 `data-brand="ontology"` 를 넣습니다.
3. 끄려면 `data-brand` 속성을 지웁니다. 런타임에 끄고 켜려면 `@axis-ds/theme`(1.7.0 이상)의 `ThemeProvider` 와 `setBrand` 를 씁니다.

자세한 절차와 `axis check` 로 확인하는 방법은 [테마 커스터마이징 가이드](https://github.com/IDEA-on-Action/AXIS-Design-System/blob/main/docs/guides/theme-customization.md) 「템플릿에서 ontology 켜기」에 있습니다.

## 구조

```
├── app/
│   ├── layout.tsx       # 루트 레이아웃(Pretendard · data-brand 자리)
│   ├── page.tsx         # 메인 페이지
│   ├── theme-toggle.tsx # 다크모드 토글 컴포넌트
│   └── globals.css      # AXIS 토큰 CSS import(+ 브랜드 import 주석)
├── tailwind.config.ts   # AXIS preset
├── postcss.config.mjs   # PostCSS 설정(tailwindcss · autoprefixer)
├── tsconfig.json        # TypeScript 설정
└── package.json         # 의존성
```
