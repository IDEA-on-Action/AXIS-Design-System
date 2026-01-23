#!/usr/bin/env python3
"""
AX Sprint Skill - 5-Day Validation Sprint 설계 및 운영

Brief 승인 후 5-Day Validation Sprint를 설계하고 운영합니다.

사용법:
    python sprint_skill.py --brief-id BRF-2025-001 [--method 5DAY_SPRINT]
    python sprint_skill.py --new --title "프로젝트명"
    python sprint_skill.py --list
    python sprint_skill.py --status VAL-2025-001

옵션:
    --brief-id          Brief ID (기존 Brief 기반 스프린트 생성)
    --method            검증 방법론 (5DAY_SPRINT, INTERVIEW, DATA_ANALYSIS, BUYER_REVIEW, POC)
    --new               새 스프린트 생성 (Brief 없이)
    --title             스프린트 제목
    --list              진행 중인 스프린트 목록
    --status            스프린트 상태 확인
    --update            스프린트 체크리스트 업데이트
    --decision          최종 결정 기록 (GO, PIVOT, NO_GO)
    --dry-run           실제 저장 없이 미리보기
    --json              JSON 형식 출력
"""

import argparse
import io
import json
import os
import sys
from dataclasses import dataclass, field, asdict
from datetime import datetime, timedelta
from enum import Enum
from pathlib import Path
from typing import Any

# Windows 콘솔 UTF-8 출력 설정
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')


class ValidationMethod(Enum):
    FIVE_DAY_SPRINT = "5DAY_SPRINT"
    INTERVIEW = "INTERVIEW"
    DATA_ANALYSIS = "DATA_ANALYSIS"
    BUYER_REVIEW = "BUYER_REVIEW"
    POC = "POC"


class SprintDecision(Enum):
    PENDING = "PENDING"
    GO = "GO"
    PIVOT = "PIVOT"
    NO_GO = "NO_GO"


class TaskStatus(Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    SKIPPED = "skipped"


@dataclass
class SprintTask:
    id: str
    day: int
    title: str
    description: str
    status: TaskStatus = TaskStatus.PENDING
    assignee: str | None = None
    completed_at: str | None = None
    notes: str | None = None


@dataclass
class SprintDay:
    day: int
    title: str
    focus: str
    tasks: list[SprintTask] = field(default_factory=list)

    @property
    def completion_rate(self) -> float:
        if not self.tasks:
            return 0.0
        completed = sum(1 for t in self.tasks if t.status == TaskStatus.COMPLETED)
        return (completed / len(self.tasks)) * 100


@dataclass
class ValidationSprint:
    validation_id: str
    brief_id: str | None
    title: str
    method: ValidationMethod
    decision: SprintDecision = SprintDecision.PENDING
    days: list[SprintDay] = field(default_factory=list)
    findings: list[str] = field(default_factory=list)
    evidence_links: list[str] = field(default_factory=list)
    next_actions: list[str] = field(default_factory=list)
    created_at: str = ""
    started_at: str | None = None
    validated_at: str | None = None
    success_criteria: list[str] = field(default_factory=list)
    success_rate: float = 0.0

    def __post_init__(self):
        if not self.created_at:
            self.created_at = datetime.now().isoformat()

    @property
    def total_tasks(self) -> int:
        return sum(len(d.tasks) for d in self.days)

    @property
    def completed_tasks(self) -> int:
        return sum(
            1 for d in self.days
            for t in d.tasks
            if t.status == TaskStatus.COMPLETED
        )

    @property
    def completion_rate(self) -> float:
        if self.total_tasks == 0:
            return 0.0
        return (self.completed_tasks / self.total_tasks) * 100

    @property
    def current_day(self) -> int:
        """현재 진행 중인 Day 반환"""
        for day in self.days:
            if day.completion_rate < 100:
                return day.day
        return 5  # 모두 완료


def get_project_root() -> Path:
    """프로젝트 루트 디렉토리 찾기"""
    current = Path.cwd()
    while current != current.parent:
        if (current / "pyproject.toml").exists() or (current / "package.json").exists():
            return current
        current = current.parent
    return Path.cwd()


def get_sprints_dir() -> Path:
    """스프린트 저장 디렉토리"""
    project_root = get_project_root()
    sprints_dir = project_root / ".claude" / "data" / "sprints"
    sprints_dir.mkdir(parents=True, exist_ok=True)
    return sprints_dir


def generate_validation_id() -> str:
    """Validation ID 생성"""
    year = datetime.now().year
    sprints_dir = get_sprints_dir()
    existing = list(sprints_dir.glob(f"VAL-{year}-*.json"))
    next_num = len(existing) + 1
    return f"VAL-{year}-{next_num:03d}"


def create_5day_sprint_template() -> list[SprintDay]:
    """5-Day Sprint 템플릿 생성"""
    days = []

    # Day 1: 문제 정의 & 매핑
    day1 = SprintDay(
        day=1,
        title="문제 정의 & 매핑",
        focus="문제를 깊이 이해하고 검증 방향 설정",
        tasks=[
            SprintTask("D1-1", 1, "Brief 기반 문제 상세화", "Brief 내용을 바탕으로 해결할 문제를 구체적으로 정의"),
            SprintTask("D1-2", 1, "이해관계자 맵 작성", "의사결정자, 사용자, 영향받는 팀 등 매핑"),
            SprintTask("D1-3", 1, "검증 질문 우선순위화", "검증해야 할 가설/질문 목록 작성 및 우선순위 결정"),
            SprintTask("D1-4", 1, "검증 방법론 확정", "인터뷰, 프로토타입 테스트, 데이터 분석 등 방법 결정"),
        ]
    )
    days.append(day1)

    # Day 2: 솔루션 스케치
    day2 = SprintDay(
        day=2,
        title="솔루션 스케치",
        focus="다양한 아이디어 발산 후 수렴",
        tasks=[
            SprintTask("D2-1", 2, "HMW 질문 도출", "How Might We 형태로 기회 영역 정의"),
            SprintTask("D2-2", 2, "아이디어 브레인스토밍", "4-up 또는 Crazy 8s 기법으로 아이디어 발산"),
            SprintTask("D2-3", 2, "팀 투표 & 수렴", "dot voting으로 유망 아이디어 선별"),
            SprintTask("D2-4", 2, "프로토타입 범위 결정", "MVP 범위와 핵심 기능 정의"),
        ]
    )
    days.append(day2)

    # Day 3: 결정 & 프로토타입 설계
    day3 = SprintDay(
        day=3,
        title="결정 & 프로토타입 설계",
        focus="최종 방향 결정 및 상세 설계",
        tasks=[
            SprintTask("D3-1", 3, "최종 솔루션 방향 결정", "Decider가 최종 방향 확정"),
            SprintTask("D3-2", 3, "스토리보드 작성", "사용자 여정 기반 화면/기능 흐름 설계"),
            SprintTask("D3-3", 3, "역할 분담", "프로토타입 제작 담당자 배정"),
            SprintTask("D3-4", 3, "인터뷰 가이드 준비", "검증 질문 스크립트 및 시나리오 작성"),
        ]
    )
    days.append(day3)

    # Day 4: 프로토타입 제작
    day4 = SprintDay(
        day=4,
        title="프로토타입 제작",
        focus="테스트 가능한 프로토타입 완성",
        tasks=[
            SprintTask("D4-1", 4, "MVP 프로토타입 개발", "Figma/코드 등으로 테스트 가능한 프로토타입 제작"),
            SprintTask("D4-2", 4, "테스트 시나리오 작성", "사용자가 수행할 태스크 정의"),
            SprintTask("D4-3", 4, "인터뷰 참여자 확정", "5명 내외 테스트 참여자 섭외 완료"),
            SprintTask("D4-4", 4, "리허설", "팀 내부 테스트 및 인터뷰 리허설"),
        ]
    )
    days.append(day4)

    # Day 5: 검증 & 결론
    day5 = SprintDay(
        day=5,
        title="검증 & 결론",
        focus="실제 검증 수행 및 의사결정",
        tasks=[
            SprintTask("D5-1", 5, "고객 인터뷰/테스트 수행", "5명 대상 1:1 인터뷰 및 프로토타입 테스트"),
            SprintTask("D5-2", 5, "결과 종합 & 인사이트 도출", "인터뷰 노트 정리 및 패턴 분석"),
            SprintTask("D5-3", 5, "Go/Pivot/No-Go 결정", "성공 기준 대비 달성률 평가 및 결정"),
            SprintTask("D5-4", 5, "후속 액션 정의", "다음 단계 구체적 액션 아이템 도출"),
        ]
    )
    days.append(day5)

    return days


def create_interview_template() -> list[SprintDay]:
    """Interview 방법론 템플릿"""
    return [
        SprintDay(
            day=1,
            title="인터뷰 준비",
            focus="인터뷰 설계 및 참여자 섭외",
            tasks=[
                SprintTask("I1-1", 1, "인터뷰 목표 정의", "검증할 가설과 질문 목록 작성"),
                SprintTask("I1-2", 1, "인터뷰 가이드 작성", "질문 스크립트 및 프로빙 질문 준비"),
                SprintTask("I1-3", 1, "참여자 섭외", "타겟 고객 5-8명 섭외"),
            ]
        ),
        SprintDay(
            day=2,
            title="인터뷰 수행",
            focus="1:1 심층 인터뷰 진행",
            tasks=[
                SprintTask("I2-1", 2, "인터뷰 진행", "1:1 인터뷰 수행 (각 30-60분)"),
                SprintTask("I2-2", 2, "노트 정리", "인터뷰 직후 핵심 인사이트 기록"),
            ]
        ),
        SprintDay(
            day=3,
            title="분석 & 결론",
            focus="인사이트 종합 및 의사결정",
            tasks=[
                SprintTask("I3-1", 3, "어피니티 다이어그램", "인터뷰 결과 클러스터링"),
                SprintTask("I3-2", 3, "인사이트 도출", "핵심 발견사항 정리"),
                SprintTask("I3-3", 3, "결론 및 후속 액션", "Go/Pivot/No-Go 결정"),
            ]
        ),
    ]


def create_sprint(
    title: str,
    brief_id: str | None = None,
    method: ValidationMethod = ValidationMethod.FIVE_DAY_SPRINT,
    success_criteria: list[str] | None = None
) -> ValidationSprint:
    """새 스프린트 생성"""
    validation_id = generate_validation_id()

    # 방법론에 따른 템플릿 선택
    if method == ValidationMethod.FIVE_DAY_SPRINT:
        days = create_5day_sprint_template()
    elif method == ValidationMethod.INTERVIEW:
        days = create_interview_template()
    else:
        # 기본 템플릿 (간소화)
        days = [
            SprintDay(
                day=1,
                title="준비",
                focus="검증 준비",
                tasks=[
                    SprintTask("G1-1", 1, "검증 계획 수립", "검증 방법 및 일정 확정"),
                    SprintTask("G1-2", 1, "리소스 확보", "필요 인력/도구 확보"),
                ]
            ),
            SprintDay(
                day=2,
                title="실행",
                focus="검증 수행",
                tasks=[
                    SprintTask("G2-1", 2, "검증 실행", "계획에 따른 검증 수행"),
                ]
            ),
            SprintDay(
                day=3,
                title="결론",
                focus="결과 정리 및 의사결정",
                tasks=[
                    SprintTask("G3-1", 3, "결과 분석", "검증 결과 분석"),
                    SprintTask("G3-2", 3, "의사결정", "Go/Pivot/No-Go 결정"),
                ]
            ),
        ]

    sprint = ValidationSprint(
        validation_id=validation_id,
        brief_id=brief_id,
        title=title,
        method=method,
        days=days,
        success_criteria=success_criteria or [
            "핵심 가설 70% 이상 검증",
            "타겟 고객 5명 이상 인터뷰 완료",
            "기술적 실현 가능성 확인",
        ]
    )

    return sprint


def save_sprint(sprint: ValidationSprint, dry_run: bool = False) -> str:
    """스프린트 저장"""
    if dry_run:
        return f"[Dry-run] {sprint.validation_id} 저장 예정"

    sprints_dir = get_sprints_dir()
    file_path = sprints_dir / f"{sprint.validation_id}.json"

    # dataclass를 dict로 변환
    data = sprint_to_dict(sprint)

    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    return str(file_path)


def sprint_to_dict(sprint: ValidationSprint) -> dict:
    """스프린트를 dict로 변환"""
    return {
        "validation_id": sprint.validation_id,
        "brief_id": sprint.brief_id,
        "title": sprint.title,
        "method": sprint.method.value,
        "decision": sprint.decision.value,
        "days": [
            {
                "day": d.day,
                "title": d.title,
                "focus": d.focus,
                "tasks": [
                    {
                        "id": t.id,
                        "day": t.day,
                        "title": t.title,
                        "description": t.description,
                        "status": t.status.value,
                        "assignee": t.assignee,
                        "completed_at": t.completed_at,
                        "notes": t.notes,
                    }
                    for t in d.tasks
                ]
            }
            for d in sprint.days
        ],
        "findings": sprint.findings,
        "evidence_links": sprint.evidence_links,
        "next_actions": sprint.next_actions,
        "created_at": sprint.created_at,
        "started_at": sprint.started_at,
        "validated_at": sprint.validated_at,
        "success_criteria": sprint.success_criteria,
        "success_rate": sprint.success_rate,
    }


def load_sprint(validation_id: str) -> ValidationSprint | None:
    """스프린트 로드"""
    sprints_dir = get_sprints_dir()
    file_path = sprints_dir / f"{validation_id}.json"

    if not file_path.exists():
        return None

    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    return dict_to_sprint(data)


def dict_to_sprint(data: dict) -> ValidationSprint:
    """dict를 스프린트로 변환"""
    days = []
    for d in data.get("days", []):
        tasks = [
            SprintTask(
                id=t["id"],
                day=t["day"],
                title=t["title"],
                description=t["description"],
                status=TaskStatus(t.get("status", "pending")),
                assignee=t.get("assignee"),
                completed_at=t.get("completed_at"),
                notes=t.get("notes"),
            )
            for t in d.get("tasks", [])
        ]
        days.append(SprintDay(
            day=d["day"],
            title=d["title"],
            focus=d["focus"],
            tasks=tasks,
        ))

    return ValidationSprint(
        validation_id=data["validation_id"],
        brief_id=data.get("brief_id"),
        title=data["title"],
        method=ValidationMethod(data.get("method", "5DAY_SPRINT")),
        decision=SprintDecision(data.get("decision", "PENDING")),
        days=days,
        findings=data.get("findings", []),
        evidence_links=data.get("evidence_links", []),
        next_actions=data.get("next_actions", []),
        created_at=data.get("created_at", ""),
        started_at=data.get("started_at"),
        validated_at=data.get("validated_at"),
        success_criteria=data.get("success_criteria", []),
        success_rate=data.get("success_rate", 0.0),
    )


def list_sprints() -> list[ValidationSprint]:
    """모든 스프린트 목록"""
    sprints_dir = get_sprints_dir()
    sprints = []

    for file_path in sprints_dir.glob("VAL-*.json"):
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                sprints.append(dict_to_sprint(data))
        except Exception:
            continue

    return sorted(sprints, key=lambda s: s.created_at, reverse=True)


def update_task_status(
    sprint: ValidationSprint,
    task_id: str,
    status: TaskStatus,
    notes: str | None = None
) -> bool:
    """태스크 상태 업데이트"""
    for day in sprint.days:
        for task in day.tasks:
            if task.id == task_id:
                task.status = status
                if status == TaskStatus.COMPLETED:
                    task.completed_at = datetime.now().isoformat()
                if notes:
                    task.notes = notes
                return True
    return False


def make_decision(
    sprint: ValidationSprint,
    decision: SprintDecision,
    findings: list[str],
    next_actions: list[str],
    success_rate: float
) -> None:
    """최종 결정 기록"""
    sprint.decision = decision
    sprint.findings = findings
    sprint.next_actions = next_actions
    sprint.success_rate = success_rate
    sprint.validated_at = datetime.now().isoformat()


def format_sprint_summary(sprint: ValidationSprint) -> str:
    """스프린트 요약 포맷팅"""
    lines = []

    lines.append("")
    lines.append("━" * 60)
    lines.append(f"📋 {sprint.title}")
    lines.append("━" * 60)
    lines.append("")

    # 기본 정보
    lines.append(f"**ID**: {sprint.validation_id}")
    if sprint.brief_id:
        lines.append(f"**Brief**: {sprint.brief_id}")
    lines.append(f"**방법론**: {sprint.method.value}")
    lines.append(f"**상태**: {sprint.decision.value}")
    lines.append(f"**생성일**: {sprint.created_at[:10]}")
    lines.append("")

    # 진행률
    lines.append(f"## 진행률: {sprint.completion_rate:.0f}% ({sprint.completed_tasks}/{sprint.total_tasks})")
    lines.append("")

    # Day별 현황
    lines.append("## 일별 현황")
    lines.append("")

    for day in sprint.days:
        status_icon = "✅" if day.completion_rate == 100 else "🔄" if day.completion_rate > 0 else "⏳"
        lines.append(f"### {status_icon} Day {day.day}: {day.title} ({day.completion_rate:.0f}%)")
        lines.append(f"> {day.focus}")
        lines.append("")

        for task in day.tasks:
            if task.status == TaskStatus.COMPLETED:
                icon = "✅"
            elif task.status == TaskStatus.IN_PROGRESS:
                icon = "🔄"
            elif task.status == TaskStatus.SKIPPED:
                icon = "⏭️"
            else:
                icon = "⬜"

            assignee = f" (@{task.assignee})" if task.assignee else ""
            lines.append(f"- [{icon}] **{task.id}** {task.title}{assignee}")

        lines.append("")

    # 성공 기준
    if sprint.success_criteria:
        lines.append("## 성공 기준")
        for criterion in sprint.success_criteria:
            lines.append(f"- {criterion}")
        lines.append("")

    # 결과 (결정된 경우)
    if sprint.decision != SprintDecision.PENDING:
        lines.append("## 결과")
        lines.append(f"**결정**: {sprint.decision.value}")
        lines.append(f"**성공률**: {sprint.success_rate:.0f}%")
        lines.append("")

        if sprint.findings:
            lines.append("### 주요 발견")
            for finding in sprint.findings:
                lines.append(f"- {finding}")
            lines.append("")

        if sprint.next_actions:
            lines.append("### 후속 액션")
            for action in sprint.next_actions:
                lines.append(f"- {action}")
            lines.append("")

    return "\n".join(lines)


def format_sprint_checklist(sprint: ValidationSprint) -> str:
    """스프린트 체크리스트 (Markdown)"""
    lines = []

    lines.append(f"# {sprint.title} - Sprint Checklist")
    lines.append("")
    lines.append(f"**ID**: {sprint.validation_id}")
    lines.append(f"**방법론**: {sprint.method.value}")
    lines.append("")

    for day in sprint.days:
        lines.append(f"## Day {day.day}: {day.title}")
        lines.append(f"> {day.focus}")
        lines.append("")

        for task in day.tasks:
            checkbox = "x" if task.status == TaskStatus.COMPLETED else "~" if task.status == TaskStatus.IN_PROGRESS else " "
            lines.append(f"- [{checkbox}] **{task.id}** {task.title}")
            lines.append(f"  - {task.description}")

        lines.append("")

    return "\n".join(lines)


def format_sprint_json(sprint: ValidationSprint) -> str:
    """스프린트 JSON 출력"""
    data = sprint_to_dict(sprint)
    return json.dumps(data, ensure_ascii=False, indent=2)


def main():
    parser = argparse.ArgumentParser(description="AX Sprint - 5-Day Validation Sprint")
    parser.add_argument("--brief-id", type=str, help="Brief ID")
    parser.add_argument("--method", type=str, default="5DAY_SPRINT",
                       choices=["5DAY_SPRINT", "INTERVIEW", "DATA_ANALYSIS", "BUYER_REVIEW", "POC"],
                       help="검증 방법론")
    parser.add_argument("--new", action="store_true", help="새 스프린트 생성")
    parser.add_argument("--title", type=str, help="스프린트 제목")
    parser.add_argument("--list", action="store_true", help="스프린트 목록")
    parser.add_argument("--status", type=str, help="스프린트 상태 확인 (Validation ID)")
    parser.add_argument("--checklist", type=str, help="체크리스트 출력 (Validation ID)")
    parser.add_argument("--update", type=str, help="태스크 업데이트 (형식: VAL-ID:TASK-ID:STATUS)")
    parser.add_argument("--decision", type=str, help="최종 결정 (형식: VAL-ID:GO|PIVOT|NO_GO)")
    parser.add_argument("--dry-run", action="store_true", help="실제 저장 없이 미리보기")
    parser.add_argument("--json", action="store_true", help="JSON 형식 출력")

    args = parser.parse_args()

    # 스프린트 목록
    if args.list:
        sprints = list_sprints()
        if not sprints:
            print("진행 중인 스프린트가 없습니다.")
            return

        print("")
        print("━" * 60)
        print("📋 스프린트 목록")
        print("━" * 60)
        print("")
        print("| ID | 제목 | 방법론 | 상태 | 진행률 |")
        print("|-----|------|--------|------|--------|")
        for s in sprints:
            print(f"| {s.validation_id} | {s.title[:20]} | {s.method.value} | {s.decision.value} | {s.completion_rate:.0f}% |")
        return

    # 스프린트 상태 확인
    if args.status:
        sprint = load_sprint(args.status)
        if not sprint:
            print(f"스프린트를 찾을 수 없습니다: {args.status}")
            sys.exit(1)

        if args.json:
            print(format_sprint_json(sprint))
        else:
            print(format_sprint_summary(sprint))
        return

    # 체크리스트 출력
    if args.checklist:
        sprint = load_sprint(args.checklist)
        if not sprint:
            print(f"스프린트를 찾을 수 없습니다: {args.checklist}")
            sys.exit(1)

        print(format_sprint_checklist(sprint))
        return

    # 태스크 업데이트
    if args.update:
        try:
            parts = args.update.split(":")
            val_id, task_id, status = parts[0], parts[1], parts[2]
        except (ValueError, IndexError):
            print("형식 오류: --update VAL-ID:TASK-ID:STATUS")
            print("예: --update VAL-2025-001:D1-1:completed")
            sys.exit(1)

        sprint = load_sprint(val_id)
        if not sprint:
            print(f"스프린트를 찾을 수 없습니다: {val_id}")
            sys.exit(1)

        try:
            task_status = TaskStatus(status.lower())
        except ValueError:
            print(f"잘못된 상태: {status}")
            print("가능한 상태: pending, in_progress, completed, skipped")
            sys.exit(1)

        if update_task_status(sprint, task_id, task_status):
            save_sprint(sprint, args.dry_run)
            print(f"✅ 태스크 {task_id} 상태 업데이트: {status}")
        else:
            print(f"태스크를 찾을 수 없습니다: {task_id}")
            sys.exit(1)
        return

    # 최종 결정
    if args.decision:
        try:
            parts = args.decision.split(":")
            val_id, decision = parts[0], parts[1]
        except (ValueError, IndexError):
            print("형식 오류: --decision VAL-ID:GO|PIVOT|NO_GO")
            sys.exit(1)

        sprint = load_sprint(val_id)
        if not sprint:
            print(f"스프린트를 찾을 수 없습니다: {val_id}")
            sys.exit(1)

        try:
            sprint_decision = SprintDecision(decision.upper())
        except ValueError:
            print(f"잘못된 결정: {decision}")
            print("가능한 결정: GO, PIVOT, NO_GO")
            sys.exit(1)

        # 간단한 결정 기록 (상세 내용은 수동 입력 필요)
        make_decision(
            sprint,
            sprint_decision,
            findings=["결정 기록됨 - 상세 내용 추가 필요"],
            next_actions=["후속 액션 정의 필요"],
            success_rate=70.0 if sprint_decision == SprintDecision.GO else 50.0
        )
        save_sprint(sprint, args.dry_run)
        print(f"✅ 스프린트 {val_id} 결정: {decision}")
        return

    # 새 스프린트 생성
    if args.new or args.brief_id:
        if not args.title and not args.brief_id:
            print("--title 또는 --brief-id가 필요합니다.")
            sys.exit(1)

        title = args.title or f"Brief {args.brief_id} 검증"
        method = ValidationMethod(args.method)

        print(f"🚀 새 스프린트 생성 중...")
        sprint = create_sprint(
            title=title,
            brief_id=args.brief_id,
            method=method
        )

        file_path = save_sprint(sprint, args.dry_run)

        if args.json:
            print(format_sprint_json(sprint))
        else:
            print(format_sprint_summary(sprint))
            print("")
            if not args.dry_run:
                print(f"💾 저장됨: {file_path}")
            print("")
            print("💡 체크리스트 보기: /ax:sprint --checklist " + sprint.validation_id)
            print("💡 상태 업데이트: /ax:sprint --update " + sprint.validation_id + ":D1-1:completed")
        return

    # 도움말
    parser.print_help()


if __name__ == "__main__":
    main()
