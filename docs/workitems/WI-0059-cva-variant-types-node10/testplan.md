# WI-0059 테스트 계획 · 결과

> PRD: [prd.md](./prd.md) | 실행일: 2026-10-24 | 환경: Node 22.22.0, TypeScript 5.9.3, next 15.5.28, cva 0.7.1, clsx 2.1.1

## 1. 단위 테스트 (`packages/axis-ui-react/scripts/fix-cva-dts.test.mjs`, ui-react `test` 에 연결)

| 테스트 | 결과 |
|---|---|
| 이름공간 import 를 지우고 ClassProp 2곳을 로컬 타입으로 | 통과 |
| 부수효과 import 만 있는 파일은 그 줄만 삭제 | 통과 |
| 참조 없는 파일은 그대로 | 통과 |
| 예상 밖 import 모양(이름 import)은 고치지 않고 문제로 알림 | 통과 |
| ClassProp 밖 멤버(ClassValue)가 남으면 알림 | 통과 |
| 동치: 로컬 타입 ↔ 설치된 cva `ClassProp` 서로 대입 가능(tsc, 음성 대조로 다른 모양은 false) | 통과 |
| 산출물: dist 에 남은 참조 0 | 통과 |

변이: 로컬 타입의 첫 멤버를 `className?: string` 으로 바꾸면 동치 테스트 1건 실패, 원복 뒤 7/7(`cmp` 일치).

첫 구현은 부수효과 import(avatar · 루트 index)를 예상 밖 모양으로 보고 빌드를 실패시켰어요(가드가 동작함). 그 모양을 지원에 추가했어요.

## 2. 빌드 산출물 (AC1)

`pnpm build`(ui-react): 「d.ts 68개 중 24개 고침」, `grep -rl class-variance-authority/types dist` 0건. 처음 실측한 참조 파일 수(24)와 같아요.

## 3. 해석 게이트 변형 탐침 (AC2)

| 설치본 | node | node16 CJS | node16 ESM | bundler |
|---|---|---|---|---|
| 수정본(`pnpm pack-smoke`) | 통과 | 통과 | 통과 | 통과 |
| 배포본 1.5.1(음성 대조) | **실패**(TS2578 × 3: 없는 값 3곳이 오류로 안 잡힘) | 통과 | 통과 | 통과 |

해석 탐침 224건은 두 경우 모두 실패 0 이에요(서브패스 해석은 WI-0053 으로 이미 정상).

## 4. Next 실측 (AC3, tsconfig 없이 시작해 Next 가 `"moduleResolution": "node"` 로 생성)

| 설치본 | `<Button variant="secondary">` | `<Button variant="nope">` |
|---|---|---|
| 수정 tarball | rc 0 | **rc 1** `Type '"nope"' is not assignable to type '"default" \| "link" \| ...'` |
| 배포본 1.5.1(음성 대조) | | rc 0(결함 재현) |

## 5. 게이트 (AC4, 캐시 우회)

| 게이트 | 결과 |
|---|---|
| `turbo run type-check --force` | rc 0, Cached 0/10 |
| `turbo run lint --force` | rc 0, Cached 0/4 |
| `turbo run build --force` | rc 0, Cached 0/8 |
| `turbo run test --force` | rc 0, Cached 0/6(mcp 138 · cli 657 · ui-react 110 + node 7 · agentic-ui 90 · theme 31 · tokens 235) |
| `pnpm test:registry` · `check-types-versions` · `pack-smoke` · `cli-smoke` | 모두 rc 0 |
