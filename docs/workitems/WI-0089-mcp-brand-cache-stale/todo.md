# WI-0089: MCP 브랜드 도구의 tokens 판독 낡음 TODO

> PRD: [prd.md](./prd.md) | 계획: [plan.md](./plan.md) | 테스트 계획: [testplan.md](./testplan.md) | GitHub: #224 | 상태: 🔄 착수 측정 완료(2026-10-29) · 사용자 결정 Q80 ~ Q85 대기

## 착수
- [x] WI-0085 원 재현 기록 확인(`WI-0085-pinned-pnpm-guidance/testplan.md:20`, 같은 경로 미지원 → 빌드 전) 뒤 같은 조건 재현 (AC1) → 2026-10-29: S1 단계 1 에서 L 미지원 안내(1.7.0) · F 빌드 전 안내(1.7.0), 2회 실행 같음(testplan 2.1)
- [x] 발행본 mcp 1.4.6 stdio 하네스(같은 프로세스 L · 같은 경로 새 프로세스 F), tools/list 실측 18개 (AC1 ~ AC6) → 13 시퀀스 · 172칸 · 갈림 20칸, check_project 갈림 0(testplan 2절)
- [x] 양성 대조: F 가 상태마다 다른 응답을 내 하네스가 상태 변화를 만들고 있음을 보임, check 의 tokens 설치 축은 미선언 픽스처(S13)로 따로 (testplan 2.1 · 2.3)
- [x] 원인 분리: Node 단독 프로브로 같은 프로세스 `createRequire().resolve` 낡음 · Worker · 자식 프로세스 정상, 우회 비용 (prd 1.2, testplan 3.2)
- [x] 캐시 전수 표(mcp · registry-core grep, 낡음 C1 하나 · 무해 C2 ~ C8, CLI 영향 없음) (prd 1.3, AC7)
- [x] 반례 탐색: 내용은 바뀌고 exports 는 같은 S3 · S5 · S9 갈림 0 (testplan 3.1)

## 결정
- [ ] Q80 방식(권장 B 변경 감지 + 격리 해석) (AC1 ~ AC4 · AC6)
- [ ] Q81 감지 키(권장 내용 sha256) (AC5)
- [ ] Q82 범위(권장 `brand-core.ts` Node 해석 세 곳만) (AC7)
- [ ] Q83 폴백(권장 Node 해석 + 재시작 안내 한 줄) (AC8)
- [ ] Q84 changeset(권장 mcp · cli patch) (AC10)
- [ ] Q85 Node 20 · 24 측정 시점(권장 구현 검증 때, 착수는 막지 않음) (testplan 5절)
- [ ] 격리 해석의 동기화 방식(동기 유지 `Atomics.wait` · `spawnSync` 대 async 화)을 착수 때 고르고 testplan 에 기록 (plan 3절 3, 사용자 결정 아님) (AC10)

## 구현
- [ ] 원본 `axis-cli/src/theme/brand-core.ts` 의 Node 해석 세 곳(`:169` · `:350` · `:590`)을 `resolveTokensSubpath` 하나로 모음, 오류 코드 분류 불변 (AC1 ~ AC4 · AC6)
- [ ] 첫 Node 해석 직전 내용 키 기록 · 다르면 격리 해석, 미설치 갈래는 기록하지 않음 (AC1 ~ AC5)
- [ ] 격리 해석(한 호출의 해석을 Worker 하나에 묶음, `code` 만 옮김) (AC1 ~ AC4)
- [ ] 폴백 `stale` 표시와 MCP 응답 재시작 안내 한 줄(`brand.ts` 포매터), CLI 렌더러는 그대로 (AC8 · AC10)
- [ ] 원본 → MCP 사본 `cp`, `brand-core.test.ts` 통과 (AC10)

## 테스트
- [ ] 새 회귀 테스트(cli 「WI-0089」 describe, mcp brand 핸들러 행)를 수정 전 소스에서 빨강 · 수정본 초록 (AC11)
- [ ] 변이 V1 ~ V5 각각 빨강, sha256 대조 원복 (AC9)
- [ ] 빌드본으로 하네스 재측정: 갈림 0, AC6 가드 칸 발행본과 바이트 같음, 격리 해석 횟수 (AC1 ~ AC6)
- [ ] CLI `theme list` · `theme info` · `theme add` 출력 A/B(발행본 cli 1.7.7 대 수정본) (AC10)
- [ ] Node 20 · 24 하네스 재측정 (Q85)
- [ ] `git diff --stat` 이 `brand-core.ts` 두 파일 · 테스트 · changeset · 문서만 (AC7)
- [ ] turbo build · type-check · lint `--force`(Cached 0), cli · mcp vitest (AC10)

## 릴리스
- [ ] `.changeset/` Q84 결과대로, `pnpm check-changeset-mcp-tokens` rc 0 (AC10)
- [ ] release-notes.md
