# WI-0076: MCP 토큰 데이터 생성 테스트 계획 · 결과

> PRD: [prd.md](./prd.md) | 작성일: 2026-10-25 | 기준: `main` 3b5ed0f + 브랜치 `fix/batch6`(f774f7e 위)
> 표기: **측정**(이번에 실행해 얻은 값) · **계산**(값에서 유도) · **추정**(실행하지 않음)

## 1. 수정 전 재현 (측정, 음성 대조)

- 이 브랜치에서 수정 전에 `pnpm --filter @axis-ds/mcp build`(rc 0) 뒤 stdio 로 호출: `dist/data/tokens.json` 은 src 사본과 sha 같음(5509514…593d). `colors.primary` `hsl(222.2 47.4% 11.2%)`, `radius.control` · `spacing.5` · `colors.card` · `colors.input` · `colors.chart-1` · `control.h.md` · `brand.ontology` 7개 모두 「토큰을 찾을 수 없습니다.」이고 isError 없음.
- `turbo run build test --filter=@axis-ds/mcp --dry=json`: mcp build 의존 `['@axis-ds/registry-core#build']`, test 의존 `[]`.

## 2. 단위 · 회귀 테스트 (측정)

| 대상 | 결과 |
|---|---|
| `src/registry/tokens-sync.test.ts`(새 파일) | 20 통과. 원천은 이 파일에서 줄 단위로 따로 읽어요(생성기 파서 재사용 안 함) |
| 원천 비교 | variables.css :root 284 · .dark 284, shadcn :root 25 · .dark 25, json 284 를 전부 1:1 비교, 하한 단언(284 · 25), 생성 309 = 284 + 25 |
| 1.3.5 픽스처(AC3) | 값 다름 16(colors.primary · ring · fontFamily.sans · shadow.lg 포함, background 는 일치), 없어진 5, 없는 CSS 변수 4(`--radius-full` · `-lg` · `-none` · `-sm`). 생성본 자신과 비교하면 0 · 0 · 0(비교기 대조) |
| 생성기 throw | json 값 불일치 · .dark 블록 없음 · 모르는 접두(`--axis-motion-*`) · 호환 경로 원천 사라짐(`--ring`) · tokens 를 못 찾음 |
| 핸들러 | `control.h.md` · `--axis-control-h-md` · `space.4`(→ spacing.4) · `spacing.5` · `typography.fontSize.3xl` 조회, 상세의 다크 값 · `hsl(var(--primary))`, 미발견 null 과 안내 문구, 목록 합계 309 · 출처 버전 · density 필터 |
| mcp 전체 vitest | 7 파일 163 통과(수정 전 143 은 계산값: 163 - 20) |

### 2.1 변이 (측정, 각 변이 뒤 원본 sha 복원 확인)

| 변이 | 결과 |
|---|---|
| M0 생성기 없음(수정 전 소스) | rc 1, import 실패 |
| M1 생성 대신 1.3.5 손 사본 반환(copy-data 만 남긴 상태) | rc 1, 13 실패 |
| M2 `control.h.md` 값 하나 변조 | rc 1, 3 실패 |
| M3 shadcn 값 `hsl()` 감싸기 제거 | rc 1, 4 실패 |
| M4 `radius.md` 를 옛 `--radius` 로 | rc 1, 생성 단계 throw(경로 겹침) |
| M5 다크 값 누락 | rc 1, 1 실패 |
| M6 json 대 CSS 값 대조 제거 | rc 1, 1 실패(json 불일치 변이 테스트) |
| tokens dist 를 치운 채 vitest | rc 1, `Cannot find module …/@axis-ds/tokens/dist/json/tokens.json`(0건 통과 아님) |

## 3. 배포 경로 실측 (측정)

- pack tarball(`pnpm pack`, changeset 적용 전이라 version 1.3.5) 내용: `dist/data/tokens.json` 있음, `src/registry/data/tokens.json` 없음(`components.json` 만).
- 격리 HOME · XDG_CONFIG_HOME 에 tarball 과 npm `@axis-ds/tokens@1.8.0` 설치(rc 0, AXIS_* env 0개). stdio `list_tokens` 표 309행을 **발행본** tokens dist(variables.css · shadcn-compat.css)와 비교: 불일치 0, 표에 빠진 변수 0, stderr 비어 있음. 비교기 양성 대조: 원천 사본의 `--axis-control-h-md` · `--primary` 를 바꾸면 불일치 3(값 2 · 다크 1)으로 잡힘.
- 같은 서버: `colors.primary` · `control.h.md` · `--axis-control-h-md` · `spacing.5` · `radius.md` 는 찾음, `animation.duration.fast` · `brand.ontology` 는 `isError: true`. `list_tokens({category:"animation"})` 은 입력 검증 오류(-32602).
- `node scripts/mcp-smoke.mjs`(이 브랜치 빌드): OK, 번들 데이터 도구 호출 11건(종전 9건). 같은 스모크에 npm `@axis-ds/mcp@1.3.5` tarball: FAIL 4건(list_tokens 값 · 출처 · 밀도, get_token 값 · 다크, control.h.md, animation 경로 isError false).

## 4. 빌드 순서 · 캐시 (측정, AC6)

- 수정 뒤 `--dry=json`: mcp build · test 의존 모두 `['@axis-ds/registry-core#build', '@axis-ds/tokens#build']`. 두 번 재면 해시 같음(45a8cd80… · 3691d958…), `packages/axis-tokens/src/component/components.json` 값 하나를 바꾸면 be178080… · ddab2e25… 로 바뀌고 되돌리면 원래 해시.
- `turbo run test --force` 의 실행 태스크에 `@axis-ds/tokens:build` 가 들어 있음(mcp test 앞).
- changeset: tokens 단독 patch 임시 changeset 으로 `changeset status --verbose` 를 재면 linked 4패키지 · 예제 앱만 오르고 mcp 는 오르지 않음(devDependency). 이 WI changeset 을 함께 두면 mcp 1.4.0(minor).

## 5. 게이트 (측정)

| 게이트 | 결과 |
|---|---|
| `turbo run lint --force` | rc 0, 7/7, Cached 0 (mcp 포함) |
| `turbo run type-check --force` | rc 0, 11/11, Cached 0 |
| `turbo run build --force` | rc 0, 8/8, Cached 0, `[token-gen] @axis-ds/tokens 1.8.0 에서 토큰 309개 생성` |
| `turbo run test --force` | rc 0, 7/7, Cached 0 |
| check-token-refs · check-contrast-pairs · check-types-versions · check-library-links | 모두 rc 0 |
| build:registry · test:registry · check-licenses | 모두 rc 0 (생성물 `apps/web/public/r` version 1.8.0 은 1.5.0 으로 되돌림) |
| pack-smoke | rc 0, 퍼블리시 대상 6개, mcp stdio 18 도구 · 호출 11건 |
| cli-smoke · registry-install-smoke | rc 0 (g2 5/5) |
| E2E | 해당 없음(apps/web 변경 없음) |

- 빌드가 바꾼 `apps/web/public/templates/*.json` 5개는 updatedAt 한 줄씩만 바뀌어 되돌렸어요(템플릿 소스 변경 없음).

## 6. 발행 뒤 재측정 (예정)

- npm `@axis-ds/mcp@1.4.0` 을 격리 HOME 에 같은 버전대 tokens 발행본과 설치해 3절을 다시 재요. 출처 줄의 tokens 버전이 발행 시점 tokens 와 같은지도 봐요(WI-0077 이 linked 1.8.1 을 함께 내면 1.8.1 이어야 함).
