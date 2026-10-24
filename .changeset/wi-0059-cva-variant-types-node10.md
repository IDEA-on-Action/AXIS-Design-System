---
"@axis-ds/ui-react": patch
---

`moduleResolution: "node"`(Next 15 가 tsconfig 를 만들 때 쓰는 값)에서 `variant` · `size` 같은 변형 prop 의 타입 검사가 꺼지던 문제를 고쳤습니다(WI-0059). 종전 d.ts 는 `class-variance-authority/types` 를 import 했는데, 이 경로는 cva 의 `exports` 에만 있어 node 해석에서 풀리지 않아 변형 타입이 any 로 떨어졌습니다(`skipLibCheck` 라 오류 없이 통과). 이제 d.ts 가 그 경로를 참조하지 않아 `<Button variant="nope" />` 같은 잘못된 값이 타입 오류로 잡힙니다. 런타임 코드는 바뀌지 않았습니다.

**업데이트 뒤 빌드가 실패할 수 있습니다.** `moduleResolution: "node"` 로 빌드하던 앱(tsconfig 없이 시작해 Next 가 만든 tsconfig 포함)은 그동안 변형 prop 의 타입 검사가 꺼져 있었습니다. 이 버전부터 다시 켜지므로 다음 코드는 `next build` 의 타입 단계에서 실패합니다.

- 없는 값을 넘긴 경우: `<Button variant="nope" />` → 실제 있는 값(`default` · `secondary` · `ghost` · `destructive` · `outline` · `link` 등)으로 고칩니다
- 넓은 `string` 변수를 넘긴 경우: `const v: string = ...; <Button variant={v} />` → 변수 타입을 좁힙니다. 예: `const v = "secondary" as const`, 또는 `import type { ButtonProps } from "@axis-ds/ui-react"` 뒤 `const v: ButtonProps["variant"] = ...`

`moduleResolution` 이 `bundler` · `node16` 인 앱은 종전에도 검사가 켜져 있어 영향이 없습니다.
