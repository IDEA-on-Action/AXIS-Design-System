# WI-0065: cli theme add · check 가 브랜드 적용 전제를 처리 · 판정하도록 보강 PRD

> 작성일: 2026-10-24 | 버전: v1.0 | 작성자: Sinclair Seo | WI: WI-0065 | GitHub: #175 | 우선순위: P2 | 상태: Approved (2026-10-24 배치 2 결정 반영)
> 기준: `main` 59dd6a3 (cli 1.5.4 · mcp 1.3.2, linked 4패키지 1.6.0)
> 묶음: 배치 2 묶음 ③(WI-0037 · WI-0041 · WI-0049 · WI-0065) | 관련: WI-0046(애니메이션, 묶음 ②) · WI-0064(브랜드 가이드, 묶음 ④) · WI-0068(defaultBrand 해제 저장)

---

## 1. 개요

### 1.1 문제 (측정, 2026-10-24)

- 경로 A(Next 15.5.28 + Tailwind 3.4.19, src 없음)에서 `init -y` → `theme add ontology` → `add button` 만 실행하고 add 가 안내한 의존성을 설치해 빌드하면 Button 바탕이 `rgba(0, 0, 0, 0)`(투명) · 둥글기 0px 이었어요. 같은 상태의 `axis check`(배포본 1.5.4)는 5 pass / 1 warn / 0 fail, rc 0 이었어요
- 원인(측정 · 코드 확인): ① init 이 componentsDir 를 `./src/components/ui` 로 정해 create-next-app content(`./components/**` 등)가 Button 파일을 스캔하지 않음 ② theme add 가 기본 토큰 CSS(`@axis-ds/tokens/css` · `css/shadcn`)를 넣지 않아 `--axis-button-bg-default` 가 정의되지 않음 ③ 브랜드 CSS 는 `[data-brand]` 선택자뿐인데 레이아웃에 data-brand 가 없음
- check 의 Tailwind 3 판정이 `--background` · `hsl(var(` 문자열 포함이라 create-next-app 기본 config(`var(--background)`)도 「AXIS 토큰이 설정」 PASS 였어요(거짓 초록)
- `theme add` · `theme list` · `theme info` 의 설치 안내가 npm 프로젝트에도 `pnpm add` 고정(theme/index.ts 5곳 · theme 설치 안내 1곳), tokens 기록 범위는 `^1.3.0`

### 1.2 결정 (2026-10-24 사용자, 브리프 권장안 + 반박 검토 major 반영)

| # | 결정 |
|---|---|
| D7 | CSS 자동 + 코드는 안내. Tailwind 3 은 브랜드 import 앞에 `@axis-ds/tokens/css` · `@axis-ds/tokens/css/shadcn` 을, Tailwind 4 는 `@axis-ds/tokens/css/tailwind4` 와 선언된 컴포넌트 패키지의 `tailwind.css` 를 넣어요(이미 있는 것은 넣지 않음, 순서 variables → shadcn → 브랜드). layout · tailwind.config 는 고치지 않고 감지 결과로 정확한 안내를 내요. 설치 안내는 lockfile 로 고른 명령이에요 |
| D7-위치 | 반박 검토 반영: 새 줄은 항상 파일 앞쪽 import 구간 끝(규칙보다 앞)에 넣고, 규칙(`@tailwind` 등) 뒤에 있는 기존 `@import` 는 「CSS 규칙상 무시될 수 있으니 맨 앞으로」 경고해요. 그 줄도 「있음」으로 봐요(아래 측정: Next.js 15 는 위치와 관계없이 끌어올려 적용) |
| D7-측정 | 반박 검토 반영: Tailwind 3 에서 css/shadcn 위치에 따른 border-color 를 1회 측정했어요(아래 1.3) |
| D7-Provider | 반박 검토 반영: Provider 예시에서 `defaultBrand` 를 빼요(`setBrand(undefined)` 로 끈 상태가 새로고침 뒤 유지되지 않음, WI-0068). 루트 레이아웃 `<html data-brand>`(Provider 불필요, 첫 화면부터) 와 ThemeProvider 의 `setBrand` 두 방법을 함께 안내해요. `axis theme info` · MCP `axis.get_brand` 도 같은 예시(brand-core) |
| D7-범위 | tokens 기록 범위를 linked 현행 `^1.6.0` 으로 올려요(Tailwind 4 진입점 1.4.0 · agentic-ui 1.6.0 변수, 후자는 이슈 서술이고 측정하지 않음). 설치본 업그레이드 안내 기준(1.3.0)은 그대로예요 |
| D8 | 정적 판독 FAIL · 휴리스틱 WARN. Tailwind 3 content 가 componentsDir · 선언된 컴포넌트 패키지 경로를 덮지 않으면 FAIL(`tailwind.content`), content 를 정적으로 다 읽지 못하면 WARN. preset 부재는 WARN(자체 매핑만으로 PASS 하던 거짓 초록 정정). brand 가 있는데 레이아웃에 ThemeProvider · data-brand 가 없으면 WARN(`brand.activation`) |
| D8-애니메이션 | 반박 검토 반영(이 묶음이 소유): ui-react 를 쓰는데(선언 또는 componentsDir 의 animate-in 류 클래스) 애니메이션 플러그인(Tailwind 3 tailwindcss-animate · Tailwind 4 tw-animate-css)이 없으면 WARN(`animation`). init 안내 한 줄도 이 묶음이 내요(WI-0046 은 init.ts 를 고치지 않음) |
| D9 | `@axis-ds/cli` minor(1.5.4 → 1.6.0), `@axis-ds/mcp` patch(1.3.2 → 1.3.3). 반박 검토 반영: mcp 도 check_project 판정 결과가 바뀌지만 도구 이름 · 입력 스키마 · 결과 모양(`name · severity · message`)이 그대로라 patch 로 둬요(결과 항목 이름이 늘어나는 것은 CHANGELOG 에 적음) |

### 1.3 측정: Tailwind 3 에서 import 위치와 border-color (2026-10-24)

Next 15.5.28 + Tailwind 3.4.19, `<html data-brand="ontology">`, 같은 page(`Button` · `<div class="border">`)로 두 변형을 빌드했어요.

| 변형 | 출력 CSS 의 `@import` 잔존 | `* {border-color: hsl(var(--border))}` 위치 | preflight `border:0 solid` 위치 | Button 바탕 | `div.border` 테두리색 |
|---|---|---|---|---|---|
| import 3줄이 `@tailwind` 앞 | 0 | 18197 | 29747 | rgb(50, 106, 218) | rgb(229, 231, 235) |
| import 3줄이 `@tailwind` 뒤(quick-start 종전 예시 형태) | 0 | 18197 | 29746 | rgb(50, 106, 218) | rgb(229, 231, 235) |

- 두 변형의 규칙 순서가 같아요. Next.js(webpack · css-loader)는 `@import` 를 위치와 관계없이 앞으로 끌어올려요(측정). 다른 도구는 CSS 규칙대로 무시할 수 있어(추정, 측정하지 않음) 경고로 남겨요
- 어느 위치든 preflight 가 shadcn 의 `* {border-color}` 뒤에 와서 이겨요. 테두리색은 gray-200(229, 231, 235)이고 ontology `--border`(216 11% 91%, 계산값 rgb(230, 232, 235))가 아니에요. 기본 브랜드 `--border`(220 13% 91%, 계산값 rgb(229, 231, 235))와는 값이 같아요. 이 차이를 없애는 일(preset 의 borderColor 기본값 등)은 tokens 변경이라 이 묶음 범위 밖이에요

## 2. 수용 기준

- AC1 경로 A 를 새 cli 로 다시 재서 `init -y` → `theme add ontology` → `add button`(+ add 안내 의존성 설치)만으로 Button 이 투명하지 않고, 남은 수동 단계(data-brand · preset)를 cli 출력이 정확히 안내하며, 그 단계를 따른 뒤 Button 바탕이 #326ADA
- AC2 같은 상태(cli 1.5.4 결과물)에 새 check 가 FAIL · rc 1(content), 수동 단계를 마친 상태는 모두 PASS
- AC3 theme add 가 기본 토큰 CSS 를 브랜드 앞에 한 번만 넣음(멱등), Tailwind 4 는 진입점 · 컴포넌트 tailwind.css, 규칙 뒤 import 경고
- AC4 설치 안내가 lockfile 을 따름(npm · yarn · pnpm), tokens 기록 범위 ^1.6.0
- AC5 Provider 예시에 defaultBrand 없음(cli theme add · theme info · mcp get_brand)
- AC6 check 새 항목 3개(`brand.activation` · `tailwind.content` · `animation`)가 cli · mcp 에서 같은 순서 · 문구, 해당하지 않으면 항목 없음
- AC7 변이: content FAIL · preset 판정 · 기본 토큰 CSS · brand.activation 을 끄면 테스트 실패

## 3. 범위 밖

- layout · tailwind.config 자동 편집(D7 대안, WI-0028 Q1 · U10 「코드는 고치지 않음」 유지)
- Tailwind 3 preflight 가 AXIS `--border` 를 덮는 문제(tokens 변경)
- quick-start · 브랜드 가이드의 서술 정리(WI-0064 가 이 묶음 머지 뒤 import 순서 · Provider 예시를 그대로 옮김)
- MCP 브랜드 도구의 설치 안내를 lockfile 별로 고르기(종전처럼 pnpm 한 가지, 범위만 ^1.6.0 으로 맞춤)
