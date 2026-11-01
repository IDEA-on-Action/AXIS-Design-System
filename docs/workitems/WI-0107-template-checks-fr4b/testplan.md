# WI-0107: 테스트 계획 · 결과

> PRD: [prd.md](./prd.md) | 작성일: 2026-11-01 | 상태: 측정 완료(2026-11-01)
> 환경: node v22.22.0 · pnpm 9.15.4 · WSL2 Linux x64. 구판 = origin/main 2d10c1c 에서 빌드한 cli · mcp dist(변경 전 같은 워크트리에서 `turbo run build --force`, Cached 0), 신판 = 이 브랜치 dist

## 1. 단위 · 패리티 · 비교 테스트

| 파일 | 수 | 내용 |
|---|---|---|
| `packages/axis-cli/src/template/template-checks.test.ts` | 42 | 5규칙 양성 · 음성, 주석 안 em-dash, cn() 조합, 같은 줄 중복 제거, 측정 실패(0파일 · EACCES), 링크 밖 · 안 · 순환 · 깨짐, node_modules · 점 디렉터리, 256KB · 한 줄 상한, 시간 상한 3건, template 이상값 12종(종전 출력과 JSON 같음), `__proto__` 키, 깨진 config, 문구(건수 · 첫 위치 · 안내 조건 · 소스 조각 없음 · 이스케이프), runCheck fail 불변, 패리티 5건, 동기화 2건 |
| `packages/axis-mcp/src/tools/template-checks.test.ts` | 12 | CLI = MCP 전 항목 비교(빈 디렉터리 · PASS · WARN · 레지스트리 전 컴포넌트 · 이상값 5종 · 측정 실패), 줄바꿈 파일 이름 출력 줄 수, 원격 checks 변형 4종 apply 뒤 결과 같음 |

- 패리티는 테스트 안에서만 `spawnSync(node, scripts/check-ontology.mjs)` 로 템플릿 스크립트를 실행해 출력 `파일:줄  규칙` 을 내장 판정과 순서까지 비교하고, 파일 수 · 종료 분류(0 · 1 · 2)도 맞춰요. 대상: 규칙 fixture, 템플릿 원본 files(두 구현 0건 · 20파일), 레지스트리 전 컴포넌트 사본, 링크 밖 · 순환 · 깨짐, 상한 · 링크 혼합.

### 변이 A/B(테스트가 결함을 잡는지, 구현을 바꾸고 해당 테스트 파일만 실행 · 원복 후 sha256 확인 OK)

| 변이 | 결과 |
|---|---|
| M1 내장 판정에서 HEX 보고 제거 | cli 8 failed / 42 |
| M2 MCP 10번째 항목 호출 제거 | mcp 6 failed / 12 |
| M3 정적 표를 일반 객체 색인으로 + slug 검사 제거 | cli 4 failed / 42 |
| M4 CSS 분해를 종전 정규식으로 | cli 2 failed / 42(시간 상한) |
| M5 링크를 무조건 따라감 | cli 2 failed / 42 |
| M6 경로 이스케이프 제거 | mcp 1 failed / 12, cli 1 failed / 42 |

## 2. 회귀

- `turbo run build --force`: 8/8, Cached 0. `turbo run type-check lint test --force`: 24/24, Cached 0(cli 1328 · mcp 265 · ui-react 199 · agentic-ui 148 · theme 47 통과)
- `pnpm pack-smoke` rc 0, `pnpm test:registry` 45 pass / 0 fail, `pnpm cli-smoke` OK, `pnpm registry-install-smoke` 5/5(agentic-tool-call-card 포함)
- `pnpm check-changeset-mcp-tokens` rc 0. 음성 대조: changeset 에서 cli 줄을 지우면 rc 1(「registry-core 를 바꿨는데 … @axis-ds/cli 올림이 없어요」), 원복 rc 0
- `pnpm changeset status --verbose`: cli 1.8.0 · mcp 1.5.0 (minor), agentic-ui 1.8.4 (patch). linked 다른 3개는 올라가지 않아요

## 3. 종전 출력 바이트 같음(신 · 구 dist A/B, 새 HOME · env 없음)

`env -i HOME=<새 HOME> PATH=$PATH node <dist>/index.js check -d <fixture>` 의 stdout · stderr · rc 를 문자열로 비교했어요.

| fixture | 결과 |
|---|---|
| 신판 dist 로 `template init` 한 theme-only · dashboard · hr-dashboard · landing-page, 빈 디렉터리, ontology-console 사본에서 template 을 지움 · `__proto__` · `constructor` · `toString` · 배열 · 숫자 · `dashboard` 로 바꾼 것, 깨진 axis.config.json | 13/13 같음(빈 디렉터리 rc 1, 나머지 rc 0) |
| 양성 대조: template 이 그대로인 ontology-console 사본 | 다름(신판만 10번째 줄) |

- 구판 템플릿 스크립트와 신판 스크립트를 템플릿 원본 사본 · 레지스트리 전 컴포넌트 사본(48파일)에 돌린 출력 `diff` rc 0(판정 불변, 위반 5건 같음)
- MCP: 같은 template 없는 사본에서 신 · 구 dist 의 `check_project` 본문 `diff` rc 0, 다른 바이트는 도구 설명 한 줄뿐

## 4. 실경로(새 HOME, env 주입 없음, 신판 dist)

- `template init ontology-console --dir app -y` rc 0(원격 사이트의 현재 템플릿, checks 필드 없음 · 구 스크립트 → 런타임이 checks 를 안 읽어도 동작함을 겸해 확인)
- `check -d app`: 신판 rc 0, 10번째 항목 `PASS … 파일 20개, 위반 0건`, 8 pass / 2 warn / 0 fail. 구판 rc 0, 해당 줄 0개, 7 pass / 2 warn. 나머지 줄은 같음(diff rc 0)
- 위반 주입(`lib/bad.ts` 에 U+2014 · `#ff0000`): 신판 rc 0, `WARN … 파일 21개, 위반 2건(em-dash 1 · palette 1), 첫 위치 "lib/bad.ts":1 em-dash → 전체 보기: npm run check:ontology`, 7 pass / 3 warn. 구판 해당 줄 0개. 같은 사본의 `npm run check:ontology`(배포된 구 스크립트) rc 1, 위반 2건(같은 목록)
- MCP stdio(신판 dist): 도구 설명에 「적용한 템플릿의 규칙 검사 포함(읽기 전용, 스크립트 실행 안 함)」, 같은 WARN 줄 `- [WARN] …`. 구판은 해당 줄 없음
- 이 브랜치 템플릿 사본: `npm run -s check:ontology` rc 0(20파일 · 0건), 양성 `lib/pos.ts` 에 `#ff0000` rc 1, 빈 디렉터리 rc 2

## 5. 시간 상한(구 · 신 템플릿 스크립트, 같은 입력, 250KB 안팎)

| 입력 | 구 스크립트 | 신 스크립트 |
|---|---|---|
| `.a{color:red}` + 여러 줄 꼬리 주석(4,000자 × 60줄) | 33,334ms | 51ms |
| 같은 내용 한 줄 12만 자 주석 | 7,576ms | 26ms(한 줄 상한으로 건너뜀 → 측정 실패 rc 2) |
| 닫히지 않은 `cn(` 반복 | 60,013ms 에 timeout | 205ms |
| `className={cn(` 반복 | 22,920ms | 53ms |
| `#fff` 반복(위반 다수, 줄 번호) | 9,826ms | 195ms |
| 닫히지 않은 `/*` 반복 | 2,472ms | 49ms |
| 중첩 `cn(` 2,000단 블록 | 904ms | 157ms |
| `\'` 반복(줄 안 2차, 한 줄 4,000자) | 882ms | 937ms(줄 상한이 묶는 최악값) |

- 회귀 테스트는 내장 판정으로 1초 상한을 둬요(12만 자 꼬리 주석 · 여러 줄 꼬리 주석 · 병적 입력 5종).

## 6. 레지스트리 전 컴포넌트 전수(D4)

- 실경로: 신판 dist 로 init 한 사본에 `axis add <30개 전부> -y`(rc 0, 50파일)
  - 원격 레지스트리(배포된 사이트, 아직 이 브랜치 아님): 위반 5건, `components/agentic/tool-call-card.tsx:111 em-dash` + card-shadow 4건
  - 이 브랜치 동봉 레지스트리(`AXIS_REGISTRY_URL=http://127.0.0.1:1/r` 로 원격을 막아 동봉본 사용, 측정 전제): 위반 4건, em-dash 0
- 남은 4건(모두 card-shadow, 카드 모양 `rounded-*` + `border` + `shadow-*` 휴리스틱): `components/ui/select.tsx:63` · `:64`(SelectContent 팝오버), `components/ui/toast.tsx:25` · `:26`(toast 변형). 둘 다 떠 있는 레이어의 그림자라 카드 규칙의 의도와 다른 오탐에 가까워요. 이번 PR 에서는 고치지 않았어요(open question)
