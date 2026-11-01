# WI-0107: 템플릿별 검사를 axis check · MCP check_project 와 연동 PRD

> 작성일: 2026-11-01 | 버전: v1.0 | WI: WI-0107 | GitHub: #271 | 상태: 결정 반영 · 구현 완료(머지 전)
> 상위: WI-0027 PRD FR-4b(후속으로 미뤄 둔 연동) | 기준: `main` 2d10c1c
> 표기: **측정**(이번에 실행해 얻은 값) · **계산** · **추정**(실행하지 않음)

## 1. 배경

- ontology-console 템플릿은 `scripts/check-ontology.mjs`(`npm run check:ontology`)로 디자인 규칙 다섯 가지를 검사해요(WI-0027 FR-4a). `axis check` · MCP `axis.check_project` 는 이 규칙을 보지 않아서, em-dash 위반 1건이 있는 사본도 9항목 7 pass / 2 warn / 0 fail · rc 0 이었어요(브리프 측정).
- `axis.config.json` 의 `template` 키를 읽는 코드는 0건이었어요. 이번에 처음 읽으므로 신뢰 경계를 넘는 값으로 다뤄요.
- `registry-core/src/config/axis-config.ts:12-13 · :27` 주석과 `apps/web/public/schema.json` 의 template · brand 설명이 코드와 달랐어요(brand 를 템플릿 apply · init · MCP apply_template 도 씀).
- AXIS 가 배포하는 `agentic-tool-call-card` 가 ontology 규칙(em-dash)에 걸려, `axis add` 만 해도 사용자 프로젝트에 WARN 이 생길 수 있었어요(반박 검토 측정).

## 2. 사용자 결정(2026-11-01, 모두 권장안)

| ID | 결정 |
|---|---|
| D1 | 실행 방식 C: check-ontology.mjs 의 5규칙을 registry-core 순수 함수(`template-checks.ts`)로 옮기고 사용자 스크립트는 실행하지 않아요. template.json 에 `checks` id 를 선언하되 런타임(cli · mcp)은 이 필드를 읽지 않아요(빌드 · 동기화 테스트 전용). `script` 는 사람용 안내 문자열이에요 |
| D2 | 위반은 WARN(rc 0 유지). 검사 파일 0개 · 읽기 예외는 WARN 「측정 실패」(PASS 아님). 실행할 검사는 config 의 `template` + registry-core 정적 표로 고르고, 표와 template.json `checks` 가 같은지 동기화 테스트(모르는 id 는 실패). template 이 없거나 표에 없으면 항목을 만들지 않아 종전 출력과 바이트 같음. 주석 · schema 설명 정정 |
| D3 | 보안 · 견고성: ① lstat 재귀, 링크는 실경로가 프로젝트 안일 때만, 방문 실경로 집합 + 깊이 한도 ② CSS 규칙 분해를 선형 토크나이저로, 파일 크기 상한, 시간 상한 회귀 테스트 ③ template 값 안전 조회(typeof · slug · Map) ④ 메시지는 고정 문구 + 건수 + 규칙 id, 경로는 이스케이프 · 길이 제한, 「전체 보기」는 script 가 있을 때만, 내장 규칙임을 밝힘 ⑤ 템플릿 스크립트도 같은 규칙으로 고쳐 패리티 테스트로 고정 |
| D4 | `tool-call-card` 설명 앞의 긴 줄표(U+2014) 구분자를 가운뎃점 「· {description}」로. 레지스트리 전 컴포넌트 전수 측정, 남은 위반은 보고 |

## 3. 요구사항

- FR-1: `axis check` 10번째 항목 `template.<검사 id>`. `collectCheckResults` 끝에 공유 함수 `collectTemplateCheckResults(baseDir)` 결과를 붙여요.
- FR-2: MCP `handleCheckProject` 도 같은 함수를 같은 자리에서 불러요. 도구 설명에 「적용한 템플릿의 규칙 검사 포함(읽기 전용, 스크립트 실행 안 함)」.
- FR-3: 정적 표 `TEMPLATE_CHECKS = Map{ "ontology-console" → ["ontology-rules"] }`, 정의 `TEMPLATE_CHECK_DEFINITIONS = Map{ "ontology-rules" → { script: "check:ontology" } }`.
- FR-4: template.json `checks: [{ "id": "ontology-rules", "script": "check:ontology" }]`. 빌드 스크립트는 모양만 확인하고, id · script 가 표와 같은지는 cli 테스트가 봐요.
- FR-5: 문구
  - PASS: `템플릿 ontology-console 규칙 검사(axis 내장 규칙, 설치한 axis 버전 기준 · 프로젝트 스크립트는 실행하지 않음): 파일 N개, 위반 0건`
  - WARN(위반): `…: 파일 N개, 위반 M건(<규칙> <수> · …), 첫 위치 "<경로>":<줄> <규칙>[, 건너뜀: …][ → 전체 보기: npm run check:ontology]`
  - WARN(측정 실패): `…: 측정 실패, 검사할 파일이 없습니다(대상: app · components · lib)` / `…: 측정 실패, 파일을 읽지 못했습니다(<코드>)`
- FR-6: 상한 · 범위(두 구현 같음): 파일 256KB, 한 줄 4,096자, 디렉터리 깊이 32, 클래스 묶음 8,000자. 건너뛴 수는 문구에 적어요.
- FR-7: 문서 정정(axis-config.ts 주석 · schema.json 설명), cli README `axis check` 절, 템플릿 README, WI-0027 PRD FR-4b 상태.

## 4. 수용 기준

- AC1: 템플릿 원본 사본에서 `axis check` 에 새 항목 PASS(파일 20개, 위반 0건), 위반 주입이면 WARN 이고 rc 0
- AC2: template 이 없거나 이상값("__proto__" · "constructor" · 배열 · 숫자 · 다른 템플릿)이면 출력이 origin/main dist 와 바이트 같음
- AC3: 같은 fixture 에서 CLI 와 MCP 의 전 항목 name · severity · message 가 같음(check 의 레포 첫 직접 비교 테스트)
- AC4: 패리티: 같은 입력에 두 구현의 위반 목록(파일 · 줄 · 규칙) · 파일 수 · 종료 분류가 같음. 템플릿 원본 files 에 두 구현 모두 0건
- AC5: 링크 밖 · 순환 · 깨진 링크에서 프로젝트 밖을 읽지 않고 죽지 않음. 12만 자 꼬리 주석 CSS 가 1초 안
- AC6: 줄바꿈 파일 이름이 있어도 MCP 출력 줄 수가 늘지 않음, 소스 조각이 문구에 없음
- AC7: 원격 템플릿 JSON 의 checks 를 바꾸거나 지워도 apply 뒤 check 결과가 같음
- AC8: changeset cli · mcp minor, agentic-ui patch(linked 중 agentic-ui 만 1.8.4), `pnpm check-changeset-mcp-tokens` 통과
- AC9: turbo build · type-check · lint · test `--force`(Cached 0), pack-smoke, 템플릿 사본 `npm run check:ontology` rc 0

## 5. 범위 밖 · 위험

- 다른 템플릿(dashboard 등)의 검사: 표에 없어 항목을 만들지 않아요.
- MCP 의 기존 9항목 중 일부(axis.config.json · utils · brand 문구)는 여전히 CLI 와 별도 구현이에요. 이번 비교 테스트가 드리프트를 잡아요.
- 사용자 사본 차이: 프로젝트의 `scripts/check-ontology.mjs` 를 고치거나 오래된 템플릿으로 만든 프로젝트는 `axis check` 결과와 다를 수 있어요. 문구에 「axis 내장 규칙, 설치한 axis 버전 기준」을 밝혔어요.
- 정규식 휴리스틱이라 오탐이 있어요(레지스트리 select · toast 의 card-shadow 4건, testplan 6절). 그래서 WARN 까지만 내요.
- 템플릿 규칙을 고치면 cli · mcp 를 다시 발행해야 해요.
