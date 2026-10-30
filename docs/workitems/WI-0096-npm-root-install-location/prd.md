# WI-0096: npm 워크스페이스 루트 선언의 설치 위치 안내를 theme add · init · check 에 반영 PRD

> 작성일: 2026-10-30 | 버전: v1.0 | 작성자: Sinclair Seo | WI: WI-0096 | GitHub: #240 | 우선순위: P3 | 상태: 구현 완료, 사용자 확인 대기 (Q110 ~ Q115 는 권장안으로 진행)
> 기준: `main` e32275e (linked 1.8.2 · cli 1.7.8 · mcp 1.4.7 발행됨) 위 worktree 브랜치 `wi-0096-npm-root-install-location`. 착수 측정은 main 빌드(e32275e)로 했어요
> 출처: WI-0093 사용자 결정 Q15(theme add · init · check dependencies 의 npm 루트 위치 문구를 이 WI 로 분리), WI-0097 Q41 의 잔여 H4
> 표기: **측정**(이번에 실행해 얻은 값) · **추정**(실행하지 않음) · **미측정**(재야 하지만 아직 재지 않음)

---

## 1. 개요

### 1.1 문제 (측정)

npm 워크스페이스에서 앱 디렉터리의 plain `npm install` 은 워크스페이스 루트 `package.json` 에만 선언한 패키지를 설치하지 않아요. 이번에 npm 네 버전 × lockfile 네 조건 × 실행 위치 세 곳(48칸)을 다시 쟀어요(testplan 2.1).

| npm | 앱 디렉터리 `npm install` | 앱 디렉터리 `npm install --include-workspace-root` | 루트 `npm install` |
|---|---|---|---|
| 7.24.2 | 루트 선언 설치 0/4 | 0/4 | 4/4 |
| 8.19.4 | 0/4 | 4/4 | 4/4 |
| 9.9.4 | 0/4 | 4/4 | 4/4 |
| 10.9.4 | 0/4 | 4/4 | 4/4 |

lockfile 네 조건은 없음 · 빈 파일 · 정상(루트 설치 뒤 node_modules 만 지움) · 앱 디렉터리 자체 lockfile 이에요. 루트에서 실행하면 네 버전 모두 앱 선언도 함께 설치했어요(16/16). pnpm 9.15.4 · yarn 1.22.22 는 앱 디렉터리에서 실행해도 루트 선언을 설치했어요(각 2/2).

그런데 main(e32275e) 의 세 명령은 npm 루트 선언 · 미설치에 앱 디렉터리 명령 「npm install」을 안내했어요(testplan 2.2, 6줄).

| 명령 | 종전 출력(npm 루트 선언 · 미설치) |
|---|---|
| theme add | `  ! @axis-ds/ui-react 가 워크스페이스 루트에 선언됐지만 설치되지 않아 … 설치(npm install) 뒤 theme add 를 다시 실행하거나 직접 넣으세요.` |
| theme add | `    설치: npm install`(「… 워크스페이스 루트에 선언돼 있어 앱 package.json 은 바꾸지 않음」 다음 줄) |
| init | `  설치는 실행하지 않았습니다. 설치: npm install`(clsx · tailwind-merge 가 루트 선언) |
| init | `  애니메이션: tw-animate-css 는 워크스페이스 루트에 선언돼 있지만 설치되지 않았습니다. npm install 뒤 …` |
| check · MCP | `선언됐지만 설치되지 않은 의존성: tailwindcss, clsx, tailwind-merge → npm install`(셋 모두 루트 선언) |
| check · MCP | `워크스페이스 루트에 선언돼 있지만 설치되지 않았습니다: @axis-ds/tokens, @axis-ds/ui-react → npm install` |

같은 check 출력의 Tailwind 4 줄은 이미 「설치(워크스페이스 루트에서 npm install)」이라(WI-0097) 한 화면 안에서 두 안내가 달랐어요. 실제로 종전 안내대로 앱 디렉터리에서 `npm install` 을 실행하면 dependencies WARN 이 그대로 남고, 루트에서 실행하면 PASS 로 바뀌어요(testplan 2.4 실경로 스모크).

### 1.2 결정

#### 이 WI 의 결정 (Q110 ~ Q115, 권장안으로 진행, 사용자 확인 대기)

7절 표에 선택지 · 근거가 있어요.

| # | 진행한 권장안 |
|---|---|
| Q110 | 문구는 WI-0093 Q15 · WI-0097 과 같은 「워크스페이스 루트에서 npm install」 |
| Q111 | 한 안내 묶음에 루트 선언이 하나라도 있으면 루트 위치 문구(루트에서 실행하면 앱 선언도 함께 설치됨) |
| Q112 | theme add 의 루트 선언 컴포넌트 `tailwind.css` 보류 안내(WI-0097 H4)도 이번에 함께 맞춤 |
| Q113 | theme add · theme list 의 P2(앱 디렉터리 lockfile 이면 루트 선언 불인정) 경계는 그대로 두고 잔여로 기록 |
| Q114 | init 의 `tailwindWarnings`(「<설치 명령> 뒤 tailwind-merge 범위를 다시 확인」)는 범위 밖, 잔여 |
| Q115 | 새 문구의 최종 확정은 사용자 몫(WI-0097 Q43 · Q48 선례) |

#### 선례 · 이어받는 결정

| 출처 | 내용 |
|---|---|
| WI-0093 Q15 | npm 루트 선언이면 theme list · info · MCP 브랜드 도구에 「워크스페이스 루트에서 npm install」. theme add · init · check dependencies 는 이 WI |
| WI-0093 B2 | theme add 의 루트 선언 빌드 전 재설치 줄은 이미 루트 위치 문구. 루트 선언 미설치 「설치: npm install」 줄은 이 WI 의 잔여 |
| WI-0097 Q41 · H4 | check(`componentInstallPhrase`)와 theme add(DEC-2 문구)의 npm 루트 설치 구절이 다름, 이 WI 에서 맞춤 |
| WI-0101 | Tailwind 3 preset 게이트도 `tokensInstallPhrase` 로 같은 문구를 이미 씀 |
| CLAUDE.md | registry-core 를 바꾸면 cli · mcp 둘 다 올림 |

## 2. 범위

### 2.1 하는 것

- registry-core `project.ts` 에 공용 헬퍼 `installCommandPhrase(installCommand, rootDeclared)` 하나를 더함(기존 함수 시그니처 불변).
- check dependencies(registry-core `dependencies-core.ts` `checkDependencies`, CLI · MCP 공용): 미설치 두 묶음의 설치 구절.
- theme add(cli `theme/index.ts`): 루트 선언 tokens 미설치 줄, 루트 선언 컴포넌트 `tailwind.css` 보류 안내의 괄호 안 구절.
- init(cli `init/init.ts`): utils 의존성 「설치는 실행하지 않았습니다. 설치: …」 줄(add · present 두 갈래), 애니메이션 선언 · 미설치 줄.
- `packages/axis-cli/README.md` 의 해당 서술(theme add 의 「루트 선언 미설치 줄은 npm 이어도 앱 디렉터리 명령 그대로」는 거짓이 되므로 고침).

### 2.2 하지 않는 것

- pnpm · yarn 의 출력(앱 디렉터리 실행으로 루트 선언이 설치됨, 측정). npm 이어도 앱 선언만인 안내.
- theme list · info · MCP 브랜드 도구 · check 의 Tailwind 4 CSS 줄 · Tailwind 3 preset 게이트(이미 루트 위치 문구).
- `template apply`(WI-0088), init 애니메이션 안내의 다른 개선(WI-0099, 이 WI 뒤).
- 판정 · 심각도 · 종료 코드. 바뀌는 것은 설치 명령 구절뿐이에요.
- 다른 WI 문서 · project-todo.md(Master 몫).

### 2.3 알려진 한계 (이 WI 뒤에도 남음)

- Q113: theme add · theme list 는 앱 디렉터리에 lockfile 이 있으면 루트 선언을 인정하지 않고 종전 add 명령을 안내해요(WI-0087 P2). npm 10.9.4 측정에서는 앱 lockfile 이 있어도 앱 디렉터리의 `npm install` 이 워크스페이스로 동작해 루트 선언을 설치하지 않았어요. P2 경계 자체를 npm 에서 다시 정할지는 별도 판단이에요. check dependencies 는 원래 P2 를 보지 않아 이번에 루트 위치 문구가 나와요(테스트로 고정).
- Q114: init 의 Tailwind 설치본 · 선언 major 불일치 경고 「npm install 뒤 tailwind-merge 범위를 다시 확인하세요」는 그대로예요(설치 위치가 아니라 다시 설치한 뒤 확인하라는 문장, 루트 선언 tailwindcss 일 때 같은 결함이 있는지는 미측정).
- npm 6 이하는 workspaces 를 지원하지 않아 대상이 아니에요(추정, 미측정).

## 3. 수용 기준 (AC)

| AC | 기준 | 확인 |
|---|---|---|
| AC1 | npm 7 ~ 10 에서 앱 디렉터리 `npm install` 이 루트 선언을 설치하지 않는다는 전제를 실측으로 확인 | testplan 2.1, 48칸 |
| AC2 | 착수 전 main 출력에서 결함 줄을 모두 찾음 | testplan 2.2, 6줄 |
| AC3 | npm 루트 선언 · 미설치에서 theme add 두 줄 · init 두 줄 · check 두 묶음이 「워크스페이스 루트에서 npm install」 | 새 테스트 · 수정 후 출력 diff |
| AC4 | pnpm · yarn · npm 앱 선언 출력은 바이트 불변 | 18개 출력 가운데 15개 바이트 같음, 음성 대조 테스트 |
| AC5 | CLI check 와 MCP `axis.check_project` 의 문구가 같음 | 같은 코어, mcp 테스트가 같은 문자열 |
| AC6 | 새 테스트가 수정 전 호출부에서 빨강 | testplan 4절 음성 대조 |
| AC7 | check 종료 코드 · 판정 불변 | 바뀐 줄은 WARN 문구뿐, 수정 전후 18개 출력의 rc 같음 |
| AC8 | 새 안내를 따르면 경고가 풀림 | testplan 2.4 실경로 스모크 |
| AC9 | 패키지별 type-check · lint · test(캐시 없이) · `pnpm check-changeset-mcp-tokens` 통과 | testplan 5절 |

## 4. 미측정 · 위험

- yarn 4 node-modules 는 이번에 다시 재지 않았어요(WI-0093 의 yarn 4.5.3 실측을 이어받음). 출력은 yarn 이면 바뀌지 않으므로 회귀 위험은 없어요.
- bun 은 `detectInstallCommand` 가 설치 명령을 고르지 않아 대상이 아니에요.
- `packageManagerOf` 가 접두로 매니저를 가르므로 `npm ci` 같은 명령이 들어오면 npm 으로 봐요(현재 `detectInstallCommand` 는 `npm install` 만 돌려줘요).

## 5. 의존 · 순서

- WI-0088(template apply) 과 고친 파일이 겹치지 않아요(template apply 코드 · 테스트를 건드리지 않음).
- 배치 11 의 WI-0099 가 init 애니메이션 안내를 이 WI 뒤에 고쳐요. 이 WI 는 `animationGuideLine` 의 선언 · 미설치 줄에서 설치 구절만 `installCommandPhrase` 로 바꿨어요.

## 6. 측정 출처

- 설치 위치: scratchpad `measure-npm.sh`(npm 네 버전, `npx -y npm@<버전>`) · `measure-other.sh`(pnpm 9.15.4 · yarn 1.22.22). 패키지는 `is-number@7.0.0`(루트 선언) · `kind-of@6.0.3`(앱 선언).
- CLI 출력: scratchpad `run-cli.sh` 로 main 빌드 사본(`base-cli`)과 수정본을 같은 fixture 18개에 돌려 diff.
- 실경로 스모크: scratchpad `smoke-npm.sh`(npm 10.9.4 로 실제 설치).

## 7. 사용자 결정 항목 (Q110 ~ Q115, 권장안으로 진행, 사용자 확인 대기)

| # | 질문 | 선택지 | 권장안 | 근거 |
|---|---|---|---|---|
| Q110 | npm 루트 선언 미설치의 설치 문구 | ① 「워크스페이스 루트에서 npm install」 ② `npm install --include-workspace-root`(앱 디렉터리) ③ `npm install -w <앱> --include-workspace-root` | ① | npm 7.24.2 은 앱 디렉터리에서 `--include-workspace-root` 를 붙여도 루트 선언을 설치하지 않았어요(0/4). 루트 실행은 네 버전 16/16. WI-0093 Q15 · WI-0097 · WI-0101 이 이미 ① 이라 한 화면 안의 문구가 같아져요 |
| Q111 | 한 묶음에 앱 선언과 루트 선언이 섞일 때 | ① 루트 선언이 하나라도 있으면 루트 위치 문구 ② 앱 · 루트로 나눠 명령 두 개 ③ 모두 루트 선언일 때만 루트 위치 문구 | ① | 루트에서 실행하면 앱 선언도 함께 설치됐어요(16/16). ③ 은 섞인 경우 루트 선언이 끝내 설치되지 않는 안내가 남아요. ② 는 줄이 길어지고 효과는 ① 과 같아요 |
| Q112 | theme add 의 루트 선언 컴포넌트 `tailwind.css` 보류 안내(Issue 본문에 없던 줄) | ① 함께 고침 ② 별도 WI | ① | 착수 측정에서 같은 결함으로 찾았고(2.2 첫 줄), WI-0097 Q41 이 H4 를 이 WI 에서 맞추기로 했어요. registry-core `deferredComponentImportReason` 은 고치지 않고 cli 호출부가 구절을 넘겨요 |
| Q113 | npm 에서 앱 디렉터리 lockfile(P2) 경계 | ① 그대로 두고 잔여로 기록 ② npm 이면 P2 를 무시하고 루트 선언 인정 | ① | P2 는 theme add 의 쓰기 판정(앱 package.json 에 쓸지)까지 바꾸는 경계라 문구 WI 의 범위를 넘어요. npm 10.9.4 측정(앱 lockfile 이 있어도 루트 선언 미설치)은 prd 2.3 에 남겨요 |
| Q114 | init `tailwindWarnings` 의 「<설치 명령> 뒤 tailwind-merge 범위를 다시 확인」 | ① 범위 밖, 잔여 ② 함께 루트 위치 문구 | ① | Issue 가 지목한 줄이 아니고, 설치본 · 선언 major 가 다를 때 다시 설치한 뒤 확인하라는 문장이라 루트 선언 여부를 이 함수가 받지 않아요. 결함 여부는 미측정 |
| Q115 | 새 문구 확정 | ① 사용자 확인 대기(권장안 문구로 구현) ② 지금 확정 | ① | WI-0097 Q43 · Q48 선례. 새 문구는 release-notes 「바뀐 점」에 모았어요 |
