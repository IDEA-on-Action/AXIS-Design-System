# WI-0090 릴리스 노트

> 예상 버전: `@axis-ds/cli` 1.7.4 · `@axis-ds/mcp` 1.4.4 (patch) | GitHub: #227

## 바뀐 점

- `axis check` · MCP `axis.check_project` 의 `tailwind.content` 항목: pnpm 기본 레이아웃처럼 앱의 컴포넌트 패키지 설치본이 `.pnpm` 스토어 링크이면, 아래 glob 도 덮은 것으로 봐요(종전에는 실제 빌드가 같은 클래스를 만드는데도 FAIL).
  - 실경로가 앱 설치본과 같은 상위 설치본을 가리키는 glob(`../../node_modules/@axis-ds/ui-react/dist/**/*.{js,mjs}`)
  - 스토어 실경로를 상대 경로로 쓴 glob(`../../node_modules/.pnpm/**/@axis-ds/ui-react/dist/**/*.{js,mjs}` 등)
- 실경로가 다른 상위 설치본을 가리키면 종전대로 FAIL 이고, 문구에 이유를 붙여요. 예: `(상위 경로 ../../node_modules/@axis-ds/ui-react 는 앱이 쓰는 설치본과 다른 설치본(1.8.1, 앱 1.8.2)이라 덮음으로 보지 않아요)`. 실측에서 그 경로는 다른 버전을 스캔해 클래스 하나가 빠졌어요.

## 영향

- 제안 glob 과 그 밖의 문구는 바뀌지 않아요. `axis theme add` 의 content 안내도 그대로예요.
