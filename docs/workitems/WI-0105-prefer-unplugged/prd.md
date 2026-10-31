# WI-0105: Yarn Plug'n'Play 에서 컴포넌트 tailwind.css 가 스캔되도록 ui-react · agentic-ui 에 preferUnplugged 선언 PRD

> 작성일: 2026-11-01 | 버전: v1.0 | 작성자: Sinclair Seo | WI: WI-0105 | GitHub: #265 | 우선순위: P3 | 상태: 구현 · 검증 완료, PR 리뷰 대기
> 기준: `main` 71f0c62 (linked 1.8.2 · cli · mcp 는 배치 11 발행본). 측정은 이 브랜치 소스로 빌드 · `pnpm pack` 한 tarball 로 했어요
> 출처: WI-0102 사용자 결정 Q121 (a) 「다음 linked 발행에 포함」, WI-0102 testplan C8 · C9
> 표기: **측정**(이번에 실행해 얻은 값) · **추정**(실행하지 않음) · **미측정**(재야 하지만 아직 재지 않음)

---

## 1. 개요

### 1.1 문제 (WI-0102 측정, 이번에 다시 측정)

Yarn Plug'n'Play(`nodeLinker: pnp`) 앱은 패키지를 `.yarn/cache` 의 zip 으로 둬요. `@axis-ds/ui-react/tailwind.css` · `@axis-ds/agentic-ui/tailwind.css` 의 `@source "./dist"` 는 zip 안 경로로 풀리고, Tailwind 4 스캐너는 실제 디렉터리만 읽어서 컴포넌트 클래스가 하나도 생성되지 않아요. 빌드는 rc 0 이에요. WI-0102 는 check 가 이 경우를 WARN 으로 알리고 PnP 루트 `package.json` 의 `dependenciesMeta` unplug 를 안내하도록 고쳤지만(cli 1.7.9 · mcp 1.4.8), 사용자가 직접 설정해야 했어요.

- 측정(testplan 2절 V2): 1.8.2 PnP 앱의 `u.css` 산출물 4,455 B · `axis-button-bg-default` 0건, `@import "tailwindcss";` 만 넣은 빌드와 `cmp` 같음

### 1.2 해결

`@axis-ds/ui-react` · `@axis-ds/agentic-ui` 의 `package.json` 에 `"preferUnplugged": true` 를 선언해요. Yarn Berry 는 이 필드가 있는 패키지를 설치할 때 `.yarn/unplugged` 에 풀어 두므로, `@source "./dist"` 가 실제 디렉터리를 가리켜요. 사용자 설정이 필요 없고, WI-0102 의 check 판정은 결과(`.yarn/unplugged/*/node_modules/<패키지>`)를 보므로 WARN 이 저절로 사라져요(측정, testplan 2.3).

### 1.3 결정 (2026-11-01 사용자 확정)

| # | 결정 | 내용 |
|---|---|---|
| D1 | 발행 범위 | ui-react · agentic-ui 만 patch → 1.8.3. tokens · theme 는 1.8.2 그대로(linked 는 올라가는 패키지끼리만 맞춤, 선례 1.6.3 발행 1296556). tokens · mcp · cli changeset 없음. changeset 은 `.changeset/wi-0105-prefer-unplugged.md` 하나 |
| D2 | 게이트 | `scripts/pack-smoke.mjs` 5번 검사를 넓혀 「tarball 안 배포 CSS 에 파일을 스캔하는 `@source` 가 있으면 tarball `package.json` 의 `preferUnplugged === true` 필수」. 패키지 이름 목록이 아니라 관측값으로 분기. 실패 문구에 WI-0105 와 이유 |
| D3 | 안내 문구 | check 안내 문구는 바꾸지 않음. `docs/guides/troubleshooting.md` PnP 절에 「1.8.3 부터는 패키지가 preferUnplugged 를 선언해 Yarn 이 자동으로 풀어요. 1.8.2 이하이거나 dependenciesMeta 로 unplugged: false 를 준 경우에만 위 설정이 필요해요」 |

Issue #265 본문의 「linked 4패키지 발행이 따라와요」는 D1 로 바뀌었어요.

---

## 2. 범위

### 2.1 하는 것

- `packages/axis-ui-react/package.json` · `packages/axis-agentic-ui/package.json` 에 `"preferUnplugged": true`
- `scripts/pack-smoke.mjs` 5-1 검사(D2)와 머리 주석
- `docs/guides/troubleshooting.md` PnP 절 한 문단(D3)
- changeset 하나(ui-react · agentic-ui patch)

### 2.2 하지 않는 것

- registry-core · cli · mcp 의 check · init · add 판정과 문구(D3)
- tokens · theme 버전(D1)
- Tailwind 3 content 안내(troubleshooting 의 Tailwind 3 절, 아래 open question)
- 컴포넌트 · 스타일 · API

### 2.3 알려진 한계

- PnP 사용자는 두 패키지가 `.yarn/unplugged` 에 풀린 만큼 디스크를 더 써요(측정: ui-react 820 KB · agentic-ui 564 KB, `du -sh`, WI-0102 2.4 와 같음)
- 루트 `dependenciesMeta` 에 `"unplugged": false` 를 주면 그 설정이 우선해 종전처럼 zip 에 남아요(측정, testplan 2.1 V5). 이 경우 check 는 WI-0102 WARN 을 그대로 내요(측정, testplan 2.3)
- 레지스트리가 packument(메타데이터)에 `preferUnplugged` 를 싣는지는 이 측정이 보지 않아요. 하네스는 보수적으로 packument 에서 필드를 지우고 tarball 에만 두었고 그래도 동작했어요

---

## 3. 수용 기준 (AC)

| # | 기준 | 확인 |
|---|---|---|
| AC1 | 이 브랜치로 pack 한 tarball 의 두 `package.json` 에 `preferUnplugged: true` 가 있음 | testplan 2.1 |
| AC2 | Yarn 4.5.3 PnP 앱에서 1.8.3(이 브랜치) 설치 시 `.yarn/unplugged` 에 두 패키지가 풀리고, u · g 산출물이 node-modules 설치와 `cmp` 같음 | testplan 2.1 V1 |
| AC3 | 대조: PnP 1.8.2 는 클래스 0, `unplugged: false` opt-out 도 클래스 0 | testplan 2.1 V2 · V5 |
| AC4 | npm · pnpm · Yarn node-modules linker 산출물 불변 | testplan 2.1 V3 · V4, 2.2 |
| AC5 | pack-smoke: 현행 rc 0, 필드 제거 · 문자열 `"true"` 변이 rc 1 + 새 문구, 원복 rc 0, 구판 pack-smoke 는 필드 없어도 rc 0 | testplan 3절 |
| AC6 | `pnpm check-changeset-mcp-tokens` rc 0, `pnpm changeset status --verbose` 에 발행 패키지는 ui-react · agentic-ui 1.8.3 만 | testplan 4절 |
| AC7 | turbo build · type-check · lint `--force`(Cached 0) 통과 | testplan 4절 |

---

## 4. 미측정 · 위험

- Yarn classic(1.x)은 이번 브랜치 tarball 로 다시 재지 않았어요. 브리프 측정(필드만 더한 시뮬레이션 tarball)에서 산출물 불변이었고, Yarn classic 은 이 필드를 읽지 않아요(추정)
- `@tailwindcss/postcss` 경로 · Yarn 4.18.1 은 이번에 재지 않았어요. WI-0102 에서 unplug 결과가 node-modules 와 같았으므로 같은 결과로 추정해요
- 실제 npm 레지스트리 발행본으로는 발행 뒤에 재야 해요(미측정)

## 5. 의존 · 순서

- WI-0102(cli 1.7.9 · mcp 1.4.8 발행됨)의 check 판정이 `.yarn/unplugged` 결과를 보므로 cli · mcp 변경은 필요 없어요

## 6. 측정 출처

- testplan.md, scratchpad `batch12/WI-0105/verify.GXnb/`(하네스 · 결과), `impl.rfQQ/`(빌드 · pack-smoke 로그)
