# WI-0107: 테스트 계획 · 결과

> PRD: [prd.md](./prd.md) | 작성일: 2026-11-01 | 상태: 측정 완료(2026-11-01)
> 환경: node v22.22.0 · pnpm 9.15.4 · WSL2 Linux x64. 구판 = origin/main 2d10c1c 에서 빌드한 cli · mcp dist(변경 전 같은 워크트리에서 `turbo run build --force`, Cached 0), 신판 = 이 브랜치 dist

## 1. 단위 · 패리티 · 비교 테스트

| 파일 | 수 | 내용 |
|---|---|---|
| `packages/axis-cli/src/template/template-checks.test.ts` | 42(2차 반영 뒤 64) | 5규칙 양성 · 음성, 주석 안 em-dash, cn() 조합, 같은 줄 중복 제거, 측정 실패(0파일 · EACCES), 링크 밖 · 안 · 순환 · 깨짐, node_modules · 점 디렉터리, 256KB · 한 줄 상한, 시간 상한 3건, template 이상값 12종(종전 출력과 JSON 같음), `__proto__` 키, 깨진 config, 문구(건수 · 첫 위치 · 안내 조건 · 소스 조각 없음 · 이스케이프), runCheck fail 불변, 패리티 5건, 동기화 2건 |
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

### 4.1 검토 반영 뒤 실경로 재측정(새 HOME, env -i, 이 브랜치 템플릿 files 사본, 신판 dist)

- 템플릿 사본: 신판 PASS 「파일 20개, 위반 0건」 rc 0, origin/main dist 는 해당 줄 0개, `npm run -s check:ontology` rc 0
- 검토 3a fixture(1행 `#ff0000` + U+2014, 2행 4,100자 주석): 신판 WARN 「위반 2건(em-dash 1 · palette 1), 첫 위치 "lib/bad.ts":1 em-dash」 rc 0, 스크립트 rc 1(반영 전에는 파일째 건너뛰어 PASS · rc 0)
- `cn(\"` 반복 258KB 파일 3개: check 204ms PASS, 스크립트 106ms rc 0(반영 전 검토 측정 53,680ms · 24,030ms)
- `\'` 반복 250KB 파일 20개: check 318ms, 스크립트 230ms(반영 전 검토 측정 16,231ms · 16,680ms)
- 숨은 문자 파일 이름(태그 6 · ZWSP · BOM · 따옴표): WARN 줄의 서식 · 제어 문자 0개, 태그는 `\u{e0049}` 꼴, 따옴표는 `\u0022`
- 첫 위치: 1행 palette · 2행 card-shadow fixture 에서 「"lib/order.ts":1 palette」
- 270KB 파일 하나만 더함: WARN 「일부 측정 실패, 파일 20개 위반 0건, 건너뜀: 크기 상한(256KB) 초과 1개」 rc 0, 스크립트 rc 2
- template 없음 · `"__proto__"` · 빈 디렉터리: 신판과 origin/main dist 의 stdout · stderr · rc 같음(3/3), 양성 대조(template 있음)는 다름

## 5. 시간 상한(구 · 신 템플릿 스크립트, 같은 입력, 250KB 안팎)

| 입력 | 구 스크립트 | 신 스크립트 |
|---|---|---|
| `.a{color:red}` + 여러 줄 꼬리 주석(4,000자 × 60줄) | 33,334ms | 51ms |
| 같은 내용 한 줄 12만 자 주석 | 7,576ms | 26ms(검토 반영 전 측정: 한 줄 상한으로 건너뜀. 반영 뒤에는 줄 상한이 없고 판정함) |
| 닫히지 않은 `cn(` 반복 | 60,013ms 에 timeout | 205ms |
| `className={cn(` 반복 | 22,920ms | 53ms |
| `#fff` 반복(위반 다수, 줄 번호) | 9,826ms | 195ms |
| 닫히지 않은 `/*` 반복 | 2,472ms | 49ms |
| 중첩 `cn(` 2,000단 블록 | 904ms | 157ms |
| `\'` 반복(줄 안 2차, 한 줄 4,000자) | 882ms | 937ms(검토 반영 전). 반영 뒤 내장 판정 12ms(5.1절) |

- 회귀 테스트는 내장 판정으로 1초 상한을 둬요(12만 자 꼬리 주석 · 여러 줄 꼬리 주석 · 병적 입력 5종).

### 5.1 검토 반영(2026-11-01): 2차 시간 2건 · 줄 상한 제거

- 내장 판정(esbuild 번들) 구 HEAD(fd1bc76) → 신, 250KB 입력
  - `cn(\"` 반복(한 줄 4,095자): 5,133ms → 24ms. 같은 패턴을 테스트 러너로 한 줄 전체에 두면 구판 35,317ms
  - `\'` 반복(한 줄 4,000자): 835ms → 12ms. 한 줄 전체면 구판 53,964ms
- 적대 입력 35종 × 줄 길이 3가지(한 줄 전체 · 4,000 · 200) 신판 최악 242ms(`cn({` 반복, 작업량 상한으로 partial)
- 회귀 테스트: 위 패턴 6가지 500ms 상한(구판 A/B 에서 모두 실패), 겹친 `cn(` 8만 개는 partial · 1초 상한
- 작업량 상한(글자 수 × 16 + 100,000): 레지스트리 · 템플릿 소스 85개에 기본값 0 으로 배수만 바꿔 재면 배수 2 까지 partial 0개, 배수 1 에서 1개(input.tsx). 배수 16 은 실제 소스가 쓰는 양의 8배 여유예요
- 선형화가 판정을 바꾸지 않았는지: 구 · 신 `inspectOntologySource` 차분 퍼징 12만 건(위반이 있는 입력 85,236건) 차이 0. 음성 대조로 신판 문자열 표의 역슬래시 처리를 한 글자 바꾸면 1만 5천 건 중 456건 차이

## 6. 레지스트리 전 컴포넌트 전수(D4)

- 실경로: 신판 dist 로 init 한 사본에 `axis add <30개 전부> -y`(rc 0, 50파일)
  - 원격 레지스트리(배포된 사이트, 아직 이 브랜치 아님): 위반 5건, `components/agentic/tool-call-card.tsx:111 em-dash` + card-shadow 4건
  - 이 브랜치 동봉 레지스트리(`AXIS_REGISTRY_URL=http://127.0.0.1:1/r` 로 원격을 막아 동봉본 사용, 측정 전제): 위반 4건, em-dash 0
- 남은 4건(모두 card-shadow, 카드 모양 `rounded-*` + `border` + `shadow-*` 휴리스틱): `components/ui/select.tsx:63` · `:64`(SelectContent 팝오버), `components/ui/toast.tsx:25` · `:26`(toast 변형). 둘 다 떠 있는 레이어의 그림자라 카드 규칙의 의도와 다른 오탐에 가까워요. 6.1절에서 컴포넌트 쪽을 고쳐 없앴어요

### 6.1 사용자 결정 [A] 반영(2026-11-01 2차): select · toast 를 토큰 그림자로

- 바꾼 것: `SelectContent` 의 `shadow-md`, `toastVariants` 기본의 `shadow-lg` 를 Dialog 와 같은 `shadow-[shadow:var(--axis-shadow-lg)]` 로(테두리 · 판정 규칙은 그대로). r/ select · toast · index · registry 를 `pnpm build:registry` 로 다시 만들고 `version` 은 1.5.0 으로 되돌렸어요(mcp registry-guard 하드코딩)
- 값 실측: tokens dist `css/variables.css` 의 `--axis-shadow-lg` 는 `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`(밝은 · 어두운 테마 같음)이고 Tailwind 3.4.19 기본 `boxShadow.lg` 와 글자까지 같아요. `md` 는 `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)`. ontology 브랜드(`css/brands/ontology.css`)는 `--axis-shadow-lg: 0 8px 24px rgba(17,20,24,.10)`(어두운 테마 `rgba(0,0,0,.50)`), `--axis-card-shadow: 0 0 #0000`
- 레지스트리 전 컴포넌트(r/*.json 의 files 30개)를 템플릿 사본에 넣은 48파일: 신판 스크립트 위반 0건 rc 0, 같은 방법으로 HEAD(91c8d12) r/ 를 넣은 대조군은 card-shadow 4건(`select.tsx:63 · 64`, `toast.tsx:25 · 26`) rc 1. 패리티 테스트 「레지스트리 전 컴포넌트를 넣은 사본」은 두 구현 위반 0건 · 파일 수 같음을 요구하도록 바꿨어요
- 걸리지 않는 이유(판정 동작, 탐침 fixture): 같은 `rounded-md border` 묶음에서 `shadow-[shadow:var(--axis-shadow-lg)]` · `shadow-[shadow:0_4px_8px_rgb(0_0_0/0.5)]` 는 0건, `shadow-[var(--axis-shadow-lg)]` · `shadow-[0_4px_8px_var(--x)]` · `shadow-lg` 는 card-shadow. 그림자 정규식이 대괄호 안의 `:` 를 받지 않기 때문이고 토큰 여부와는 관계없어요. 두 번째 줄의 `_rgb(` 는 palette 로도 잡히지 않아요(릴리스 노트 한계 절)

## 7. 사용자 결정 [B] 반영(2026-11-01 2차): 프로젝트 전체 예산

- 값: 판정할 파일 4,000개 · 읽는 바이트 합계 16MB(두 구현 같음). 크기는 목록을 모을 때 본 `stat` 크기로 셈
- 근거 분포(app · components · lib, 확장자 6종): 템플릿 원본 20파일 45,857B, 레지스트리 전 컴포넌트를 넣은 사본 48파일 164,133B(최대 9,292B, 중앙값 3,002B), 이 레포 `apps/web/src` 101파일 405,360B(최대 12,904B). 사본 대비 파일 수 83배 · 바이트 102배, apps/web 대비 약 40배 여유
- 순서: 대상 순서(app → components → lib) → 디렉터리 이름 정렬 깊이 우선. 파일 수는 4,001번째 판정 대상을 만나면 목록 모으기를 멈추고, 바이트는 읽기 전에 합계가 넘을 파일에서 멈춰요(합계가 예산과 같으면 멈추지 않음). 바이트 사유가 목록에서 더 앞이면 바이트 사유
- 문구: 건너뜀에 「프로젝트 예산 초과로 측정 중단(파일 4000개 상한)」 · 「(읽기 16MB 상한)」, 위반 0건이면 WARN 일부 측정 실패 · 스크립트 rc 2, 위반이 있으면 위반 WARN(스크립트 rc 1)에 같은 문구
- 시간 상한은 두지 않았어요. 기기 부하에 따라 멈추는 파일이 달라져 두 구현 · 두 실행의 결과가 달라지고 패리티 테스트가 흔들려요
- 주입: 코어는 `inspectOntologyRules(dir, targets, budget)` 인자(테스트 전용, axis check · MCP 는 기본값), 스크립트는 환경변수 `CHECK_ONTOLOGY_MAX_FILES` · `CHECK_ONTOLOGY_MAX_BYTES`(양의 정수이고 기본값보다 작을 때만, `99999` · `0` · `abc` · `-1` · `1e9` 는 무시함을 테스트)
- 테스트 8건 추가(cli template-checks 64건 통과): 기본값, 파일 수 예산(같은 파일에서 멈춤 · 뒤 위반 안 봄 · rc 2), 경계(같으면 안 멈춤), 바이트 예산(위반 우선 rc 1 · 중단 문구), 바이트가 앞선 사유, 기본 4,000개(4,001개 프로젝트, 환경변수로 못 올림), 기본 16MB(255KB 66개 → 64개), 템플릿 · 레지스트리 사본은 예산 안

### 7.1 변이 A/B(구현을 바꾸고 cli template-checks 만 실행, 원복 뒤 두 파일 sha256 같음 확인)

| 변이 | 결과 |
|---|---|
| M1 코어 바이트 예산 판정 제거 | 3 failed / 64 |
| M2 코어 파일 수 예산 판정 제거 | 2 failed / 64 |
| M3 스크립트만 파일 수 기본값 4001 | 2 failed / 64(기본 4,000개 패리티 · 공개 JSON 동기화) |
| M4 스크립트만 바이트 비교 `>=` | 2 failed / 64(바이트 사유 패리티 · 공개 JSON 동기화) |
| M5 스크립트만 환경변수로 올리기 허용 | 2 failed / 64(환경변수 무시 · 공개 JSON 동기화) |
| M6 스크립트만 예산 중단을 미완료로 안 셈 | 5 failed / 64 |

### 7.2 실경로(이 브랜치 dist, 새 HOME, `env -i`)

| 사본 | `axis check` 항목 | 시간 | `npm run -s check:ontology` |
|---|---|---|---|
| 템플릿 원본 | PASS 「파일 20개, 위반 0건」 rc 0 | 196ms | rc 0 |
| 원본 + `lib/x00` ~ `x40` 아래 4,100파일 | WARN 「일부 측정 실패, 파일 4000개 위반 0건, 건너뜀: 프로젝트 예산 초과로 측정 중단(파일 4000개 상한)」 rc 0 | 277ms | rc 2, 같은 건너뜀 |
| 원본 + 255KB 파일 66개 | WARN 「… 파일 82개 위반 0건, 건너뜀: … (읽기 16MB 상한)」 rc 0 | 1,478ms | rc 2, 파일 82개 |
| 250KB 적대 입력 80개(`cn({`) | WARN, 파일 65개, 작업량 상한 65개 · 읽기 16MB 상한 | 4,468ms | rc 2, 4,649ms |
| 같은 수(`\'`) | WARN, 파일 65개 · 읽기 16MB 상한 | 927ms | rc 2, 855ms |
| 같은 수(`cn(\"`) | WARN, 파일 65개 | 2,620ms | rc 2, 2,368ms |

- 종전 출력 바이트 같음: template 없음 · `"__proto__"` · 빈 디렉터리에서 origin/main dist(구판)와 신판의 `axis check` stdout+stderr+rc, MCP `axis.check_project` 응답 본문이 3 × 2 모두 같음(`cmp`)


## 8. 독립 검토 반영(2026-11-01 3차)

### 8.1 지적 재현(고치기 전 HEAD fe2e245)

| 지적 | 재현 결과 |
|---|---|
| 템플릿 utils 의 기본 `twMerge` | tailwind-merge 2.6.0 에서 HEAD 템플릿 `lib/utils.ts` 의 `cn('rounded-md border shadow-[shadow:var(--axis-shadow-lg)]', 'shadow-black/50')` → `rounded-md border shadow-black/50`(그림자 사라짐). 신판은 `… shadow-[shadow:var(--axis-shadow-lg)] shadow-black/50`, `shadow-none` 을 주면 `rounded-md border shadow-none` 으로 레지스트리 utils 와 같음 |
| 판정 대상 밖 항목의 순회 | 검토자 사본에 HEAD 코어(esbuild 번들): 같은 파일 링크 20만 개 9,755ms · 빈 `.md` 30만 개 2,952ms · 빈 디렉터리 10만 개 1,837ms, 셋 다 `checked 1`, `budgetStop null`(PASS) |
| 파이프에서 stdout 잘림 | 위반 4,100파일 사본, HEAD 스크립트 `2>/dev/null \| (sleep 0.3; cat) \| wc -l` 534 · 534 · 1,914줄, `\| tail -1` 은 위반 줄. 신판은 3회 모두 4,002줄, 마지막 줄이 요약 |

### 8.2 바꾼 것과 테스트

- 디렉터리 항목 예산 50,000개: readdir 가 돌려준 이름을 숨김 · `node_modules` 까지 모두 세고, 넘는 다음 이름에서 목록 모으기를 멈춰요(사유 `entries`, 문구 「프로젝트 예산 초과로 측정 중단(디렉터리 항목 50000개 상한)」). 값 근거: 템플릿 원본 · 레지스트리 사본은 수십 개, 파일 수 예산 4,000개의 12.5배. 검토자 사본에서 신판 코어는 링크 20만 개 3,329ms · `.md` 30만 개 722ms · 빈 디렉터리 10만 개 730ms, 셋 다 `budgetStop entries`(일부 측정 실패), 스크립트 rc 2
- 스크립트: `process.exitCode = main()`, 위반 + 판정 못 한 파일이면 stderr 「위반이 있고, 판정하지 못한 파일도 있어요 (건너뜀 참고)」
- 템플릿 `lib/utils.ts`: 레지스트리 utils 와 같은 `extendTailwindMerge`(그림자 그룹에 `^\[shadow:.+\]$`), 공개 JSON 재생성(index.json 은 updatedAt 만 바뀌어 되돌림)
- 테스트 4건 추가(cli template-checks 68건 통과): 항목 예산(대상 밖 이름 · 숨김 · 디렉터리 · 중복 링크를 셈, 경계 같으면 안 멈춤, 패리티), 기본 50,000개(5만 `.md` 뒤 위반 안 봄, axis check WARN, 환경변수로 못 올림), 느린 파이프에서 마지막 줄이 요약 · rc 1 · stderr 안내, 템플릿 utils 의 그림자 병합 설정이 레지스트리 utils 와 같음

### 8.3 변이 A/B(구현을 바꾸고 cli template-checks 만 실행, 원복 뒤 세 파일 sha256 같음 확인)

| 변이 | 결과 |
|---|---|
| M1 코어 파일 수 예산 판정 제거 | 2 failed / 68 |
| M2 스크립트 파일 수 예산 판정 제거 | 4 failed / 68 |
| M3 코어 바이트 예산 판정 제거 | 3 failed / 68 |
| M4 스크립트 바이트 예산 판정 제거 | 4 failed / 68 |
| M5 코어 항목 예산 판정 제거 | 2 failed / 68 |
| M6 스크립트 항목 예산 판정 제거 | 3 failed / 68 |
| M7 스크립트 `process.exit(main())` 로 되돌림 | 2 failed / 68 |
| M8 템플릿 utils 의 `cn` 이 확장 안 한 twMerge 를 씀 | 1 failed / 68 |
| M9 템플릿 utils 의 그림자 그룹 등록 제거 | 1 failed / 68 |
| M10 템플릿 utils 를 HEAD 판으로 | 1 failed / 68 |

### 8.4 실경로(이 브랜치 dist, 새 HOME, `env -i`)

| 사본 | `axis check` 항목 | 시간 | `npm run -s check:ontology` |
|---|---|---|---|
| 템플릿 원본 | PASS 「파일 20개, 위반 0건」 rc 0 | 126ms | rc 0, 느린 파이프 마지막 줄 요약 |
| 원본 + `app/zz` 아래 `lib/utils.ts` 링크 6만 개 | WARN 「일부 측정 실패, 파일 7개 위반 0건, 건너뜀: 프로젝트 예산 초과로 측정 중단(디렉터리 항목 50000개 상한)」 rc 0 | 1,525ms | rc 2, 1,438ms, 같은 건너뜀 |
| 원본 + 위반 4,100파일 | WARN 「파일 4000개, 위반 3980건 … 건너뜀: … (파일 4000개 상한)」 rc 0 | 227ms | rc 1, stderr 안내, 느린 파이프 마지막 줄 요약 |

- MCP `axis.check_project` 도 링크 · 위반 사본에서 같은 문구
- 종전 출력 바이트 같음: template 없음 · `"__proto__"` · 빈 디렉터리에서 구판 dist 와 신판의 `axis check` 출력+rc, MCP 응답 본문 3 × 2 모두 같음(`cmp`)
- 품질 게이트: turbo type-check lint test `--force` 24/24 Cached 0 rc 0, turbo build `--force` 8/8 Cached 0 rc 0, pack-smoke · check-changeset-mcp-tokens · test:registry · registry-install-smoke rc 0
