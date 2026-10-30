# WI-0103: check 의 패키지 CSS import 를 exports · 중첩 설치본까지 보고 풂 릴리스 노트

> **미발행**(2026-10-29 작성, 수정본 측정 반영). 사용자 결정 Q70 ~ Q79 는 모두 권장안이고, 구현 중 추가 결정 Q70a ~ Q70d 도 권장안으로 진행했어요([prd 8절](./prd.md))
> 대상: `@axis-ds/cli` patch · `@axis-ds/mcp` patch(registry-core 변경) | GitHub: #254 | linked 4패키지(tokens · theme · ui-react · agentic-ui)는 바뀌지 않아요

## 바뀐 점

- Tailwind 4 프로젝트에서 `axis check` · MCP `axis.check_project` 는 앱 안 CSS(진입 파일 · 상대 `@import` 로 들여온 하위 파일)의 tokens CSS import 줄(`@axis-ds/tokens/css` · `css/shadcn` · `css/tailwind4`)과 컴포넌트 `@axis-ds/ui-react/tailwind.css` · `@axis-ds/agentic-ui/tailwind.css` 줄을 Tailwind 4 빌드 도구와 같은 순서로 풀어요. 그 줄이 있는 파일 위치부터 위로 `node_modules` 를 찾고, 먼저 잡힌 설치본에 `exports` 가 있으면 그 `exports`(조건 `style` · `default`)로만 풀어요.
- 앱 안에 남은 낡은 중첩 `node_modules`(그림자 설치본) 때문에 빌드는 실패하는데 check 는 PASS 이던 경우를 알려요(측정: 착수 측정 147칸에서 실빌드와 어긋나던 칸 45 → 0).
  - 1.4.0 미만 `@axis-ds/tokens` 가 하위 파일 옆이나 진입 파일 옆 `node_modules` 에 남아 있으면 `./css/tailwind4` 를 내보내지 않아 빌드가 「is not exported under the condition "style"」로 실패해요. 이제 globals.css 가 「… 그 줄이 있는 파일 위치에서 먼저 잡히는 app/node_modules/@axis-ds/tokens(1.2.0)가 ./css/tailwind4 를 내보내지 않아 해석되지 않습니다 → 그 중첩 node_modules 의 @axis-ds/tokens 를 지우거나 1.4.0 이상으로 맞추세요」 WARN 이에요
  - 진입 파일의 컴포넌트 `tailwind.css` 줄도 진입 파일 옆 그림자를 봐요(종전에는 앱 기준으로만 봤음)
  - 앱과 워크스페이스 루트에 설치본이 없고 진입 파일 쪽 중첩 `node_modules` 에만 있어 다른 디렉터리의 하위 파일 줄이 풀리지 않으면 「설치본이 <경로> 에만 있음」 WARN 이에요
- `exports` 도 그 파일도 없는 중첩 디렉터리는 빌드 도구처럼 건너뛰어요. 종전에는 하위 파일의 컴포넌트 줄이 「이 파일 위치에서 … 찾지 못해 … globalCss 를 앱 안 파일로 바꾸세요」 WARN 이었는데 이제 PASS 예요(빌드는 성공).
- 하위 파일의 컴포넌트 줄 그림자 WARN 은 원인 문구(「… 내보내지 않아」 · 「내보낸 파일(…)이 없어」)로 바뀌었어요.
- pnpm 링크가 앱 기준 설치본과 같은 실체를 가리키면 그림자로 보지 않아요(측정).

## 종료 코드

- **바뀌지 않아요.** 새 판정은 모두 WARN 이에요(측정 152칸 · 기존 fixture 196개 모두 rc 같음).
- 집계(「N pass / M warn」)와 안내 줄은 그림자가 있는 프로젝트에서 달라져요.

## 바뀌지 않은 점

- 프로젝트 밖 진입 파일(`globalCss` 가 앱 밖)의 판정 · 문구, `@import "tailwindcss"` · `tw-animate-css` 줄, 루트 레이아웃 JS import, 브랜드 import, Tailwind 3 프로젝트, Plug'n'Play
- `axis theme add` 의 출력과 쓰는 파일(측정: 348개 사본에서 출력 · 파일 트리 sha256 같음)
- 앱 기준 설치본 자체의 판정(1.4.0 미만이면 종전 버전 확인 WARN, dist 를 아직 빌드하지 않은 workspace 링크는 종전 PASS)
- 그림자가 없는 프로젝트의 출력(측정: 기존 fixture 코퍼스에서 그림자 fixture 3개 말고는 CLI · MCP 출력 바이트 같음)

## 알려진 한계

- 그림자 파일이 해석되면 그 내용(토큰 변수 유무)은 보지 않아요(Q75)
- 프로젝트 밖 진입 파일 옆의 그림자는 종전 판정이라 PASS 로 남아요(Q70a)
- 같은 줄이 여러 파일에 있으면 처음 나온 줄만 봐요(Q70b)
- 앱 기준 설치본이 손상(exports · 파일 없음)이고 그 위 설치본이 빌드를 막는 경우는 판정하지 않아요(Q70c)
- exports 패턴 키 · 폴더 매핑 · `./` 로 시작하지 않는 대상 · 깨진 `package.json` 은 판정하지 않아요(빌드는 실패할 수 있음)
- 대상 경로에 `..` · 쿼리가 든 exports 는 WARN 은 맞지만 원인 문구가 「내보낸 파일이 없어」예요
- WI-0100 문서(prd 153줄 · release-notes 14줄 · 45줄)의 「그림자는 WI-0103 한계」 서술은 이 WI 로 해소됐어요(그 문서는 고치지 않았어요)
