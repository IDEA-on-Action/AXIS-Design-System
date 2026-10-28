# WI-0097: check 의 CSS import 해석 가능성 판정 구현 계획

> PRD: [prd.md](./prd.md) | 같은 발행: WI-0098(#242) · WI-0100(#244) | 순서: WI-0100a → **WI-0097** → WI-0100b, WI-0098 은 병렬(경계 보고서 2절)
> 줄 번호는 `main` 18d0357 기준이에요. WI-0100a 가 먼저 머지되면 `checkGlobalsCss` · `checkTailwindSetup` 줄이 움직이므로 착수 때 다시 읽어요

## 1. 소유 원칙 (경계 보고서 1-2)

- **WI-0100 이 「어느 파일을 읽나」**를 맡아요(진입 파일 선택 · 상대 `@import` 펼침)
- **이 WI 가 「그 줄이 이 앱에서 해석되나」**를 맡아요. 해석 상태를 registry-core 공용 헬퍼로 만들고, 루트 선언 인정은 `rootDeclarationsAllowed`(P1 · P2) 와 `pnpRootOnlyDependency` 로 갈라요
- WI-0100 은 상대 경로만 펼치고 패키지 경로 줄은 이 WI 헬퍼에 넘겨요. 펼쳐서 찾은 근거도 해석될 때만 인정해요
- WI-0098 은 TW4 에서 `inspectTailwindContent` 가 `null` 이라 판정이 겹치지 않아요

## 2. 고칠 지점

| 파일:줄 | 변경 | 소유 |
|---|---|---|
| `packages/axis-registry-core/src/project.ts` (`:178-213` 옆) | 새 헬퍼 2개(이름은 구현 때 확정). ① 컴포넌트 `tailwind.css` 해석 상태: `app` · `pnp-root-only` · `app-lockfile`(P2) · `root-not-installed` · `root-old`(설치본 버전) · `root-missing-file` · `root-ok` · `undeclared`. `declaredDependency` · `pnpRootOnlyDependency`(`:206-213`) · `hasAppLockfile` · `findInstalledPackage`(`:498-519`) · `isFile` 를 조합 ② tokens CSS 해석 상태: 앱 선언이면 설치 여부와 상관없이 해석됨으로 봄(Q28, PnP · non-PnP 공통), PnP 루트 전용이면 `pnp-root-only`, non-PnP 는 그 밖에 `findInstalledPackage` 디렉터리가 있으면 해석됨, 그 밖(루트 선언 · 미설치, 미선언 · 미설치, PnP 앱 미선언)은 해석 안 됨 | 0097 |
| 같은 파일 또는 registry-core 새 모듈 | DEC-2 미루는 이유 문구 함수(`theme/index.ts:367-385` 의 세 갈래 문장)와 1.4.0 상수 이전. cli 쪽 접두(`  ! `) · `chalk` 는 cli 에 남김 | 0097 |
| `packages/axis-registry-core/src/template/tailwind-core.ts:393` `TAILWIND4_MIN_AXIS_VERSION` | `theme-add.ts:115` `COMPONENT_TAILWIND_CSS_MIN_VERSION` 과 하나로(값 `"1.4.0"` 같음) | 0097 |
| `tailwind-core.ts:818-850` `tailwind4Issues` | B1 줄 없음 방향 `:826-835`: `declaredRange` 대신 ①의 상태로 갈래(prd 1.4 표). 줄 있음 방향 `:843-849`: 해석 불가 WARN 추가, 1.3.0 은 종전 문구. 입력 `css` 는 WI-0100b 뒤 펼친 문자열이 될 수 있음(근거 문자열 · 진입 문자열을 나눠 받는 모양은 0100b 가 정함) | 0097 단독 |
| `tailwind-core.ts:862-899` `checkTailwindSetup` TW4 | 루프(`:868`)는 0100a 가 교체. pass 문구 `:891-895` 는 바꾸지 않음(D4) | 루프 0100 · 문구 0097 |
| `tailwind-core.ts:297-305` · `:324-338` | 정규식은 0100 이 소유, 이 WI 는 찾은 spec 을 ②로 넘기기만 함 | 정규식 0100 · 해석 0097 |
| `tailwind-core.ts:353-389` `checkGlobalsCss` | 뼈대(후보 루프 `:355`, 레이아웃 폴백 위치 `:364-366`)는 0100a 가 먼저 옮김. 이 WI 는 pass 를 내기 직전에 ② 게이트를 붙임(import 갈래 · 레이아웃 JS 갈래 둘 다, `--axis-*` 직접 정의 갈래는 게이트 없음) | 뼈대 0100 · 게이트 0097 |
| `tailwind-core.ts:1-33` 머리 주석(`:12-14` · `:24-26`), `:55-65` 주석 | 「B1 은 `declaredRange` 그대로(Q6 · Q7)」 서술을 Q21 · Q22 로 갱신. 범위를 넓히는 커밋에서 같이 고침(서술이 그 순간 거짓이 됨) | 0097 |
| `packages/axis-cli/src/theme/theme-add.ts:395` · `:404-419` · `:115` | ① 헬퍼 호출로 교체, 상수 import. 결과 `componentImports` · `deferredComponentImports` 는 같은 값 | 0097 |
| `packages/axis-cli/src/theme/index.ts:367-385` | 이전한 문구 함수 호출로 교체(출력 바이트 불변) | 0097 |
| `packages/axis-cli/src/template/template-check.ts:41 · 44`, `packages/axis-mcp/src/tools/template.ts:409 · 412` | 변경 없음(재수출 `export *` 로 새 export 자동 포함, 추정) | - |
| `packages/axis-cli/README.md:101` · `:104` · `:109` | B1 두 방향(`:104` 는 Tailwind 4 문제 5번, 줄 있음 방향이 버전 조건 밖으로 넓어짐) · globals 해석 조건 | `:109` 는 0100 과 함께 고침 |
| `docs/guides/troubleshooting.md` 2절(Tailwind 스타일 미적용) | PnP 한 줄(Q27): 루트에만 선언한 패키지의 CSS import 는 앱이 해석하지 못함 → 앱 package.json 에 선언. 0098 의 PnP 문구와 한 줄로 합칠지는 먼저 머지하는 WI 가 쓰고 뒤 WI 가 덧붙임 | 0097 · 0098 |
| `.changeset/` | cli patch + mcp patch | 0097 |

## 3. 구현 단계 · 다른 WI 와의 순서

| 단계 | 내용 | 충돌 지점 |
|---|---|---|
| 0 | Q22 실빌드 1회(todo 결정 2번). rc 0 이면 중단 | - |
| 1 | WI-0100a 머지 확인 후 그 위에서 브랜치 | `checkGlobalsCss` 뼈대 · `:868` 루프 · `findGlobalCss` 이전(`project.ts:374` 옆) |
| 2 | HEAD 기준선 고정, 4절 목록 확정 | - |
| 3 | registry-core 헬퍼 ① · ② · 문구 함수 · 상수 통합, 단위 테스트(registry-core 는 테스트 스크립트가 없어 cli `template-check.test.ts` 의 「WI-0097」 describe 에 둠) | `project.ts` 텍스트 충돌(0100 `findGlobalCss`, 0098 unplugged 헬퍼) |
| 4 | theme add 호출 교체 → `theme-add.test.ts` 전부 통과 확인(AC9) | `theme-add.ts` import 블록(`:45` 부근)을 0100(`:424`) · 0098(`:479-485`)이 함께 건드림 |
| 5 | B1 두 방향 · globals 게이트, 주석 | `template-check.test.ts` 블록(0100 `:230-347`, 0098 `:2129-2214`) |
| 6 | 테스트 · A/B probe · 변이 · fixture 재측정 · 게이트 | - |
| 7 | README · 가이드 · changeset | README `:109`(0100) · `:115`(0098) |
| 이후 | WI-0100b 가 펼친 근거를 ① · ② 로 넘기게 함. WI-0098 은 이 WI 뒤 rebase(`theme/index.ts:455-465`) | 머리 주석 `:1-33` 은 마지막에 머지하는 쪽이 전체를 다시 읽음 |

- 0097 을 0100a 보다 먼저 하면 0100 이 게이트를 다시 써야 해서 순서를 지켜요(경계 보고서 2절)
- WI-0095 는 이 묶음 뒤예요. init(`init.ts:324-332`)이 ① 헬퍼를 쓰게 하는 것은 그쪽 몫이에요

## 4. 바뀔 기존 테스트 (착수 전 고정할 목록)

조사 · 검증이 후보로 준 것이에요. 「분류(추정)」는 이번에 fixture 를 하나씩 읽지 않고 붙인 값이라, 착수 단계 2에서 각 테스트의 선언 위치 · 설치 stub 을 읽어 확정하고 이 표를 고쳐요. 목록 밖 기대 변경이 나오면 AC10 위반이니 멈추고 사유를 적어요.

| 파일:줄 | 내용 | 분류(추정) |
|---|---|---|
| `packages/axis-cli/src/template/template-check.test.ts:2572-2586` | 루트 ui-react 1.8.1 「설치본」 stub(`:2496-2504` install, npm 은 `writeInstalledStub` `:67-69` 로 package.json 만), 기대는 B1 줄 안내 | **바뀜 확실**(검증 확인: 파일 없음 → 손상 갈래). stub 에 `tailwind.css` 를 넣어 기대 유지할지, 손상 갈래 기대로 바꿀지 결정해 testplan 에 사유 기록 |
| 같은 파일 `:917-941`(B1 describe 3건) · `:1118-1140`(C 합침 2건) · `:1194`(B1 상수) | 앱 선언 `project()` fixture | 불변(Q21, 앱 선언은 게이트 밖). 회귀 가드로 남김 |
| 같은 파일 globals PASS 기대 `:215` · `:364` · `:607` · `:641` · `:672` · `:686` · `:1040` · `:1954` · `:1970` (9건) | tokens import · 레이아웃 JS import 로 globals PASS | **뒤집힐 후보**(tokens 선언 위치 · 설치 stub 여부 미확인, 앱 선언이면 Q28 로 불변). 의도가 「import 인정」이면 stub 보강 · 기대 불변 |
| 같은 파일 TW4 진입점 PASS `:437` · `:531` · `:804` · `:1193` · `:1953` (5건) | tailwind.config TW4 PASS | 불변 추정(D4). 단 같은 fixture 에 루트 선언 컴포넌트 줄이 있으면 AC5 로 바뀜 |
| `packages/axis-mcp/src/tools/template.test.ts:329` · `:358` · `:406` | 앱 선언 B1 | 불변(Q21) |
| 같은 파일 globals PASS `:258` · `:266` · `:469` · `:492` (4건) | globals PASS | 뒤집힐 후보, cli 와 같은 처리 |
| 같은 파일 TW4 PASS `:198` · `:368` · `:491` (3건) | TW4 PASS | 불변 추정 |
| `packages/axis-cli/src/theme/theme-add.test.ts` 전부 | DEC-2 동작 | 불변(AC9, 헬퍼 이동만) |

## 5. 바꾸지 않는 곳

- 앱 선언 B1 · 앱 선언 줄 있음(Q21), tokens 앱 선언의 globals PASS(Q28), `detectTailwind`, tailwind.config TW4 pass 문구(D4), 1.4.0 판정 `axisPackagesBelowTailwind4`
- `checkAnimationPlugin` TW4(`:1442-1456`, `pluginProblem` 이 이미 게이트, 펼침은 0100), content(`:1079-1354`, 0098)
- init(Q24 → WI-0095), TW3 preset ESM(Q26 → WI-0101), theme add 쓰기 동작
- 심각도(전부 WARN, 선례 D5)
