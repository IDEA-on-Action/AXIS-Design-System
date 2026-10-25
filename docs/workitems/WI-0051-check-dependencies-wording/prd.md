# WI-0051: check dependencies 항목이 선언만 보고 「설치되어 있습니다」로 표시 PRD

> 작성일: 2026-10-25 | 버전: v1.0 | 작성자: Sinclair Seo | WI: WI-0051 | GitHub: #144 | 우선순위: P3 | 상태: Approved (2026-10-25 사용자 결정: 권장안 + 검토 지적 반영)
> 기준: `main` 778e1dd (cli 1.6.0 · mcp 1.3.3 배포됨) | 묶음: 배치 3 ① (WI-0051 · 0068 · 0070 · 0072)
> 표기: **측정**(이번에 실행해 얻은 값) · **계산**(값에서 유도) · **추정**(실행하지 않음)

---

## 1. 개요

### 1.1 문제 (측정)

- cli `template-check.ts` 와 mcp `template.ts` 가 같은 로직을 따로 갖고, `package.json` 선언만 보고 「필수 및 권장 의존성이 모두 설치되어 있습니다」를 냈어요. node_modules 가 없는 프로젝트 · `@axis-ds/ui-react` 를 선언만 한 프로젝트도 PASS 였어요(cli 1.4.0 · 1.6.0 · MCP 1.3.3 실측, 이슈 #144 와 재측정 코멘트, 배치 3 브리프).
- `@axis-ds/tokens` 는 exports 에 `./package.json` 이 없어 `require.resolve("@axis-ds/tokens/package.json")` 가 ERR_PACKAGE_PATH_NOT_EXPORTED 로 실패해요(브리프 실측). 설치 판정은 디렉터리를 직접 봐야 해요.

### 1.2 결정

| # | 결정 | 근거 |
|---|---|---|
| D1 | 선언된 대상이 설치되지 않았으면 WARN + lockfile 에 맞는 설치 명령(`detectInstallCommand`). FAIL 로 올리지 않는다 | 권장안. install 전에 check 를 돌리는 CI 를 깨지 않음, 종료 코드 불변 |
| D2 | 대상: 필수 · 권장(`tailwindcss` · `clsx` · `tailwind-merge`) 가운데 선언된 것 + 선언된 `@axis-ds/*`. 전이 의존(cva · @radix-ui/*)은 보지 않는다 | 권장안 |
| D3 | 설치본 판독은 registry-core `project.ts` 의 `findInstalledPackage`(상위 디렉터리로 거슬러 올라가며 `node_modules/<name>/package.json`) 하나로, WI-0068(theme 버전) · WI-0072(tokens 버전) · WI-0070(animate 설치)이 함께 쓴다. Plug'n'Play(`.pnp.cjs`)는 선언 기준으로 되돌리고 문구에 남긴다 | 권장안 + 검토 minor(같은 보고서 안의 판정 일치) |
| D4 | 기존 `installedVersion`(한 층만 봄) 호출지(`detectTailwind` · `axisPackagesBelowTailwind4`)는 이번에 바꾸지 않는다 | 검토 minor 가 결정 항목으로 분리를 요구. 바꾸면 호이스팅 모노레포의 Tailwind major 판정과 TW4 버전 안내 결과가 바뀌어 기준선 테스트 · 문서 수치를 다시 재야 함. 이 묶음은 새 판정 셋만 공용 함수로 맞추고, 기존 호출지 이관은 사용자 확인 항목으로 남김. **해소(2026-10-25, WI-0074 #199)**: 두 호출지도 `findInstalledPackage` + `isPnpProject` 가드로 옮겼고 `installedVersion` 은 지웠어요 |
| D5 | cli · mcp 중복 구현을 registry-core `template/dependencies-core.ts` 로 옮기고 항목 이름을 둘 다 `dependencies` 로 맞춘다(종전 cli 는 package.json 이 없을 때 이름이 `package.json`) | 권장안. JSON 파손은 종전 cli 가 예외로 멈췄던 것을 FAIL 항목으로 바꿈 |

## 2. 요구사항

| ID | 요구사항 | AC |
|---|---|---|
| FR-1 | 선언만 · 미설치 → WARN, 설치 명령 lockfile 기준 | AC1: 단위 테스트(npm lockfile → `npm install`) |
| FR-2 | 선언된 `@axis-ds/*` 미설치 → WARN | AC2: ui-react 선언 · 미설치 → WARN, 설치 stub 뒤 PASS |
| FR-3 | 호이스팅(상위 node_modules) · exports 제한 패키지 · PnP | AC3: 단위 테스트 3건 |
| FR-4 | cli · mcp 같은 결과 | AC4: mcp template.test 「배치 3 ①」, T4-1 기준선 의도 변경 기록 |
| FR-5 | 배포 경로: 이 브랜치 pack 한 cli 로 npm 설치 전 · 후 실측 | AC5: testplan 3 |
