---
"@axis-ds/tokens": minor
"@axis-ds/ui-react": minor
"@axis-ds/agentic-ui": minor
---

Tailwind CSS 4 프로젝트에서 AXIS 를 import 몇 줄로 연동할 수 있게 했습니다(WI-0044).

- `@axis-ds/tokens`: Tailwind 4 진입점 `@axis-ds/tokens/css/tailwind4` 를 더했습니다. Tailwind 3 preset(`@axis-ds/tokens/tailwind`)과 같은 매핑(색 24 · radius 3 · 글꼴 3)을 `@theme inline` 으로, `.dark` 클래스 다크 모드를 `@custom-variant dark (&:where(.dark, .dark *))` 로 정의하고, 토큰 변수(`css` · `css/shadcn`)를 base 레이어로 함께 불러옵니다. `@import "tailwindcss";` 뒤에 `@import "@axis-ds/tokens/css/tailwind4";` 한 줄이면 `bg-primary` · `rounded-md` · `font-mono` · `dark:bg-primary` 가 AXIS 변수로 생성되고, `--radius` 와 브랜드 CSS(ontology 등)를 따라갑니다. preset 과 같은 소스에서 빌드 때 만들어집니다.
- `@axis-ds/ui-react` · `@axis-ds/agentic-ui`: 패키지 빌드 산출물을 가리키는 `@source` 를 담은 `tailwind.css` 를 배포합니다. Tailwind 4 는 `node_modules` 를 스캔하지 않아 컴포넌트 클래스(`bg-[var(--axis-button-bg-default)]` 등)가 생성되지 않았는데, 전역 CSS 에 `@import "@axis-ds/ui-react/tailwind.css";` 한 줄을 더하면 생성됩니다. npm · pnpm 설치 모두 동작합니다.
- 다크 변형은 Tailwind 4 공식 형태라 Tailwind 3 preset(`.dark` 의 자손에만 적용, 명시도 +1)과 달리 `.dark` 를 붙인 요소 자신에도 적용되고 명시도를 올리지 않습니다.

Tailwind 3 사용자는 영향이 없습니다. preset 과 기존 CSS 산출물(`variables.css` · `shadcn-compat.css` · 브랜드 CSS · JSON · JS)은 바뀌지 않았고, 새 파일과 exports 항목만 더해졌습니다.
