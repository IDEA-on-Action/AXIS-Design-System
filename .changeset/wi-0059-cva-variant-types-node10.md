---
"@axis-ds/ui-react": patch
---

`moduleResolution: "node"`(Next 15 가 tsconfig 를 만들 때 쓰는 값)에서 `variant` · `size` 같은 변형 prop 의 타입 검사가 꺼지던 문제를 고쳤습니다(WI-0059). 종전 d.ts 는 `class-variance-authority/types` 를 import 했는데, 이 경로는 cva 의 `exports` 에만 있어 node 해석에서 풀리지 않아 변형 타입이 any 로 떨어졌습니다(`skipLibCheck` 라 오류 없이 통과). 이제 d.ts 가 그 경로를 참조하지 않아 `<Button variant="nope" />` 같은 잘못된 값이 타입 오류로 잡힙니다. 런타임 코드는 바뀌지 않았습니다.
