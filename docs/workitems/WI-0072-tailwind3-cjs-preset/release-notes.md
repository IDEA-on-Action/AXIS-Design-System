# WI-0072 릴리스 노트: Tailwind 3 CommonJS 설정에서도 preset 이 적용돼요

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | GitHub: #191 | 대상: `@axis-ds/tokens` patch(linked 라 theme minor 와 함께 1.7.0) · `@axis-ds/cli` · `@axis-ds/mcp` patch

## 바뀐 점

- `module.exports = { presets: [require("@axis-ds/tokens/tailwind")] }` 처럼 CommonJS 설정(`.cjs`, type 이 없는 `.js`, `.ts` 안의 `module.exports`)에서 preset 이 통째로 빠지던 결함을 고쳤어요. 1.1.0 부터 있던 결함이에요(회귀 아님). 이제 `require` 결과가 preset 자체예요.
- `require(...).default` · `const { axisKeyframes, axisAnimation } = require(...)` · ESM `import` 는 그대로 동작해요. 붙인 속성은 열거되지 않아 `...preset` 으로 펼쳐도 섞이지 않아요.
- 타입: `require` 는 `tailwind-preset.d.cts`(`export =`), `import` 는 `tailwind-preset.d.mts` 로 해석돼요.
- `axis theme add` 의 CommonJS 안내는 모든 버전에서 되는 `require("@axis-ds/tokens/tailwind").default` 로 바뀌었어요.
- `axis check` · MCP `axis.check_project` 는 CommonJS 설정의 `.default` 없는 `require` 를 설치본 tokens 가 1.7.0 미만이면 WARN 으로 알려요(종전 거짓 PASS). `.ts` · `.mjs` 의 `export default` 형태는 Tailwind 가 `.default` 를 꺼내 줘서 PASS 예요.

## 업그레이드

- tokens 1.7.0 으로 올리면 설정을 바꿀 필요가 없어요. 1.6.2 이하를 계속 쓰면 CommonJS 설정에 `.default` 를 붙여요.
- 토큰 값은 바뀌지 않았어요.

## 발행 전 대조

- Release PR(changesets version-packages)에서 tokens · theme 가 **1.7.0** 인지 확인해요. check 의 수정 버전 상수(`TOKENS_CJS_PRESET_FIXED_VERSION` · `THEME_MARKUP_BRAND_MIN_VERSION`)가 1.7.0 이고, 근거는 이 묶음의 theme changeset 이 minor 라 linked 4패키지가 최고 현재 버전(1.6.3)에서 1.7.0 으로 오른다는 것이에요. 다른 값이면 상수를 고친 뒤 발행해요.
- 이 브랜치의 `pnpm changeset status --verbose`(측정): tokens · theme 1.7.0(minor), linked 라 ui-react · agentic-ui 도 1.7.0(내용 변경 없음), cli 1.6.1 · mcp 1.3.4(patch). 예제 앱 axis-nextjs-example 0.1.14 는 내부 의존 갱신이에요.
