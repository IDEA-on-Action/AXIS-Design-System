# WI-0068: ThemeProvider 브랜드 해제 유지 · 마크업 존중 테스트 계획 · 결과

> PRD: [prd.md](./prd.md) | 작성일: 2026-10-25 | 기준: `main` 778e1dd + 브랜치 `fix/wi-0051-0070-0068-0072-check-brand-cjs`
> 표기: **측정**(이번에 실행해 얻은 값) · **계산**(값에서 유도) · **추정**(실행하지 않음)

## 1. 단위 테스트 (측정, React 18.3.1 · jsdom)

| 대상 | 결과 |
|---|---|
| theme 전체(vitest) | 47 통과(3파일: theme.test 39 · theme.hydrate.test 5 · theme.ssr.test 3) |
| `theme.test.tsx` 기존 「setBrand(undefined)」 | 기대를 저장값 `null` → `""` 로 바꿈(의도한 변경) |
| `theme.test.tsx` 「WI-0068」 11건 | S1 defaultBrand 해제 뒤 재마운트 꺼짐 · S2 마크업만 유지 · S3 같은 값 · S4 저장값 우선 · S5 마크업이 defaultBrand 를 이김 · S6 저장값 경로 해제 유지 · S7 마크업 브랜드를 끄고 마크업이 다시 와도 꺼짐 · S8 언마운트 복원 뒤 다른 defaultBrand 재마운트 · S8-2 마크업 문서 복원 · S9 StrictMode · S10 구버전 저장값 없음 |
| `theme.hydrate.test.tsx`(새 파일) | 양성 대조군: 렌더 중 마크업을 읽는 소비자는 같은 하네스에서 불일치 오류가 잡힘. 마크업 + defaultBrand 없음 · 저장값 「끔」 + 마크업 · defaultBrand 만 · 하이드레이션 뒤 언마운트 복원: 오류 0, 첫 커밋에서 속성 제거 기록 없음, 끝난 뒤 ctx.brand 가 기대값 |

### 1.1 변이 (측정)

| 변이 | 결과 |
|---|---|
| 하이드레이션 판별을 끔(`hydrating` 을 늘 false) | hydrate 테스트 2건 실패(마크업 · 「끔」 시나리오에서 불일치 오류) |
| 하이드레이션 첫 커밋 DOM 보호(`if (!brandResolved) return`)를 끔 | hydrate 테스트 1건 실패(마크업 속성이 지워졌다가 다시 붙음) |

원복 뒤 47 통과.

## 2. 브라우저 실측 (측정)

구성: React 19.2.3 · react-dom 19.2.3 · esbuild 0.25.8 을 npm 으로 설치한 스크래치 앱 2개(npm `@axis-ds/theme@1.6.2` · 이 브랜치 pack tarball). `renderToString` 으로 SSR HTML 을 만들고(`<html data-brand>` 는 시나리오별) 클라이언트 번들이 `hydrateRoot`. Playwright 1.61.1 Chromium. `onRecoverableError` · 콘솔 오류 · `data-brand` MutationObserver 기록을 모음. 순서: 로드 → 「끔」 버튼(`setBrand(undefined)`) → 새로고침.

### 2.1 결과

| 시나리오(마크업 · defaultBrand) | npm 1.6.2: 마운트 → 끔 뒤 새로고침 | 이 브랜치: 마운트 → 끔 뒤 새로고침 |
|---|---|---|
| S1 없음 · ontology | ontology → **ontology**(해제 풀림, 저장값 null) | ontology → **null**(저장값 `""`) |
| S2 ontology · 없음 | **null**(마운트 때 지움, 기록 `[null]`) → null | **ontology**(기록에 null 없음) → null |
| S3 ontology · ontology | ontology → ontology(마크업이 다시 와서 켜짐) | ontology → null |
| S5 x · ontology | **ontology**(defaultBrand 가 덮음) → ontology | **x**(마크업 우선) → null |
| S6 없음 · 없음 | null → null | null → null |

- 두 빌드 모두 하이드레이션 recoverable 오류 0 · 콘솔 오류 0(이 브랜치는 저장값 「끔」 + 서버 defaultBrand 로 새로고침해 서버 HTML 「brand:ontology」, 하이드레이션 뒤 「brand:none」 인 S1 에서도 0).
- 이 브랜치 S2 · S3 · S5 의 새로고침 뒤 기록은 `[null]`: 하이드레이션이 끝난 뒤 저장값 「끔」을 반영하며 서버 마크업을 지운 것. PRD 1.3 의 남는 한계(첫 화면에 잠깐 보임)의 근거이고, 화면 깜박임 자체는 재지 않았어요.

## 3. check (측정, 이 브랜치 pack 한 cli · MCP)

- f1(`<html data-brand="ontology">` + `<ThemeProvider defaultTheme="system">`, npm theme 1.6.2 설치): cli 1.6.0 · MCP 1.3.3 PASS(거짓 초록), 이 브랜치 cli · MCP WARN `app/layout.tsx의 <html data-brand> 를 @axis-ds/theme 설치본 1.6.2 의 ThemeProvider 가 마운트 때 지웁니다 → @axis-ds/theme 1.7.0 이상으로 올리거나 setBrand("ontology")`.
- f2(같은 레이아웃에 `defaultBrand="ontology"`): PASS. 단위 테스트는 설치본 1.7.0 PASS · providers 파일 구성 · 판정 불가 WARN · ThemeProvider 없음 · defaultBrand 있음 PASS 를 봄.
- brand-core 사본: cli 원본을 고친 뒤 `cp`, sha256 d731ab19… 두 파일 동일, mcp T5-1 통과.

## 4. 남는 확인 (추정 · 미실행)

- Next.js App Router 실앱에서의 하이드레이션(이번 실측은 renderToString + hydrateRoot 정적 페이지).
- 발행 뒤 npm 1.7.0 으로 2.1 다시 재기.

## 배포 뒤 재측정 (2026-10-25)

- 대상: npm 발행본 tokens · theme · ui-react · agentic-ui 1.7.0, cli 1.6.1, mcp 1.3.4(run 40137182470, provenance 6/6). 레지스트리에서 설치해 node_modules 의 version 으로 확인했어요.
- 결과: 불일치 0. theme 1.7.0 과 1.6.2(음성 대조)로 S1~S6 과 우선순위 시나리오(저장값 > 마크업 > defaultBrand)를 브라우저에서 쟀고 모두 일치했어요. 1.7.0 은 recoverable 오류 · 콘솔 오류가 0건이에요. check 의 theme 버전 분기 WARN 도 문구까지 일치했어요.
- 원자료: `/tmp/claude-1000/-home-sinclair-work-idea-on-action-AXIS-Design-System/69d8f408-60b9-4bb2-8b0a-d1cb1f9af027/scratchpad/post3`
