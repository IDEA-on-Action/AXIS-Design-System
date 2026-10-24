# WI-0059 릴리스 노트: node10 에서 cva 변형 prop 타입 복구

> 작성일: 2026-10-24 | WI: WI-0059 | GitHub: #158 | changeset: `@axis-ds/ui-react` patch

## 변경 사항

- **d.ts 후처리**: ui-react 빌드가 tsup 뒤에 `scripts/fix-cva-dts.mjs` 를 실행해 d.ts 의 `class-variance-authority/types` 참조를 없애요. 이름공간 import 는 cva `ClassProp` 과 같은 모양의 로컬 타입(`ClassValue` 는 clsx 루트)으로 바꾸고, 부수효과 import 는 지워요. 예상 밖 모양이 나오면 빌드가 실패해요
- **효과**: `moduleResolution: "node"`(Next 15 가 tsconfig 를 만들 때 쓰는 값)에서도 `variant` · `size` 같은 변형 prop 의 잘못된 값이 타입 오류로 잡혀요. 종전에는 any 로 떨어져 검사가 꺼졌어요. 런타임 코드는 같아요
- **게이트**: pack-smoke 의 G2-types 에 변형 탐침을 더했어요(없는 값 3곳 `@ts-expect-error`, 4가지 해석 방식)

## 업그레이드 안내 (사용자 결정 2026-10-24: patch 유지, 안내 보강)

- 런타임은 같지만 **빌드 결과는 달라질 수 있어요.** `moduleResolution: "node"` 앱에서 꺼져 있던 변형 타입 검사가 다시 켜지므로, 없는 값(`variant="nope"`)이나 넓은 `string` 변수(`variant={someString}`)를 넘기던 코드는 업데이트 뒤 `next build` 타입 단계에서 실패해요
- 고치는 방법: 실제 있는 값으로 바꾸거나, 변수 타입을 좁혀요(`as const`, `ButtonProps["variant"]` 같은 prop 타입 사용)
- patch 로 둔 이유: 의도한 타입을 되돌리는 버그 수정이고, minor 로 올려도 `^1.5.x` 사용자는 자동으로 받으므로 효과가 신호 전달에 그쳐요. 대신 changeset(CHANGELOG)에 같은 안내를 넣었어요
- `bundler` · `node16` 해석 앱은 종전에도 검사가 켜져 있어 영향이 없어요

## 알려진 한계

- cva 를 올려 `ClassProp` 모양이 바뀌면 동치 테스트가 실패해요. 그때 `LOCAL_CLASSPROP_DECL` 을 새 모양에 맞춰야 해요
- tsup · TypeScript 가 d.ts 를 다른 모양으로 내면 후처리가 빌드를 멈춰요(조용히 지나가지 않게 한 의도된 동작)
