# WI-0030: apps/web Tailwind content 경로에 src/lib 추가 PRD

> 작성일: 2026-10-19 | 버전: v1.0 (2026-10-19) | 작성자: Sinclair Seo | WI: WI-0030 | GitHub: #95 | 상태: Approved
> 선행: 없음. 기준 `main` e690905
> 관련: WI-0025 M3 · M4 브랜치가 같은 `content` 배열에 registry · 패키지 경로를 더합니다(plan.md 5.1 U21 에서 별건으로 분리)

---

## 1. 개요

### 1.1 배경
- `apps/web/tailwind.config.ts` 의 `content` 에 `./src/lib` 가 없어, 그 안의 클래스 문자열은 CSS 가 생성되지 않을 수 있습니다(Issue #95).
- `src/lib` 에는 `utils.ts` · `shiki.ts` · `library-types.ts` · `template-types.ts` 4개 파일이 있습니다.

### 1.2 원인 (실측, e690905)
| # | 내용 | 실측 |
|---|---|---|
| C1 | `library-types.ts` 의 출처 색상 맵이 클래스 문자열 4개(`bg-zinc-500` · `bg-blue-500` · `bg-purple-500` · `bg-green-500`)를 갖고, 라이브러리 화면 3곳이 `sourceInfo.color` 로 그 값을 씁니다 | 나머지 3파일에는 클래스 문자열이 없습니다 |
| C2 | 그중 `bg-zinc-500` 은 `src/lib` 에만 있어 산출 CSS 에서 빠집니다. 나머지 3개는 `src/app` · `src/components` 에도 있어 이미 생성됩니다 | 수정 전 빌드 산출 CSS 에서 `.bg-zinc-500{` 0건, 양성 대조군 `.bg-blue-500{` 1건 |

### 1.3 목표
1. `src/lib` 의 클래스 문자열이 산출 CSS 에 생성되게 합니다.
2. 기존 클래스와 a11y 결과를 바꾸지 않습니다.

### 1.4 범위
- 포함: `content` 배열에 `./src/lib/**/*.{js,ts,jsx,tsx,mdx}` 한 줄 추가(`src/app` 줄 바로 다음, 기존 줄은 그대로)
- 제외: `src/registry` 등 다른 디렉토리 경로(WI-0025 M3 · M4 범위), 패키지 배포

## 2. 수용 기준 (AC)

| # | 기준 | 판정 방법 |
|---|---|---|
| AC-1 | 수정 후 `src/lib` 전용 클래스가 산출 CSS 에 생성됩니다 | `pnpm turbo run build --filter=@ax/web... --force` 산출 `apps/web/out` CSS 에서 `.bg-zinc-500{` 유무 |
| AC-2 | 기존 클래스 회귀 0 | 수정 전후 고유 클래스 선택자 집합 비교에서 사라진 선택자 0 |
| AC-3 | type-check · lint · build · a11y spec 통과 수가 수정 전과 같습니다 | `pnpm --filter @ax/web type-check` · `lint`, a11y spec 수정 전후 통과 수 |
