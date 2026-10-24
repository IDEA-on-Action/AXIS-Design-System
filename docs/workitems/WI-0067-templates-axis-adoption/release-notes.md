# WI-0067 릴리스 노트: 템플릿 4종 AXIS 토큰 전환

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | GitHub: #181 | 대상: 문서 사이트(Pages) 의 템플릿 JSON. npm 릴리스 없음

## 바뀐 점

`npx @axis-ds/cli template init <slug>` 로 받는 템플릿 4종(theme-only · dashboard · landing-page · hr-dashboard)이 AXIS 토큰을 씁니다. cli · mcp 는 템플릿을 pages.dev 에서 받으므로 cli 를 올리지 않아도 배포 뒤 새 템플릿을 받습니다.

| 항목 | 이전 | 이후 |
|---|---|---|
| 색 · 둥글기 | `globals.css` 의 자체 hsl 변수 39~53개 | `@axis-ds/tokens/css` · `@axis-ds/tokens/css/shadcn` import, 자체 색 변수 0 |
| Tailwind 설정 | `theme.extend` 에 자체 매핑 | `presets: [axisPreset]` |
| 글꼴 | `next/font/google` Inter(빌드 때 네트워크 필요) | `pretendard` 패키지(Pretendard Variable 동적 서브셋), 스택은 preset |
| 브랜드 | 안내 없음 | `globals.css` 의 ontology import 주석 한 줄 + `<html data-brand="ontology">` |
| `axis check`(cli 1.6.1) | `tailwind.config` · `globals.css` WARN | 두 항목 PASS(4종 실측) |
| 의존성 | - | `@axis-ds/tokens ^1.7.0` · `pretendard ^1.3.9` 추가 |
| template version | 0.1.0 | 0.2.0 |

- hr-dashboard: 상태 색(성공 · 경고 · 오류)은 `--axis-status-*`, 차트 · Zone 색은 `chart-1~5` 를 씁니다. Glassmorphism 패널은 템플릿 로컬 클래스로 남고 색은 `--card` · `--border` 를 따릅니다. KPI 카드 진입 애니메이션은 움직임 줄이기에서 멈춥니다(WI-0071 정책).
- dashboard: 통계 카드의 증감 글자 색이 Tailwind 팔레트(green · red)에서 AXIS 상태 색으로 바뀌었습니다.
- 테두리: tokens CSS 뒤에 `* { @apply border-border }` 를 둡니다. Tailwind 3 preflight 가 테두리 기본색을 gray-200 으로 덮기 때문입니다(빼면 다크 · 브랜드에서도 테두리가 회색, 실측).

## ontology 켜기

1. `app/globals.css` 의 `/* @import "@axis-ds/tokens/css/brands/ontology"; */` 주석을 풀거나 `npx @axis-ds/cli theme add ontology`
2. `app/layout.tsx` 의 `<html>` 에 `data-brand="ontology"`(또는 `@axis-ds/theme` 1.7.0 이상의 `ThemeProvider defaultBrand="ontology"`)
3. 끄기는 `data-brand` 제거(`ThemeProvider` 는 `setBrand(undefined)`)
4. `npx @axis-ds/cli check` 로 확인(`axis.config.json` 에 `brand` 가 있을 때 `brand` · `brand.activation` 항목)

자세한 절차와 측정값: [테마 커스터마이징 가이드](../../guides/theme-customization.md) 「템플릿에서 ontology 켜기」, [Quick Start](../../guides/quick-start.md) 「6. 템플릿에서 시작하기 · 템플릿에서 ontology 켜기」.

## 업그레이드

- 이미 받은 템플릿은 자동으로 바뀌지 않습니다(파일 복사 방식). `npx @axis-ds/cli template diff <slug>` 로 새 템플릿과 차이를 보고 필요한 파일을 옮깁니다.
- tokens 는 `^1.7.0` 범위라 이후 tokens 색 변경은 다음 설치부터 들어옵니다.

## 저장소 내부

- `apps/web/scripts/build-template-index.mjs` 는 `template.json` 과 `files/package.json` 의 의존성이 다르면 빌드를 실패시킵니다.
- `pnpm template-smoke` 는 `--axis-*` 정의 1건 이상 · 전환 전 `--primary`(240 5.9% 10%) 0건도 봅니다.
- cli 테스트의 theme-only fixture 는 전환 전 사본으로 동결했습니다(`packages/axis-cli/test/fixtures/theme/templates/theme-only-pre-wi0067.json`). 전환 후 템플릿 check 기준선을 따로 둡니다.
