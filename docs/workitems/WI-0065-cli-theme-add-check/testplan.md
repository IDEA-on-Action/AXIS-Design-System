# WI-0065 테스트 계획 · 결과

> PRD: [prd.md](./prd.md) | 실행일: 2026-10-24 | 환경: Node 22.22.0 · Next 15.5.28 · tailwindcss 3.4.19 · npm 의 @axis-ds/tokens 1.6.0 · Playwright Chromium(계산 스타일)

## 1. 단위 테스트

| 파일 | 내용 | 결과 |
|---|---|---|
| `packages/axis-cli/src/theme/theme-add.test.ts` | 기본 토큰 CSS 2줄 + 브랜드 순서(theme-only · BOM · 다른 브랜드 뒤), 같은 브랜드만 있으면 빠진 기본 CSS 만, 모두 있으면 `exists` · 쓰기 0, 멱등(2회차 0), Tailwind 4 진입점 · ui-react tailwind.css 순서, 규칙 뒤 import 경고와 음성 대조, lockfile 별 업그레이드 · theme 설치 명령(npm · yarn, pnpm 없음), preset · content 안내와 음성 대조, data-brand · setBrand 예시(defaultBrand 없음), 레이아웃 · `./providers` 에서 찾음 | 통과(51) |
| `packages/axis-cli/src/theme/theme-commands.test.ts` | theme info 예시, theme list 의 lockfile 별 설치 명령(npm), lockfile 없으면 `pnpm add "@axis-ds/tokens@^1.6.0"` | 통과 |
| `packages/axis-cli/src/template/template-check.test.ts` | T4-1 기준선(1e84f15) 6개 프로젝트: 바뀐 것은 theme-only(app/globals.css · preset WARN · content PASS 추가) · allPass(preset WARN) 두 곳뿐이고 나머지 4개는 그대로. T4-3 brand 7항목(brand.activation). content FAIL(이슈 재현 조합) · PASS(음성 대조) · npm 패키지 경로 · 동적 content WARN · files 객체 · 해당 없음 3종. brand.activation WARN · PASS · providers · 주석 · brand 없음. animation 선언 · 복사 설치 · Tailwind 4 · 음성 대조. content FAIL 단독으로 runCheck fail 1. glob 판독 단위 | 통과(116) |
| `packages/axis-mcp/src/tools/template.test.ts` | check_project 의 brand.activation · content FAIL · animation WARN 이 CLI 와 같은 순서, preset 없음 WARN 문구 | 통과 |
| `packages/axis-mcp/src/tools/brand.test.ts` · `brand-core.test.ts` | providerExample(data-brand · setBrand), 설치 안내 범위 ^1.6.0, brand-core 바이트 사본 일치 | 통과 |

## 2. 실측: ontology 경로 A (AC1 · AC2)

src 없는 Next 15.5.28 + Tailwind 3.4.19 프로젝트(create-next-app Tailwind 3 형태의 `tailwind.config.ts` · `app/globals.css`)를 같은 원본에서 두 번 복사해 비교했어요. page 는 `<Button id="btn">` 하나만 둔 사용자 코드예요. add 가 안내한 `npm install @radix-ui/react-slot class-variance-authority` 와 `npm install` 은 두 쪽 모두 실행했어요(안내를 따른 것, 전제 주입 아님).

| 단계 | cli | Button 바탕 | 둥글기 | `axis check` |
|---|---|---|---|---|
| before: init → theme add → add button | main 59dd6a3 빌드(버전 표시 1.5.4) | rgba(0, 0, 0, 0) | 0px | 배포본 1.5.4: 5 pass / 1 warn / 0 fail, rc 0. 새 cli: 4 pass / 3 warn / **1 fail**, rc 1(content 가 `./src/components/ui` 를 덮지 않음) |
| after-1: 같은 명령만 | 이 브랜치 빌드 | rgb(37, 99, 235) = #2563EB(AXIS 기본) | 6px | 6 pass / 2 warn / 0 fail, rc 0(WARN: preset 없음 · brand.activation) |
| after-2: cli 안내대로 `<html data-brand="ontology">` 1줄 | 같음 | **rgb(50, 106, 218) = #326ADA** | 6px | 7 pass / 1 warn |
| after-3: cli 안내대로 `presets: [require("@axis-ds/tokens/tailwind")]` 1줄 | 같음 | rgb(50, 106, 218) | 10px(ontology `--radius` 12px - 2px) | 8 pass / 0 warn / 0 fail |

- 결론(측정): cli 명령만으로는 Button 이 투명 · 0px 에서 AXIS 기본 색 · 6px 로 바뀌어요. #326ADA 가 되려면 수동 1단계(data-brand)가, ontology 둥글기까지 맞추려면 수동 1단계(preset)가 더 필요하고, 두 단계 모두 theme add 출력과 check WARN 이 정확한 줄을 안내해요
- after-1 의 check 문구는 WARN 문구를 「자체 hsl(var(--*)) 매핑만 있음」에서 「자체 CSS 변수 매핑만 있음」으로 고치기 직전 빌드로 쟀어요(판정 · 개수는 같고 문구만 다름). before · after-3 의 check 는 최종 빌드로 쟀어요
- 테두리색은 모든 단계에서 rgb(229, 231, 235)예요(PRD 1.3, Tailwind 3 preflight)

## 3. 측정: import 위치와 border-color

PRD 1.3 표. 두 변형 모두 build rc 0, 출력 CSS 의 `@import` 0건, 규칙 순서 같음.

## 4. 변이 (A/B)

저장소 밖 스크래치 스크립트로 분기를 종전 동작으로 되돌려 실행하고 원본으로 되돌렸어요(6건 모두 원복 sha 일치).

| 변이 | 대상 테스트 | 결과 |
|---|---|---|
| content FAIL 끔 | template-check.test.ts | 4건 실패 |
| preset 없어도 PASS(종전 거짓 초록) | template-check.test.ts | 6건 실패 |
| theme add 기본 토큰 CSS 끔 | theme-add.test.ts | 7건 실패 |
| brand.activation 끔 | template-check.test.ts | 10건 실패 |

## 5. 게이트 (캐시 우회 `--force`)

- type-check · lint(cli · mcp · registry-core · web) 11/11, Cached 0, rc 0
- build · test(cli · mcp) 4/4, Cached 0, rc 0(cli 704 · mcp 139)
- `pnpm --filter @ax/web build` rc 0
