# WI-0068 릴리스 노트: 브랜드를 끈 상태가 유지되고, 서버 마크업 브랜드를 지우지 않아요

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | GitHub: #182 | 대상: `@axis-ds/theme` minor(linked 1.7.0) · `@axis-ds/cli` · `@axis-ds/mcp` patch

## 바뀐 점

- `setBrand(undefined)` 로 끈 상태가 새로고침 뒤에도 유지돼요. `defaultBrand` 를 지정해도 마찬가지라, 「기본은 켜고 사용자가 끌 수 있음」을 만들 수 있어요.
- 서버 마크업 `<html data-brand="ontology">` 를 초기값으로 읽어요. `defaultBrand` 없이 마크업만 두어도 마운트 때 지우지 않아요.
- 하이드레이션 첫 렌더는 서버와 같은 값으로 그려서 `useTheme().brand` 를 화면에 그려도 불일치 오류가 나지 않아요.
- `ThemeProvider` 를 언마운트하면 마운트 전 마크업 값으로 되돌려요.
- `axis check` · MCP 는 마크업 `data-brand` + `ThemeProvider` 만 있는 레이아웃을 설치된 theme 이 1.7.0 미만이면 WARN 으로 알려요.

## 동작이 달라지는 것

- **초기 브랜드 우선순위**: 저장값 > 서버 마크업 `data-brand` > `defaultBrand`. 마크업과 `defaultBrand` 가 다르면 이제 마크업이 이겨요(1.6.2 까지는 `defaultBrand`).
- **저장값**: 해제하면 키를 지우지 않고 빈 문자열을 남겨요. 직접 `localStorage.getItem("axis-brand")` 를 읽는 코드는 빈 문자열을 「끔」으로 다뤄요. `<head>` 인라인 스크립트에서 기본 브랜드를 두려면 `|| "ontology"` 대신 `brand === null ? "ontology" : brand` 를 써요.
- 1.6.2 이하로 내리면 빈 문자열을 저장값 없음으로 읽어 그 버전 동작으로 돌아가요.

## 남는 한계

- 서버 마크업에 `data-brand` 가 있는데 사용자가 끈 상태로 새로고침하면 하이드레이션이 끝날 때까지 첫 화면에 브랜드가 보일 수 있어요. 가이드의 인라인 스크립트로 먼저 반영해요.

## 발행 전 대조

- Release PR(changesets version-packages)에서 tokens · theme 가 **1.7.0** 인지 확인해요. check 의 수정 버전 상수(`TOKENS_CJS_PRESET_FIXED_VERSION` · `THEME_MARKUP_BRAND_MIN_VERSION`)가 1.7.0 이고, 근거는 이 묶음의 theme changeset 이 minor 라 linked 4패키지가 최고 현재 버전(1.6.3)에서 1.7.0 으로 오른다는 것이에요. 다른 값이면 상수를 고친 뒤 발행해요.
- 이 브랜치의 `pnpm changeset status --verbose`(측정): tokens · theme 1.7.0(minor), linked 라 ui-react · agentic-ui 도 1.7.0(내용 변경 없음), cli 1.6.1 · mcp 1.3.4(patch). 예제 앱 axis-nextjs-example 0.1.14 는 내부 의존 갱신이에요.
