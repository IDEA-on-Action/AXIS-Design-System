# WI-0042 릴리스 노트: `axis check` Tailwind 4 오탐 · 종료 코드

> 릴리스일: 미정(PR 머지 뒤 Version Packages PR 을 머지할 때 CI 발행) | 유형: fix · 동작 변경 | 영향: @axis-ds/cli 1.2.1 → 1.3.0 (minor), @axis-ds/mcp 1.2.0 → 1.2.1 (patch), `.changeset/wi-0042-check-tailwind4.md`

## 변경 사항

### fix: Tailwind 4 프로젝트의 tailwind.config 오탐
- Tailwind 4 이상(설치본, 없으면 `package.json` 선언으로 판정)은 `tailwind.config` 파일 대신 전역 CSS 의 `@import "tailwindcss"` 를 봅니다. 있으면 PASS, 없으면 WARN 입니다. 종전에는 설정 파일이 없다고 FAIL 이었습니다.
- Tailwind 3 은 `tailwind.config.mjs` · `.cjs` 도 인정합니다(WARN, TypeScript 권장). 종전에는 FAIL 이었습니다.
- MCP `axis.check_project` 도 같은 판정 · 문구를 냅니다.

### 동작 변경: FAIL 이 있으면 종료 코드 1
- `axis check` 는 FAIL 이 하나라도 있으면 종료 코드 1 로 끝납니다. WARN 만 있으면 0 입니다. 종전에는 결과와 관계없이 0 이었습니다.
- CI 나 스크립트에서 `axis check` 를 쓰고 있다면 FAIL 이 이제 실패로 잡힙니다.

## 알려진 한계
- Tailwind 4 의 PASS 는 Tailwind 진입 import 가 있다는 뜻입니다. AXIS 의 Tailwind 4 연동(`@theme`)은 아직 없어 AXIS 색 클래스가 만들어지는지는 확인하지 않습니다(WI-0044).

## 영향 없음
- Tailwind 3 프로젝트의 `.ts` · `.js` · 설정 없음 문구와 나머지 항목(axis.config.json · globals.css · utils.ts · dependencies · brand)은 바뀌지 않았습니다.

## 검증
- 배포본 1.2.1 과 같은 Tailwind 4 앱을 비교: FAIL → PASS, 빈 디렉터리: rc 0 → 1. 상세는 [testplan.md](./testplan.md).
