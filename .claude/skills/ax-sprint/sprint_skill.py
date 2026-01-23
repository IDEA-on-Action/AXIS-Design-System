#!/usr/bin/env python3
"""
AX Sprint Skill - 프로젝트 ToDo 기반 스프린트 플랜 수립

현재 프로젝트의 project-todo.md를 기반으로 5-Day Sprint를 설계하고 운영합니다.

사용법:
    python sprint_skill.py --new --title "스프린트명"
    python sprint_skill.py --from-todo                    # ToDo 기반 자동 생성
    python sprint_skill.py --list
    python sprint_skill.py --status VAL-2025-001

옵션:
    --from-todo         project-todo.md 기반 스프린트 생성
    --new               새 스프린트 생성
    --title             스프린트 제목
    --days              스프린트 기간 (기본: 5일)
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
import re
import sys
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from pathlib import Path
from typing import Any

# Windows 콘솔 UTF-8 출력 설정
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')


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


class TaskPriority(Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


@dataclass
class TodoItem:
    """project-todo.md에서 파싱된 항목"""
    id: str
    title: str
    status: TaskStatus
    phase: str | None = None
    category: str | None = None
    priority: TaskPriority = TaskPriority.MEDIUM


@dataclass
class SprintTask:
    id: str
    day: int
    title: str
    description: str
    status: TaskStatus = TaskStatus.PENDING
    priority: TaskPriority = TaskPriority.MEDIUM
    source_todo_id: str | None = None  # 원본 ToDo 항목 ID
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
class ProjectSprint:
    sprint_id: str
    title: str
    source_todo_path: str | None = None  # 원본 ToDo 파일 경로
    decision: SprintDecision = SprintDecision.PENDING
    days: list[SprintDay] = field(default_factory=list)
    findings: list[str] = field(default_factory=list)
    next_actions: list[str] = field(default_factory=list)
    created_at: str = ""
    started_at: str | None = None
    completed_at: str | None = None
    success_criteria: list[str] = field(default_factory=list)
    success_rate: float = 0.0
    todo_version: str | None = None  # ToDo 버전 정보

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
        return len(self.days)


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


def find_todo_file() -> Path | None:
    """project-todo.md 파일 찾기"""
    project_root = get_project_root()

    # 가능한 경로들
    candidates = [
        project_root / "project-todo.md",
        project_root / "PROJECT-TODO.md",
        project_root / "docs" / "project-todo.md",
        project_root / "TODO.md",
    ]

    for path in candidates:
        if path.exists():
            return path

    return None


def parse_todo_file(file_path: Path) -> tuple[list[TodoItem], str | None, str | None]:
    """
    project-todo.md 파싱

    Returns:
        (todo_items, version, last_updated)
    """
    content = file_path.read_text(encoding="utf-8")
    items: list[TodoItem] = []
    version: str | None = None
    last_updated: str | None = None

    # 버전 추출
    version_match = re.search(r"\*\*현재 버전\*\*:\s*(\d+\.\d+\.\d+)", content)
    if version_match:
        version = version_match.group(1)

    # 업데이트 날짜 추출
    date_match = re.search(r"\*\*마지막 업데이트\*\*:\s*(\d{4}-\d{2}-\d{2})", content)
    if date_match:
        last_updated = date_match.group(1)

    # 현재 Phase/섹션 추적
    current_phase = None
    current_category = None
    item_id = 0

    for line in content.split("\n"):
        line_stripped = line.strip()

        # Phase 감지
        phase_match = re.match(r"#+\s*Phase\s*(\d+\.?\d*)", line_stripped, re.IGNORECASE)
        if phase_match:
            current_phase = f"Phase {phase_match.group(1)}"
            continue

        # 카테고리 감지 (### 또는 ####)
        category_match = re.match(r"#{3,4}\s+(?:\d+\.\s*)?(.+?)(?:\s*[📊🔧🚀🎬📚🎨✅])?$", line_stripped)
        if category_match:
            current_category = category_match.group(1).strip()
            continue

        # 체크박스 항목 감지
        # - [x] 완료, - [ ] 미완료, - [~] 진행 중
        checkbox_match = re.match(r"-\s*\[([ x~X])\]\s*(.+)", line_stripped)
        if checkbox_match:
            item_id += 1
            status_char = checkbox_match.group(1).lower()
            title = checkbox_match.group(2).strip()

            # ✅ 이모지로 완료 표시된 경우도 처리
            if "✅" in title:
                status = TaskStatus.COMPLETED
                title = title.replace("✅", "").strip()
            elif status_char == "x":
                status = TaskStatus.COMPLETED
            elif status_char == "~":
                status = TaskStatus.IN_PROGRESS
            else:
                status = TaskStatus.PENDING

            # 우선순위 판단 (키워드 기반)
            priority = TaskPriority.MEDIUM
            if any(kw in title.lower() for kw in ["critical", "urgent", "blocker", "핵심"]):
                priority = TaskPriority.HIGH
            elif any(kw in title.lower() for kw in ["nice to have", "optional", "이후 검토"]):
                priority = TaskPriority.LOW

            items.append(TodoItem(
                id=f"TODO-{item_id:03d}",
                title=title,
                status=status,
                phase=current_phase,
                category=current_category,
                priority=priority
            ))

    return items, version, last_updated


def generate_sprint_id() -> str:
    """Sprint ID 생성"""
    year = datetime.now().year
    sprints_dir = get_sprints_dir()
    existing = list(sprints_dir.glob(f"SPRINT-{year}-*.json"))
    next_num = len(existing) + 1
    return f"SPRINT-{year}-{next_num:03d}"


def create_sprint_from_todo(
    title: str,
    todo_items: list[TodoItem],
    todo_version: str | None,
    todo_path: str,
    num_days: int = 5
) -> ProjectSprint:
    """ToDo 항목 기반 스프린트 생성"""
    sprint_id = generate_sprint_id()

    # 미완료 항목만 필터링
    pending_items = [
        item for item in todo_items
        if item.status != TaskStatus.COMPLETED
    ]

    # 우선순위 및 Phase 순으로 정렬
    priority_order = {TaskPriority.HIGH: 0, TaskPriority.MEDIUM: 1, TaskPriority.LOW: 2}
    pending_items.sort(key=lambda x: (priority_order.get(x.priority, 1), x.phase or "ZZZ"))

    # Day별로 태스크 분배
    days: list[SprintDay] = []
    items_per_day = max(1, len(pending_items) // num_days) if pending_items else 2

    day_titles = [
        ("계획 & 분석", "스프린트 범위 확정 및 작업 분석"),
        ("설계 & 준비", "구현 설계 및 환경 준비"),
        ("구현 (1)", "핵심 기능 구현"),
        ("구현 (2)", "추가 기능 및 연동"),
        ("검증 & 정리", "테스트, 문서화, 완료 처리"),
    ]

    # num_days에 맞게 조정
    while len(day_titles) < num_days:
        day_titles.append((f"추가 작업 ({len(day_titles) + 1})", "추가 구현 및 개선"))

    for day_num in range(1, num_days + 1):
        day_title, day_focus = day_titles[day_num - 1] if day_num <= len(day_titles) else (f"Day {day_num}", "작업 진행")

        # 해당 Day의 태스크
        start_idx = (day_num - 1) * items_per_day
        end_idx = start_idx + items_per_day if day_num < num_days else len(pending_items)
        day_items = pending_items[start_idx:end_idx] if start_idx < len(pending_items) else []

        tasks = []
        for idx, item in enumerate(day_items, 1):
            tasks.append(SprintTask(
                id=f"D{day_num}-{idx}",
                day=day_num,
                title=item.title,
                description=f"[{item.phase or 'General'}] {item.category or ''}".strip(),
                status=TaskStatus.PENDING,
                priority=item.priority,
                source_todo_id=item.id
            ))

        # 태스크가 없으면 기본 태스크 추가
        if not tasks:
            if day_num == 1:
                tasks = [
                    SprintTask(f"D{day_num}-1", day_num, "스프린트 목표 확인", "범위 및 목표 재확인"),
                    SprintTask(f"D{day_num}-2", day_num, "작업 우선순위 정리", "태스크 우선순위 결정"),
                ]
            elif day_num == num_days:
                tasks = [
                    SprintTask(f"D{day_num}-1", day_num, "완료 항목 검증", "구현 결과 테스트"),
                    SprintTask(f"D{day_num}-2", day_num, "문서 업데이트", "project-todo.md 갱신"),
                    SprintTask(f"D{day_num}-3", day_num, "스프린트 회고", "학습점 및 개선점 정리"),
                ]
            else:
                tasks = [
                    SprintTask(f"D{day_num}-1", day_num, f"Day {day_num} 작업", "작업 진행"),
                ]

        days.append(SprintDay(
            day=day_num,
            title=day_title,
            focus=day_focus,
            tasks=tasks
        ))

    # 성공 기준 자동 생성
    total_pending = len(pending_items)
    success_criteria = [
        f"스프린트 태스크 80% 이상 완료 ({int(total_pending * 0.8)}개 이상)",
        "모든 완료 항목 테스트 통과",
        "project-todo.md 업데이트 완료",
    ]

    return ProjectSprint(
        sprint_id=sprint_id,
        title=title,
        source_todo_path=todo_path,
        days=days,
        success_criteria=success_criteria,
        todo_version=todo_version
    )


def create_empty_sprint(title: str, num_days: int = 5) -> ProjectSprint:
    """빈 스프린트 생성 (ToDo 없이)"""
    sprint_id = generate_sprint_id()

    day_titles = [
        ("계획 & 분석", "스프린트 범위 확정 및 작업 분석"),
        ("설계 & 준비", "구현 설계 및 환경 준비"),
        ("구현 (1)", "핵심 기능 구현"),
        ("구현 (2)", "추가 기능 및 연동"),
        ("검증 & 정리", "테스트, 문서화, 완료 처리"),
    ]

    days = []
    for day_num in range(1, num_days + 1):
        day_title, day_focus = day_titles[day_num - 1] if day_num <= len(day_titles) else (f"Day {day_num}", "작업 진행")

        days.append(SprintDay(
            day=day_num,
            title=day_title,
            focus=day_focus,
            tasks=[
                SprintTask(f"D{day_num}-1", day_num, f"Day {day_num} 작업 정의", "작업 항목 추가 필요"),
            ]
        ))

    return ProjectSprint(
        sprint_id=sprint_id,
        title=title,
        days=days,
        success_criteria=[
            "스프린트 목표 달성",
            "모든 완료 항목 테스트 통과",
        ]
    )


def save_sprint(sprint: ProjectSprint, dry_run: bool = False) -> str:
    """스프린트 저장"""
    if dry_run:
        return f"[Dry-run] {sprint.sprint_id} 저장 예정"

    sprints_dir = get_sprints_dir()
    file_path = sprints_dir / f"{sprint.sprint_id}.json"

    data = sprint_to_dict(sprint)

    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    return str(file_path)


def sprint_to_dict(sprint: ProjectSprint) -> dict:
    """스프린트를 dict로 변환"""
    return {
        "sprint_id": sprint.sprint_id,
        "title": sprint.title,
        "source_todo_path": sprint.source_todo_path,
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
                        "priority": t.priority.value,
                        "source_todo_id": t.source_todo_id,
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
        "next_actions": sprint.next_actions,
        "created_at": sprint.created_at,
        "started_at": sprint.started_at,
        "completed_at": sprint.completed_at,
        "success_criteria": sprint.success_criteria,
        "success_rate": sprint.success_rate,
        "todo_version": sprint.todo_version,
    }


def load_sprint(sprint_id: str) -> ProjectSprint | None:
    """스프린트 로드"""
    sprints_dir = get_sprints_dir()
    file_path = sprints_dir / f"{sprint_id}.json"

    if not file_path.exists():
        return None

    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    return dict_to_sprint(data)


def dict_to_sprint(data: dict) -> ProjectSprint:
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
                priority=TaskPriority(t.get("priority", "medium")),
                source_todo_id=t.get("source_todo_id"),
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

    return ProjectSprint(
        sprint_id=data["sprint_id"],
        title=data["title"],
        source_todo_path=data.get("source_todo_path"),
        decision=SprintDecision(data.get("decision", "PENDING")),
        days=days,
        findings=data.get("findings", []),
        next_actions=data.get("next_actions", []),
        created_at=data.get("created_at", ""),
        started_at=data.get("started_at"),
        completed_at=data.get("completed_at"),
        success_criteria=data.get("success_criteria", []),
        success_rate=data.get("success_rate", 0.0),
        todo_version=data.get("todo_version"),
    )


def list_sprints() -> list[ProjectSprint]:
    """모든 스프린트 목록"""
    sprints_dir = get_sprints_dir()
    sprints = []

    for file_path in sprints_dir.glob("SPRINT-*.json"):
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                sprints.append(dict_to_sprint(data))
        except Exception:
            continue

    return sorted(sprints, key=lambda s: s.created_at, reverse=True)


def update_task_status(
    sprint: ProjectSprint,
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
    sprint: ProjectSprint,
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
    sprint.completed_at = datetime.now().isoformat()


def format_sprint_summary(sprint: ProjectSprint) -> str:
    """스프린트 요약 포맷팅"""
    lines = []

    lines.append("")
    lines.append("━" * 60)
    lines.append(f"📋 {sprint.title}")
    lines.append("━" * 60)
    lines.append("")

    # 기본 정보
    lines.append(f"**ID**: {sprint.sprint_id}")
    if sprint.source_todo_path:
        lines.append(f"**원본 ToDo**: {sprint.source_todo_path}")
    if sprint.todo_version:
        lines.append(f"**ToDo 버전**: v{sprint.todo_version}")
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

            priority_badge = "🔴" if task.priority == TaskPriority.HIGH else "🟡" if task.priority == TaskPriority.MEDIUM else "🟢"
            assignee = f" (@{task.assignee})" if task.assignee else ""
            lines.append(f"- [{icon}] {priority_badge} **{task.id}** {task.title}{assignee}")

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


def format_todo_status(todo_path: Path | None, items: list[TodoItem], version: str | None) -> str:
    """ToDo 상태 포맷팅"""
    lines = []

    lines.append("")
    lines.append("━" * 60)
    lines.append("📋 project-todo.md 분석 결과")
    lines.append("━" * 60)
    lines.append("")

    if not todo_path:
        lines.append("❌ project-todo.md 파일을 찾을 수 없습니다.")
        lines.append("")
        lines.append("다음 위치에 파일을 생성해 주세요:")
        lines.append("- project-todo.md")
        lines.append("- docs/project-todo.md")
        return "\n".join(lines)

    lines.append(f"**파일**: {todo_path}")
    if version:
        lines.append(f"**버전**: v{version}")
    lines.append("")

    # 통계
    total = len(items)
    completed = sum(1 for i in items if i.status == TaskStatus.COMPLETED)
    in_progress = sum(1 for i in items if i.status == TaskStatus.IN_PROGRESS)
    pending = sum(1 for i in items if i.status == TaskStatus.PENDING)

    lines.append("## 현황")
    lines.append(f"- 전체: {total}개")
    lines.append(f"- ✅ 완료: {completed}개 ({completed/total*100:.0f}%)" if total > 0 else "- ✅ 완료: 0개")
    lines.append(f"- 🔄 진행중: {in_progress}개")
    lines.append(f"- ⬜ 대기: {pending}개")
    lines.append("")

    # 미완료 항목 (스프린트 대상)
    pending_items = [i for i in items if i.status != TaskStatus.COMPLETED]
    if pending_items:
        lines.append("## 스프린트 대상 항목 (미완료)")
        lines.append("")

        # Phase별 그룹핑
        by_phase: dict[str, list[TodoItem]] = {}
        for item in pending_items:
            phase = item.phase or "기타"
            if phase not in by_phase:
                by_phase[phase] = []
            by_phase[phase].append(item)

        for phase, phase_items in by_phase.items():
            lines.append(f"### {phase} ({len(phase_items)}개)")
            for item in phase_items[:5]:  # 최대 5개만 표시
                status_icon = "🔄" if item.status == TaskStatus.IN_PROGRESS else "⬜"
                lines.append(f"- [{status_icon}] {item.title[:50]}...")
            if len(phase_items) > 5:
                lines.append(f"  ... 외 {len(phase_items) - 5}개")
            lines.append("")

    return "\n".join(lines)


def format_sprint_json(sprint: ProjectSprint) -> str:
    """스프린트 JSON 출력"""
    data = sprint_to_dict(sprint)
    return json.dumps(data, ensure_ascii=False, indent=2)


def main():
    parser = argparse.ArgumentParser(description="AX Sprint - 프로젝트 ToDo 기반 스프린트 플랜")
    parser.add_argument("--from-todo", action="store_true", help="project-todo.md 기반 스프린트 생성")
    parser.add_argument("--check-todo", action="store_true", help="project-todo.md 확인만")
    parser.add_argument("--new", action="store_true", help="새 스프린트 생성")
    parser.add_argument("--title", type=str, help="스프린트 제목")
    parser.add_argument("--days", type=int, default=5, help="스프린트 기간 (기본: 5일)")
    parser.add_argument("--list", action="store_true", help="스프린트 목록")
    parser.add_argument("--status", type=str, help="스프린트 상태 확인 (Sprint ID)")
    parser.add_argument("--update", type=str, help="태스크 업데이트 (형식: SPRINT-ID:TASK-ID:STATUS)")
    parser.add_argument("--decision", type=str, help="최종 결정 (형식: SPRINT-ID:GO|PIVOT|NO_GO)")
    parser.add_argument("--dry-run", action="store_true", help="실제 저장 없이 미리보기")
    parser.add_argument("--json", action="store_true", help="JSON 형식 출력")

    args = parser.parse_args()

    # ToDo 파일 확인
    if args.check_todo:
        todo_path = find_todo_file()
        if todo_path:
            items, version, _ = parse_todo_file(todo_path)
            print(format_todo_status(todo_path, items, version))
        else:
            print(format_todo_status(None, [], None))
        return

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
        print("| ID | 제목 | 상태 | 진행률 | 생성일 |")
        print("|-----|------|------|--------|--------|")
        for s in sprints:
            print(f"| {s.sprint_id} | {s.title[:20]} | {s.decision.value} | {s.completion_rate:.0f}% | {s.created_at[:10]} |")
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

    # 태스크 업데이트
    if args.update:
        try:
            parts = args.update.split(":")
            sprint_id, task_id, status = parts[0], parts[1], parts[2]
        except (ValueError, IndexError):
            print("형식 오류: --update SPRINT-ID:TASK-ID:STATUS")
            print("예: --update SPRINT-2026-001:D1-1:completed")
            sys.exit(1)

        sprint = load_sprint(sprint_id)
        if not sprint:
            print(f"스프린트를 찾을 수 없습니다: {sprint_id}")
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
            sprint_id, decision = parts[0], parts[1]
        except (ValueError, IndexError):
            print("형식 오류: --decision SPRINT-ID:GO|PIVOT|NO_GO")
            sys.exit(1)

        sprint = load_sprint(sprint_id)
        if not sprint:
            print(f"스프린트를 찾을 수 없습니다: {sprint_id}")
            sys.exit(1)

        try:
            sprint_decision = SprintDecision(decision.upper())
        except ValueError:
            print(f"잘못된 결정: {decision}")
            print("가능한 결정: GO, PIVOT, NO_GO")
            sys.exit(1)

        make_decision(
            sprint,
            sprint_decision,
            findings=["결정 기록됨 - 상세 내용 추가 필요"],
            next_actions=["후속 액션 정의 필요"],
            success_rate=sprint.completion_rate
        )
        save_sprint(sprint, args.dry_run)
        print(f"✅ 스프린트 {sprint_id} 결정: {decision}")
        return

    # ToDo 기반 스프린트 생성
    if args.from_todo:
        todo_path = find_todo_file()
        if not todo_path:
            print("❌ project-todo.md 파일을 찾을 수 없습니다.")
            print("")
            print("다음 위치에 파일을 생성해 주세요:")
            print("- project-todo.md")
            print("- docs/project-todo.md")
            sys.exit(1)

        items, version, _ = parse_todo_file(todo_path)
        pending_count = sum(1 for i in items if i.status != TaskStatus.COMPLETED)

        if pending_count == 0:
            print("✅ 모든 ToDo 항목이 완료되었습니다!")
            print("새 작업을 project-todo.md에 추가한 후 다시 시도하세요.")
            return

        title = args.title or f"Sprint - v{version}" if version else "Sprint"

        print(f"🚀 ToDo 기반 스프린트 생성 중...")
        print(f"   원본: {todo_path}")
        print(f"   미완료 항목: {pending_count}개")
        print("")

        sprint = create_sprint_from_todo(
            title=title,
            todo_items=items,
            todo_version=version,
            todo_path=str(todo_path),
            num_days=args.days
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
            print("💡 상태 업데이트: /ax:sprint --update " + sprint.sprint_id + ":D1-1:completed")
            print("💡 완료 처리: /ax:sprint --decision " + sprint.sprint_id + ":GO")
        return

    # 새 스프린트 생성 (빈 템플릿)
    if args.new:
        if not args.title:
            print("--title이 필요합니다.")
            sys.exit(1)

        # ToDo 파일 확인
        todo_path = find_todo_file()
        if todo_path:
            print("💡 project-todo.md가 있습니다. --from-todo 옵션 사용을 권장합니다.")
            print("")

        print(f"🚀 새 스프린트 생성 중...")
        sprint = create_empty_sprint(title=args.title, num_days=args.days)

        file_path = save_sprint(sprint, args.dry_run)

        if args.json:
            print(format_sprint_json(sprint))
        else:
            print(format_sprint_summary(sprint))
            print("")
            if not args.dry_run:
                print(f"💾 저장됨: {file_path}")
        return

    # 기본: ToDo 확인 후 안내
    todo_path = find_todo_file()
    if todo_path:
        items, version, _ = parse_todo_file(todo_path)
        print(format_todo_status(todo_path, items, version))
        print("")
        print("💡 스프린트 생성: /ax:sprint --from-todo")
        print("💡 커스텀 생성: /ax:sprint --new --title \"제목\"")
    else:
        print(format_todo_status(None, [], None))
        print("")
        print("💡 빈 스프린트 생성: /ax:sprint --new --title \"제목\"")


if __name__ == "__main__":
    main()
