# WI-0093: theme list · info · MCP 브랜드 도구의 tokens 설치 안내가 선언 출처를 따름 PRD

> 작성일: 2026-10-27 | 버전: v1.1(구현 후 추가 결정 B1 ~ B4 반영) | 작성자: Sinclair Seo | WI: WI-0093 | GitHub: #236 | 우선순위: P3 | 상태: Approved (2026-10-27 사용자 결정 Q13 ~ Q17 · Q20)
> 기준: `main` ffbda57 (linked 1.8.2 · cli 1.7.5 · mcp 1.4.4 발행됨) 위 worktree 브랜치 | PR-B(WI-0091 · 0094 · 0092 의 PR-A 와 별도 PR · 별도 릴리스, Q4)
> 표기: **측정**(이번에 실행해 얻은 값) · **계산**(값에서 유도) · **추정**(실행하지 않음)

---

## 1. 개요

### 1.1 문제 (측정, 발행본 cli 1.7.5 · mcp 1.4.4)

`axis theme list` · `axis theme info` 와 MCP `axis.list_brands` · `axis.get_brand` 는 tokens 가 미설치 · 미지원 · 빌드 전일 때 선언 출처와 상관없이 `<pm> add "@axis-ds/tokens@^1.6.0"` 을 안내했어요. 그 안내를 실제 매니저로 실행한 결과(testplan 3절, 16건 중 앱 선언 · 루트 선언 8건):

| 경우 | 1.7.5 안내를 실행한 결과 |
|---|---|
| 루트에만 선언(pnpm · npm · yarn node-modules) | 앱 `package.json` 에 새 선언이 생김(`{}` → `^1.6.0` · npm 은 `^1.8.2`) |
| 앱에 선언(pnpm · npm) | 앱 범위가 다시 쓰임(`^1.8.0` → `^1.8.2`) |
| 앱에 선언(yarn node-modules · PnP) | 앱 범위가 **낮아짐**(`^1.8.0` → `^1.6.0`) |
| Yarn PnP 앱 선언(설치 · 해석됨) | 브랜드 도구가 node_modules 만 봐서 「설치돼 있지 않아」 + add, 실행해도 다시 같은 안내(끝나지 않는 고리) |

### 1.2 결정 (2026-10-27 사용자 결정, 근거 `synthesis.md` 3절 묶음 4)

| # | 결정 |
|---|---|
| Q13 | 루트 선언 경계는 `theme add` 와 같게(P1 Plug'n'Play · P2 앱 lockfile 이면 루트 선언 불인정). PnP 에서 선언이 있으면 add 대신 「Plug'n'Play 라 설치본을 판정하지 못함」. brand-core 의 PnP 해석은 범위 밖(잔여) |
| Q14 | 선언 출처로 install · add 를 고르는 판정은 registry-core `project.ts` 공용 헬퍼(P1 · P2 · 앱 lockfile 목록 포함). cli `theme-add.ts` 의 `APP_LOCKFILES` 사본은 그 헬퍼로 옮김 |
| Q15 | npm 워크스페이스 루트 선언이면 list · info · MCP 출력에 「워크스페이스 루트에서 npm install」. theme add · init · check dependencies 의 같은 문구 결함은 별도 WI-0096 |
| Q16 | unsupported · not-built 갈래도 범위. 루트 선언 unsupported 는 WI-0087 DEC-8 문구(^1.3.0 이상) 그대로, not-built 재설치는 install |
| Q17 | `theme add` 의 설치 안내 공백도 고침. 앱 선언 + not-installed 면 「설치: <pm> install」, 루트 선언 + not-built 면 재설치 안내. **WI-0087 DEC-1 을 다시 연다**(DEC-1 은 「앱 선언 문구는 바이트 그대로」였고, WI-0087 테스트가 앱 선언 미설치에 설치 줄이 없음을 음성 대조로 고정했어요. 이번에 그 기대를 바꿔요) |
| Q20 | 선언 범위가 브랜드 지원 버전을 허용하지 않을 때(정확 버전 `1.2.1` · `~1.2.0`)의 두 단계 고리는 범위 밖, release-notes 잔여 |
| Q4 | PR-B 단독, changeset `@axis-ds/cli` patch + `@axis-ds/mcp` patch(registry-core 를 고치므로 CLAUDE.md 「registry-core 를 바꾸면 cli · mcp 둘 다」) |

### 1.3 안내 표 (구현 기준)

| 선언 | 미설치 | 미지원(< 1.3.0) | 빌드 전 재설치 |
|---|---|---|---|
| 없음 · package.json 없음 · P1(PnP 루트만) · P2(앱 lockfile) | 종전 `<pm> add "…@^1.6.0"` | 종전 업그레이드 add | 종전 add |
| 앱 선언 | `<pm> install` | 종전 업그레이드 add(범위를 올려야 함) | `<pm> install` |
| 루트 선언(pnpm · yarn) | `<pm> install`(앱 디렉터리) | DEC-8 문구 | `<pm> install` |
| 루트 선언(npm) | 「워크스페이스 루트에서 npm install」 | DEC-8 문구 | 「워크스페이스 루트에서 npm install」 |
| PnP + 앱 선언 | 「… 선언돼 있지만 Plug'n'Play 설치라 설치본을 판정하지 못해 브랜드를 읽을 수 없습니다.」 한 줄(세 상태 모두) | 같음 | 같음 |

`theme add`(Q17 · B1 · B2 · B3):

| 선언 | 미설치 | 미지원(< 1.3.0) | 빌드 전 |
|---|---|---|---|
| 없음(앱에 씀) | 종전 그대로(「설치는 실행하지 않았습니다. 설치: <pm> install」) | 종전 그대로(+ 업그레이드 add) | 종전 그대로 |
| 앱 선언 | 「    설치: <pm> install」(Q17) | 종전 업그레이드 add | 「    워크스페이스면 <build>, 아니면 재설치: <pm> install」(B3) |
| 루트 선언(pnpm · yarn) | 종전 「    설치: <pm> install」 | DEC-8 문구 | 「    워크스페이스면 <build>, 아니면 재설치: <pm> install」(Q17) |
| 루트 선언(npm) | 종전 「    설치: npm install」(앱 디렉터리 명령 그대로, WI-0096) | DEC-8 문구 | 「    워크스페이스면 <build>, 아니면 재설치: 워크스페이스 루트에서 npm install」(B2) |
| PnP + 앱 선언 | theme list 와 같은 PnP 한 줄(B1) | 같음(업그레이드 경고 · 줄 없음) | 같음 |

설치 · 재설치 · 업그레이드 줄은 「- package.json: … 가 이미 있어 범위를 바꾸지 않음」(앱) 또는 「… 워크스페이스 루트에 선언돼 있어 앱 package.json 은 바꾸지 않음」(루트) 바로 다음 줄이에요. 그 밖의 theme add 출력과 init · check dependencies 의 npm 위치 문구는 그대로예요(WI-0096).

### 1.3.1 구현 후 추가 결정 (2026-10-27 사용자 확정, decisions.md 「구현 후 추가 결정」 PR-B)

| # | 결정 | 반영 |
|---|---|---|
| B1 | Yarn PnP 앱에서 theme add 의 tokens 안내는 theme list · MCP 와 같은 PnP 한 줄로 통일한다(설치 줄을 내지 않음). 미설치 · 미지원 · 빌드 전 세 상태에 같은 PnP 문구를 쓰는 범위는 유지 | `ThemeAddPlan.tokensGuide`(registry-core `dependencyInstallGuide`)가 `pnp` 이고 tokens 가 `ok` 가 아니면 앱 선언 줄 다음에 PnP 한 줄, 설치 · 재설치 줄과 미지원 경고 · 업그레이드 줄은 내지 않음 |
| B2 | 루트 선언 + 빌드 전 재설치 줄은 공용 헬퍼 문구를 써서 npm 이면 「워크스페이스 루트에서 npm install」. 기존 루트 선언 미설치 「설치: npm install」 줄은 그대로(WI-0096 잔여) | 재설치 줄을 theme list 와 같은 `rebuildGuide(tokensGuide)` 로 만듦 |
| B3 | 앱 선언 + 빌드 전에도 재설치 줄을 넣어 선언 출처와 상관없이 대칭 | 같은 `rebuildGuide` 줄 |
| B4 | MCP 서버 등록부(`src/index.ts` `axis.list_brands` · `axis.get_brand`)가 `tokensInstallGuideFor` 를 쓰는 배선을 테스트로 고정(종전 함수로 되돌리면 빨강) | `src/index-brand-wiring.test.ts` 가 SDK 서버를 대역으로 바꿔 등록된 처리기를 픽스처에 돌림 |
| 공통 | PR-A · PR-B 를 모두 머지한 뒤 Version PR 하나로 함께 발행(cli 1.7.6 · mcp 1.4.5) | README · release-notes 의 「1.7.5 다음 patch」 · 「1.4.4 다음 patch」 표기를 1.7.6 · 1.4.5 로 |

### 1.4 범위 밖

- brand-core `resolveTokens` 의 PnP 해석(Q13): PnP 에서는 설치돼 있어도 브랜드를 읽지 못해요. 이번에는 안내만 바꿔요.
- theme add · init(utils · animation) · check dependencies 의 npm 루트 위치 문구(Q15, WI-0096).
- 선언 범위가 지원 버전을 허용하지 않는 두 단계 고리(Q20).
- WI-0095 ~ 0100(decisions.md 「별도 WI」).

## 2. 요구사항

| ID | 요구사항 | AC |
|---|---|---|
| FR-1 | list · info · MCP 의 미설치 안내가 선언 출처를 따름(1.3 표) | AC1 · AC3 |
| FR-2 | 미지원 · 빌드 전 갈래(Q16) | AC2 |
| FR-3 | PnP + 앱 선언은 판정하지 못했다는 한 줄, 루트만이면 종전(P1) | AC1 |
| FR-4 | 판정은 registry-core 공용 헬퍼, cli · mcp 같은 결과 | AC3 |
| FR-5 | theme add 설치 공백(Q17 · B1 · B2 · B3) | AC4 · AC7 |

### 2.1 AC

- **AC1**: 단위 픽스처 9종(선언 없음 · 앱 단독 · pnpm 앱 · pnpm 루트 · yarn 루트 · npm 루트 · npm 앱 · P2 · PnP 루트만)에서 list · info 안내가 1.3 표와 같고 rc 1. PnP + 앱 선언은 한 줄, `.pnp.cjs` 를 치우면 install(양성 대조).
- **AC2**: 루트 선언 미지원은 DEC-8 문구, 앱 선언 · 선언 없음 미지원은 종전 업그레이드 add. 빌드 전은 선언이 있으면 install(npm 루트는 루트에서), 없으면 종전 add.
- **AC3**: MCP `tokensInstallGuideFor` 와 CLI `tokensInstallGuide` 가 같은 값, 안내 줄이 같은 문장(MCP 는 명령을 백틱). 발행 전 dist 를 stdio 로 띄워 조사 픽스처 9개에서 확인.
- **AC4**: theme add 앱 선언 + 미설치는 「설치: <pm> install」, 루트 선언 + 빌드 전은 재설치 줄, 앱 package.json 쓰기 없음. 설치본이 있으면 두 줄 모두 없음(음성 대조).
- **AC5**: pnpm 9.15.4 · npm 10.9.4 · yarn 4.5.3(node-modules · PnP) 워크스페이스에서 루트 선언 · 앱 선언 · 미선언 · P2 의 안내를 그대로 실행하면 tokens 가 앱에서 해석되고(bare specifier `require.resolve`), 선언이 있던 경우 앱 package.json 이 바뀌지 않음.
- **AC6**: 변이(헬퍼 add 고정 · npm 루트 분기 · P2 · PnP · 앱 선언 install · DEC-8 문구 · theme add 두 줄 · MCP 재설치) 각각 빨강 1건 이상.
- **AC7**(B1 ~ B4): theme add 가 PnP 앱 선언의 미설치 · 빌드 전 · 미지원에서 PnP 한 줄만 내고(설치 · 재설치 · 업그레이드 줄 없음, theme list 와 같은 문장), 빌드 전 재설치 줄이 앱 선언 · 루트 선언 모두에 나오며 npm 루트 선언이면 「워크스페이스 루트에서 npm install」. MCP 등록부 배선을 종전 함수로 되돌리면 빨강. 변이 각각 빨강 1건 이상.

## 3. 릴리스

- `@axis-ds/cli` patch + `@axis-ds/mcp` patch. registry-core 는 private 이라 발행되지 않고 cli · mcp 가 번들해요. PR-A 와 함께 Version PR 하나로 발행해 cli 1.7.6 · mcp 1.4.5 예요(추가 결정 공통).
- 동작 변경은 release-notes 「바뀐 점」. 앱 선언 사용자에게도 list · info · MCP 미설치 안내와 theme add 출력이 바뀌어요.
