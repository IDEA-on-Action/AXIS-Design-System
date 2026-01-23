# AX Sprint Skill

5-Day Sprint를 설계하고 운영합니다. **기본 모드는 ToDo 기반**입니다.

| 모드 | 입력 | 용도 | 기본값 |
|------|------|------|--------|
| **ToDo 기반** | project-todo.md | 프로젝트 개발 스프린트 | ✅ 기본 |
| **Brief 기반** | Brief JSON (승인됨) | 사업기회 검증 스프린트 | - |

## 사용법

### 기본 실행 (ToDo 기반 스프린트 자동 생성)

```bash
# project-todo.md 기반으로 바로 스프린트 생성
python .claude/skills/ax-sprint/sprint_skill.py

# 또는 명시적으로
python .claude/skills/ax-sprint/sprint_skill.py --from-todo
```

### ToDo 기반 스프린트 옵션

```bash
# ToDo 파일 확인만
python .claude/skills/ax-sprint/sprint_skill.py --check-todo

# 커스텀 제목으로 생성
python .claude/skills/ax-sprint/sprint_skill.py --title "AXIS DS v0.2.0"

# 스프린트 기간 지정 (기본: 5일)
python .claude/skills/ax-sprint/sprint_skill.py --days 3
```

### 스프린트 관리

```bash
# 스프린트 목록
python .claude/skills/ax-sprint/sprint_skill.py --list

# 스프린트 상태 확인
python .claude/skills/ax-sprint/sprint_skill.py --status SPRINT-2026-001

# 태스크 업데이트
python .claude/skills/ax-sprint/sprint_skill.py --update SPRINT-2026-001:D1-1:completed

# 최종 결정
python .claude/skills/ax-sprint/sprint_skill.py --decision SPRINT-2026-001:GO
```

### Brief 기반 스프린트 (BD용)

```
/ax:sprint --brief-id BRF-2025-001 --method 5DAY_SPRINT
```

## 출력

- Sprint JSON 파일 (`.claude/data/sprints/SPRINT-YYYY-NNN.json`)
- 스프린트 체크리스트 (콘솔 출력)
- Confluence 스프린트 페이지 (Brief 기반 시)

## 5-Day Sprint 프레임워크

### Day 1: 계획 & 분석
- [ ] 스프린트 범위 확정
- [ ] 작업 분석 및 우선순위화
- [ ] 검증 방법론 확정

### Day 2: 설계 & 준비
- [ ] 구현 설계
- [ ] 환경 준비
- [ ] 프로토타입 범위 결정

### Day 3: 구현 (1)
- [ ] 핵심 기능 구현
- [ ] 역할 분담
- [ ] 중간 점검

### Day 4: 구현 (2)
- [ ] 추가 기능 구현
- [ ] 테스트 시나리오 작성
- [ ] 연동 작업

### Day 5: 검증 & 정리
- [ ] 테스트 수행
- [ ] 문서화 (project-todo.md 갱신)
- [ ] Go/Pivot/No-Go 결정
- [ ] 후속 액션 정의

## CLI 옵션

| 옵션 | 설명 |
|------|------|
| `--from-todo` | project-todo.md 기반 스프린트 생성 |
| `--check-todo` | project-todo.md 확인만 |
| `--new` | 빈 스프린트 생성 |
| `--title` | 스프린트 제목 |
| `--days` | 스프린트 기간 (기본: 5일) |
| `--list` | 스프린트 목록 |
| `--status` | 스프린트 상태 확인 (Sprint ID) |
| `--update` | 태스크 업데이트 (SPRINT-ID:TASK-ID:STATUS) |
| `--decision` | 최종 결정 (SPRINT-ID:GO\|PIVOT\|NO_GO) |
| `--dry-run` | 실제 저장 없이 미리보기 |
| `--json` | JSON 형식 출력 |

## Decision Criteria

```
IF 성공 기준 70%+ 달성:
    decision = "GO"
    → 다음 단계 진입

ELIF 성공 기준 40-70% 달성:
    decision = "PIVOT"
    → 수정 후 재시도

ELSE:
    decision = "NO_GO"
    → Archive
```

## 출력 예시

```json
{
  "sprint_id": "SPRINT-2026-001",
  "title": "AXIS DS v0.2.0",
  "source_todo_path": "project-todo.md",
  "decision": "GO",
  "days": [
    {
      "day": 1,
      "title": "계획 & 분석",
      "focus": "스프린트 범위 확정 및 작업 분석",
      "tasks": [
        {
          "id": "D1-1",
          "title": "스프린트 목표 확인",
          "status": "completed"
        }
      ]
    }
  ],
  "findings": [
    "모든 컴포넌트 빌드 성공",
    "테스트 커버리지 80% 달성"
  ],
  "next_actions": [
    "npm 배포 준비",
    "문서화 사이트 구축"
  ],
  "success_rate": 85.0,
  "todo_version": "0.6.0"
}
```

## Validation 방법론 (Brief 기반)

| 방법 | 적합 상황 | 기간 |
|------|----------|------|
| **5DAY_SPRINT** | 솔루션 컨셉 검증 | 5일 |
| **INTERVIEW** | 고객 Pain 검증 | 1-2주 |
| **DATA_ANALYSIS** | 가설 정량 검증 | 1주 |
| **BUYER_REVIEW** | 예산/구매의사 확인 | 3-5일 |
| **POC** | 기술 실현가능성 | 2-4주 |
