# WI-0094: dependencies 의 @axis-ds/* 루트 대상 릴리스 노트

> 대상: `@axis-ds/cli` patch · `@axis-ds/mcp` patch (같은 PR: WI-0091 · WI-0092, changeset 1개) | GitHub: #237
> 발행: PR-A · PR-B(WI-0093)를 모두 머지한 뒤 Version PR 하나로 cli 1.7.6 · mcp 1.4.5 (예정)

## 바뀐 점

- `axis check` · MCP `axis.check_project` 의 dependencies 항목이 워크스페이스 루트 `package.json` 에 선언한 `@axis-ds/*`(앱에 없는 것)도 설치 확인 대상으로 봐요.
  - 설치되지 않았으면 「워크스페이스 루트에 선언돼 있지만 설치되지 않았습니다: @axis-ds/ui-react → <설치 명령>」 WARN 이에요. 지금까지는 앱 선언만 봐서 「N개 확인」 PASS 였어요.
  - 설치돼 있으면 PASS 이고 「N개 확인」 수만 늘어요.
  - 끝의 「워크스페이스 루트에 선언: …」 표시에도 그 이름이 들어가요.
  - 종료 코드는 바뀌지 않아요(WARN).
- 이 결정은 WI-0081 · 배치 6c 가 정한 경계(`@axis-ds/*` 는 앱 선언만)를 다시 정한 것이에요(사용자 결정 Q11 · Q19).
- 루트 대상에는 이름 필터가 없어요. `@axis-ds/cli` 같은 도구 패키지도 대상이고, 앱 디렉터리에 자체 lockfile 이 있어도 루트 선언을 셈해요(필수 · 권장 의존성과 같은 규칙).

## 잔여 · 알려진 한계

- 워크스페이스 멤버가 아니면서 자체 lockfile 을 가진 앱(측정 R8b)도 루트 선언을 셈해 WARN 이 나와요(WI-0081 D1 의 잔여 오차와 같은 축, 사용자 결정 Q19).
- npm 워크스페이스에서 안내하는 `npm install` 은 앱 디렉터리에서 실행하면 루트 선언을 설치하지 않아요(npm 10.9.4 측정). 위치 문구는 WI-0096 에서 고쳐요.
- Plug'n'Play 의 루트 전용 `@axis-ds/*` 는 설치 확인 대상(「N개」)에 넣지 않아요(WI-0091 Q1 규칙). 대신 「<이름> 가 워크스페이스 루트에만 선언돼 Plug'n'Play 에서 앱이 해석하지 못합니다 → 앱 package.json 에 선언하세요」 WARN 으로 알려요(추가 결정 A3, 종료 코드 불변). 필수 의존성도 루트 전용이라 FAIL 이면 그 FAIL 만 나와요.
- 루트에 `workspace:*` 로 선언한 `@axis-ds/*`, yarn 1 · bun 레이아웃은 재지 않았어요.
