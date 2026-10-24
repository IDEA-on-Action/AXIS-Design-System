# WI-0054 테스트 계획 · 결과

> PRD: [prd.md](./prd.md) | 실행일: 2026-10-24 | 기준: bd54e91 + 브랜치 `fix/wi-0054-avatar-hydration-error`

## 1. 신규 단위 테스트 (AC1)

`packages/axis-ui-react/src/avatar/avatar.test.tsx` 에 9건을 더했어요(기존 11건 유지, 합계 20건). jsdom 의 img 는 리소스를 안 불러와 `complete=false · naturalWidth=0` 이고 `decode` 가 없어서(jsdom 27 실측), 테스트가 `HTMLImageElement.prototype` 에 브라우저 상태를 흉내 내고 테스트마다 원래대로 돌려요.

| # | 테스트 | 고정하는 것 |
|---|---|---|
| U1 | SSR 뒤 하이드레이션 전에 이미 실패한 이미지 | `renderToString` 마크업 + `hydrateRoot` 뒤 fallback `BU`, `onRecoverableError` 0건 (FR-1) |
| U2 | `complete && naturalWidth 0` + decode 거부 | fallback, decode 1회 |
| U3 | naturalWidth 0 + decode 이행(크기 0 SVG 등) | img 유지 (FR-2, SVG 예외) |
| U4 | 로딩 중(`complete=false`) | decode 안 부름, 이후 error 이벤트로 fallback |
| U5 | naturalWidth > 0 | decode 안 부름, img 유지 |
| U6 | decode 없는 환경 | 판정 안 함(종전 동작) |
| U7 | decode 대기 중 src 변경 | 이전 src 의 거부로 새 src 를 실패 처리 안 함 (FR-4) |
| U8 | onError 로 fallback 뒤 src 변경 | 새 src 의 img 다시 렌더 (FR-3, 부수 결함 C2) |
| U9 | A 실패 → B → A | A 를 다시 시도 (FR-3) |

### 1.1 음성 대조 (수정 전 소스 `main` bd54e91)

같은 테스트 파일로 수정 전 `avatar.tsx` 를 돌리면 **6 실패 · 14 통과 (20)** 예요. 실패는 U1 · U2 · U3 · U7 · U8 · U9 이에요. U3 · U7 은 「decode 를 1회 불렀다」를 확인하는 단언에서 실패해요(수정 전에는 판정 경로가 없음). U4 · U5 · U6 은 「판정하지 않음」을 고정하는 테스트라 수정 전에도 통과하는 것이 맞아요.

### 1.2 변이 (`avatar.tsx` 를 바꿔 돌리고 원본으로 되돌림, 되돌린 뒤 sha256 `1388d416…70cc2b` 일치)

| 변이 | 결과 | 잡은 테스트 |
|---|---|---|
| M1 판정 끄기(effect 첫 줄 `return`) | 4 실패 | U1 · U2 · U3 · U7 |
| M2 decode 없이 `complete && naturalWidth 0` 이면 바로 실패 | 4 실패 | U2(decode 0회) · U3(SVG 오판) · U6 · U7 |
| M3 decode 가 없으면 실패로 판정 | 1 실패 | U6 |
| M4 `complete` 검사 제거 | 2 실패 | U4 · U7 |
| M5 `naturalWidth` 검사 제거 | 1 실패 | U5 |
| M6 src 변경 시 초기화 제거 | 1 실패 | U9 |
| M7 src 일치 비교와 초기화 모두 제거(수정 전 C2 와 같은 동작) | 2 실패 | U8 · U9 |
| M8 decode 결과의 `cancelled` 가드 제거 | **0 실패(생존)** | 없음 |

M8 은 등가 변이예요. 실패 상태를 「실패한 src」로 저장하고 `hasError` 를 `failedSrc === src` 로 구하기 때문에, 가드가 없어도 이전 src 의 거부는 지금 src 를 fallback 으로 만들지 못하고 다음 렌더에서 초기화돼요(U7 이 그 결과를 고정). 가드는 언마운트 뒤 상태 갱신을 막으려고 남겼어요.

## 2. Playwright SSR 하이드레이션 실측 (AC2)

스크래치 fixture(커밋 안 함): node http 서버가 `renderToString` 결과를 내보내고, 페이지 `load`(모든 이미지가 load · error 로 끝난 뒤) 200ms 뒤에 `hydrateRoot` 번들(esbuild)을 붙여요. React 19.2.3, Playwright 1.61.1. 화면은 하이드레이션 500ms 뒤에 읽었어요.

| 사례 | 수정 전 | 수정 후 | M2(naive) | M1(판정 끄기) |
|---|---|---|---|---|
| 깨진 PNG(404) | img | **fallback BU** | fallback BU | img |
| 1×1 PNG | img | img | img | img |
| SVG viewBox 만 | img | img | img | img |
| SVG 크기 · viewBox 없음 | img | img | img | img |
| SVG `width="0"` (nw 0, 정상) | img | **img** | **fallback SZ (오판)** | img |
| ok → 깨진 src → ok (부수 결함) | fallback 고정 | **img(/ok.png?s=2), nw 1** | img | img |
| 하이드레이션 recoverable error · console error | 0 · 0 | 0 · 0 | 0 · 0 | 0 · 0 |

- 위 표는 chromium 149.0.7827.55 · firefox 151.0 · webkit 26.5 세 엔진 결과가 모두 같아요(엔진별 원자료 12행).
- 수정 후 빌드 산출물(`dist/avatar/avatar.mjs`, `"use client"` 머리말 포함)로도 chromium 에서 같은 결과를 1회 확인했어요.
- 「깨진 src 가 img 로 남음」이 계측 실패가 아니라는 근거: 같은 실행에서 하이드레이션 전 탐침이 그 img 를 `complete=true · naturalWidth=0 · decode 거부` 로 읽었고, 수정 후 같은 페이지에서는 fallback 으로 바뀌었어요.

## 3. SVG 판정 근거 (PRD 3.2)

하이드레이션 전 탐침 값(수정 후 실행에서 기록, 수정 전과 같음):

| 이미지 | chromium | firefox | webkit |
|---|---|---|---|
| 깨진 PNG | complete · 0×0 · decode 거부(EncodingError) | 같음 | 같음 |
| 1×1 PNG | 1×1 · 이행 | 같음 | 같음 |
| SVG viewBox 만 | 150×150 · 이행 | 300×300 · 이행 | 150×150 · 이행 |
| SVG 크기 · viewBox 없음 | 300×150 · 이행 | 같음 | 같음 |
| SVG `width="0"` | complete · 0×0 · **이행** | 같음 | 같음 |

## 4. 게이트 (AC3)

| 게이트 | rc | 수치 |
|---|---|---|
| `turbo run type-check lint test build --filter='...@axis-ds/ui-react' --force --concurrency=1` | 0 | 14/14 태스크, Cached 0. 대상 ui-react · agentic-ui · @ax/web · axis-nextjs-example(+ 의존 tokens · theme build) |
| └ ui-react test | 0 | 119 통과(Test Files 8). 신규 9건 포함(종전 110 은 119 - 9 로 계산한 값) |
| └ agentic-ui test | 0 | 90 통과 |
| └ @ax/web lint | 0 | 경고 · 오류 0 |
| `pnpm test:registry` | 0 | 45/45 |
| `pnpm pack-smoke` | 0 | 퍼블리시 대상 통과, G2 RSC 결함 0건, G2-types 224건 실패 0 |
| `pnpm check-library-links` | 0 | 위반 0건 |

측정 메모

- 처음 병렬 실행에서 `@ax/web#type-check` 가 `.next/types/**` 없음(TS6053)으로 실패했어요. 같은 실행의 `@ax/web#build` 가 `.next` 를 다시 만드는 중이라 겹친 것이라 `--concurrency=1` 로 다시 돌려 통과했어요. 새 worktree 에서는 dist 가 없어 agentic-ui test 가 ui-react 를 못 찾아 실패하므로 build 를 먼저 돌렸어요. 둘 다 이 변경과 무관한 실행 순서 문제예요.
- `pack-smoke` 첫 실행은 mcp 를 빌드하지 않은 상태라 mcp 2건이 실패했고, mcp build 뒤 다시 돌려 통과했어요.
- 빌드가 바꾼 `apps/web/public/templates/*.json` 5개는 `git checkout` 으로 되돌렸어요.

## 5. 생성물 (FR-6)

- 레지스트리: `node scripts/build-registry.mjs --out <스크래치>` 결과와 `apps/web/public/r` 를 `diff -r` 하면 파일 32 대 32, 차이는 `index.json` · `registry.json` 의 `"version"`(1.6.0 대 1.5.0) 한 줄씩뿐이에요. version 은 D5 대로 그대로 둬서 **public/r 변경 없음**이에요. ui-react Avatar 는 레지스트리 항목이 아니에요(항목 이름에 avatar 가 든 것은 `agentic-agent-avatar` 1개). 「소스 문자열이 출력에 없음」이 계측 실패가 아니라는 대조: 같은 출력에서 WI-0052 소스의 `visibleLength` 는 `agentic-streaming-text.json` 에서 1건 잡혀요.
- library: 스크래치 사본에 `library refresh-axis -o <스크래치>` 를 돌리면 「변경 1(axis-avatar) · 유지 47」, 바뀐 파일 4개(`categories/ui.json` · `index.json` · `meta.json` · `search-index.json`)를 반영했어요. 내용은 axis-avatar 의 소스 사본 · `updatedAt`(2026-10-24) · 자동 태그 `side-effects` 추가(useEffect 사용)와, 그 태그의 meta 개수 1 → 2 예요. meta · index 의 `version` 은 그대로예요. 반영 뒤 저장소에서 `--dry-run` 을 다시 돌리면 변경 0 · 쓰기 0 이고, 사본 3개 파일(avatar.tsx · index.tsx · variants.ts)이 소스와 바이트 단위로 같아요.

## 6. 배포 뒤 (AC4, 미실행)

- [ ] 발행본 `@axis-ds/ui-react` patch 로 2절 fixture 를 1회 다시 돌려 깨진 src 가 fallback 으로 바뀌는지 확인
