# WI-0078: library 상세 화면 E2E 스모크 테스트 계획 · 결과

> PRD: [prd.md](./prd.md) | TODO: [todo.md](./todo.md) | GitHub: #206 | 측정일: 2026-10-25 | 브랜치 `fix/batch6`(main 3b5ed0f 기준)
> 측정 산출물: `/tmp/claude-1000/-home-sinclair-work-idea-on-action-AXIS-Design-System/69d8f408-60b9-4bb2-8b0a-d1cb1f9af027/scratchpad/w6impl/WI-0078/`(로그 · 서버 로그 · 변이 스크립트 `serve-variant.sh` · 가드 재현 `run-guard.sh` · `guard-mutations.sh`)
> 서버: 모든 E2E 는 `E2E_SERVER=static`(정적 빌드 `out/`, 3101), `--workers=1`. 변이 사본은 scratchpad 에 복사해 PID 로 띄우고 끈 뒤 3101 리슨 0 을 확인했어요.

## 1. 대표 항목 (측정, `node apps/web/e2e/library-reps.cjs`)

| 종류 | id | 주소 | 코드 파일 | 기대 설치 명령 |
|---|---|---|---|---|
| code | axis-accordion | /library/ui/accordion/ | 1 | `npx @axis-ds/cli add accordion` |
| renamed | shadcn-accordion | /library/ui/shadcn-accordion/ | 0 | `npx shadcn@latest add accordion` |
| existing | monet-hero-with-image | /library/ui/hero-with-image/ | 0 | `npx monet add hero-with-image` |

a11y-routes.cjs 는 같은 code 대표를 써서 경로가 그대로예요(측정: `--count` 59, library 줄 수정 전후 diff rc 0).

## 2. 새 spec · 음성 대조 · 변이 (AC1 ~ AC4)

| # | 조건 | 결과(측정) | 판정 |
|---|---|---|---|
| T1 | 정상 `out/` | 4 passed | AC1 · AC4 PASS |
| T2 | `out/` 사본에서 `library/components/axis-accordion.json` 삭제(curl: 데이터 404 · 페이지 200) | rc 1, **code 1 실패** · renamed · existing · 자기 검사 3 통과. 실패 사유: 데이터 응답 404 · 오류 h1 · h1 · 설치 명령 · pre 0 · 파일 경로 | AC2 PASS |
| T3 | T2 와 같은 사본, **수정 전** a11y(`--grep library/ui/accordion`, READY 기본 h1) | rc 0, **4 passed**(거짓 초록 재현, 서버 로그 axis-accordion.json 404 6건) | 수정 전 결함 재현 |
| T4 | 사본의 상세 chunk(`page-163c4d7cc781fb99.js`) fetch 접두를 `/library/component/` 로 치환(잔존 0) | rc 1, **양성 3 모두 실패**(「요청이 관측되지 않음 (다른 주소: /library/component/<id>.json 404)」), 자기 검사도 「주입한 404 가 관측되지 않음 (측정 실패)」로 실패 | AC3 PASS |
| T5 | T4 조건에서 `node scripts/check-library-links.mjs` | rc 0(항목 129 · 파일 129 · 위반 0). public 소스만 보는 검사라 이 축을 못 봄 | AC3 축 차이 확인 |
| T6 | 판정 함수 퇴화 변이(judge 가 늘 빈 배열, 임시 spec 사본) | rc 1, 양성 3 통과 · **자기 검사 1 실패** | AC4 감지기 PASS |

## 3. a11y READY 좁히기 (AC6)

| # | 조건 | 결과(측정) |
|---|---|---|
| A1 | READY 변경 뒤, T2 사본에서 `a11y --grep library/ui/accordion` | rc 1, **4 failed**(`waiting for locator('h2:text-is("설치")')` 시간 초과) |
| A2 | READY 변경 뒤, 정상 `out/` 에서 a11y 전체 | rc 0, **236 passed**(expected 236 · unexpected 0 · flaky 0 · skipped 0, 17.7분) |
| A3 | A2 의 library 상세 4조합 axe 요약 | violations 0 · passes 24 · lowIncomplete 0(4조합 모두). 로드 뒤 화면(탭 · 코드 블록)을 재도 새 위반 없음 |

## 4. CI 건수 가드 (AC5)

frontend.yml 「E2E 실행 건수 가드」 run 본문을 yaml 에서 그대로 뽑아 `bash -e` 로 돌렸어요(`run-guard.sh`). 입력은 이번 E2E JSON(a11y 는 A2, 나머지는 CI step 과 같은 명령으로 실행).

| 조건 | 결과 |
|---|---|
| 정상 | rc 0. a11y 236 · nontext 8 · tokens 22 · demo 8 · tooltip 6 · library 4 |
| 기대값 `library:5` 로 바꾼 yml 사본 | rc 1 「library: 실행 4건 · skipped 0건 (기대 5건 · skipped 0)」 |
| 자기 검사 `test.skip` | rc 1 「실행 3건 · skipped 1건」 |
| 자기 검사 빼고 실행(`--grep-invert 감지기`) | rc 1 「실행 3건」 + 「library detail (감지기 자기 검사): 0건 (기대 1건)」 |
| JSON 원복 뒤 | rc 0 |

`library:4` 는 고정값이에요. 근거: 대표 3종은 규칙으로 고르고 못 고르면 설정 단계에서 멈추므로 데이터가 바뀌어도 3 이 그대로이고, 자기 검사는 1건이에요. 종류를 바꿀 때만 고쳐요(frontend.yml 주석에 기록).

## 5. 기존 E2E 불변 (AC6)

| suite | 결과(측정) |
|---|---|
| a11y | 236 passed |
| nontext | 8 passed |
| demo | 8 passed |
| tooltip | 6 passed |
| tokens | 22 passed |
| library(신규) | 4 passed, 10.4초 |

## 6. 게이트 (AC7)

| 게이트 | 결과(측정) |
|---|---|
| `pnpm turbo lint --force` | rc 0, 7/7, Cached 0 |
| `pnpm turbo type-check --force` | rc 0, 11/11, Cached 0 |
| `pnpm turbo build --force` | rc 0, 8/8, Cached 0. templates JSON 5개 updatedAt 만 바뀌어 되돌림 |
| `pnpm turbo test --force` | 1차 rc 1(mcp `template.test.ts` 5초 타임아웃, a11y 동시 실행 중) · 2차 rc 1(cli `guidance.test.ts` 5초 타임아웃, load average 37 · 8코어) · **3차 `--concurrency=1` rc 0**, 6/6, Cached 0(theme 47 · mcp 143 · cli 738 · ui-react 194 · agentic-ui 148). 실패 둘 다 이 WI 가 건드리지 않은 패키지의 시간 초과 |
| frontend.yml run 단계 | check-token-refs · check-contrast-pairs · check-types-versions · check-library-links · build:registry · test:registry · check-licenses · pack-smoke(퍼블리시 대상 6) · cli-smoke · registry-install-smoke(5/5) 모두 rc 0. build:registry 뒤 `public/r/index.json` · `registry.json` version 1.8.0 → 1.5.0 되돌림 |
| 새 spec 단독 tsc(e2e 는 apps/web tsconfig 에서 제외라 임시 tsconfig) | rc 0 |
| 새 spec 단독 eslint | `@typescript-eslint/no-require-imports` 규칙 정의 없음 1건. 기존 a11y.spec.ts 도 같은 오류 2건이라 기존 상태와 같음(e2e 는 `next lint` 대상 밖) |

## 7. 남은 확인

- PR CI run 에서 library step 4건 · 건수 가드 통과 확인(배치 6 묶음 PR 에서)
