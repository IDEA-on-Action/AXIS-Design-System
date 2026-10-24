# WI-0051 릴리스 노트: dependencies 항목이 설치본까지 봐요

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | GitHub: #144 | 대상: `@axis-ds/cli` · `@axis-ds/mcp` patch

## 바뀐 점

- `axis check` · MCP `axis.check_project` 의 dependencies 항목이 `package.json` 선언만 보고 「모두 설치되어 있습니다」로 표시하던 것을 고쳤어요. 선언된 `tailwindcss` · `clsx` · `tailwind-merge` · `@axis-ds/*` 가 `node_modules` 에 없으면 「선언됐지만 설치되지 않은 의존성」 WARN 과 lockfile 에 맞는 설치 명령을 보여 줘요.
- 모노레포처럼 상위 디렉터리의 `node_modules` 에 설치된 것도 찾아요. Plug'n'Play(`.pnp.cjs`)는 설치본을 읽지 않고 선언 기준으로 보며 그 사실을 문구에 적어요.
- PASS 문구는 「필수 및 권장 의존성이 선언 · 설치되어 있습니다 (N개 확인)」이에요.
- cli 와 MCP 가 같은 공유 코어를 써서 결과가 같아요. package.json 이 없을 때 cli 의 항목 이름도 `dependencies` 로 맞췄어요. JSON 이 깨진 package.json 은 예외로 멈추지 않고 FAIL 항목으로 나와요.

## 동작이 달라지는 것

- 설치 전에 check 를 돌리면 WARN 이 하나 늘어요. 종료 코드는 그대로예요.

## 발행 전 대조

- Release PR(changesets version-packages)에서 tokens · theme 가 **1.7.0** 인지 확인해요. check 의 수정 버전 상수(`TOKENS_CJS_PRESET_FIXED_VERSION` · `THEME_MARKUP_BRAND_MIN_VERSION`)가 1.7.0 이고, 근거는 이 묶음의 theme changeset 이 minor 라 linked 4패키지가 최고 현재 버전(1.6.3)에서 1.7.0 으로 오른다는 것이에요. 다른 값이면 상수를 고친 뒤 발행해요.
- 이 브랜치의 `pnpm changeset status --verbose`(측정): tokens · theme 1.7.0(minor), linked 라 ui-react · agentic-ui 도 1.7.0(내용 변경 없음), cli 1.6.1 · mcp 1.3.4(patch). 예제 앱 axis-nextjs-example 0.1.14 는 내부 의존 갱신이에요.
