# WI-0067 테스트 계획 · 결과: 템플릿 4종 AXIS 토큰 전환

> PRD: [prd.md](./prd.md) | TODO: [todo.md](./todo.md) | GitHub: #181 | 실행일: 2026-10-25 | 기준: `main` 17f2815
> 표기: **측정**(이번에 실행) · **추정**(실행하지 않음). 측정 도구는 발행본 `@axis-ds/cli` 1.6.1, 설치된 `@axis-ds/tokens` 1.7.0 · `pretendard` 1.3.9 · tailwindcss 3.4.19 · next 15.5.28, Chromium 149.0.7827.55

## 1. 실경로 (AC1)

발행본 cli 1.6.1 로 빈 디렉터리에 `axis template init <slug>` → `pnpm install` → `axis check`. 템플릿 JSON 은 이 브랜치의 생성물을 127.0.0.1 서버로 주고 `AXIS_TEMPLATE_URL` 로 가리켰어요(주입 전제. 서버 로그에 slug 4개 요청 200, pages.dev 경로는 배포 뒤 AC9 로 따로 재요).

| slug | init · install rc | tailwind.config | globals.css | 결과 | 전환 전(배치 4 브리프 측정) |
|---|---|---|---|---|---|
| theme-only | 0 · 0 | PASS | PASS | 5 pass / 1 warn / 0 fail (WARN: utils.ts 없음) | 3 / 3 / 0 (두 항목 WARN) |
| dashboard | 0 · 0 | PASS | PASS | 5 / 1 / 0 | 3 / 3 / 0 |
| landing-page | 0 · 0 | PASS | PASS | 5 / 1 / 0 | 3 / 3 / 0 |
| hr-dashboard | 0 · 0 | PASS | PASS | 6 / 0 / 0 | 4 / 2 / 0 |

브랜드를 켠 사본(주석 해제 + `<html data-brand="ontology">` + config `brand`): theme-only 7 / 1 / 0, hr-dashboard 8 / 0 / 0, `brand` · `brand.activation` PASS. `theme add ontology`(cli 1.6.1) 경로: 실행 rc 0, import 줄 추가 · config `brand` 기록 · `package.json` 범위 유지. `data-brand` 전 6 / 2 / 0(`brand.activation` WARN, 레이아웃 주석 안의 `data-brand` 글자는 세지 않음), 넣은 뒤 7 / 1 / 0.

## 2. 빌드 CSS · 스모크 (AC2)

`node scripts/template-smoke.mjs`(빌드한 cli, npm install, next build, CSS 내용 판정).

| 입력 | theme-only | dashboard | landing-page | hr-dashboard | rc |
|---|---|---|---|---|---|
| 이 브랜치 JSON | `@tailwind` 0 · `.bg-background` 1 · `--axis-*` 544 · 옛 `--primary` 0 → PASS | 같음 PASS | 같음 PASS | 같음 PASS | 0 |
| 고치기 전 JSON(`--templates-dir`, 음성 대조) | `--axis-*` 0 · 옛 `--primary` 1 → FAIL | FAIL | FAIL | FAIL | 1 |

`.bg-background` 는 전후 모두 1건이라 추가한 두 조건이 판정을 가르는 것을 확인했어요.

## 3. 소스 정적 검사 (AC3 · AC4 · AC5)

- 4종 `files/` 의 CSS 변수 정의 줄(`--x:`) 0건. 양성 대조: 같은 기준으로 전환 전 theme-only JSON 에서 `--primary: 240` 1건
- 팔레트 클래스(`text-green-600` 등 22색 계열) 0건. 양성 대조: 전환 전 dashboard JSON 에서 4건
- `next/font` · Inter 0건(`esModuleInterop` 4건만 글자로 걸림)
- hsl 리터럴: hr-dashboard `lib/demo-data.ts` 트리맵 범주 색 10건만 남음(로컬 예외, PRD 1.3)
- 생성기 일치 검사: dashboard `template.json` 의 pretendard 를 `^1.3.8` 로 바꾸자 `dashboard: template.json 과 files/package.json 의 의존성이 다릅니다 / dependencies.pretendard: template.json ^1.3.8 / files/package.json ^1.3.9` 로 rc 1, 되돌리면 rc 0
- description · features 의 「미사용」 · 「자체 테마」 0건, 브랜드 안내: features 4종 · theme-only README · 가이드 2곳
- 커밋한 생성 JSON 5개는 실경로 · 브라우저 실측에 쓴 사본과 `updatedAt` 외 동일(5/5, 비교 스크립트 양성 대조: dashboard vs theme-only DIFF)

## 4. 브라우저 계산값 (AC6 · AC7)

theme-only · hr-dashboard 를 `next build` 뒤 `next start`(프로젝트 next 직접 실행, 프로세스 그룹 종료)로 띄우고 Playwright 로 `<html>` 의 `.dark` 를 바꿔 가며 쟀어요. 기대값은 각 프로젝트에 **설치된** tokens 의 `shadcn-compat.css` · `brands/ontology.css` 를 읽어 브라우저에서 rgb 로 바꾼 값이에요(버전에 묶지 않음). 페이지 HTTP 4xx · 5xx 0건, 실측 뒤 남은 서버 0.

| 상태 | `--primary` | 배경 | 글자 | 테두리 | 기대값 일치(2 템플릿) |
|---|---|---|---|---|---|
| 기본 · 라이트 | 221 39% 11% | rgb(255, 255, 255) | rgb(17, 24, 39) | rgb(229, 231, 235) | 2/2 |
| 기본 · 다크 | 220 14% 96% | rgb(3, 7, 17) | rgb(243, 244, 246) | rgb(31, 41, 55) | 2/2 |
| ontology · 라이트(마크업) | 220 69.4% 52.5% | rgb(247, 247, 247) | rgb(17, 20, 24) | rgb(230, 232, 235) | 2/2 |
| ontology · 다크(마크업) | 219.7 81.6% 68% | rgb(14, 16, 19) | rgb(241, 243, 245) | rgb(43, 47, 53) | 2/2 |
| ontology 끔(`removeAttribute`) · 라이트 | 기본 · 라이트와 같음 | | | | 2/2 |
| ontology 끔 · 다크 | 기본 · 다크와 같음 | | | | 2/2 |

- 12/12 일치. body `font-family` 는 기본 `--axis-font-family-sans` 스택, ontology 는 브랜드 스택과 같고 실제 로드는 FontFace status 로 확인했어요(Pretendard 92면 중 loaded: theme-only 6 · hr-dashboard 9, 독립 검토 실측). `document.fonts.check` 는 없는 글꼴에도 참을 내서(음성 대조 실패) 근거에서 뺐어요
- 음성 대조(구현 중 발견): `* { @apply border-border }` 를 뺀 첫 구현에서는 테두리가 모든 상태에서 rgb(229, 231, 235)(Tailwind 3 preflight 의 gray-200)라 템플릿마다 6상태 중 4개가 불일치였어요. 그 줄을 다시 넣어 해소했어요
- 계측 정정: 두 번째 실측은 첫 실측이 남긴 `next start` 서버(cwd 가 지워진 옛 디렉터리)를 같은 포트에서 봐 글꼴이 Times New Roman 으로 나왔어요. `/proc/<pid>/cwd` 로 소유를 확인해 끄고, 실측 스크립트를 프로세스 그룹 종료 · 새 포트로 고친 뒤 다시 잰 값이 위 표예요
- `ThemeProvider defaultBrand` 구성은 템플릿에서 재지 않았어요(템플릿에 Provider 없음, 가이드에 「재지 않음」 명시)

## 5. 단위 테스트 · 게이트 (AC8)

- cli 730 · mcp 143 · theme 47 · ui-react 155 · agentic-ui 95 통과
- D4 A/B: 동결 사본 대신 현재 theme-only.json 을 읽게 바꾸면 cli 8건 실패(theme-add · brand-core · T4-1), 동결 사본으로 0건
- 전환 후 기준선(`WI-0067: 전환 후 theme-only 템플릿 check 기준선`): tailwind · globals PASS, fail 0, 같은 테스트에서 동결 사본은 두 항목 WARN
- `turbo run lint` 7 · `type-check` 11 · `build` 8 · `test` 6 태스크 모두 `--force` 로 하나씩, Cached 0
- frontend.yml run 단계: check-token-refs · check-contrast-pairs · check-types-versions · check-library-links(위반 0) · build:registry · test:registry · check-licenses · pack-smoke(퍼블리시 대상 6개) · cli-smoke · registry-install-smoke 모두 rc 0. `build:registry` 가 바꾼 `public/r` 의 version 줄(1.5.0 → 1.7.0)은 이 WI 밖이라 되돌렸어요
- E2E: a11y 40 · nontext 8 · demo 8(`E2E_SERVER=static`) · tokens 22 통과

### 독립 검토 보강 (2026-10-25)

- 테두리 열의 원측정은 body `borderTopColor` 라 대리 지표예요. 독립 검토가 theme-only 의 `.rounded-lg.border.bg-card`(전이 없는 요소)를 다시 재서 6/6 상태가 설치본 `--border` 와 같았어요(라이트 229,231,235 · 다크 31,41,55 · ontology 라이트 230,232,235 · ontology 다크 43,47,53). hr-dashboard 는 조건에 맞는 요소가 없어 border 클래스 요소는 미측정이고, `.glass-panel` 테두리는 rgba(31,41,55,0.6)로 AXIS `--border` 에서 온 값이에요.
- hr-dashboard 차트 비텍스트 대비(독립 검토 실측): 기본 다크 바탕에서 success 8.84 · warning 10.51 · error 5.35 · chart-1 5.53(막대 불투명도 0.7 계산값 chart-1 3.20 · error 3.04, 전환 전 alert 2.48). 라이트로 쓰면 success 2.28 · warning 1.92 로 3:1 미만이지만 전환 전 색도 거의 같아 회귀는 아니에요. 템플릿 axe 게이트는 WI-0027 AC5 몫이에요.

## 6. 배포 뒤 (AC9, 머지 후)

- [x] pages.dev `templates/<slug>.json` 4개 · index.json 이 커밋본과 `updatedAt` 외 동일(2026-10-25, #200 머지 bb7f1ac, frontend.yml run 40143822689 CI · Deploy Production success). 5/5 same-except-updatedAt, 양성 대조 dashboard 대 theme-only DIFF
- [x] 발행본 cli 1.6.1 로 `AXIS_TEMPLATE_URL` 없이(AXIS_ 환경변수 0개, pages.dev) 4종 `template init <slug> -d <dir>` → `pnpm install` → `check`: tailwind preset · globals.css 4/4 PASS, fail 0(dashboard · landing-page · theme-only 5/1/0, hr-dashboard 6/0/0, WARN 은 utils.ts 없음), 설치본 tokens 1.7.0 · pretendard 1.3.9
- [x] theme-only 를 가이드 「템플릿에서 ontology 켜기」대로(브랜드 import 주석 해제 + `<html data-brand="ontology">`) 바꿔 `next build` rc 0 → `next start` → Playwright Chromium 실측: ontology 라이트 `--primary` 220 69.4% 52.5% · 다크 219.7 81.6% 68%, `data-brand` 제거 시 라이트 221 39% 11% · 다크 220 14% 96%, 다시 켜면 ontology 값. 기대값은 설치본 `shadcn-compat.css` · `brands/ontology.css` 에서 읽었고 4/4 일치, body 글꼴 첫 항목 "Pretendard Variable", 서버 HTML 의 data-brand="ontology"
- 참고: `axis template init <slug>` 를 `--dir` 없이 비대화형으로 부르면 디렉터리 질문에서 아무것도 만들지 않고 rc 0 으로 끝나요(실측). 가이드는 `--dir` 형태라 영향이 없어요
- 원자료: `/tmp/claude-1000/-home-sinclair-work-idea-on-action-AXIS-Design-System/69d8f408-60b9-4bb2-8b0a-d1cb1f9af027/scratchpad/w67/live2/` · `/tmp/claude-1000/-home-sinclair-work-idea-on-action-AXIS-Design-System/69d8f408-60b9-4bb2-8b0a-d1cb1f9af027/scratchpad/w67/goal3c/`
