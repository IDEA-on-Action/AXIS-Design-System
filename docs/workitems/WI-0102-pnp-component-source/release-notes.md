# WI-0102: Plug'n'Play 에서 컴포넌트 클래스가 생성되지 않는 경우를 check 가 알림 릴리스 노트

> **발행**(2026-10-31, npm cli 1.7.9 · mcp 1.4.8, Version PR #266 · publish run 41135645387, provenance 2/2). 이 문서의 결정은 2026-10-30 사용자가 모두 확정했어요(아래 「확인 대기」 표기는 작성 당시 상태예요).

> 미발행(2026-10-30 작성, 수정본 측정 반영). 사용자 결정 Q120 ~ Q125 는 대기 중이고 권장안 (a) 로 구현했어요([prd 7절](./prd.md))
> 대상: `@axis-ds/cli` patch · `@axis-ds/mcp` patch(registry-core 변경) | GitHub: #249 | linked 4패키지(tokens · theme · ui-react · agentic-ui)는 바뀌지 않아요

## 원인 (측정)

Yarn Plug'n'Play 는 패키지를 `.yarn/cache` 의 zip 으로 둬요. `@axis-ds/ui-react/tailwind.css` 의 `@source "./dist"` 는 그 zip 안 경로로 풀리고, Tailwind 4 스캐너는 실제 디렉터리만 읽어서 컴포넌트 클래스가 하나도 생성되지 않아요. 빌드는 성공(rc 0)해서 알아채기 어려워요.

- Yarn 4.5.3 · `@tailwindcss/cli` 4.1.14: PnP 4,455 B · 클래스 0(`@import "tailwindcss"` 만 넣은 빌드와 바이트가 같음), node-modules 47,858 B · 2건
- 루트 `package.json` 에 `dependenciesMeta` unplugged 를 두면 node-modules 와 바이트가 같아요
- `@tailwindcss/postcss` 4.1.14, Yarn 4.18.1 · Tailwind 4.3.3 도 같아요

## 바뀐 점

- Tailwind 4 프로젝트에서 `axis check` · MCP `axis.check_project` 는 Plug'n'Play 앱에 선언한 `@axis-ds/ui-react` · `@axis-ds/agentic-ui` 가 zip 안에만 있으면(앱 선언 범위에 맞는 `.yarn/unplugged/*/node_modules/<패키지>` 가 없음) 알려요.
  - 줄이 있으면 PASS 대신 「`<패키지>/tailwind.css` import 가 있지만 Plug'n'Play 에서 @source "./dist" 가 .yarn/cache zip 안을 가리켜 컴포넌트 클래스가 생성되지 않습니다 → Plug'n'Play 루트(.pnp.cjs 가 있는 곳) package.json 의 dependenciesMeta 에 "<패키지>": { "unplugged": true } 를 두고 yarn install 하세요」 WARN 이에요
  - 줄이 없으면 줄만 넣으라는 종전 안내 대신 같은 설정을 먼저 하고 줄을 넣으라고 안내해요
- 안내대로 설정하고 `yarn install` 하면 다음 check 는 종전 판정으로 돌아가요(측정: 실측 앱에서 PASS).
- `docs/guides/troubleshooting.md` 에 Plug'n'Play 설정 예시를 더했어요. 앱 `package.json` 에 두면 Yarn 이 따르지 않아요(측정).

## 종료 코드

- **바뀌지 않아요.** 새 판정은 모두 WARN 이에요.
- 집계(「N pass / M warn」)와 안내 줄은 해당 Plug'n'Play 프로젝트에서 달라져요.

## 바뀌지 않은 점

- Plug'n'Play 가 아닌 프로젝트, unplugged 로 설치한 프로젝트, `workspace:` · `portal:` · `link:` 범위, 그 패키지를 가리키는 `@source` 를 직접 쓴 CSS
- `axis theme add` · `axis init` 의 동작과 출력
- Tailwind 3 프로젝트(content 판정은 WI-0098 그대로)

## 알려진 한계

- `.yarnrc.yml` 의 `pnpUnpluggedFolder` 로 위치를 바꾸면 unplugged 를 찾지 못해 설정 뒤에도 WARN 이에요(WI-0098 과 같음)
- unplugged 디렉터리의 `dist` 가 실제로 있는지는 보지 않아요
- 범위를 읽지 못하는 선언(`npm:` 별칭 · `file:` · git)은 버전을 보지 않고 이름만 맞는 unplugged 설치본을 인정해요
- 패키지 쪽에서 해결하는 방법(`preferUnplugged`, 측정상 효과 있음)은 사용자 결정 Q121 대기예요
