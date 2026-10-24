# WI-0048 테스트 계획 · 결과

> PRD: [prd.md](./prd.md) | 실행일: 2026-10-24 | 기준: main bd54e91 + 이 브랜치(`docs/wi-0028-0040-0048-closeout`)
> 표기: **측정**은 이번에 명령을 실행해 얻은 값입니다.

## T1. Tailwind 표기 (AC1)

| 항목 | 수정 전(측정) | 수정 뒤(측정) |
|---|---|---|
| `grep -rnE "Tailwind( CSS)? ?(v)?[34]..."` 루트 README · `docs/guides`(theme-customization 제외) · `.claude/prompts` | 저장소 스택 「4」 3곳 + 소비자 설정 안내(quick-start · troubleshooting · component-usage) | 저장소 스택 3곳이 두 축 표기. `grep -nE "Tailwind( CSS)? 4\b"` 를 세 파일에 돌려 0줄 |
| 기준 값 | `apps/web/package.json` `"tailwindcss": "^3.4.17"` | 같음 |

- 소비자 설정 안내의 「Tailwind CSS 4」 절은 소비 프로젝트용 설정이라 바꾸지 않았습니다. `theme-customization.md` 의 Tailwind 4 언급(237 · 240 · 299 · 445 · 447행)도 소비자 안내이고, 이 묶음 범위 밖입니다.

## T2. 문서 링크 전수 점검 (AC2 · AC3)

점검 스크립트(스크래치, 저장소에 넣지 않음): 루트 `README.md` · `docs/guides/**/*.md` · `.claude/prompts/**/*.md` 13개 파일의 코드 펜스 밖 마크다운 링크를 상대 파일(존재) · 사이트 경로 `/x`(`apps/web/src/app` page 59개 라우트, `(group)` 세그먼트 제거, `apps/web/public` 정적 파일) · pages.dev URL(HTTP GET, 리다이렉트 따르지 않음)로 나눠 봅니다. 저장소에는 마크다운 문서 링크 검사 스크립트가 없어(`check-library-links` 는 library 데이터 전용) 이렇게 쟀습니다.

| 시점 | 링크 | 상대 | 사이트 경로 | URL | 깨짐 |
|---|---|---|---|---|---|
| 수정 전(측정) | 6 | 5 | 1 | 0 | 1 (`quick-start.md:208` `/docs/components`) |
| 수정 뒤(측정) | 6 | 5 | 0 | 1 | 0. `https://axis-design-system.pages.dev/components/` 200 |

- 계측 대조: 같은 13개 파일의 `](` 개수 `grep -o` 6개로 스크립트가 센 링크 수와 같음. 라우트 대조 음성 대조: `https://axis-design-system.pages.dev/docs/components` 404, `/components` 308 → `/components/` 200.
- 코드 블록 안 주소(측정): `https://axis-design-system.pages.dev/r/button.json` 200 · `/r/index.json` 200. `.../r` 는 레지스트리 기준 주소라 404 가 정상(페이지 아님). `theme-customization.md` 의 `/docs/brand-demo/` 는 200(수정하지 않음).
- `pnpm check-library-links` rc 0, 위반 0건(사이트 링크 48 · 항목 129).

## T3. 게이트

| 명령 | 결과(측정) |
|---|---|
| `pnpm --filter @axis-ds/cli test` | rc 0, 17파일 662/662(guidance 테스트가 README · `docs/guides` · `.claude/prompts` 를 스캔) |
| `pnpm exec turbo run lint --force` | rc 0, 4/4, Cached 0 |
| `npx prettier --check README.md docs/guides/quick-start.md` | 경고. HEAD 판도 같은 설정으로 경고(기준선)라 파일 전체를 다시 쓰지 않음. `monorepo-setup.md` · `.claude/prompts/README.md` 는 통과 |
