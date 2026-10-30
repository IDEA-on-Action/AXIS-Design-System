# WI-0096: npm 워크스페이스 루트 선언의 설치 위치 안내 릴리스 노트

> **발행**(2026-10-31, npm cli 1.7.9 · mcp 1.4.8, Version PR #266 · publish run 41135645387, provenance 2/2). 이 문서의 결정은 2026-10-30 사용자가 모두 확정했어요(아래 「확인 대기」 표기는 작성 당시 상태예요).

> 대상: `@axis-ds/cli` 1.7.8 다음 patch · `@axis-ds/mcp` 1.4.7 다음 patch | GitHub: #240 | 기준: `main` e32275e

## 바뀐 점

npm 워크스페이스에서 루트 `package.json` 에만 선언한 패키지가 설치되지 않았을 때, 설치 안내가 「워크스페이스 루트에서 npm install」로 실행 위치까지 알려요. 앱 디렉터리에서 `npm install` 을 실행하면 루트에만 선언한 패키지는 설치되지 않아요(npm 7.24.2 · 8.19.4 · 9.9.4 · 10.9.4 실측). 종전 안내를 따르면 같은 경고가 다시 나왔어요.

| 명령 | 종전 | 이번 |
|---|---|---|
| `axis theme add` | `    설치: npm install`(tokens 가 루트 선언 · 미설치) | `    설치: 워크스페이스 루트에서 npm install` |
| `axis theme add` | `… 설치(npm install) 뒤 theme add 를 다시 실행하거나 직접 넣으세요.`(루트 선언 컴포넌트 패키지 미설치) | `… 설치(워크스페이스 루트에서 npm install) 뒤 …` |
| `axis init` | `  설치는 실행하지 않았습니다. 설치: npm install`(clsx · tailwind-merge 가운데 하나라도 루트 선언) | `  설치는 실행하지 않았습니다. 설치: 워크스페이스 루트에서 npm install` |
| `axis init` | `애니메이션: … 는 워크스페이스 루트에 선언돼 있지만 설치되지 않았습니다. npm install 뒤 …` | `… 워크스페이스 루트에서 npm install 뒤 …` |
| `axis check` · MCP `axis.check_project` | `선언됐지만 설치되지 않은 의존성: … → npm install`(묶음에 루트 선언이 있을 때) | `… → 워크스페이스 루트에서 npm install` |
| `axis check` · MCP `axis.check_project` | `워크스페이스 루트에 선언돼 있지만 설치되지 않았습니다: … → npm install` | `… → 워크스페이스 루트에서 npm install` |

한 안내 묶음에 앱 선언과 루트 선언이 섞여 있으면 루트 위치 문구예요. 루트에서 실행하면 앱 선언도 함께 설치돼요(npm 네 버전 측정). 이제 `axis theme list` · `axis theme info` · MCP 브랜드 도구 · check 의 Tailwind 4 줄 · Tailwind 3 preset 게이트와 같은 문구예요. 문구는 권장안으로 넣었고 최종 확정은 사용자 확인 대기예요(Q110 · Q115).

## 종료 코드

`axis check` 의 종료 코드는 바뀌지 않아요. 바뀐 것은 WARN 문구의 설치 명령 구절뿐이고 판정 · 「N pass / M warn」 집계는 그대로예요(같은 fixture 18개를 수정 전후로 돌려 rc 18/18 같음).

## 바뀌지 않은 점

- pnpm · yarn 워크스페이스는 앱 디렉터리에서 실행해도 루트 선언이 설치돼 종전 「pnpm install」 · 「yarn install」 그대로예요(pnpm 9.15.4 · yarn 1.22.22 측정).
- npm 이어도 앱 `package.json` 에만 선언한 패키지의 안내는 종전 「npm install」이에요.
- 설치본이 있어 안내가 나오지 않는 경우, Yarn Plug'n'Play 안내, theme add 의 업그레이드 안내(루트 선언이면 「워크스페이스 루트 package.json 의 … 선언을 올리고 설치하세요」)는 그대로예요.
- `axis template apply` · MCP `axis.apply_template` 은 다루지 않았어요(WI-0088).

## 알려진 한계

- `axis theme add` · `axis theme list` 는 앱 디렉터리에 lockfile 이 있으면 루트 선언을 보지 않고 종전 추가 명령을 안내해요(WI-0087 P2). npm 10.9.4 에서는 앱 lockfile 이 있어도 앱 디렉터리 `npm install` 이 루트 선언을 설치하지 않았어요(prd 2.3 · Q113, 잔여).
- `axis init` 의 Tailwind 설치본 · 선언 major 불일치 경고 「<설치 명령> 뒤 tailwind-merge 범위를 다시 확인하세요」는 그대로예요(Q114, 잔여).
- npm 6 이하(workspaces 미지원)는 대상이 아니에요.
