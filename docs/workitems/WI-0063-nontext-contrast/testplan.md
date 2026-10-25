# WI-0063: 기본 테마 비텍스트 대비 테스트 계획 · 결과

> PRD: [prd.md](./prd.md) | 작성일: 2026-10-25 | 기준: `main` f8a05be + 브랜치 `fix/batch4-a11y`(WI-0062 794e23f 뒤)
> 표기: **측정**(이번에 실행해 얻은 값) · **계산**(토큰 값에서 유도) · **추정**(실행하지 않음)

## 1. 토큰 (측정: node --test, tokens 전체 512 통과)

| 테스트 | 내용 | 결과 |
|---|---|---|
| `default-contrast.test` | 짝 표 전 69행(글자 · 아이콘 · 비텍스트) + 기본 전용 11짝(placeholder · shadcn destructive · 폼 컨트롤 경계 · 입력 경계 · 트랙 · 흰 썸 2 · Progress 채움 4) x 기본 라이트 · 다크 | 통과. 수정 전 dist(작업 시작 백업)로 같은 파일을 돌리면 33 실패(그중 새 변수 14칸은 「값 없음」, 나머지는 실제 미달) |
| `ontology-values.test` | 같은 표를 ontology 에 행의 min 으로, 완전성(새 6변수 포함), v1 팔레트 폐쇄성 | 통과. 새 Progress success · warning · destructive 는 hex 대신 `{color.*.500}` 참조라 팔레트 밖 hex 가 없음 |
| `brands.test` WI0063_SAME | 새 6변수 ontology 값 = 1.7.0 렌더 값, 그중 3개는 ontology 의 border-default · surface-tertiary · surface-brand 와 같음, 초안에 없는 이름 | 통과 |
| `baseline-1.2.1.test` | 1.2.1 대비 바뀐 기본 변수 = WI0029 + WI0062 + WI0063 예외 표 | 통과(예외 표 전에는 변수 7 · 신규 3 불일치) |
| `theme-modes.test` | components.json 색 leaf 47 → 53 | 통과 |

- ontology CSS(측정): `dist/css/brands/ontology.css` 를 수정 전 백업과 `diff` 하면 기존 줄 변경 0, 새 6변수 x 2블록 추가 12줄뿐이에요.

## 2. 단위 테스트 (측정: vitest)

| 파일 | 건수 | 내용 | 수정 전 소스 |
|---|---|---|---|
| agentic `src/nontext-contrast.test.tsx` | 20 | 양성 대조 1(아이콘 20+ · 점 10+ · 테두리 5+), 17개 렌더 x 아이콘 · 점 · 테두리에 3:1 미만 상태 색 없음, PlanCard · ToolCallCard 스피너 arc 불투명 2 | **14 실패** |
| ui-react `src/nontext-contrast.test.tsx` | 6 | Checkbox · Radio · Textarea 경계, Switch · Slider 트랙, Progress 4변형 채움 | **6 실패** |

- 수정 전 소스: 컴포넌트 소스만 `git show HEAD:`(WI-0062 커밋)로 되돌려 돌린 뒤 백업으로 복원했어요(`scratchpad/wa11y/w62/bak63`).
- 전체: agentic-ui 148 · ui-react 194 · cli 738 · mcp 143 · theme 47 통과(turbo test `--force`).

## 3. E2E (측정: static 빌드, chromium)

| 스위트 | 결과 | 비고 |
|---|---|---|
| nontext(`brand-nontext-contrast`) | 8 통과 | 기본 브랜드 주 표식 최솟값 3.34(RunProgress 진행 점 / 현재 단계 회색 바탕). 2026-10-19 하한 8쌍(2.28 · 2.54 · 2.83 · 2.97)은 5.02 · 4.83 · 3.68 · 4.49 로, `DEFAULT_BRAND_FLOOR` 를 비웠어요 |
| a11y | 40 통과 | |
| demo | 8 통과 | |
| tooltip | 6 통과 | |
| tokens | 22 통과 | dark-tokens 라이트 고정 기준값 3개 · 다크 기대 맵(input-border-default 제외 · hover · progress-fill 4 추가) 갱신 |

- 첫 nontext 실행은 4 실패였어요: 잔여 프로브가 `--axis-status-warning` 을 직접 적고 있었고, 기록용 행(PlanCard 왼쪽 선 · 진행 막대)이 쓰는 `--axis-status-success` 가 계산 색 맵에서 빠졌어요. 둘을 고친 뒤 8 통과예요.

## 4. 브라우저 측정 (측정)

- axe(WI-0062 testplan 3절과 같은 스크립트 · 경로 59 x 4환경 = 236회, 최종 빌드): color-contrast 위반 0 · 비대비 위반 0 · incomplete 중 수치 4.5 미만 0. 모든 실행이 HTTP 200, 브랜드 · 테마 프로브 일치, passes 최소 19. 수정 전 빌드는 같은 스크립트로 62 · 26 · 23 · 22 와 incomplete 미달 45 를 잡았어요(양성 대조).
- 폼 컨트롤 실요소(`scratchpad/wa11y/w62/ctrl-probe.mjs`, 문서 페이지의 실제 요소 경계 · 트랙 · 채움 대 가장 가까운 불투명 바탕):

| 요소 | 기본 라이트 전 → 후 | 기본 다크 전 → 후 | ontology 라이트 · 다크(전 = 후) |
|---|---|---|---|
| Checkbox · Radio · Textarea 경계 | 1.24 → 4.83 | 1.36 → 4.12 | 1.15 · 1.42 |
| Input 경계 | 1.47 → 4.83 | 1.93 → 4.12 | 1.31 · 3.37 |
| Switch 꺼짐 · Slider 트랙 | 1.24 → 4.83 | 1.36 → 4.12 | 1.10 · 1.40 |
| Progress default · success 채움 | 2.97 · 1.84 → 4.17 · 4.05 | 2.84 · 6.44 → 3.99 · 6.44 | 4.21 · 1.93 / 4.79 · 5.99 |

- ontology 불변: `/docs/brand-demo/` html 계산값(`ont-probe.mjs`)은 기존 289개 차이 0, 새 6개만 추가(값은 1.7.0 렌더 값). 26경로 x 라이트 · 다크 요소 22,656개의 color · background · border · opacity · fill · stroke 를 수정 전 · 후 빌드에서 비교(`render-probe.mjs`)하면 차이는 진행 스피너 arc opacity 0.75 → 1(PlanCard · ToolCallCard · brand-demo, 의도한 변경)과 pulse 애니메이션 위상(같은 요소의 opacity 0.93 · 0.60 등, 측정 시점 차이)뿐이에요.
- 추정(미측정): hover · focus 상태의 포커스 링은 토큰 계산(3.68 · 5.47)과 nontext E2E(ontology 포커스 링)로만 봤고, 기본 브랜드 버튼 포커스 링을 실제로 포커스해 재지는 않았어요.

## 5. 게이트 (측정: `scratchpad/wa11y/w62/gates63/summary.txt`)

| 단계 | 결과 |
|---|---|
| turbo lint · type-check · build · test(각각 `--force`) | rc 0, 캐시 0 |
| check-token-refs · check-contrast-pairs · check-types-versions · check-library-links | rc 0(짝 표 부모 근거 21행 위반 0) |
| build:registry · test:registry · check-licenses · pack-smoke · cli-smoke · registry-install-smoke | rc 0 |

- `build:registry` 가 version 을 1.7.0 으로 쓰는 것을 1.5.0 으로 되돌렸고(WI-0052 선례), `pnpm build` 뒤 public/templates 5파일은 updatedAt 만 바뀌어(내용 diff 0) 되돌렸어요.
