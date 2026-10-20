# WI-0044: Tailwind 4 프로젝트의 AXIS 연동 PRD

> 작성일: 2026-10-20 | 버전: v1.0 | 작성자: Sinclair Seo | WI: WI-0044 | GitHub: #134 | 우선순위: P2 | 상태: Approved (2026-10-20 결정 반영)
> 기준: `origin/main` ba5dd78 (linked 4패키지 1.3.0, `@axis-ds/cli` 1.3.0 · `@axis-ds/mcp` 1.2.1 배포 완료)
> 관련: WI-0042(#131)에서 분리. 실측 워크플로 `wf_af6c0ba7-565`(측정 4 · 반박 검증 16 · 설계 1 에이전트). 같은 실측에서 나온 기존 결함은 WI-0045 ~ WI-0048(#136 ~ #139)로 분리

---

## 1. 개요

### 1.1 배경
- `create-next-app` 15.5 의 기본은 Tailwind 4 입니다. `@axis-ds/tokens` 의 Tailwind 연동은 Tailwind 3 preset(`@axis-ds/tokens/tailwind`)뿐이고 Tailwind 4 용 진입점(`@theme`)이 없습니다.
- 사용자 문서 가운데 Tailwind 4 연동(`@theme` · `@source`)을 안내하는 곳은 0건입니다(같은 검색으로 `preset` 6건 · `tailwind.config` 8건이 잡혀 계측 실패가 아님).

### 1.2 실측 (2026-10-20, create-next-app 15.5.28 · tailwindcss 4.3.3 · 배포본 1.3.0)

npm 패키지 경로(`@axis-ds/ui-react` Button):

| 구성 | Button 배경 | 비고 |
|---|---|---|
| V1 기본(`@import "tailwindcss"`) | 투명 rgba(0,0,0,0), radius 0px | |
| V2 + `@axis-ds/tokens/css` · `css/shadcn` | 투명 | 변수는 정의되지만 Tailwind 4 가 `node_modules` 를 스캔하지 않아 `.bg-[var(--axis-button-bg-default)]` 규칙이 0건(`.gitignore` 와 무관) |
| V3 + `@source` 로 ui-react dist | `#3B82F6`, 글자 `#FFFFFF` | Tailwind 3 대조군(preset + content)과 같음 |
| V3r V3 + `:root{--radius:1rem}` | radius 6/8px 그대로 | radius 가 AXIS `--radius` 가 아니라 Tailwind 4 기본값 |
| V4 V3 + 손으로 쓴 `@theme inline` | Tailwind 3 preset 과 같은 값(V4r 14/16px) | |

- 컴포넌트(ui-react 30 · agentic-ui 18 · 레지스트리 28)는 preset 색 클래스(`bg-primary` 등)를 쓰지 않고 `bg-[var(--axis-*)]` 임의값 클래스로 칠합니다(0건, 양성 대조로 측정 확인).
- preset 에 기대는 것은 radius(`rounded-sm/md/lg`, 모서리별 `rounded-*-sm` 포함: ui-react 17/30 · agentic-ui 13/18)와 `font-mono`(agentic-ui 9건)입니다. 기본 `--radius` 0.5rem 에서는 Tailwind 4 기본값과 우연히 같지만, ontology 브랜드(`--radius: 12px`, JetBrains Mono)에서는 어긋납니다.
- 앱 코드의 `bg-primary` 같은 shadcn 스타일 클래스는 `@theme` 매핑 없이는 생성되지 않습니다.
- 손으로 `@theme inline` 을 써도 create-next-app 기본 `globals.css` 의 `:root{--background:#ffffff}` · `body{background: var(--background)}` 가 AXIS shadcn 변수(HSL 삼중값)와 이름이 겹쳐 `bg-background` 가 무효가 됩니다.
- `axis init` 은 Tailwind 4 에서 tailwind-merge 범위만 바꾸고 토큰 · CSS 연결은 안내하지 않으며, 없는 `./tailwind.config.ts` 를 `axis.config.json` 에 기록합니다.

### 1.3 결정 (2026-10-20 사용자)

| # | 결정 |
|---|---|
| D1 | `@axis-ds/tokens` 에 Tailwind 4 진입점 `@axis-ds/tokens/css/tailwind4` 를 더합니다. preset 의 colors · borderRadius · fontFamily · darkMode 를 `@theme inline` · `@custom-variant dark` 로 재현합니다. 기존 동작을 바꾸지 않는 추가라 linked 4패키지 minor(1.4.0) |
| D2 | 스캔 경로는 `@axis-ds/ui-react` · `@axis-ds/agentic-ui` 가 `@source` 를 담은 `tailwind.css` 를 내고, 사용자는 import 한 줄로 얻습니다. import 한 CSS 안의 상대 `@source` 가 실제로 동작하는지 먼저 실측하고, 안 되면 문서 안내로 바꿉니다 |
| D3 | CLI 는 `axis init` 이 Tailwind 4 에서 필요한 import 줄을 안내하고(파일은 고치지 않음), `axis check`(MCP 포함)가 연동 누락을 WARN 으로 알립니다. 없는 `tailwind.config.ts` 를 기록하는 문제도 고칩니다 |
| D5 | dark 변형은 Tailwind 4 공식 형태 `@custom-variant dark (&:where(.dark, .dark *))` 를 유지합니다(2026-10-20 사용자 결정). Tailwind 3 preset(`darkMode: ['class']`, `.dark` 의 자손에만 적용 · 특이도 +1)과 달리 `.dark` 요소 자신에도 적용되고 특이도가 0 이라는 차이를 문서에 적습니다 |
| D4 | 범위 밖: `axis add` 레지스트리 미조회(WI-0045), 애니메이션 플러그인 · keyframes(WI-0046), 레지스트리 의존성 누락(WI-0047), 문서 스택 표기 드리프트(WI-0048) |

## 2. 요구사항

- FR-1: `@axis-ds/tokens` 빌드가 `dist/css/tailwind4.css` 를 만들고 exports 에 `./css/tailwind4` 를 더합니다. 내용은 preset 과 같은 매핑(색 24 · radius 3 · 글꼴 3)과 `@custom-variant dark` 이며, preset 과 어긋나지 않도록 같은 출처에서 만들거나 대조 테스트로 막습니다. 한 줄 import 로 쓸 수 있게 토큰 CSS(`variables.css` · `shadcn-compat.css`)를 함께 불러올지는 실측으로 정합니다.
- FR-2: `@axis-ds/ui-react` · `@axis-ds/agentic-ui` 가 `tailwind.css`(패키지 dist 를 가리키는 `@source`)를 배포하고 exports 에 넣습니다. ui-react 의 `sync-exports` 검사와 충돌하지 않아야 합니다.
- FR-3: `axis init` 이 Tailwind 4 를 감지하면 전역 CSS 에 넣을 import 줄(토큰 진입점 · 사용하는 컴포넌트 패키지의 `tailwind.css`)과 create-next-app 기본 `:root` · `body` 와의 이름 충돌 주의를 출력합니다. Tailwind 4 에서는 존재하지 않는 `tailwind.config.ts` 를 config 에 적지 않습니다.
- FR-4: `axis check` · MCP `axis.check_project` 는 Tailwind 4 에서 `@import "tailwindcss"` 가 있어도 토큰 진입점 import 가 없으면 WARN 을 냅니다(공유 코어 `tailwind-core.ts`, 사본 동일성 유지).
- FR-5: 문서: 패키지 README(tokens · ui-react · agentic-ui · cli), 사용자 가이드 · 문서 사이트의 설치 안내에 Tailwind 4 절을 더합니다. Tailwind 3 안내는 유지합니다.

## 3. 수용 기준

- AC1: Tailwind 4 앱(create-next-app 15.5.28)에서 `@import "tailwindcss"; @import "@axis-ds/tokens/css/tailwind4"; @import "@axis-ds/ui-react/tailwind.css";` 만으로 ui-react Button 배경이 `#3B82F6`, 앱 코드 `bg-primary` 가 Tailwind 3 preset 대조군과 같은 값입니다(Playwright 계산 스타일).
- AC2: `:root{--radius:1rem}` 판별 프로브에서 radius 가 Tailwind 3 preset 과 같이 따라가고, ontology 브랜드에서 radius 12/10/8px · `font-mono` 가 JetBrains Mono 스택입니다.
- AC3: Tailwind 3 경로(preset)의 출력과 기존 tokens 산출물(`variables.css` · `shadcn-compat.css` · 브랜드 CSS · 1.2.1 기준선 테스트)이 바뀌지 않습니다.
- AC4: `axis init` 이 Tailwind 4 프로젝트에서 import 줄을 안내하고 Tailwind 3 출력은 기존과 같습니다. `axis check` 는 Tailwind 4 + 토큰 진입점 없음에서 WARN, 있으면 PASS 이고 MCP 도 같은 문구입니다.
- AC5: 변이 음성 대조: 진입점 매핑 · `@source` · check WARN 을 각각 끄면 해당 테스트나 실측이 실패합니다.
- AC6: `pnpm exec turbo run type-check|lint|build|test --force` · `pnpm pack-smoke` 통과, 패키지 tarball 에 새 CSS 가 들어 있습니다.

## 4. 범위 밖 · 미측정
- D4 의 별도 WI 4건.
- 색을 지정하지 않은 `ring-2` · `border-t` 가 Tailwind 4 에서 currentColor 가 되는 차이(실측 공백, 문서에 주의로만 적음).
  - 사실 정정(2026-10-20, FR-5 단계 실측, testplan 5절): `ring-2` 는 진입점 유무와 관계없이 currentColor 입니다. `border-t` 는 진입점이 없으면 currentColor 이지만, `@axis-ds/tokens/css/tailwind4` 를 쓰면 진입점이 base 레이어로 불러오는 `* { border-color: hsl(var(--border)) }` 때문에 AXIS `--border` 색입니다. 문서에는 이 실측대로 적었습니다.
  - Tailwind 3 대비(2026-10-20 보정, testplan 6절 B1 · B2): Tailwind 3 preset 의 색 미지정 테두리는 preflight 의 gray-200(`#e5e7eb`)입니다(`@axis-ds/tokens/css/shadcn` 을 따로 import 하지 않을 때). Tailwind 4 진입점은 AXIS `--border` 라 기본 라이트에서는 rgb(229,231,235) 로 같지만, 다크(rgb(31,41,55))와 ontology 브랜드(라이트 rgb(230,232,235) · 다크 rgb(43,47,53))에서는 다릅니다. tokens README · quick-start 의 「다르게 동작하는 것」에 적었습니다.
- 다크 모드 · hover · Next 16 · turbopack 은 가능한 범위에서 실측하고 못 한 것은 testplan 에 미측정으로 남깁니다.
