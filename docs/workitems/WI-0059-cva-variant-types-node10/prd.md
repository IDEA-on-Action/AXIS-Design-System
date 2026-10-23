# WI-0059: node10 에서 cva 변형 prop 타입이 any 로 떨어지는 문제 PRD

> 작성일: 2026-10-24 | 버전: v1.0 | 작성자: Sinclair Seo | WI: WI-0059 | GitHub: #158 | 우선순위: P2 | 상태: Approved (2026-10-24 결정 반영)
> 기준: `main` 1716188 (linked 4패키지 1.5.1 배포)
> 관련: WI-0053(#147) 1단계 실측(PRD 1.4)에서 분리

---

## 1. 개요

### 1.1 문제 (실측, 2026-10-24)

- ui-react 의 `cva(...)` 9곳(button · sheet · toast · alert · label · toggle · badge · progress 2)에서 tsup 이 d.ts 를 만들 때 `*Variants` 의 추론 타입을 펼치며 `import * as class_variance_authority_types from 'class-variance-authority/types'` 와 `{ variant?: ... } & class_variance_authority_types.ClassProp` 를 넣어요. 일부 파일(avatar · 루트 index)에는 부수효과 import `import 'class-variance-authority/types';` 가 들어가요. 합계 d.ts 24개(.d.ts · .d.mts)
- cva 0.7.1(최신)은 `./types` 를 `exports` 로만 내보내고 `typesVersions` 가 없어요. moduleResolution `node`(node10, Next 15 가 tsconfig 를 만들 때 쓰는 값)에서는 풀리지 않아요
- Next 기본 `skipLibCheck: true` 라 오류는 안 나고 `X & any` 가 any 로 무너져 `variant` · `size` 같은 변형 prop 의 타입 검사가 꺼져요

| 실측 | 결과 |
|---|---|
| 배포본 1.5.1, Next 가 만든 node tsconfig 앱에서 `<Button variant="nope">` | `next build` rc 0(결함) |
| 배포본 1.5.1 에 해석 게이트 변형 탐침 | node 만 실패(TS2578 × 3), node16 · bundler 통과 |

cva 루트(`class-variance-authority`)는 `types` 필드로 node10 에서도 풀려서 `VariantProps` 는 문제없어요.

### 1.2 결정 (2026-10-24 사용자)

| # | 결정 |
|---|---|
| D1 | 방식: 소스 · 레지스트리는 그대로 두고, ui-react 빌드 끝에 d.ts 를 후처리해요. 이름공간 import 는 cva 의 `ClassProp` 과 같은 모양의 로컬 타입(`ClassValue` 는 clsx 루트, ui-react 의 dependencies)으로 바꾸고, 부수효과 import 는 지워요. 예상 밖 모양이 나오면 고치지 않고 빌드를 실패시켜요 |
| D2 | 게이트: 해석 게이트(G2-types)에 변형 탐침을 더해요. 없는 변형 값에 `@ts-expect-error` 를 붙여, 변형 타입이 any 로 무너지면 TS2578 로 실패해요. 올바른 값은 통과해야 해요(양성 대조) |
| D3 | 릴리스: `@axis-ds/ui-react` patch(런타임 무변경, d.ts 만) |

## 2. 요구사항

- FR-1 `packages/axis-ui-react/scripts/fix-cva-dts.mjs`: dist d.ts 후처리, `--check` 검사 모드. build 스크립트에서 tsup 바로 뒤에 실행
- FR-2 로컬 타입과 설치된 cva `ClassProp` 이 서로 대입 가능한지 tsc 로 확인하는 테스트(cva 가 바뀌면 실패)
- FR-3 `scripts/types-resolution-gate.mjs` 변형 탐침, `scripts/pack-install-smoke.mjs` 탐침 수 검산

## 3. 수용 기준

- AC1 빌드 뒤 ui-react dist 에 `class-variance-authority/types` 참조 0
- AC2 G2-types 변형 탐침이 수정본에서 4방식 모두 통과, 배포본 1.5.1 에서 node 실패(음성 대조)
- AC3 Next 가 만든 node tsconfig 앱에서 `variant="nope"` 가 타입 오류(rc 1), 올바른 값은 rc 0
- AC4 기존 게이트(type-check · lint · build · test · test:registry · pack-smoke · cli-smoke · check-types-versions) 통과

## 4. 범위 밖

- 레지스트리 사본(소비자가 소스를 직접 컴파일해 해당 없음)
- cva 상위 저장소에 typesVersions 추가 제안
