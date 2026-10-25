# WI-0077: Tailwind 3 색 없는 border 가 다크 · 브랜드에서도 회색 PRD

> 작성일: 2026-10-25 | 버전: v1.0 | 작성자: Sinclair Seo | WI: WI-0077 | GitHub: #203 | 우선순위: P3 | 상태: Approved (2026-10-25 배치 6 결정: 브리프 권장안 일괄 채택, project-todo 「배치 6 결정」 줄이 정본)
> 기준: `main` 3b5ed0f (linked 1.8.0 · cli 1.6.2 · mcp 1.3.5 발행됨, 미발행 changeset 0) | 묶음: 배치 6 (WI-0078 → 0076 → 0074 → 0075 → **0077**)
> 표기: **측정**(이번에 실행해 얻은 값) · **계산**(값에서 유도) · **추정**(실행하지 않음)

---

## 1. 개요

### 1.1 문제 (측정)

- quick-start 「Tailwind CSS 3」 예시 그대로(`tokens/css` · `css/shadcn` · 브랜드 다음 `@tailwind` 3줄) 만든 Next 15.5.28 · Tailwind 3.4.19 소비자에 npm 발행본 1.8.0 을 설치해 재면, 색을 지정하지 않은 `border` · `border-t` · `hr` 세 탐침이 4개 상태(기본 · ontology x 라이트 · 다크) 12칸 중 **9칸**에서 `hsl(var(--border))` 와 달라요. 세 탐침 모두 rgb(229, 231, 235)(gray-200)로 남고, 기본 · 라이트는 `--border` 가 같은 값이라 구별되지 않아요.
- 원인: Tailwind 3 preflight 는 `*, ::before, ::after { border: 0 solid theme('borderColor.DEFAULT') }` 를 내요. preset(`packages/axis-tokens/src/tailwind-preset.ts`)은 `colors.border` 만 정하고 `borderColor.DEFAULT` 는 정하지 않아 Tailwind 기본 gray-200 이 돼요. `css/shadcn` 의 `* { border-color: hsl(var(--border)) }` 는 레이어 없는 같은 명시도 규칙이고 `@tailwind base` 앞에 오므로 preflight 가 이겨요.
- `@axis-ds/ui-react` README 「Tailwind CSS 3」 절은 `@axis-ds/tokens/css/shadcn` 한 줄만 안내해요. 그대로 따르면 컴포넌트가 읽는 `--axis-*` 가 정의되지 않아 Input 경계가 글자색(rgb(17, 24, 39), 다크 rgb(243, 244, 246))이고 Progress 채움이 투명이에요.
- 문서 4곳(quick-start · tokens README · theme-customization 2곳)은 「Tailwind 3 은 gray-200 이 정상」 또는 「템플릿 밖은 재지 않음」으로 적고 있어요.

### 1.2 결정 (2026-10-25 배치 6 결정)

| # | 결정 | 근거 |
|---|---|---|
| D1 | preset 에 `theme.extend.borderColor.DEFAULT = 'hsl(var(--border, 220 13% 91%))'` 를 넣어요. fallback 은 Tailwind 3 gray-200(#e5e7eb)의 HSL | 업그레이드만으로 quick-start · cli theme add · 직접 구성한 소비자가 모두 고쳐져요. fallback 이 없으면 `--border` 를 정의하지 않은 앱이 currentColor(검정)로 바뀌어요 |
| D2 | tailwind4 생성기(`scripts/tailwind4.mjs`)는 `borderColor` 를 건너뛰기 목록(`TAILWIND3_ONLY_KEYS`)에 명시하고, 그 밖의 모르는 키는 throw 를 유지해요 | Tailwind 4 진입점은 base 레이어로 불러오는 같은 `*` 규칙이 맡아 새 변수가 필요 없어요. 넓게 열면 다른 키 누락을 못 잡아요 |
| D3 | 문서는 낡은 서술 정정 + 「tokens 1.8.0 이하는 `@layer base { * { @apply border-border } }` 블록」 한 줄, ui-react README 는 `@axis-ds/tokens/css` 를 함께 import | README 는 발행해야 npm 에 실려요. linked 설정으로 ui-react 도 1.8.1 이 되어 같은 발행에 실려요 |
| D4 | 템플릿 4종의 `@apply border-border` 블록은 그대로 둬요 | 1.8.0 이하 tokens 를 쓰는 기존 프로젝트 호환. 결과는 같아요(브리프 V1 · V2 모두 0/12) |

### 1.3 범위 밖

- Tailwind 4(브리프 T0 0/12, 결함 없음), `css/shadcn` 을 레이어로 감싸 내보내는 안(TW3 빌드 rc 1 · TW4 12/12 회귀로 기각), cli `theme add` 의 TW3 줄 변경, 이슈 코멘트의 「다크 axe 위반 24건」(최소 화면에서 재현 안 됨, 브리프).

## 2. 수용 기준

- **AC1 (TW3 실경로)**: 후보 tokens 를 설치한 quick-start TW3 예시 소비자에서 세 탐침 불일치 0/12. 음성 대조: 같은 소비자에 발행본 1.8.0 이면 9/12.
- **AC2 (유틸리티 우선)**: 같은 화면에서 `border-red-500` 4/4 rgb(239, 68, 68), `border-border` 4/4 기대값.
- **AC3 (하위 호환)**: `tokens/css` 만 import 한(shadcn 없음) 소비자에서 색 없는 border 가 종전 rgb(229, 231, 235) 이고 검정으로 붕괴하지 않아요. 변이: fallback 없는 값이면 (0, 0, 0).
- **AC4 (TW4 무회귀)**: `dist/css/tailwind4.css` 와 나머지 CSS 의 sha256 이 발행본 1.8.0 과 같아요.
- **AC5 (ui-react README)**: README TW3 절이 `@axis-ds/tokens/css` · `@axis-ds/tokens/css/shadcn` 두 줄을 이 순서로 안내하고, 그대로 만든 소비자에서 `--axis-border-default` 정의, Input 경계가 글자색이 아니고 Progress 채움이 투명이 아니에요. 음성 대조: 종전 한 줄 예시는 Input 글자색 · Progress 투명.
- **AC6 (문서 정합)**: 「Tailwind 3 은 gray-200」 서술 4곳 정정, 남은 낡은 서술 0건(양성 대조: 같은 grep 이 HEAD 에서는 찾음).
- **AC7 (단위 테스트)**: Tailwind 3 으로 preset 을 컴파일한 preflight 의 border-color 단언(node --test). 생성기는 borderColor 에서 throw 하지 않고 그 밖의 모르는 키는 throw. 변이: preset 수정 전 소스에서 새 테스트가 빨개지고, 건너뛰기를 넓히거나 없애면 생성기 테스트가 빨개져요.
- **AC8 (품질 게이트)**: turbo lint · type-check · build · test 를 하나씩 `--force`(Cached 0), frontend.yml run 단계 전체, cli guidance.test · init.test 문서 검사 통과, 생성물 churn 정리.
