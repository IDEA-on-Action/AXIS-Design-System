# WI-0065 릴리스 노트: theme add 가 기본 토큰 CSS 를 넣고, check 가 빠진 전제를 짚어요

> 작성일: 2026-10-24 | WI: WI-0065 | GitHub: #175 | changeset: `@axis-ds/cli` minor · `@axis-ds/mcp` patch(묶음 ③)

## 변경 사항

### axis theme add

- 브랜드 import 앞에 기본 토큰 CSS 를 넣어요. Tailwind 3 은 `@axis-ds/tokens/css` · `@axis-ds/tokens/css/shadcn`, Tailwind 4 는 `@axis-ds/tokens/css/tailwind4` 와 선언된 `@axis-ds/ui-react` · `@axis-ds/agentic-ui` 의 `tailwind.css` 예요. 이미 있는 줄은 넣지 않아요
- 새 줄은 파일 앞쪽 import 구간 끝(`@tailwind` 보다 앞)에 넣고, 규칙 뒤에 있는 기존 `@import` 는 맨 앞으로 옮기라고 알려요
- Tailwind 3 이면 preset · content 가 빠졌을 때 넣을 줄을 알려요(설정 파일은 고치지 않아요)
- 브랜드를 켜는 예시가 `<html data-brand>` 와 `useTheme().setBrand` 예요. 레이아웃에서 이미 찾으면 그 파일을 알려요. `defaultBrand` 는 끈 상태가 새로고침 뒤 유지되지 않아(WI-0068) 예시에서 뺐어요
- 설치 · 업그레이드 안내가 lockfile 을 따라요(npm 프로젝트에 `pnpm add` 를 내지 않음). `package.json` 에 더하는 `@axis-ds/tokens` 범위가 `^1.6.0` 이에요(종전 `^1.3.0`)
- `axis theme list` · `axis theme info` 의 설치 안내도 lockfile 을 따라요

### axis check · MCP axis.check_project

- Tailwind 3 은 `@axis-ds/tokens/tailwind` preset 이 있어야 PASS 예요. 종전에는 `var(--background)` · `hsl(var(` 문자열만 있어도 PASS 여서 create-next-app 기본 설정도 통과했어요(WARN 으로 바뀜)
- 해당할 때만 더하는 항목 3개
  - `brand.activation`(WARN): brand 가 있는데 루트 레이아웃에 ThemeProvider · data-brand 가 없음
  - `tailwind.content`(FAIL): Tailwind 3 content 가 componentsDir 나 선언된 컴포넌트 패키지 경로를 덮지 않음. FAIL 이면 종료 코드 1 이에요
  - `animation`(WARN): ui-react 를 쓰는데 애니메이션 플러그인이 없음
- MCP 는 같은 공유 코어로 같은 항목 · 문구를 내요. 도구 이름 · 입력 · 결과 모양은 그대로이고 결과 항목만 늘어요

### axis init

- 애니메이션 플러그인이 `package.json` 에 없으면 안내 한 줄을 내요

## 실측 요약

- src 없는 Next 15 + Tailwind 3 프로젝트에서 `init -y` → `theme add ontology` → `add button` 만으로 Button 이 투명 · 0px 에서 AXIS 기본색 #2563EB · 6px 가 됐어요. cli 가 안내한 `<html data-brand>` 1줄 뒤 #326ADA, preset 1줄 뒤 ontology 둥글기 10px 이에요
- 같은 프로젝트의 cli 1.5.4 결과물에 새 check 는 content FAIL · rc 1 을 내요(1.5.4 check 는 rc 0)

## 남겨 둔 것

- Tailwind 3 에서는 preflight 가 shadcn 의 `* { border-color }` 를 덮어 기본 테두리색이 gray-200 이에요(ontology 와 1 단위 차이, tokens 변경 필요)
- MCP 브랜드 도구의 설치 안내는 종전처럼 pnpm 한 가지예요(범위만 ^1.6.0)
- quick-start · 브랜드 가이드의 서술 정리는 WI-0064(묶음 ④)가 이 결과를 옮겨요
