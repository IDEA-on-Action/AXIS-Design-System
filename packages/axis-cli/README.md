# @axis-ds/cli

AXIS Design System의 CLI 도구입니다. shadcn 호환 방식으로 컴포넌트를 프로젝트에 설치합니다.

## 설치

```bash
npm install -g @axis-ds/cli
# or
npx @axis-ds/cli
```

## 사용법

```bash
# 프로젝트 초기화
axis init

# 컴포넌트 추가
axis add button

# 설치된 컴포넌트 목록
axis list
```

## 브랜드 테마 (`axis theme`)

프로젝트에 설치된 `@axis-ds/tokens`(1.3.0 이상)의 브랜드를 조회하고 적용합니다. 세 명령 모두 `-d, --dir <path>` 로 대상 디렉터리를 받습니다(기본: 현재 디렉터리).

```bash
# 설치된 브랜드 목록 (이름 · 설명 · 테마)
axis theme list

# 브랜드 상세: import 경로 · Provider 예시 · 주요 토큰 · 보정 내역(a11y 메타)
axis theme info ontology

# 브랜드 적용: 전역 CSS import · package.json 의존성 · axis.config.json 의 brand
axis theme add ontology
```

- `axis theme add` 는 `axis.config.json` 의 `globalCss` → `app/globals.css` → `src/app/globals.css` → 루트 `globals.css` 순으로 찾은 파일에 `@import "@axis-ds/tokens/css/brands/<brand>";` 를 한 줄 넣습니다. 여러 번 실행해도 같은 줄을 다시 넣지 않습니다.
- `package.json` 에 `@axis-ds/tokens` 가 없으면 `dependencies` 에 `^1.3.0` 을 더하고 설치 명령만 안내합니다. 설치는 실행하지 않습니다.
- 브랜드 CSS 는 `[data-brand="<brand>"]` 선택자로 적용되므로 `ThemeProvider defaultBrand` 나 `<html data-brand>` 가 있어야 화면이 바뀝니다. 코드는 고치지 않고 예시만 출력합니다.
- `@axis-ds/tokens` 가 없거나 1.3.0 미만이면 목록 대신 설치 · 업그레이드 안내를 내고 종료 코드 1 로 끝납니다.
- `axis check` 는 `axis.config.json` 의 `brand` 와 CSS 의 브랜드 import 가 맞는지도 봅니다.

## 프로젝트 검증 (`axis check`)

- Tailwind 구성 항목: Tailwind 4 이상(설치본, 없으면 `package.json` 선언으로 판정)은 설정 파일 대신 전역 CSS(`globals.css` · `app/globals.css` · `src/app/globals.css` · `src/globals.css` · `styles/globals.css` 순)의 `@import "tailwindcss"` 를 봅니다. Tailwind 3 이하는 `tailwind.config.ts` · `.js` · `.mjs` · `.cjs` 를 찾습니다.
  - 이 항목은 Tailwind 진입 import 만 봅니다. `@axis-ds/tokens` 의 Tailwind 연동은 Tailwind 3 preset(`@axis-ds/tokens/tailwind`)뿐이라, Tailwind 4 에서 PASS 여도 `bg-primary` 같은 AXIS 색 클래스가 만들어진다는 뜻은 아닙니다.
- FAIL 이 하나라도 있으면 종료 코드 1 로 끝납니다. WARN 만 있으면 0 입니다(1.3.0 부터, 이전에는 결과와 관계없이 0).
- MCP `axis.check_project` 도 같은 항목 · 문구를 냅니다.

## 문서

자세한 사용법은 [AXIS Design System 문서](https://axis.minu.best)를 참고하세요.

## 라이선스

MIT
