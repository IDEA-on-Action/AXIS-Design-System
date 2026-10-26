# WI-0090: pnpm 기본 레이아웃에서 실경로가 같은 상위 설치본 · 스토어 상대 실경로를 content 표본으로 인정 PRD

> 작성일: 2026-10-26 | 버전: v1.0 | 작성자: Sinclair Seo | WI: WI-0090 | GitHub: #227 | 우선순위: P3 | 상태: Approved (2026-10-26 사용자 결정 3건)
> 기준: `main` fd0a480 (linked 1.8.2 · cli 1.7.3 · mcp 1.4.3 발행됨) 위 브랜치 `fix/wi-0090-content-pnpm-store` | WI-0027 과 고치는 파일이 겹치지 않음
> 표기: **측정**(이번에 실행해 얻은 값) · **계산**(값에서 유도) · **추정**(실행하지 않음)

---

## 1. 개요

### 1.1 문제 (측정)

`inspectTailwindContent` 의 패키지 표본은 `findInstalledPackage` 가 찾은 가장 가까운 설치본 하나예요(WI-0080 D1). pnpm 기본(isolated) 레이아웃에서 앱 · 루트가 모두 ui-react 를 선언하면 앱 `node_modules/@axis-ds/ui-react`(`.pnpm` 스토어 링크)가 표본이 되고, `contentGlobCovers` 는 상대 glob 의 앞쪽 `../` 개수가 표본과 같을 때만 비교해서 아래 두 변형이 거짓 FAIL 이었어요.

실제 설치 픽스처(scratchpad `wi0090/fx-pnpm`, pnpm 9.15.4 기본 레이아웃, 루트 · 앱 ui-react 1.8.2, tailwindcss 3.4.19, 앱 cwd 빌드), 발행본 cli 1.7.3:

| content 변형 | 빌드 선택자 | 빌드 CSS | check |
|---|---|---|---|
| 대조(ui-react 없음) | 38 | - | FAIL |
| `./node_modules/@axis-ds/ui-react/dist/**/*.{js,mjs}` | 427 | 기준 | PASS |
| `../../node_modules/@axis-ds/ui-react/dist/**/*.{js,mjs}` | 427 | 기준과 바이트 같음 | **FAIL(거짓)** |
| `../../node_modules/.pnpm/@axis-ds+ui-react@…/node_modules/@axis-ds/ui-react/dist/**` (스토어 상대 실경로, 이번에 발견) | 427 | 기준과 바이트 같음 | **FAIL(거짓)** |
| 스토어 절대 실경로 | 427 | 기준과 바이트 같음 | PASS |

음성 대조(`wi0090/fx-pnpm-diff`, 루트 1.8.1 · 앱 1.8.2, 실경로 다름): `../../node_modules/...` 변형은 선택자 **426** 으로 1.8.2 의 Select placeholder 클래스(`[&[data-placeholder]>span]:text-[…]`) 하나가 빠져요. 이 경우의 FAIL 은 맞는 판정이에요.

### 1.2 결정 (2026-10-26 사용자 결정)

| # | 결정 | 근거 |
|---|---|---|
| D1 | 상위 설치본은 **실경로가 앱 설치본과 같을 때만** 덮음으로 인정 | 버전이 다르면 클래스 누락 실측(426/427). 같은 버전이라도 실경로가 다르면 파일이 같다는 보장이 없음 |
| D2 | 스토어 실경로를 상대 경로로 쓴 glob 도 이번에 인정 | 표본 목록에 실경로 하나만 더하면 되고, 절대 실경로는 이미 PASS 라 판정이 일관됨 |
| D3 | 실경로가 다른 상위 설치본을 덮는 glob 이 있으면 FAIL 문구의 해당 대상 뒤에 이유를 붙임(버전을 읽으면 `(1.8.1, 앱 1.8.2)`, 같으면 `(버전은 1.8.1 로 같음)`) | 사용자가 `../../` 를 넣었는데 FAIL 인 이유를 알 수 있게 |
| D4 | 버전: `@axis-ds/cli` patch · `@axis-ds/mcp` patch(예상 1.7.4 · 1.4.4) | registry-core 를 바꾸면 cli · mcp 둘 다(CLAUDE.md 규칙), 거짓 FAIL 수정 |

### 1.3 범위 밖

- 제안 문구(`suggest`)는 종전대로 가장 가까운 설치본 기준이에요(`./node_modules/...`).
- yarn · Windows realpath(subst · 대소문자)는 재지 않았어요(추정 · 미검증).
- theme add 는 `contentMissing` 의 제안만 쓰므로 이유 문구를 출력하지 않아요(종전 출력 그대로).

## 2. 요구사항

- **FR-1**: `packageContentTarget` 이 표본 말고도 `alternates`(찾은 설치본 실경로의 상대 경로, 실경로가 같은 상위 `node_modules/<pkg>`)와 `others`(실경로가 다른 상위 설치본과 이유)를 돌려줌.
- **FR-2**: `inspectTailwindContent` 는 표본 · alternates 중 하나라도 glob 이 덮으면 덮음. 덮지 않았는데 others 를 덮는 glob 이 있으면 `ContentTarget.note` 에 이유.
- **FR-3**: `checkTailwindContent` FAIL · WARN 목록의 대상 뒤에 ` (note)` 를 붙임. 그 밖의 문구는 바이트 그대로.

## 3. 수용 기준

- **AC1**: 루트 링크가 앱과 같은 스토어면 `../../node_modules/...` PASS(단위 테스트, 실제 픽스처 427 행).
- **AC2**: 스토어 상대 실경로 · `../../node_modules/.pnpm/**/...` PASS, 다른 스토어 항목 · 깊이가 다른 상대 경로 FAIL.
- **AC3**: 루트 링크가 다른 버전 스토어면 FAIL + 이유 `(1.8.0, 앱 1.8.1)`. 이유는 그 상위 설치본을 덮는 glob 이 있을 때만.
- **AC4**: 루트 설치본이 없으면 종전대로 FAIL(이유 없음). WI-0080 매트릭스(hoisted · isolated · single) 전부 그대로.
- **AC5**: 실제 설치 픽스처 10행(같은 버전 5 · 다른 버전 5)에서 check 판정이 빌드 정답과 일치(선택자 427 = PASS, 426 · 38 = FAIL).
- **AC6**: 변이(M1 실경로 비교 끔 · M2 상대 실경로 제거 · M3 이유 제거) 각각 빨강.
