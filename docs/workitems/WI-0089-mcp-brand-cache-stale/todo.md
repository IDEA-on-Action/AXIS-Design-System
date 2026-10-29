# WI-0089: MCP 브랜드 도구의 tokens 판독 낡음 TODO

> PRD: [prd.md](./prd.md) | 계획: [plan.md](./plan.md) | 테스트 계획: [testplan.md](./testplan.md) | 릴리스 노트: [release-notes.md](./release-notes.md) | GitHub: #224 | 상태: 🔄 구현 · 반박 검증 보정 완료(2026-10-29), PR 리뷰 · 발행 대기 · 남은 항목 4개(Q86 · Q87 확인, Node 20 측정, 발행 뒤 현행화)

## 착수
- [x] WI-0085 원 재현 기록 확인(`WI-0085-pinned-pnpm-guidance/testplan.md:20`, 같은 경로 미지원 → 빌드 전) 뒤 같은 조건 재현 (AC1) → 2026-10-29: S1 단계 1 에서 L 미지원 안내(1.7.0) · F 빌드 전 안내(1.7.0), 2회 실행 같음(testplan 2.1)
- [x] 발행본 mcp 1.4.6 stdio 하네스(같은 프로세스 L · 같은 경로 새 프로세스 F), tools/list 실측 18개 (AC1 ~ AC6) → 13 시퀀스 · 172칸 · 갈림 20칸, check_project 갈림 0(testplan 2절)
- [x] 양성 대조: F 가 상태마다 다른 응답을 내 하네스가 상태 변화를 만들고 있음을 보임, check 의 tokens 설치 축은 미선언 픽스처(S13)로 따로 (testplan 2.1 · 2.3)
- [x] 원인 분리: Node 단독 프로브로 같은 프로세스 `createRequire().resolve` 낡음 · Worker · 자식 프로세스 정상, 우회 비용 (prd 1.2, testplan 3.2)
- [x] 캐시 전수 표(mcp · registry-core grep, 낡음 C1 하나 · 무해 C2 ~ C8, CLI 영향 없음) (prd 1.3, AC7)
- [x] 반례 탐색: 내용은 바뀌고 exports 는 같은 S3 · S5 · S9 갈림 0 (testplan 3.1)

## 결정
- [x] Q80 방식: B 변경 감지 + 격리 해석 (AC1 ~ AC4 · AC6) → 사용자 결정 2026-10-29 권장안
- [x] Q81 감지 키: 내용 sha256 (AC5) → 같음. 반박 검증 보정으로 후보 경로의 「없음」까지 봄(AC12)
- [x] Q82 범위: `brand-core.ts` Node 해석 세 곳만 (AC7) → 같음
- [x] Q83 폴백: Node 해석 + 재시작 안내 한 줄 (AC8) → 같음
- [x] Q84 changeset: mcp · cli patch (AC10) → 같음
- [x] Q85 Node 20 · 24 측정: 구현 검증 때 (testplan 4.7) → 같음
- [x] 격리 해석의 동기화 방식 (plan 3절 3, 사용자 결정 아님) (AC10) → Worker + `Atomics.wait` 동기 대기, 이유는 testplan 4.1
- [ ] Q86 바뀐 뒤 호출마다 Worker 비용을 그대로 둘지 (prd 6절) (남음: 권장안 ① 그대로로 구현, 확인 대기)
- [ ] Q87 폴백 중 새 브랜드 표시 (prd 6절) (남음: 권장안 ① 목록에서 빼고 상세는 없는 이름 + stale 로 구현, 확인 대기)

## 구현
- [x] 원본 `axis-cli/src/theme/brand-core.ts` 의 Node 해석 세 곳을 해석기 하나(`openTokensResolver`)로 모음, 오류 코드 분류 불변 (AC1 ~ AC4 · AC6) → 하네스 고친 칸 20/20 · 가드 152/152(testplan 4.3)
- [x] 첫 Node 해석 직전 후보 경로 상태 기록 · 하나라도 다르면 격리 해석, 미설치 갈래는 기록하지 않음 (AC1 ~ AC5 · AC12) → 변이 V1 · V2 · V4 · V7 빨강(testplan 4.4)
- [x] 격리 해석(한 판정에 Worker 하나, `code` · `message` 를 옮김, `error` 리스너, 실패 래치, 한도 5 초) (AC1 ~ AC4 · AC13) → 변이 V8 · V9
- [x] 경합 사후 점검(Node 해석 직후 다시 읽어 다르면 `unknown` · 격리 해석으로 다시 판정) (AC14) → 변이 V11
- [x] 폴백 `stale` 표시와 MCP 응답 재시작 안내 한 줄(`brand.ts` 포매터), 폴백 중 낡은 exports 항목은 빼거나 `brand: null`, CLI 렌더러는 그대로 (AC8 · AC10) → 변이 V5 · V6 · V10 · V12
- [x] 원본 → MCP 사본 `cp`, `brand-core.test.ts` 통과 (AC10) → sha256 9d5618886a318e25… 같음

## 테스트
- [x] 새 회귀 테스트(cli 「WI-0089」 describe 13건, mcp brand 3건)를 main 소스에서 빨강 · 최종본 초록 (AC11) → cli 13/13 · mcp 3/3 빨강(내역은 testplan 4.2)
- [x] 변이 V1 ~ V12 각각 빨강(V8 은 처리되지 않은 오류로 실행 실패), sha256 대조 원복 (AC9) → testplan 4.4
- [x] 빌드본으로 하네스 재측정: 갈림 0, AC6 가드 칸 발행본과 바이트 같음 (AC1 ~ AC6) → Node 22 · 24 모두(testplan 4.3)
- [x] 변경 없는 호출의 비용 · 경로 (AC5) → 발행본과 번갈아 잰 차이가 잡음 안, 단위 테스트 Worker 증가 0(testplan 4.6)
- [x] CLI `theme list` · `theme info` · `theme add` 출력 A/B(발행본 cli 1.7.7 대 수정본) (AC10) → 30/30 바이트 같음(testplan 4.5)
- [x] 반박 검증 3관점(정확성 · 회귀 · 문구와 문서) 뒤 보정과 회귀 검증 재실행 (AC12 ~ AC14) → testplan 4.9
- [ ] Node 20 하네스 재측정 (Q85) (남음: 이 머신에 Node 20 없음. Node 24.18.0 은 측정 완료, testplan 4.7)
- [x] 변경 파일이 제품 코드 `brand-core.ts` 두 파일 · mcp `brand.ts` 와 테스트 · changeset · 문서뿐 (AC7) → 작업 트리 diff 통계로 확인
- [x] turbo build · type-check · lint · test `--force`(Cached 0), cli · mcp (AC10) → rc 0 · 9/9 · Cached 0, cli 1109 · mcp 234(testplan 4.8)

## 릴리스
- [x] `.changeset/` mcp · cli patch, `pnpm check-changeset-mcp-tokens` rc 0 (AC10) → testplan 4.8
- [x] release-notes.md → 미발행 상태로 작성
- [ ] 발행 뒤 release-notes 머리말 · CLAUDE.md 버전 현행화 (남음: 발행 전)
