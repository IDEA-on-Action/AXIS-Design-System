# WI-0104: check 가 Tailwind 3 preset · tokens 줄을 설치본의 exports 로 봄 릴리스 노트

> 2026-10-30 작성(수정본 측정 반영). Q130 ~ Q137 은 권장안으로 진행했고 사용자 확인 대기예요([prd 6절](./prd.md))
> 대상: `@axis-ds/cli` patch · `@axis-ds/mcp` patch(registry-core 변경) | GitHub: #260 | linked 4패키지(tokens · theme · ui-react · agentic-ui)는 바뀌지 않아요

## 바뀐 점

- Tailwind 3 프로젝트에서 `axis check` · MCP `axis.check_project` 의 tailwind.config 항목이 preset(`@axis-ds/tokens/tailwind`)을 Node 해석기처럼 풀어요. 설정 파일 위치부터 위로 올라가며 처음 잡히는 `@axis-ds/tokens` 설치본에 `exports` 가 있는데 `./tailwind` 를 내보내지 않으면 빌드가 `ERR_PACKAGE_PATH_NOT_EXPORTED` 로 실패하므로 WARN 이에요(측정: 착수 189칸 가운데 이 오류로 실패하던 50칸이 PASS → WARN).
  - 문구: 「tailwind.config.mjs에 AXIS preset 참조가 있지만 먼저 잡히는 node_modules/@axis-ds/tokens(1.8.2)가 ./tailwind 를 내보내지 않아 해석되지 않습니다 → 그 node_modules 의 @axis-ds/tokens 를 지우거나 다시 설치하세요」
  - 앱 `node_modules` 에 남은 미노출 설치본이 워크스페이스 루트의 정상 설치본을 가리는 경우도 같아요
  - 조건부 `./tailwind` 는 `require(...)` 로 받으면 `require` · `node` · `module-sync` · `default`, ESM `import` 로 받으면 여기에 `import` 조건까지 맞는 것으로 봐요(Node 22.22 측정)
  - CommonJS bare require 에서 1.7.0 미만 · 미노출 설치본이면 버전 문구 대신 위 문구예요
- Tailwind 3 프로젝트의 globals.css 항목이 앱 안 전역 CSS(진입 파일 · 하위 파일)의 tokens CSS import 줄 위치에서 먼저 잡히는 중첩 설치본이 그 경로(`./css` 등)를 내보내지 않으면 WARN 이에요(측정: Next 14 + Tailwind 3 빌드 「Package path ./css is not exported」 4칸이 PASS → WARN).
  - 문구: 「src/app/globals.css에 @axis-ds/tokens/css import 가 있지만 그 줄이 있는 파일 위치에서 먼저 잡히는 src/styles/node_modules/@axis-ds/tokens(1.8.2)가 ./css 를 내보내지 않아 해석되지 않습니다 → 그 중첩 node_modules 의 @axis-ds/tokens 를 지우거나 다시 설치하세요 (src/styles/axis.css 의 import)」

## 종료 코드

- **바뀌지 않아요.** 새 판정은 모두 WARN 이에요(측정: 189칸 · Next 10칸 · 다른 항목이 모두 통과하는 기준선 6칸에서 발행본 cli 1.7.8 · mcp 1.4.7 과 rc 같음, 기준선은 WARN 이 생겨도 rc 0).
- 집계(「N pass / M warn」)는 해당 레이아웃에서 달라져요.

## 바뀌지 않은 점

- 발행된 `@axis-ds/tokens`(1.1.0 ~ 1.8.2)는 모두 `./tailwind` · `./css` 를 내보내 정상 설치본의 판정은 그대로예요(측정 139칸 문구 바이트 같음)
- 내보낸 대상 파일이 없는 설치본(dist 를 아직 빌드하지 않은 workspace 링크 등), `exports` 가 없는 설치본 stub, 앱 선언 · 미설치, Plug'n'Play
- Tailwind 3 globals.css 의 대상 파일만 없는 그림자 · `exports` 없는 그림자 · 「이 위치에서 안 보임」 · 프로젝트 밖 전역 CSS
- Tailwind 4 프로젝트(설정 파일에 preset 이 있어도), `axis theme add` · `axis init`

## 알려진 한계

- 내보낸 대상 파일이 없거나(Q132) `exports` · 맨 경로 파일이 모두 없는 설치본(Q133)은 빌드가 실패해도 PASS 예요(측정 28칸)
- `module-sync` 조건만 내보낸 설치본은 CommonJS bare require 가 preset 을 받지 못하지만(빌드 rc 0, 클래스 빠짐) 판정하지 않아요
- Node 20 처럼 `require(esm)` · 타입 제거가 기본이 아닌 런타임 · Vite 등 Next 밖 Tailwind 3 CSS 파이프라인은 재지 않았어요
