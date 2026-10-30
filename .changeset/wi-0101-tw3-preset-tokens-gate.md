---
"@axis-ds/cli": patch
"@axis-ds/mcp": patch
---

`axis check` · MCP `axis.check_project` 의 Tailwind 3 tailwind.config 항목이 preset(`@axis-ds/tokens/tailwind`) 참조를 「참조가 있는가」가 아니라 「이 앱에서 `@axis-ds/tokens` 가 해석되는가」로 판정해요(WI-0101). CommonJS `require` · `.default` · ESM `import` · `.ts` 등 모양을 가리지 않아요. 두 패키지가 같은 공유 코어(registry-core)를 번들해 판정 · 문구가 같아요.

- **PASS 가 WARN 으로 바뀌는 경우**(종료 코드는 그대로이고 「N pass / M warn」 집계가 달라져요). 모두 Tailwind 3.4 빌드가 `Cannot find module '@axis-ds/tokens/tailwind'` 로 실패하는 레이아웃이에요:
  - tokens 를 어디에도 선언하지 않았고 설치본도 없는데 preset 을 CommonJS `.default` · ESM `import` · `.ts` · `.mjs` 안의 `require` 로 받는 경우 → 「tailwind.config.mjs에 AXIS preset 참조가 있지만 @axis-ds/tokens 가 설치되지 않아 해석되지 않습니다 → 설치(pnpm add "@axis-ds/tokens@^1.7.0")」(설치 명령은 lockfile · `packageManager` 를 따라요). 앱에 `package.json` 이 없을 때도 같아요
  - tokens 를 워크스페이스 루트에만 선언했고 설치본이 없는 경우(모든 모양. CommonJS bare require 는 루트 범위가 1.7.0 이상일 때) → 같은 문구, 설치 안내는 「pnpm install」 · 「워크스페이스 루트에서 npm install」 등
  - Yarn Plug'n'Play 에서 tokens 를 워크스페이스 루트에만 선언하고 preset 을 bare require 가 아닌 모양으로 받는 경우 → 「… 워크스페이스 루트에만 선언돼 Plug'n'Play 에서 앱이 해석하지 못합니다(워크스페이스 루트 선언 …) → 앱 package.json 에 @axis-ds/tokens 를 선언하세요」. Plug'n'Play 에서 어디에도 선언하지 않았으면(bare require 가 아닌 모양) 「설치되지 않아 해석되지 않습니다 → 설치(yarn add …)」예요
- **WARN 문구만 바뀌는 경우**(CommonJS bare require, 곧 `.cjs` 나 `module.exports` 의 `.default` 없는 `require("@axis-ds/tokens/tailwind")`):
  - 미선언 · 미설치(Plug'n'Play 포함): 종전 「@axis-ds/tokens 버전을 확인하지 못했습니다(설치본 · 선언 없음)」 대신 위의 「설치되지 않아 해석되지 않습니다」 WARN 이에요
  - 워크스페이스 루트에만 1.7.0 미만(또는 하한을 읽을 수 없는 범위)으로 선언하고 설치하지 않음: 종전 「선언 ^1.6.0 에서는 CommonJS 의 require(…) 가 preset 이 아니라 { default } 를 돌려줘 …」 대신 같은 설치 안내 WARN 이에요. 안내대로 설치하면 다음 check 에서 종전 버전 WARN 이 이어서 나올 수 있어요
- **check 종료 코드가 바뀌는 경우**: 없어요. 새 판정은 모두 WARN 이에요(fixture 91개를 발행본 1.7.7 · 1.4.6 과 같은 바이트의 빌드, 곧 WI-0103 이 들어오기 전 main e103d43 빌드와 나란히 돌려 종료 코드가 모두 같음, WI-0101 testplan 3.2).
- 바뀌지 않는 경우: 앱 `package.json` 에 tokens 를 선언했으면 설치하지 않았어도 종전 판정이에요(미설치는 dependencies 항목이 「선언됐지만 설치되지 않은 의존성」으로 알려요). 설치본 디렉터리(`node_modules/@axis-ds/tokens`, 상위 디렉터리 포함)가 있으면 선언 위치와 상관없이 종전 판정이에요. 1.7.0 버전 판정은 종전대로 CommonJS bare require 만 봐요(다른 모양은 1.6.2 에서도 preset 이 들어와요). Plug'n'Play 루트 전용의 CommonJS bare require 문구도 그대로예요. 템플릿(`axis template init`)이 만드는 프로젝트는 tokens 를 앱에 선언하므로 바뀌지 않아요.
- `axis theme add` · `axis init` 의 동작과 출력은 바뀌지 않아요.
- 같은 발행의 WI-0103(패키지 CSS import 를 exports · 중첩 설치본까지 보고 해석)은 Tailwind 4 의 CSS 줄만 다뤄요. 그 항목의 「Tailwind 3 프로젝트는 바뀌지 않음」은 CSS 줄 판정을 말하고, 이 항목의 tailwind.config preset 판정과는 따로예요. preset 판정은 설치본의 exports 에 `./tailwind` 가 있는지는 보지 않아요.
