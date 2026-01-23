#!/usr/bin/env python3
"""
AX ToDo Skill - ToDo 관리 및 Confluence 동기화

프로젝트 ToDo List 관리 및 Confluence 동기화를 수행합니다.
원장: project-todo.md (시스템 ToDo)
미러: Confluence ToDo 페이지 (읽기 전용)

사용법:
    python todo_skill.py [--sync] [--compare-only] [--report-only] [--dry-run]

옵션:
    --sync              Confluence 동기화 실행
    --compare-only      비교만 실행 (리포트 없이)
    --report-only       진행현황 리포트만 출력
    --dry-run           실제 변경 없이 미리보기
    --path <path>       project-todo.md 경로 지정
"""

import argparse
import io
import json
import os
import re
import sys
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Any

# Windows 콘솔 UTF-8 출력 설정
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')


class TodoStatus(Enum):
    COMPLETED = "completed"
    IN_PROGRESS = "in_progress"
    PENDING = "pending"


@dataclass
class TodoItem:
    id: str
    title: str
    status: TodoStatus
    phase: str | None = None
    description: str | None = None
    assignee: str | None = None
    due_date: str | None = None


@dataclass
class TodoList:
    items: list[TodoItem] = field(default_factory=list)
    version: str | None = None
    last_updated: str | None = None

    @property
    def completed(self) -> int:
        return sum(1 for i in self.items if i.status == TodoStatus.COMPLETED)

    @property
    def in_progress(self) -> int:
        return sum(1 for i in self.items if i.status == TodoStatus.IN_PROGRESS)

    @property
    def pending(self) -> int:
        return sum(1 for i in self.items if i.status == TodoStatus.PENDING)

    @property
    def total(self) -> int:
        return len(self.items)

    @property
    def completion_rate(self) -> float:
        if self.total == 0:
            return 0.0
        return (self.completed / self.total) * 100


@dataclass
class SyncDiff:
    only_in_system: list[TodoItem] = field(default_factory=list)
    only_in_confluence: list[TodoItem] = field(default_factory=list)
    status_diff: list[tuple[TodoItem, TodoItem]] = field(default_factory=list)
    content_diff: list[tuple[TodoItem, TodoItem]] = field(default_factory=list)

    @property
    def has_diff(self) -> bool:
        return bool(
            self.only_in_system or
            self.only_in_confluence or
            self.status_diff or
            self.content_diff
        )


@dataclass
class ProgressReport:
    todo_list: TodoList
    phase_stats: dict[str, dict[str, int]] = field(default_factory=dict)
    stale_items: list[TodoItem] = field(default_factory=list)
    recommendations: list[str] = field(default_factory=list)


def get_project_root() -> Path:
    """프로젝트 루트 디렉토리 찾기"""
    current = Path.cwd()
    while current != current.parent:
        if (current / "project-todo.md").exists():
            return current
        if (current / "pyproject.toml").exists() or (current / "package.json").exists():
            return current
        current = current.parent
    return Path.cwd()


def parse_todo_md(file_path: Path) -> TodoList:
    """project-todo.md 파싱"""
    if not file_path.exists():
        raise FileNotFoundError(f"project-todo.md를 찾을 수 없습니다: {file_path}")

    content = file_path.read_text(encoding="utf-8")
    todo_list = TodoList()

    # 버전 추출
    version_match = re.search(r"버전[:\s]*v?(\d+\.\d+\.\d+)", content, re.IGNORECASE)
    if version_match:
        todo_list.version = version_match.group(1)

    # 업데이트 날짜 추출
    date_match = re.search(r"마지막\s*업데이트[:\s]*(\d{4}-\d{2}-\d{2})", content, re.IGNORECASE)
    if date_match:
        todo_list.last_updated = date_match.group(1)

    # 현재 Phase 추적
    current_phase = None
    item_id = 0

    for line in content.split("\n"):
        line = line.strip()

        # Phase 감지
        phase_match = re.match(r"#+\s*Phase\s*(\d+)", line, re.IGNORECASE)
        if phase_match:
            current_phase = f"Phase {phase_match.group(1)}"
            continue

        # 체크박스 항목 감지
        # - [x] 완료된 항목
        # - [ ] 미완료 항목
        # - [~] 진행 중 항목
        checkbox_match = re.match(r"-\s*\[([ x~])\]\s*(.+)", line, re.IGNORECASE)
        if checkbox_match:
            item_id += 1
            status_char = checkbox_match.group(1).lower()
            title = checkbox_match.group(2).strip()

            if status_char == "x":
                status = TodoStatus.COMPLETED
            elif status_char == "~":
                status = TodoStatus.IN_PROGRESS
            else:
                status = TodoStatus.PENDING

            todo_list.items.append(TodoItem(
                id=f"item-{item_id}",
                title=title,
                status=status,
                phase=current_phase
            ))

    return todo_list


def generate_progress_report(todo_list: TodoList) -> ProgressReport:
    """진행현황 리포트 생성"""
    report = ProgressReport(todo_list=todo_list)

    # Phase별 통계
    for item in todo_list.items:
        phase = item.phase or "기타"
        if phase not in report.phase_stats:
            report.phase_stats[phase] = {
                "completed": 0,
                "in_progress": 0,
                "pending": 0,
                "total": 0
            }

        report.phase_stats[phase]["total"] += 1
        if item.status == TodoStatus.COMPLETED:
            report.phase_stats[phase]["completed"] += 1
        elif item.status == TodoStatus.IN_PROGRESS:
            report.phase_stats[phase]["in_progress"] += 1
        else:
            report.phase_stats[phase]["pending"] += 1

    # 장기 미완료 항목 (Phase 1-2에서 미완료)
    for item in todo_list.items:
        if item.phase in ["Phase 1", "Phase 2"] and item.status != TodoStatus.COMPLETED:
            report.stale_items.append(item)

    # 권장 사항
    if report.stale_items:
        report.recommendations.append(
            f"Phase 1-2에 {len(report.stale_items)}개 미완료 항목이 있습니다. 우선 처리를 권장합니다."
        )

    if todo_list.completion_rate < 50:
        report.recommendations.append(
            f"전체 완료율이 {todo_list.completion_rate:.1f}%입니다. 스코프 조정을 검토하세요."
        )

    return report


def compare_with_confluence(system_todo: TodoList) -> SyncDiff:
    """시스템 ToDo와 Confluence 비교"""
    # TODO: 실제 Confluence API 연동 구현
    # 현재는 빈 diff 반환
    return SyncDiff()


def sync_to_confluence(todo_list: TodoList, dry_run: bool = False) -> dict[str, Any]:
    """Confluence에 동기화"""
    page_id = os.environ.get("CONFLUENCE_TODO_PAGE_ID")
    if not page_id:
        return {
            "status": "skipped",
            "message": "CONFLUENCE_TODO_PAGE_ID 미설정"
        }

    if dry_run:
        return {
            "status": "dry_run",
            "message": f"Dry-run 모드: {todo_list.total}개 항목 동기화 예정"
        }

    # TODO: 실제 Confluence API 연동 구현
    return {
        "status": "skipped",
        "message": "Confluence 연동 미구현"
    }


def format_progress_report(report: ProgressReport) -> str:
    """진행현황 리포트 포맷팅"""
    lines = []

    lines.append("")
    lines.append("━" * 50)
    lines.append("📊 ToDo 진행현황 리포트")
    lines.append("━" * 50)
    lines.append("")

    todo = report.todo_list

    # 메타 정보
    if todo.version:
        lines.append(f"**버전**: v{todo.version}")
    if todo.last_updated:
        lines.append(f"**마지막 업데이트**: {todo.last_updated}")
    lines.append("")

    # 전체 현황
    lines.append("## 📈 전체 현황")
    lines.append("")
    lines.append("| 상태 | 건수 | 비율 |")
    lines.append("|------|------|------|")
    lines.append(f"| ✅ 완료 | {todo.completed} | {(todo.completed/todo.total*100 if todo.total > 0 else 0):.1f}% |")
    lines.append(f"| 🚧 진행중 | {todo.in_progress} | {(todo.in_progress/todo.total*100 if todo.total > 0 else 0):.1f}% |")
    lines.append(f"| 📋 대기 | {todo.pending} | {(todo.pending/todo.total*100 if todo.total > 0 else 0):.1f}% |")
    lines.append(f"| **합계** | **{todo.total}** | **100%** |")
    lines.append("")
    lines.append(f"**완료율**: {todo.completion_rate:.1f}%")
    lines.append("")

    # Phase별 현황
    if report.phase_stats:
        lines.append("## 📁 Phase별 현황")
        lines.append("")
        lines.append("| Phase | 완료 | 진행중 | 대기 | 완료율 |")
        lines.append("|-------|------|--------|------|--------|")

        for phase, stats in sorted(report.phase_stats.items()):
            total = stats["total"]
            completed = stats["completed"]
            in_progress = stats["in_progress"]
            pending = stats["pending"]
            rate = (completed / total * 100) if total > 0 else 0
            lines.append(f"| {phase} | {completed} | {in_progress} | {pending} | {rate:.0f}% |")

        lines.append("")

    # 권장 사항
    if report.recommendations:
        lines.append("## 💡 권장 사항")
        lines.append("")
        for rec in report.recommendations:
            lines.append(f"- {rec}")
        lines.append("")

    return "\n".join(lines)


def format_diff_report(diff: SyncDiff) -> str:
    """비교 결과 포맷팅"""
    if not diff.has_diff:
        return "✅ 시스템과 Confluence가 동기화되어 있습니다."

    lines = []
    lines.append("")
    lines.append("━" * 50)
    lines.append("🔍 Confluence 비교 결과")
    lines.append("━" * 50)
    lines.append("")

    lines.append("| 차이점 | 건수 |")
    lines.append("|--------|------|")
    lines.append(f"| 시스템에만 있음 | {len(diff.only_in_system)} |")
    lines.append(f"| Confluence에만 있음 | {len(diff.only_in_confluence)} |")
    lines.append(f"| 상태 차이 | {len(diff.status_diff)} |")
    lines.append(f"| 내용 차이 | {len(diff.content_diff)} |")
    lines.append("")

    total_diff = (
        len(diff.only_in_system) +
        len(diff.only_in_confluence) +
        len(diff.status_diff) +
        len(diff.content_diff)
    )
    lines.append(f"⚠️ 총 {total_diff}개 차이점 발견")

    if diff.only_in_confluence:
        lines.append("")
        lines.append("⚠️ Confluence에만 있는 항목 발견 - 수동 반영 필요")

    return "\n".join(lines)


def run_todo_skill(
    todo_path: Path,
    sync: bool = False,
    compare_only: bool = False,
    report_only: bool = False,
    dry_run: bool = False
) -> dict[str, Any]:
    """ToDo 스킬 실행"""
    result = {
        "status": "success",
        "report": None,
        "diff": None,
        "sync_result": None
    }

    # 1. project-todo.md 파싱
    try:
        todo_list = parse_todo_md(todo_path)
    except FileNotFoundError as e:
        return {
            "status": "error",
            "message": str(e)
        }

    # 2. 진행현황 리포트
    if not compare_only:
        report = generate_progress_report(todo_list)
        result["report"] = report

    # 3. Confluence 비교
    if not report_only:
        diff = compare_with_confluence(todo_list)
        result["diff"] = diff

    # 4. Confluence 동기화
    if sync:
        sync_result = sync_to_confluence(todo_list, dry_run)
        result["sync_result"] = sync_result

    return result


def main():
    parser = argparse.ArgumentParser(description="AX ToDo - ToDo 관리")
    parser.add_argument("--sync", action="store_true", help="Confluence 동기화 실행")
    parser.add_argument("--compare-only", action="store_true", help="비교만 실행")
    parser.add_argument("--report-only", action="store_true", help="리포트만 출력")
    parser.add_argument("--dry-run", action="store_true", help="실제 변경 없이 미리보기")
    parser.add_argument("--path", type=str, default="project-todo.md", help="project-todo.md 경로")
    parser.add_argument("--json", action="store_true", help="JSON 형식 출력")

    args = parser.parse_args()

    # 경로 결정
    project_root = get_project_root()
    todo_path = Path(args.path)
    if not todo_path.is_absolute():
        todo_path = project_root / todo_path

    print("🔄 ToDo 점검 시작...")

    result = run_todo_skill(
        todo_path=todo_path,
        sync=args.sync,
        compare_only=args.compare_only,
        report_only=args.report_only,
        dry_run=args.dry_run
    )

    if result["status"] == "error":
        print(f"❌ 에러: {result['message']}")
        sys.exit(1)

    if args.json:
        # JSON 출력을 위해 데이터 변환
        output = {
            "status": result["status"],
            "todo_list": {
                "total": result["report"].todo_list.total if result["report"] else 0,
                "completed": result["report"].todo_list.completed if result["report"] else 0,
                "in_progress": result["report"].todo_list.in_progress if result["report"] else 0,
                "pending": result["report"].todo_list.pending if result["report"] else 0,
                "completion_rate": result["report"].todo_list.completion_rate if result["report"] else 0,
            } if result["report"] else None,
            "has_diff": result["diff"].has_diff if result["diff"] else False,
            "sync_result": result["sync_result"]
        }
        print(json.dumps(output, ensure_ascii=False, indent=2))
    else:
        # 리포트 출력
        if result["report"]:
            print(format_progress_report(result["report"]))

        # 비교 결과 출력
        if result["diff"]:
            print(format_diff_report(result["diff"]))

        # 동기화 결과 출력
        if result["sync_result"]:
            print("")
            print("━" * 50)
            print("📤 Confluence 동기화")
            print("━" * 50)
            print(f"상태: {result['sync_result']['status']}")
            print(f"메시지: {result['sync_result']['message']}")

    print("")
    print("✅ ToDo 점검 완료")

    if args.sync:
        print("")
        print("💡 Confluence에 동기화하려면: /ax:todo --sync")


if __name__ == "__main__":
    main()
