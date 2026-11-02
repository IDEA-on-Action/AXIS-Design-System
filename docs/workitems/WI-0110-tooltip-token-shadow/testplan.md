# WI-0110: 테스트 계획 · 결과

> PRD: [prd.md](./prd.md) | 작성일: 2026-11-02 | 상태: 측정 완료(2026-11-02)
> 환경: WSL2 Linux x64 · Tailwind 3.4.19(워크스페이스) · Tailwind 4.1.13(임시 디렉터리 설치) · vitest(패키지 설정)
> 표기: **측정**(이번에 실행해 얻은 값) · **계산** · **추정**(실행하지 않음) · **미측정**

## 1. 수용 기준별 결과

| AC | 내용 | 결과 |
|---|---|---|
| AC1 | TooltipContent 에 토큰 그림자 있음 · 고정 그림자 없음, HEAD 소스에서는 실패 | 통과(측정). HEAD 의 `tooltip/index.tsx` 를 잠시 넣고 돌리면 `TooltipContent (WI-0110)` 1건 실패(1 failed / 7) |
| AC2 | `className="shadow-none"` 이 토큰 그림자를 대체 | 통과(측정). HEAD 소스에서도 통과해 판별력은 없어요(회귀 방지용) |
| AC3 | 토큰을 `shadow-md` 로 바꾼 변이에서 렌더 단언 · 소스 검사가 실패 | 통과(측정). 렌더 단언과 소스 검사 2건 실패(2 failed / 7). 원복 뒤 sha256 이 변이 전과 같고 7 통과 |
| AC4 | 문서 페이지에서 연 툴팁의 브라우저 계산값이 브랜드 · 테마별 토큰 값과 같음 | 통과(측정, 5절) |
| AC5 | Tailwind 3 · 4 에서 컴포넌트 dist 만 스캔해도 클래스 생성 | 통과(측정, 2절) |
| AC6 | turbo build · type-check · lint · test `--force`, changeset · token-refs 검사 | 3절 |

## 2. Tailwind 3 · 4 클래스 생성

`packages/axis-ui-react/dist/<컴포넌트>` 한 디렉터리만 스캔하게 해서 그 파일만으로 클래스가 생기는지 봤어요(측정). dist 는 2026-11-02 13:18 빌드본이고 `dist/tooltip/index.js` · `index.mjs` 에 토큰 문자열이 각 1건 있어요(측정).

| 스캔 대상 | Tailwind 3.4.19(`content`) | Tailwind 4.1.13(`@import "tailwindcss" source(none)` + `@source`) |
|---|---|---|
| `dist/tooltip` | 토큰 규칙 1 · 고정 0 | 토큰 1 · 고정 0 |
| `dist/switch`(양성 대조) | 토큰 0 · 고정 1 | 토큰 0 · 고정 1 |

## 3. 품질 게이트

| 명령 | 결과 |
|---|---|
| `packages/axis-ui-react` `vitest run` | 206 통과(17파일, 측정) |
| `packages/axis-ui-react` `pnpm type-check` · `pnpm lint` | 둘 다 rc 0(측정) |
| `pnpm check-changeset-mcp-tokens` | rc 0(측정) |
| `pnpm check-token-refs` | rc 0, 위반 0건(측정) |
| `pnpm changeset status` | patch: `@axis-ds/ui-react` · `@axis-ds/agentic-ui`(측정) |
| `library refresh-axis --dry-run` | 추가 0 · 변경 0 · 유지 48(측정, 기존 cli dist 로 실행) |
| `npx turbo run build --force` 뒤 `npx turbo run type-check lint test --force --concurrency=1 --continue` | 빌드 rc 0 · 8/8 · Cached 0, 이어서 rc 0 · 24/24 · Cached 0(측정). ui-react 206 · agentic-ui 148 · theme 47 · cli 1568 · mcp 266 passed. 빌드가 바꾼 `public/templates/*.json` 6개 updatedAt 은 되돌림 |

## 4. 그림자 색 수식어 동작

패키지 `cn`(dist `utils.js`)으로 툴팁 기본 클래스와 `className` 을 병합한 결과예요(측정).

| 넘긴 `className` | 병합 결과 |
|---|---|
| `shadow-black/50` | 토큰 그림자와 `shadow-black/50` 이 함께 남음 |
| `shadow-none` | 토큰 그림자를 대체 |
| `shadow-[shadow:0_10px_15px_-3px_rgb(0_0_0/0.5)]` | 토큰 그림자를 대체 |
| `shadow-[0_10px_15px_-3px_rgb(0_0_0/0.5)]` | 토큰 그림자를 대체 |

- Tailwind 3.4.19 가 만든 CSS 에서 `shadow-black/50` 은 `--tw-shadow-color` 와 `--tw-shadow: var(--tw-shadow-colored)` 만 정하고, 토큰 클래스의 `--tw-shadow-colored` 는 `var(--axis-shadow-lg)` 예요(측정). 그래서 색은 적용되지 않고 토큰 그림자가 보여요(CSS 읽기로 판단, 브라우저 실측은 안 했어요). 종전 소스에서는 이 클래스만으로 `box-shadow` 를 정하는 규칙이 없어 그림자가 없었어요(추정, 같은 CSS 근거).

## 5. 브라우저 계산값 (AC4)

`pnpm turbo run build --filter=@ax/web... --force`(rc 0, 5/5, Cached 0)로 만든 정적 빌드 `apps/web/out` 을 로컬 서버로 띄우고, Playwright 1.61.1 chromium(1280x900)으로 `/components/tooltip/` 의 「Top」 트리거에 hover 한 뒤 TooltipContent 의 `getComputedStyle().boxShadow` 를 읽었어요(측정). 브랜드 · 테마는 `<html>` 의 `data-brand` 속성과 `dark` 클래스를 바꿔 전환했어요(WI-0108 testplan 4.1 과 같은 방식). 앞의 투명 두 레이어(`rgba(0, 0, 0, 0) 0px 0px 0px 0px`)는 ring 자리라 생략했어요.

| 브랜드 · 테마 | box-shadow 계산값 | 배경 | 토큰과 일치 |
|---|---|---|---|
| 기본 · 밝음 | `rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.1) 0px 4px 6px -4px` | `rgb(17, 24, 39)` | 예 |
| 기본 · 어두움 | 기본 · 밝음과 같음 | `rgb(243, 244, 246)` | 예 |
| ontology · 밝음 | `rgba(17, 20, 24, 0.1) 0px 8px 24px 0px` | `rgb(17, 20, 24)` | 예 |
| ontology · 어두움 | `rgba(0, 0, 0, 0.5) 0px 8px 24px 0px` | `rgb(241, 243, 245)` | 예 |

- 같은 4조합의 Popover · DropdownMenu · Sheet 계산값(WI-0108 testplan 4.1)과 문자열이 같아요.
- 대조군(기본 · 밝음): 열린 툴팁에서 그 클래스를 빼면 `none` 이 되고, `:root` 의 `--axis-shadow-lg` 를 `0 1px 2px rgba(255,0,0,.5)` 로 바꾸면 `rgba(255, 0, 0, 0.5) 0px 1px 2px 0px` 로 따라와요. 측정값이 이 클래스와 토큰에서 나온다는 뜻이에요.
- 빌드 부산물로 `apps/web/public/templates/*.json` 6개의 updatedAt 만 바뀌어 되돌렸어요. 측정 뒤 서버는 PID 로 종료하고 포트 응답 없음을 확인했어요.
- 다른 방향(side right · bottom · left) 트리거는 같은 클래스를 써서 계산값도 같다고 보고 따로 재지 않았어요(추정).
