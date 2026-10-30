# WI-0102: Yarn Plug'n'Play 에서 컴포넌트 tailwind.css 의 @source 가 zip 안을 가리켜 클래스가 생성되지 않음 PRD

> 작성일: 2026-10-30 | 버전: v1.0 | 작성자: Sinclair Seo | WI: WI-0102 | GitHub: #249 | 우선순위: P3 | 상태: Draft (사용자 결정 Q120 ~ Q125 대기, 권장안 (a) 로 cli · mcp 구현까지 진행)
> 기준: `main` e32275e (linked 1.8.2 · cli 1.7.8 · mcp 1.4.7 발행됨). 측정은 npm 발행본 `@axis-ds/ui-react` · `@axis-ds/agentic-ui` 1.8.2 를 실설치한 Yarn 앱으로 했어요
> 출처: WI-0097 Q22 실빌드의 부수 관찰(testplan 2절), 사용자 결정 Q40 으로 이관
> 표기: **측정**(이번에 실행해 얻은 값) · **추정**(실행하지 않음) · **미측정**(재야 하지만 아직 재지 않음)

---

## 1. 개요

### 1.1 문제 (측정, Yarn 4.5.3 · `@tailwindcss/cli` 4.1.14 · node v22.22.0)

Yarn Plug'n'Play(`nodeLinker: pnp`) 앱에 `@axis-ds/ui-react` · `@axis-ds/agentic-ui` 1.8.2 를 앱 `package.json` 에 선언하고 전역 CSS 에 `@import "@axis-ds/ui-react/tailwind.css";` 를 넣으면, 빌드는 rc 0 인데 컴포넌트 클래스가 하나도 생성되지 않아요. 산출물이 `@import "tailwindcss";` 만 넣은 빌드와 바이트가 같아요(`cmp` 같음, 4,455 B, `axis-button-bg-default` 0건). 같은 CSS 를 node-modules linker 로 빌드하면 47,858 B · 그 클래스 2건이에요. check 는 이 경우 PASS 예요(WI-0097 Q21: 앱 선언은 해석됨).

### 1.2 원인 (측정, testplan 2절)

- PnP 에서 `@axis-ds/ui-react/tailwind.css` 는 `.yarn/__virtual__/…/cache/@axis-ds-ui-react-npm-1.8.2-….zip/node_modules/@axis-ds/ui-react/tailwind.css` 로 풀려요(`node -r ./.pnp.cjs` 로 `require.resolve` 측정). CSS 파일 자체는 PnP 가 패치한 fs 로 읽혀 import 가 성공해요
- 그 파일의 `@source "./dist"` 는 zip 안 경로를 가리키고, Tailwind 4 스캐너(oxide)는 실제 디렉터리만 읽어서 아무것도 찾지 못해요
- 근거 셋(모두 측정):
  - 같은 앱에서 루트 `package.json` 의 `dependenciesMeta` 로 두 패키지를 unplug 하면 산출물이 node-modules 빌드와 **바이트가 같아요**(47,858 B · 31,530 B, `cmp` 같음)
  - 앱 CSS 에 zip 안 dist 경로를 `@source` 로 직접 줘도(절대 · 상대) 클래스 0건이에요. 같은 dist 를 압축을 풀어 실제 디렉터리로 주면 47,858 B · 2건이에요(스캐너 자체는 정상이라는 계측 대조)
  - `@tailwindcss/postcss` 4.1.14 경로(Next.js 가 쓰는 쪽)도 같아요: PnP 0건, unplug · node-modules 2건
- 최신 조합(Yarn 4.18.1 · Tailwind 4.3.3)도 0건이에요. Yarn 4.5.3 + Tailwind 4.3.3 은 Tailwind CLI 자체가 PnP 에서 「Some options passed to require() aren't supported by PnP yet (conditions)」로 rc 1 이라(기본 `@import "tailwindcss"` 만 넣어도) 이 문제와 별개예요

### 1.3 해결 후보 비교 (측정 · 추정)

| 후보 | 바뀌는 패키지 | 실측 효과 | 부작용 · 비용 |
|---|---|---|---|
| A. 패키지 `tailwind.css` 의 `@source` 경로를 바꿈 | ui-react · agentic-ui (linked 4패키지 발행) | **효과 없음**: zip 안 경로는 어떤 `@source` 로 줘도 스캔되지 않음(앱 `@source` zip 절대 · 상대 경로 0건, 측정) | 발행만 생기고 문제는 그대로 |
| B. 패키지 `package.json` 에 `"preferUnplugged": true` | ui-react · agentic-ui (linked 4패키지 발행) | **효과 있음**: 발행본 tgz 에 이 필드만 더한 사본을 `file:` 로 설치하면 47,858 B · 31,530 B(node-modules 와 같음). 필드 없는 원본 tgz 를 같은 방식으로 설치하면 0건(대조) | 모든 PnP 사용자가 두 패키지를 디스크에 풂(실측 820 KB · 564 KB, zip 은 382 KB · 286 KB). Tailwind 를 쓰지 않는 PnP 사용자도 풀림. npm · pnpm 은 이 필드를 무시(추정, Yarn 전용 필드) |
| C. check 가 이 경우를 WARN 으로 알리고 unplug 를 안내 | cli · mcp (registry-core) | 판정이 실빌드와 맞음: 실측 앱 5개에서 check 판정과 빌드 결과가 모두 일치(testplan 4.2) | 사용자가 루트 `dependenciesMeta` 를 직접 넣어야 함. 종료 코드는 그대로(WARN) |
| D. 문서 안내만 | 없음 | 사용자가 문서를 찾아야 알 수 있음. check 는 계속 PASS | 거짓 PASS 가 남음 |

- B 와 C 는 겹치지 않아요. C 의 판정은 설정이 아니라 결과(`.yarn/unplugged` 디렉터리)를 봐서, B 로 발행된 버전을 설치하면 WARN 이 저절로 사라져요(측정: B 사본 앱에서 수정본 check 가 zip WARN 을 내지 않음)
- 앱 `package.json` 의 `dependenciesMeta` 는 Yarn 이 따르지 않아요(측정: 앱에만 두고 install 하면 unplugged 0개, 빌드 0건). 안내는 「Plug'n'Play 루트(.pnp.cjs 가 있는 곳) package.json」이어야 해요

### 1.4 결정 (권장안, 2026-10-30 사용자 확정)

- 이번 WI 는 C 를 구현해요(Q120 (a)). cli · mcp 만 바뀌어 linked 4패키지 발행이 따라오지 않아요
- B 는 사용자 결정 뒤 다음 linked 발행에 넣을지 정해요(Q121). 이번에는 구현하지 않아요

#### 선례 · 이어받는 결정

| 결정 | 내용 | 이 WI 에서 |
|---|---|---|
| WI-0097 Q21 | 앱 선언이면 `<pkg>/tailwind.css` 는 해석되는 것으로 봄 | 해석 판정은 그대로, 스캔 판정을 따로 더함 |
| WI-0097 Q40 | PnP 앱 선언의 클래스 미생성을 이 WI 로 이관 | 원인 측정 · 범위 결정 |
| WI-0097 Q77 · WI-0103 Q77 | 해석 불가 계열은 WARN, 종료 코드 불변 | 같은 심각도(Q125) |
| WI-0098 Q23 · Q29 · Q45 | `.pnp.cjs` · zip 은 읽지 않고, unplugged 설치본은 앱 선언 범위에 맞는 버전만 인정(`findPnpUnpluggedPackages`) | 같은 헬퍼로 판정 |

## 2. 범위

### 2.1 하는 것

- registry-core `project.ts`: `pnpComponentSourceHidden`(PnP 앱 선언 컴포넌트가 zip 안에만 있는지), `pnpUnplugSetupPhrase`(안내 구절)
- registry-core `template/tailwind-core.ts` `tailwind4Issues`: 줄 없음 · 줄 있음 두 방향에 PnP zip 갈래(최소 변경, 함수 `componentCssPnpMissingIssue` · `componentCssPnpPresentIssue` 추가)
- `packages/axis-cli/README.md` check 절 2번 · 5번, `docs/guides/troubleshooting.md` 2절 PnP 한 줄, changeset(cli · mcp patch)

### 2.2 하지 않는 것

| 항목 | 이유 |
|---|---|
| ui-react · agentic-ui 의 `tailwind.css` · `package.json` 변경 | linked 4패키지 발행을 부름. Q121 사용자 결정 뒤 |
| `axis theme add` 가 PnP zip 앱에 줄을 넣을 때의 안내 | Q123, 후속 후보. check 가 다음 실행에서 바로 알림 |
| WI-0098 Tailwind 3 PnP 안내의 「package.json 의 dependenciesMeta」 문구 | Q124, 후속 후보 |
| 그 패키지를 가리키는 앱의 직접 `@source` 가 실제로 있는 경로인지 | 종전(`hasComponentSource`, 경로 실재는 보지 않음) |
| `pnpUnpluggedFolder` 로 위치를 바꾼 프로젝트 | WI-0098 과 같은 잔여 오차(찾지 못해 WARN) |

### 2.3 알려진 한계

- 판정은 `.yarn/unplugged/*/node_modules/<pkg>/package.json` 의 존재 · 버전만 봐요. 그 디렉터리에 `dist` 가 실제로 있는지는 보지 않아요
- 범위를 읽지 못하는 선언(`npm:` 별칭 · `file:` · git)은 버전을 보지 않고 이름만 맞는 unplugged 설치본을 인정해요
- `workspace:` · `portal:` · `link:` 범위는 설치본이 실제 디렉터리라 종전 판정이에요(추정: workspace PnP 실빌드는 재지 않음)

## 3. 수용 기준 (AC)

- **AC1**(원인): Yarn 4 PnP 실앱에서 PnP · unplug · node-modules · 앱 `@source` 대조를 실빌드로 재고, 양성 대조(node-modules 에서 클래스 생성)가 성립해요. 측정: testplan 2절
- **AC2**(줄 있음): PnP · 앱 선언 · unplugged 없음 + 줄 → tailwind.config WARN(종전 PASS). 측정: `template-check.test.ts` Z2 · 실측 앱 c-pnp
- **AC3**(줄 없음): 같은 조건 + 줄 없음 → 줄만 권하지 않고 unplugged 설정을 먼저 안내. 측정: Z1
- **AC4**(양성 대조): 범위에 맞는 unplugged 설치본이 있으면 종전 판정(줄 없음 B1 · 줄 있음 PASS). 측정: Z3 · 실측 앱 c-unplug · c-pu
- **AC5**(가드): node-modules linker · `workspace:` 범위 · 직접 `@source` 는 종전 그대로, 범위 밖 버전 unplugged 는 인정하지 않음, 앱 쪽 `dependenciesMeta` 만으로는 인정하지 않음. 측정: Z4 ~ Z9
- **AC6**(CLI = MCP): MCP `axis.check_project` 가 같은 문구. 측정: mcp `template.test.ts` WI-0102
- **AC7**(종료 코드): 바뀌지 않아요. 측정: Z11, 실측 앱 rc
- **AC8**(변이): 판정 무력화 · 방향별 제거 · unplugged 무시 · 범위 무시 · workspace 제외 제거 · PnP 판정 제거 변이를 넣으면 테스트가 빨개져요. 측정: testplan 5절
- **AC9**(게이트): registry-core · cli · mcp 의 build · type-check · lint(turbo `--force`, Cached 0) · cli · mcp test 통과, `pnpm check-changeset-mcp-tokens` rc 0

## 4. 미측정 · 위험

- Next.js(`next build`) 경유 빌드는 재지 않았어요. `@tailwindcss/postcss` 단독 경로로 대신 쟀어요(같은 결과)
- `@tailwindcss/vite` 는 재지 않았어요(같은 oxide 스캐너라 같을 것으로 추정)
- Yarn 3 · Yarn 4 의 다른 PnP 설정(`pnpMode: loose`, `enableGlobalCache: true`)은 재지 않았어요. 전역 캐시를 쓰면 zip 이 프로젝트 밖에 있을 뿐 zip 이라는 점은 같다고 추정해요
- 패키지 쪽 B 는 `file:` 로 설치한 사본으로 쟀어요. 레지스트리 발행본에서 `preferUnplugged` 가 같게 동작하는지는 미측정이에요(Yarn 은 manifest 필드를 보므로 같을 것으로 추정)

## 5. 의존 · 순서

- 배치 10 의 이웃: WI-0104(Tailwind 3 preset 판정) · WI-0096(설치 위치 안내). 이 WI 는 Tailwind 4 `tailwind4Issues` 와 project.ts 끝에 새 함수만 더해 겹치는 줄이 없어요(추정, 머지 때 확인)

## 6. 측정 출처

scratchpad `w102/`(이 세션): `scripts/mk.sh`(앱 생성 · 설치) · `build.sh`(Tailwind CLI 빌드 · 집계) · `pcbuild.sh` · `pc.cjs`(postcss 경로) · `pu.js`(preferUnplugged 사본) · `mutate.py` · `mutate-mcp.py`(변이). 앱 디렉터리 `c-nm` · `c-pnp` · `c-unplug` · `c-unplug-app` · `c-pu` · `c-file` · `c-pnp433` · `c-nm433` · `c-pnp-y418`

## 7. 사용자 결정 항목 (Q120 ~ Q125)

| Q | 질문 | 선택지 | 권장 | 근거 |
|---|---|---|---|---|
| Q120 | 이 WI 의 해결 방향 | (a) check 가 WARN 으로 알리고 루트 `dependenciesMeta` unplugged 를 안내(cli · mcp) (b) 패키지에 `preferUnplugged` 를 넣음(linked 발행) (c) 문서만 | (a) | 측정: 판정이 실측 앱 5개의 빌드 결과와 모두 맞고, 발행이 cli · mcp 로 끝나요. (b) 는 효과가 있지만 linked 4패키지 발행과 모든 PnP 사용자의 디스크 풀기를 부르므로 Q121 로 따로 정해요. (c) 는 거짓 PASS 가 남아요. 이 권장안으로 구현까지 했어요 |
| Q121 | ui-react · agentic-ui 에 `"preferUnplugged": true` 를 넣을까요 | (a) 다음 linked 발행에 함께 넣음(별도 발행은 하지 않음) (b) 넣지 않고 check 안내만 (c) 사용자 보고가 생길 때까지 보류 | (a) | 측정: 필드만 더한 사본이 node-modules 와 같은 산출물을 내고, check 판정도 저절로 PASS 가 돼요(설정 없이 해결). 비용은 PnP 사용자 디스크 820 KB · 564 KB 정도예요. 패키지 `tailwind.css` 경로 변경(후보 A)은 효과가 없어 후보에서 뺐어요 |
| Q122 | 새 WARN 의 판정 근거 | (a) 설치 결과(`.yarn/unplugged` 에 앱 선언 범위에 맞는 설치본) (b) 설정(루트 `dependenciesMeta`)을 읽음 (c) 둘 다 | (a) | 측정: 앱 쪽 `dependenciesMeta` 는 Yarn 이 따르지 않아 설정만 읽으면 거짓 PASS 가 생겨요. 결과를 보면 `preferUnplugged`(Q121) · 루트 설정 · 수동 unplug 를 모두 같은 규칙으로 덮어요. WI-0098 Q29 와 같은 헬퍼예요 |
| Q123 | `axis theme add` 가 PnP zip 앱에 컴포넌트 줄을 넣을 때도 unplug 안내를 더할까요 | (a) 이번 범위 밖, 후속 WI (b) 이번에 안내 한 줄 추가 | (a) | theme add 는 줄을 넣는 동작이 맞고(unplug 뒤 그 줄이 필요), check 가 바로 다음 실행에서 알려요. WI-0097 이 정한 theme add 출력 불변(AC9) 범위를 넘지 않아요 |
| Q124 | WI-0098 의 Tailwind 3 PnP 안내(`contentPnpNote` · troubleshooting 3절)의 「package.json 의 dependenciesMeta」 를 「Plug'n'Play 루트 package.json」 으로 맞출까요 | (a) 후속 WI 에서 문구 통일 (b) 이번 WI 에서 함께 고침 (c) 그대로 | (a) | 측정: 모노레포 앱이 앱 `package.json` 에 넣으면 unplugged 가 생기지 않아요. 다만 문구를 바꾸면 WI-0098 기대 문자열이 바뀌어 이 WI 범위가 넓어져요 |
| Q125 | 새 판정의 심각도 | (a) WARN(종료 코드 불변) (b) FAIL | (a) | WI-0097 · WI-0103 의 해석 불가 계열이 모두 WARN 이에요. (b) 는 CI 에서 check 를 쓰는 PnP 프로젝트가 업데이트만으로 실패해요 |

## 결정 확정 (2026-10-30)

Q120 ~ Q125 는 2026-10-30 사용자가 모두 권장안으로 확정했어요. Q121 은 (a) 다음 linked 발행에 포함으로 정했고, 후속 WI-0105(#265)로 등록했어요.
