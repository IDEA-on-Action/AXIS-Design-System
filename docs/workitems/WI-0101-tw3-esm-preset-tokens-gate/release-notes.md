# WI-0101: Tailwind 3 preset 의 tokens 해석 게이트 릴리스 노트

> **미발행**(2026-10-29 작성, 수정본 측정 · 반박 검증 보정 반영, [testplan 3 ~ 5절](./testplan.md)). 새 문구 · 설치 안내 범위는 구현 그대로 2026-10-30 사용자가 확정했어요(추가 결정 Q61a · Q61b · Q65a)
> 대상: `@axis-ds/cli` patch · `@axis-ds/mcp` patch | GitHub: #248 | linked 4패키지(tokens · theme · ui-react · agentic-ui)는 올리지 않아요

## 바뀐 점

- Tailwind 3 에서 `axis check` · MCP `axis.check_project` 의 tailwind.config 항목은 `@axis-ds/tokens/tailwind` preset 참조를 「참조가 있는가」가 아니라 「이 앱에서 `@axis-ds/tokens` 가 해석되는가」로 판정해요. CommonJS `require` · `.default` · ESM `import` · `.ts` · `.mjs` 안의 `require` 모두 같아요(사용자 결정 Q61). 지금까지는 tokens 가 설치되지 않아 Tailwind 3.4 빌드가 `Cannot find module '@axis-ds/tokens/tailwind'` 로 실패하는 레이아웃도 대부분 PASS 였어요(착수 측정 21칸 가운데 19칸).
  - 루트 선언 · 미설치: 「… 가 설치되지 않아 해석되지 않습니다 → 설치(<설치 명령>)」 WARN(Q63). npm 워크스페이스 루트 선언이면 「워크스페이스 루트에서 npm install」이에요
  - 미선언 · 미설치(앱 `package.json` 이 없을 때 포함): 같은 WARN, 설치 명령은 범위를 붙인 추가 명령(`pnpm add "@axis-ds/tokens@^1.7.0"` 등)
  - Yarn Plug'n'Play 에서 루트에만 선언: 「… 가 워크스페이스 루트에만 선언돼 Plug'n'Play 에서 앱이 해석하지 못합니다(워크스페이스 루트 선언 …) → 앱 package.json 에 @axis-ds/tokens 를 선언하세요」 WARN. Yarn 4.5.3 PnP 실빌드에서 ESM `.mjs` · `.ts` 모두 rc 1 「Your application tried to access @axis-ds/tokens, but it isn't declared in your dependencies」, 앱에도 선언하면 rc 0 이었어요(사용자 결정 Q69 착수 게이트)
- CommonJS bare require 는 이미 WARN 이던 두 경우에 문구만 바뀌어요(Q65). 미선언 · 미설치는 「버전을 확인하지 못했습니다(설치본 · 선언 없음)」 대신, 워크스페이스 루트에 1.7.0 미만으로 선언 · 미설치는 「선언 ^1.6.0 에서는 …」 대신 위의 설치 안내 WARN 이에요. 그 레이아웃은 버전과 상관없이 빌드가 실패해서, 버전 안내를 따라도 고쳐지지 않았어요. 루트 1.7.0 미만 선언은 설치 뒤 다음 check 에서 종전 버전 WARN 이 이어서 나와요.

## 종료 코드

- **바뀌지 않아요.** 새 판정은 모두 WARN 이에요(fixture 91개 A/B 에서 종료 코드 전이 0, 바뀐 26칸은 tailwind.config 줄뿐).
- tailwind.config 가 PASS 에서 WARN 으로 바뀌는 프로젝트는 「N pass / M warn」 집계와 안내 줄이 달라져요. 출력 문구를 grep 하는 스크립트는 확인해 주세요.

## 바뀌지 않은 점

- 앱 `package.json` 에 tokens 를 선언했으면 설치하지 않았어도 종전 판정이에요(사용자 결정 Q62). 미설치는 dependencies 항목의 「선언됐지만 설치되지 않은 의존성」 WARN 이 알려요. `axis template init` 으로 만든 프로젝트(템플릿이 tokens 를 앱에 선언)는 설치 전에도 바뀌지 않아요(측정).
- 설치본 디렉터리(`node_modules/@axis-ds/tokens`, 상위 디렉터리 · pnpm 루트 링크 포함)가 있으면 선언 위치와 상관없이 종전 판정이에요(Q68).
- 1.7.0 버전 판정은 종전대로 CommonJS bare require 만 봐요(Q64). 다른 모양은 tokens 1.6.2 에서도 preset 이 들어와요(실빌드 15칸).
- Plug'n'Play 루트 전용의 CommonJS bare require 문구(「… 1.7.0 이상을 선언하세요」)는 그대로예요.
- Tailwind 4 판정, globals.css 판정, `axis theme add` · `axis init` 은 바뀌지 않아요.

## 잔여 · 알려진 한계

- tokens 를 앱에 선언했지만 설치하지 않은 경우는 tailwind.config 가 PASS 이고 빌드는 실패해요(Q62 로 의도한 범위, dependencies 항목이 알림).
- 설치본 디렉터리는 있는데 `dist/tailwind-preset.*` 가 없는 손상 설치는 PASS 예요(Q68).
- `.yarnrc.yml` 의 `pnpFallbackMode: all` 처럼 루트 선언이 실제로 해석되는 PnP 에서도 WARN 이에요(WI-0091 Q1 과 같은 잔여 오차).
- Plug'n'Play 는 캐시를 읽지 않아, 앱에 선언했지만 캐시에서 빠진 경우는 PASS 예요.
- `.ts` 에서 tsconfig `paths` 별칭 · 다른 파일 re-export 로 preset 을 받는 모양은 참조를 찾지 못해 종전 「preset 없음」 WARN 이에요(Q66).
- 설치본 디렉터리는 있지만 version 을 읽지 못하고 선언도 없는 CommonJS bare 는 종전 문구 「버전을 확인하지 못했습니다(설치본 · 선언 없음)」를 그대로 내요. 표기 「설치본 · 선언 없음」이 실제(설치본은 있음)와 조금 달라요(종전부터).
- Plug'n'Play 에서 tokens 를 `optionalDependencies` 에만 선언하면 선언으로 보지 않아(dependencies · devDependencies 만 봄) WARN 일 수 있어요(추정, 미측정. globals.css 판정과 같은 헬퍼의 한계).
- Next.js 실빌드 · Windows 는 재지 않았어요.
