# WI-0068: ThemeProvider 브랜드 해제 유지 · 서버 마크업 존중 PRD

> 작성일: 2026-10-25 | 버전: v1.0 | 작성자: Sinclair Seo | WI: WI-0068 | GitHub: #182 | 우선순위: P3 | 상태: Approved (2026-10-25 사용자 결정: 권장안 + 마크업 우선 + 검토 지적 반영)
> 기준: `main` 778e1dd (theme 1.6.2 배포됨) | 묶음: 배치 3 ① (WI-0051 · 0068 · 0070 · 0072)
> 표기: **측정**(이번에 실행해 얻은 값) · **계산**(값에서 유도) · **추정**(실행하지 않음)

---

## 1. 개요

### 1.1 문제 (측정, testplan 2.1 의 npm 1.6.2 대조군)

- S1: `defaultBrand="ontology"` 에서 `setBrand(undefined)` 로 끄고 새로고침하면 다시 ontology 예요. `readBrand` 가 `getItem(key) || undefined` 라 「저장값 없음」과 「끔」을 가르지 못하고, 해제가 저장값을 지우기 때문이에요.
- S2: 서버 마크업 `<html data-brand="ontology">` + `ThemeProvider`(defaultBrand 없음)는 마운트 때 속성이 지워져요(브라우저 하이드레이션 실측: MutationObserver 기록 `[null]`). 초기값이 마크업을 읽지 않고, 브랜드 effect 가 브랜드가 비면 무조건 `removeAttribute` 하기 때문이에요.
- cli · MCP check 는 S2 구성을 `brand.activation` PASS 로 판정해요(거짓 PASS, 브리프 실측).

### 1.2 결정

| # | 결정 | 근거 |
|---|---|---|
| D1 | `setBrand(undefined)` 는 저장값에 빈 문자열(센티널 「끔」)을 남긴다 | 권장안. 1.6.2 이하는 `""` 를 `|| undefined` 로 읽어 그 버전 동작으로 돌아감(하위 호환) |
| D2 | 초기 브랜드 = **저장값(`""` 이면 꺼짐) > 서버 마크업 `data-brand` > `defaultBrand`** | 권장안 + 사용자 결정(마크업 우선). S5(마크업과 defaultBrand 가 다름)는 마크업이 이김: 동작 변경이라 theme changeset 을 minor 로 둠 |
| D3 | 서버 렌더와 하이드레이션 첫 렌더는 `defaultBrand` 로 그리고 DOM 을 건드리지 않는다. 하이드레이션 직후 렌더에서 D2 값으로 맞춘다(`useSyncExternalStore` 로 하이드레이션 판별, 렌더 중 상태 보정) | 검토 minor(hydration mismatch). 마크업 경로를 더하면 저장값 없는 사용자에게까지 `ctx.brand` 불일치가 넓어짐. jsdom `hydrateRoot` 와 브라우저 하이드레이션에서 오류 0 확인 |
| D4 | 언마운트 때 마운트 전 마크업 값으로 되돌리는 cleanup 을 둔다 | 검토 minor(재마운트). 앞 인스턴스가 붙인 속성을 다음 인스턴스가 마크업으로 읽어 새 `defaultBrand` 를 이기지 않게 함 |
| D5 | check `brand.activation`: 마크업 `data-brand` + `ThemeProvider`(레이아웃 · providers) 이고 `setBrand(` · `defaultBrand=` 가 없으면 설치본(없으면 선언) theme 이 1.7.0 미만 · 판정 불가일 때 WARN | 권장안(버전 분기). 설치본 판독은 registry-core 공용 함수(WI-0051 과 같음) |
| D6 | 수정 버전 상수 `THEME_MARKUP_BRAND_MIN_VERSION = "1.7.0"` 의 근거는 이 changeset 의 theme **minor** bump(linked 1.6.3 → 1.7.0) | 검토 major. Release PR 의 version-packages 결과와 대조 |
| D7 | `providerExample` 은 버전과 상관없는 정적 문구로 두고, 버전 조건을 문구 안에 적는다(「ThemeProvider 를 함께 쓰면 1.7.0 이상」) | 검토 minor(문구를 버전에 따라 바꿀지 결정). 설치본에 따라 예시가 바뀌면 문서 인용과 어긋나므로 정적 + 조건 명시를 고름 |
| D8 | brand-core.ts 는 cli 원본을 고친 뒤 `cp` 로 mcp 사본을 맞추고 T5-1(사본 동일성)이 초록인지 본다 | 검토 minor. 현재 두 파일 sha256 d731ab19… 동일 |

### 1.3 범위 밖 · 남는 한계

- 서버 마크업에 `data-brand` 가 있는데 사용자가 끈 상태로 새로고침하면 하이드레이션이 끝날 때까지 브랜드가 보여요(FOUC). `<head>` 인라인 스크립트 없이는 막을 수 없어요(추정, 화면 깜박임은 재지 않음). 가이드에 처방을 적어요.
- theme(라이트 · 다크) 초기값의 하이드레이션 불일치는 이 WI 범위가 아니에요(종전과 같음).

## 2. 요구사항

| ID | 요구사항 | AC |
|---|---|---|
| FR-1 | 해제가 새로고침(재마운트) 뒤에도 유지 | AC1: S1 · S6 · S7 단위 + 브라우저 S1 reload 뒤 null · 저장값 `""` |
| FR-2 | 마크업 `data-brand` 를 초기값으로 존중, 마크업 > defaultBrand | AC2: S2 · S3 · S5 단위 + 브라우저 S2 마운트 뒤 ontology, S5 x |
| FR-3 | 하이드레이션 불일치 없음 · 첫 커밋이 마크업을 지우지 않음 | AC3: `theme.hydrate.test.tsx`(양성 대조군 포함) + 브라우저 onRecoverableError 0 · MutationObserver 에 null 없음 |
| FR-4 | 언마운트 시 마크업 복원, 다른 defaultBrand 재마운트 | AC4: S8 · S8-2 |
| FR-5 | check `brand.activation` 버전 분기 · cli · mcp 같은 문구 | AC5: template-check.test · mcp template.test 「배치 3 ①」 |
