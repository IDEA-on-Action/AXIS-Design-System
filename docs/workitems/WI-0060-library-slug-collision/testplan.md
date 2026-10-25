# WI-0060 테스트 계획 · 결과: library 상세 데이터 slug 충돌

> PRD: [prd.md](./prd.md) | TODO: [todo.md](./todo.md) | GitHub: #159 | 실행일: 2026-10-25 | 기준: `main` be0ba59
> 표기: **측정**(이번에 실행) · **추정**(실행하지 않음). Node 22.22.0 · pnpm 9.15.4 · next 15 static export(trailingSlash) · Playwright Chromium
> 측정 산출물: `/tmp/claude-1000/-home-sinclair-work-idea-on-action-AXIS-Design-System/69d8f408-60b9-4bb2-8b0a-d1cb1f9af027/scratchpad/w60/`

## 1. 정적 산출물 상세 화면 (AC2 · AC3)

수정 전 main(be0ba59)과 이 브랜치를 각각 `pnpm turbo run build --force` 로 빌드하고 `out/` 을 `python3 -m http.server` 로 띄운 뒤, index.json 129 항목의 상세 주소를 Chromium 으로 열어 화면을 읽었어요(`detail-probe.mjs`). 기대값은 그 항목 id 의 데이터(categories 항목)에서 만들어요: 제목(name) · 소스 배지 · 설치 명령(소스 prefix + 원본 이름) · 코드 유무 · 첫 코드 앞부분.

| 측정 | main(음성 대조) | 이 브랜치 |
|---|---|---|
| 상세 주소(고유) | 124 | 129 |
| 상세 HTML(`out/library/<cat>/<slug>/index.html`) | 124 | 129 |
| 화면이 자기 항목과 일치 | 99 / 129 | 129 / 129 |
| 코드가 보이는 화면(계측 대조, 기대 48) | 68 | 48 |

main 불일치 30건: shadcn 25개가 AXIS 배지 · `npx @axis-ds/cli add` · AXIS 코드(예: `/library/data-display/badge/`), AXIS 5개(alert · avatar · progress · skeleton · tooltip)가 shadcn/ui 배지 · 코드 없음. 같은 URL 5개의 shadcn 항목(예: shadcn-button)은 main 에서 `/library/ui/button/` 의 AXIS 화면으로 잡혀요.

대표 쌍(이 브랜치): `/library/ui/button/` AXIS · `npx @axis-ds/cli add button` · 코드 있음, `/library/ui/shadcn-button/` shadcn/ui · `npx shadcn@latest add button` · 코드 없음, `/library/ui/alert/` AXIS · 코드 있음(main 은 shadcn/ui), `/library/data-display/badge/` shadcn/ui(main 은 AXIS). 옛 5개 URL 은 그대로 AXIS 를 보여요(AC3).

0건이 계측 실패가 아님: 같은 스크립트가 main 에서 불일치 30건을 잡았고, 코드 화면 수가 기대값(48)과 같아요.

## 2. check-library-links (AC1 · AC4)

| 입력 | rc | 결과 |
|---|---|---|
| 이 브랜치 | 0 | 사이트 링크 48 · 항목 129 · 파일 129 · 카테고리 10, 상세 주소 129, 카테고리가 다른 같은 slug 25(위반 아님), 위반 0 |
| main library(`git archive be0ba59`, `--library`) | 1 | 파일 불일치 228(옛 slug 파일 99 + id 파일 없음 129) · 상세 주소 중복 5, 위반 233 |
| 변이 1: 이 브랜치 index.json 의 shadcn-button slug 만 `button` 으로 | 1 | 위반 5(주소 중복 `/library/ui/button` · search url · categories slug · 파일 slug) |
| 변이 2: `shadcn-badge.json` 삭제 + AXIS 내용의 `badge.json` 추가 | 1 | 위반 2(남는 파일 · 없는 파일) |

main 에서 옛 규칙은 rc 0(「slug 충돌 30개, 위반 아님」, 배치 4 브리프 측정)이라 새 규칙이 판정을 가르는 것을 확인했어요.

## 3. 생성 명령 (AC5)

| 실행 | 결과 |
|---|---|
| `pnpm library:refresh-axis --dry-run`(빌드 포함) | 추가 0 · 변경 0 · 유지 48 · 삭제 0, slug 변경 5(shadcn-accordion · button · collapsible · command · toggle), 쓰기 132 · 삭제 99 |
| 실제 실행 | 같은 값. 쓰기 132 = 상세 129 + index · search-index · categories/ui |
| 두 번째 실행 | 쓰기 0 · 삭제 0 · slug 변경 0 · 유지 48 |

집계 파일 diff 는 5개 항목의 slug(3곳)와 search url 뿐(40줄). 상세 파일 129개는 모두 categories 항목과 같은 내용이고 AXIS 48개는 기존 updatedAt 을 유지했어요.

## 4. 영향 범위 (AC6)

- 레지스트리 r/ 32파일: `library` 0건(grep rc 1), 대조군 `sha256` 60 · `axis-design-system.pages.dev` 41. build:registry 뒤 diff 는 index.json · registry.json 의 `version` 1.5.0 → 1.7.0 2줄뿐이라 되돌렸고(WI-0052 선례), 그 뒤 r/ · mcp `git status` 0줄
- 원격 링크 검사 수집 단계: 구판 109 · 신판 109, 한쪽에만 0
- `public/templates`: 빌드 두 번 모두 updatedAt 10줄만 바뀌어(내용 diff 0) 되돌림

## 5. 단위 테스트

- cli 738 통과(추가 8건, 계산상 main 730: Publisher 파일 경로 · slug 재지정 2, resolveRouteSlugs 5, refresh 카테고리 다른 같은 slug 1). 기존 refresh 4건은 기대값을 새 파일 키 · slug 로 갱신

## 6. 게이트 (AC7)

| 게이트 | 결과 |
|---|---|
| `pnpm turbo run lint --force` | 7/7, cached 0 |
| `pnpm turbo run type-check --force` | 11/11, cached 0 |
| `pnpm turbo run build --force` | 8/8, cached 0 |
| `pnpm turbo run test --force` | 6/6, cached 0(cli 738 · mcp 143 · ui-react 155 + 7 · agentic-ui 95 · theme 47 · tokens 298) |
| frontend.yml run 단계 | check-token-refs · check-contrast-pairs · check-types-versions · check-library-links · build:registry · test:registry · check-licenses · pack-smoke(퍼블리시 대상 6) · cli-smoke · registry-install-smoke(5/5) 모두 rc 0 |
| E2E static | a11y 40 · nontext 8 · demo 8, skipped 0 · unexpected 0 |
| E2E tokens | 22, skipped 0 · unexpected 0 |

## 7. 배포 뒤 (AC8, 미실행)

pages.dev 에서 `/library/data-display/badge/` · `/library/ui/badge/` · `/library/ui/alert/` · `/library/ui/shadcn-button/` 와 `/library/components/shadcn-badge.json` · `axis-alert.json` 을 실측해요(Master).
