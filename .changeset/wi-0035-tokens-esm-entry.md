---
"@axis-ds/tokens": patch
---

ESM 진입점(`dist/js/tokens.mjs`)에서 TypeScript 전용 문법(`as const`, `export type`)을 걷어내 Node 와 번들러에서 `import` 가 문법 오류 없이 동작하도록 고쳤어요(WI-0035). 1.1.0~1.2.1 배포본은 `import tokens from '@axis-ds/tokens'` 가 `Unexpected identifier 'as'` 로 실패했어요. 토큰 값과 CSS · JSON · CJS 산출물, 타입 선언(`tokens.d.ts`)은 그대로예요.
