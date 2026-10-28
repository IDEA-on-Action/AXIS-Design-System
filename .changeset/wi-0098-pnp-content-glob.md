---
"@axis-ds/cli": patch
"@axis-ds/mcp": patch
---

`axis check` · MCP `axis.check_project` · `axis theme add` 가 Yarn Plug'n'Play 의 Tailwind 3 `content` 를 실제 빌드와 맞게 판정 · 안내해요(WI-0098). 두 패키지가 같은 공유 코어(registry-core)를 번들해 판정 · 문구가 같아요.

**업데이트 뒤 `axis check` 종료 코드가 1 에서 0 으로 바뀔 수 있어요.** unplugged 를 설정한 Plug'n'Play 프로젝트(`dependenciesMeta` 의 `unplugged: true`)에서 `content` 가 `.yarn/unplugged/*/node_modules/<패키지>` 를 가리키는 glob(상대 · 절대)으로 컴포넌트 패키지를 덮으면 지금까지는 FAIL 이었는데 이제 PASS 예요(실제 빌드에서 클래스가 정상으로 생성되는 경우). 앱 `package.json` 의 선언 범위에 맞는 버전의 unplugged 디렉터리만 인정해요. 종료 코드가 0 에서 1 로 바뀌는 경우는 없어요.

- Plug'n'Play(`.pnp.cjs`)에서 `content` 가 `./node_modules/@axis-ds/ui-react/dist/**/*.{js,mjs}`(agentic-ui 도 같음)나 넓은 `./**/*.{js,mjs}` 로만 컴포넌트 패키지를 덮으면 `tailwind.content` 가 PASS 에서 **WARN** 으로 바뀌어요. Plug'n'Play 에는 node_modules 가 없어 그 경로는 스캔되지 않고 컴포넌트 클래스가 생성되지 않았어요. Tailwind 의 `**` · `*` 는 `.yarn` 처럼 점으로 시작하는 디렉터리를 넘지 않아서, 앱이 Plug'n'Play 루트이고 unplugged 를 설정했어도 `./**` 는 WARN 이에요(unplugged 경로는 `.yarn` 을 글자 그대로 쓴 glob 만 인정). 종료 코드는 0 그대로예요.
- Plug'n'Play 에서 패키지 경로가 없으면 FAIL 은 그대로이고, `./node_modules/...` 를 권하던 제안 대신 `require.resolve` 로 실제 위치를 넣는 동적 형태(정적으로 확인할 수 없어 WARN)를 먼저, unplugged 설정을 대안으로 안내해요. 안내에는 덮지 않은 패키지 이름이 들어가서 그대로 복사해 쓸 수 있어요. unplugged 를 설정한 프로젝트에서는 `.yarn/unplugged/*/node_modules/<패키지>/dist/**/*.{js,mjs}` 를 제안하고, 이미 unplugged 디렉터리가 있는 패키지는 `dependenciesMeta` 설정 안내를 빼요.
- Plug'n'Play 에서 컴포넌트 패키지를 워크스페이스 루트에만 선언한 앱은 경로를 안내 · 인정하지 않고 「<패키지> 가 워크스페이스 루트에만 선언돼 Plug'n'Play 에서 앱이 해석하지 못합니다 → 앱 package.json 에 선언하세요」를 내요. severity 는 종전과 같은 방향이에요(종전 PASS 는 WARN, 종전 FAIL 은 FAIL).
- `axis theme add` 는 Plug'n'Play 에서 `./node_modules` glob 만 있을 때 content 안내를 내지 않던 것을 고쳐 check 와 같은 안내를 내요. 종료 코드는 0 그대로예요.
- 상위 경로 안내 문구의 어미가 바뀌어요(「…풀려요」 → 「…풀립니다」, 종료 코드 · 판정 불변). `../` 로 시작하는 content 제안 뒤에 붙는 안내로, check · MCP · theme add 가 같은 문구를 써요. 상위 경로 설치본이 앱이 쓰는 설치본과 달라 덮음으로 보지 않을 때 목록 항목에 붙는 안내도 「…보지 않아요」 → 「…보지 않습니다」로 바뀌어요.
- Plug'n'Play 가 아닌 레이아웃(npm · pnpm · Yarn node-modules · 단일 프로젝트)의 판정 · 종료 코드는 바뀌지 않고, 문구 · theme add 출력도 위 두 상위 경로 안내의 어미 말고는 그대로예요.
