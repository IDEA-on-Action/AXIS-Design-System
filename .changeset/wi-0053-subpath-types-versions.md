---
"@axis-ds/tokens": patch
"@axis-ds/ui-react": patch
"@axis-ds/agentic-ui": patch
---

TypeScript `moduleResolution: "node"` 에서도 서브패스 타입을 찾도록 `typesVersions` 를 추가했습니다(WI-0053).

- `@axis-ds/ui-react/avatar` · `@axis-ds/agentic-ui/agent-avatar` 같은 서브패스 import 가 `"moduleResolution": "node"` 인 프로젝트에서 「Cannot find module ... or its corresponding type declarations」(TS2307)로 실패했습니다. tsconfig 없이 시작한 Next 15 앱은 `next build` 때 이 값으로 tsconfig 를 만들기 때문에 타입 단계에서 빌드가 멈췄습니다. 1.5.0 기준 ui-react 30개 · agentic-ui 18개 · tokens 4개(`tailwind` · `json` · `brands` · `brands/ontology/brand.json`) 서브패스가 해당합니다.
- `typesVersions` 는 `exports` 와 1:1 이고 같은 타입 파일을 가리킵니다. `node16` · `nodenext` · `bundler` 는 종전처럼 `exports` 로 해석되며 결과가 바뀌지 않습니다. 런타임 동작과 `exports` 는 바뀌지 않았습니다.
