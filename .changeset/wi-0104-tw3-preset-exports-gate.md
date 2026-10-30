---
"@axis-ds/cli": patch
"@axis-ds/mcp": patch
---

`axis check` · MCP `axis.check_project` 가 Tailwind 3 프로젝트에서 `@axis-ds/tokens` 설치본의 `exports` 를 실빌드처럼 봐요(WI-0104). 두 패키지가 같은 공유 코어(registry-core)를 번들해 판정 · 문구가 같아요.

- **PASS 가 WARN 으로 바뀌는 경우**(종료 코드는 그대로이고 「N pass / M warn」 집계가 달라져요). 모두 빌드가 `exports` 때문에 실패하는 레이아웃이에요:
  - tailwind.config: 설정 파일 위치부터 위로 올라가며 처음 잡히는 `@axis-ds/tokens` 설치본에 `exports` 가 있는데 `./tailwind` 를 내보내지 않는 경우(앱 `node_modules` 의 중첩 설치본이 워크스페이스 루트의 정상 설치본을 가리는 경우 포함, preset 을 받는 모양과 상관없음) → 「tailwind.config.mjs에 AXIS preset 참조가 있지만 먼저 잡히는 node_modules/@axis-ds/tokens(1.8.2)가 ./tailwind 를 내보내지 않아 해석되지 않습니다 → 그 node_modules 의 @axis-ds/tokens 를 지우거나 다시 설치하세요」. Tailwind 3.4 빌드는 `ERR_PACKAGE_PATH_NOT_EXPORTED` 로 실패해요. `./tailwind` 가 조건부(`{ "import": … }` 만 등)면 `require(...)` 로 받는 설정만 WARN 이에요(Node 22 기준 `require` · `node` · `module-sync` · `default` 조건, ESM `import` 로 받으면 `import` 조건도 맞음)
  - globals.css: Tailwind 3 에서 앱 안 전역 CSS(진입 파일 · 상대 `@import` 로 들여온 하위 파일)의 tokens CSS import 줄 위치에서 먼저 잡히는 중첩 설치본이 그 경로(`./css` 등)를 내보내지 않는 경우(조건 `style` · `default` 가 맞지 않는 경우 포함) → 「… import 가 있지만 그 줄이 있는 파일 위치에서 먼저 잡히는 src/styles/node_modules/@axis-ds/tokens(…)가 ./css 를 내보내지 않아 해석되지 않습니다 → 그 중첩 node_modules 의 @axis-ds/tokens 를 지우거나 다시 설치하세요」. Next 14 빌드가 `Package path ./css is not exported` 로 실패해요
- **WARN 문구만 바뀌는 경우**: CommonJS bare require 이고 처음 잡히는 설치본이 1.7.0 미만이면서 `./tailwind` 를 내보내지 않으면, 종전 버전 문구 대신 위의 「내보내지 않아」 문구예요.
- **check 종료 코드가 바뀌는 경우**: 없어요. 새 판정은 모두 WARN 이에요(다른 항목이 모두 통과하는 fixture 6개에서 발행본 cli 1.7.8 · mcp 1.4.7 과 수정본이 모두 rc 0, WI-0104 testplan 3.3).
- 바뀌지 않는 경우: 발행된 `@axis-ds/tokens` 는 모든 버전(1.1.0 ~ 1.8.2)이 `./tailwind` · `./css` 를 내보내므로 정상 설치본은 그대로예요. `exports` 가 없는 설치본 디렉터리는 `tailwind` 파일이 없으면 상위 설치본으로 건너뛰고(상위에도 없으면 종전 PASS), 내보낸 대상 파일이 없는 경우(dist 를 아직 빌드하지 않은 workspace 링크 등)와 설치본이 없는 경우, Plug'n'Play 는 종전 판정이에요. Tailwind 3 의 globals.css 에서 대상 파일만 없는 그림자 · `exports` 없는 그림자 · 「이 위치에서 안 보임」 · 프로젝트 밖 전역 CSS 도 종전이에요. Tailwind 4 프로젝트(tailwind.config 파일이 있어도)는 바뀌지 않아요.
- `axis theme add` · `axis init` 의 동작과 출력은 바뀌지 않아요.
