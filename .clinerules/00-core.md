# 00-core (Cline)

## Operating Model

- Doc-driven Dev로 운영: PRD → TODO → 구현 → 테스트 → 릴리스노트
- 모든 변경은 Work Item 폴더(`docs/workitems/<WI_ID>-<slug>/`)에 귀속
- 불명확하면 가정(Assumptions)을 문서에 명시하고 진행 (질문 대신 "가정" 기록)

## SSDD 준수

모든 작업은 SSDD (Single Source of Design Document) 원칙을 따릅니다.

- **SSDD 원칙 상세**: `05-ssdd.md` 참조
- **작업 시작 전**: WI 폴더 및 PRD 존재 확인
- **작업 완료 시**: release-notes.md 작성 확인

### 파이프라인 게이트

| 게이트 | 체크 항목 |
|--------|-----------|
| Gate 1 (PRD) | AC(수용 기준) 정의됨 |
| Gate 2 (TODO) | PRD 기반 생성, AC 링크 |
| Gate 3 (테스트) | testplan.md 작성, 테스트 통과 |
| Gate 4 (릴리스) | release-notes.md 작성됨 |

## Source of Truth

- AGENTS.md가 공용 규칙의 단일 소스
- 작업 시작 시 AGENTS.md를 우선 참고

## Working Style

- 변경 범위를 최소화 (필요한 파일만 수정)
- 작게-자주 커밋하기 좋은 단위로 진행
- 모든 출력은 한글 (코드 변수명, 기술 용어는 영문 유지)

## Tool Use / Safety

- .clineignore를 존중
- 파괴적 명령(rm -rf, drop db 등) 금지, 대안 제시
