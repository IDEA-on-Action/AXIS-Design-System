#!/usr/bin/env python3
"""
AX Wrap-up Skill - 작업 정리

SSDD 원칙에 따라 작업 내용을 정리하고, 테스트 검증 후 Git 커밋을 수행합니다.

사용법:
    python wrap_up.py [--skip-docs] [--skip-test] [--auto] [--dry-run] [--no-sync]

옵션:
    --skip-docs         문서 업데이트 건너뛰기
    --skip-test         테스트 건너뛰기 (비권장)
    --auto              모든 확인 자동 승인
    --dry-run           실제 커밋 없이 미리보기
    --no-sync           외부 동기화 건너뛰기
    --sync-confluence   Confluence만 동기화
    --sync-slack        Slack만 알림
"""

import argparse
import json
import os
import re
import subprocess
import sys
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Any


class WrapUpStatus(Enum):
    SUCCESS = "success"
    FAILED = "failed"
    SKIPPED = "skipped"


@dataclass
class StepResult:
    name: str
    status: WrapUpStatus
    message: str
    details: list[str] = field(default_factory=list)


@dataclass
class WrapUpReport:
    steps: list[StepResult] = field(default_factory=list)
    commit_hash: str | None = None
    commit_message: str | None = None
    changed_files: list[str] = field(default_factory=list)

    @property
    def is_successful(self) -> bool:
        return all(s.status != WrapUpStatus.FAILED for s in self.steps)


def run_command(cmd: list[str], cwd: Path | None = None, timeout: int = 60) -> tuple[int, str, str]:
    """명령 실행 및 결과 반환"""
    try:
        result = subprocess.run(
            cmd,
            cwd=cwd,
            capture_output=True,
            text=True,
            timeout=timeout,
            shell=sys.platform == "win32"
        )
        return result.returncode, result.stdout, result.stderr
    except subprocess.TimeoutExpired:
        return -1, "", "명령 실행 시간 초과"
    except FileNotFoundError:
        return -1, "", f"명령을 찾을 수 없음: {cmd[0]}"


def get_project_root() -> Path:
    """프로젝트 루트 디렉토리 찾기"""
    current = Path.cwd()
    while current != current.parent:
        if (current / "pyproject.toml").exists() or (current / "package.json").exists():
            return current
        current = current.parent
    return Path.cwd()


def collect_changes(project_root: Path) -> tuple[list[str], str]:
    """변경 사항 수집"""
    # git status
    code, stdout, _ = run_command(["git", "status", "--porcelain"], cwd=project_root)
    if code != 0:
        return [], ""

    files = []
    for line in stdout.strip().split("\n"):
        if line.strip():
            # status + filename
            status = line[:2]
            filename = line[3:].strip()
            files.append(f"{status} {filename}")

    # git diff --stat
    code, diff_stat, _ = run_command(["git", "diff", "--stat", "HEAD"], cwd=project_root)

    return files, diff_stat


def check_docs_update(project_root: Path, changed_files: list[str]) -> StepResult:
    """문서 업데이트 확인"""
    docs_to_check = ["changelog.md", "project-todo.md", "CLAUDE.md"]
    docs_found = []

    for doc in docs_to_check:
        if any(doc.lower() in f.lower() for f in changed_files):
            docs_found.append(doc)

    # backend/ 변경 시 changelog 체크
    has_backend_changes = any("backend/" in f for f in changed_files)
    changelog_updated = any("changelog" in f.lower() for f in changed_files)

    if has_backend_changes and not changelog_updated:
        return StepResult(
            name="문서 업데이트 확인",
            status=WrapUpStatus.FAILED,
            message="backend/ 변경 시 changelog.md 업데이트 필요",
            details=["변경된 파일에 backend/ 포함", "changelog.md 미업데이트"]
        )

    return StepResult(
        name="문서 업데이트 확인",
        status=WrapUpStatus.SUCCESS,
        message="문서 확인 완료",
        details=[f"확인됨: {', '.join(docs_found) if docs_found else '해당 없음'}"]
    )


def run_tests(project_root: Path) -> StepResult:
    """테스트 실행"""
    test_results = []
    has_failure = False

    # Python lint (ruff)
    backend_path = project_root / "backend"
    if backend_path.exists():
        code, stdout, stderr = run_command(
            ["ruff", "check", "backend/", "--output-format=concise"],
            cwd=project_root
        )
        if code == 0:
            test_results.append("[ruff] ✅ 통과")
        else:
            test_results.append(f"[ruff] ❌ 에러: {stdout[:200]}")
            has_failure = True

    # Python types (mypy)
    if backend_path.exists():
        code, stdout, stderr = run_command(
            ["mypy", "backend/", "--ignore-missing-imports", "--no-error-summary"],
            cwd=project_root,
            timeout=120
        )
        if code == 0:
            test_results.append("[mypy] ✅ 통과")
        else:
            error_count = len([l for l in stdout.split("\n") if "error:" in l])
            test_results.append(f"[mypy] ❌ 에러 {error_count}개")
            has_failure = True

    # TypeScript (pnpm)
    package_json = project_root / "package.json"
    if package_json.exists():
        # lint
        code, _, _ = run_command(["pnpm", "lint"], cwd=project_root, timeout=120)
        if code == 0:
            test_results.append("[eslint] ✅ 통과")
        else:
            test_results.append("[eslint] ❌ 에러")
            has_failure = True

    if has_failure:
        return StepResult(
            name="테스트 실행",
            status=WrapUpStatus.FAILED,
            message="테스트 실패",
            details=test_results
        )

    return StepResult(
        name="테스트 실행",
        status=WrapUpStatus.SUCCESS,
        message="모든 테스트 통과",
        details=test_results
    )


def generate_commit_message(changed_files: list[str], diff_stat: str) -> str:
    """커밋 메시지 자동 생성"""
    # 변경 유형 판단
    has_backend = any("backend/" in f for f in changed_files)
    has_frontend = any("app/" in f or "packages/" in f for f in changed_files)
    has_docs = any(any(doc in f.lower() for doc in [".md", "docs/"]) for f in changed_files)
    has_tests = any("test" in f.lower() for f in changed_files)
    has_config = any(any(cfg in f.lower() for cfg in ["config", ".json", ".yaml", ".toml"]) for f in changed_files)

    # 커밋 타입 결정
    if has_tests and not has_backend and not has_frontend:
        commit_type = "test"
        description = "테스트 추가/수정"
    elif has_docs and not has_backend and not has_frontend:
        commit_type = "docs"
        description = "문서 업데이트"
    elif has_config and not has_backend and not has_frontend:
        commit_type = "chore"
        description = "설정 변경"
    elif has_backend or has_frontend:
        # 새 파일 추가 vs 수정
        has_new = any(f.startswith("A ") or f.startswith("?? ") for f in changed_files)
        if has_new:
            commit_type = "feat"
            description = "기능 추가"
        else:
            commit_type = "fix"
            description = "버그 수정"
    else:
        commit_type = "chore"
        description = "기타 변경"

    # 변경 파일 요약
    file_count = len(changed_files)

    message = f"{commit_type}: {description}\n\n"
    message += f"변경 파일: {file_count}개\n"

    # 주요 파일 목록 (최대 5개)
    for f in changed_files[:5]:
        message += f"- {f}\n"
    if file_count > 5:
        message += f"... 외 {file_count - 5}개\n"

    message += "\nCo-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"

    return message


def create_commit(project_root: Path, message: str, dry_run: bool = False) -> StepResult:
    """Git 커밋 생성"""
    if dry_run:
        return StepResult(
            name="Git 커밋",
            status=WrapUpStatus.SKIPPED,
            message="Dry-run 모드: 커밋 생략",
            details=[f"커밋 메시지:\n{message}"]
        )

    # git add
    code, _, stderr = run_command(["git", "add", "-A"], cwd=project_root)
    if code != 0:
        return StepResult(
            name="Git 커밋",
            status=WrapUpStatus.FAILED,
            message="git add 실패",
            details=[stderr]
        )

    # git commit
    code, stdout, stderr = run_command(
        ["git", "commit", "-m", message],
        cwd=project_root
    )

    if code != 0:
        if "nothing to commit" in stdout or "nothing to commit" in stderr:
            return StepResult(
                name="Git 커밋",
                status=WrapUpStatus.SKIPPED,
                message="커밋할 변경 사항 없음"
            )
        return StepResult(
            name="Git 커밋",
            status=WrapUpStatus.FAILED,
            message="git commit 실패",
            details=[stderr]
        )

    # 커밋 해시 추출
    code, hash_out, _ = run_command(["git", "rev-parse", "--short", "HEAD"], cwd=project_root)
    commit_hash = hash_out.strip() if code == 0 else "unknown"

    return StepResult(
        name="Git 커밋",
        status=WrapUpStatus.SUCCESS,
        message=f"커밋 완료: {commit_hash}",
        details=[f"커밋 메시지:\n{message[:200]}..."]
    )


def sync_confluence(project_root: Path, commit_hash: str, commit_message: str) -> StepResult:
    """Confluence 동기화 (Action Log 업데이트)"""
    page_id = os.environ.get("CONFLUENCE_ACTION_LOG_PAGE_ID")
    if not page_id:
        return StepResult(
            name="Confluence 동기화",
            status=WrapUpStatus.SKIPPED,
            message="CONFLUENCE_ACTION_LOG_PAGE_ID 미설정"
        )

    # TODO: 실제 Confluence API 호출 구현
    # 현재는 placeholder
    return StepResult(
        name="Confluence 동기화",
        status=WrapUpStatus.SKIPPED,
        message="Confluence 연동 미구현",
        details=["TODO: ConfluenceMCP 연동 필요"]
    )


def sync_slack(commit_hash: str, commit_message: str, test_result: str) -> StepResult:
    """Slack 알림 전송"""
    webhook_url = os.environ.get("SLACK_WEBHOOK_URL")
    if not webhook_url:
        return StepResult(
            name="Slack 알림",
            status=WrapUpStatus.SKIPPED,
            message="SLACK_WEBHOOK_URL 미설정"
        )

    # TODO: 실제 Slack webhook 호출 구현
    return StepResult(
        name="Slack 알림",
        status=WrapUpStatus.SKIPPED,
        message="Slack 연동 미구현",
        details=["TODO: SlackMCP 연동 필요"]
    )


def run_wrap_up(
    skip_docs: bool = False,
    skip_test: bool = False,
    auto: bool = False,
    dry_run: bool = False,
    no_sync: bool = False,
    sync_confluence_only: bool = False,
    sync_slack_only: bool = False
) -> WrapUpReport:
    """작업 정리 실행"""
    project_root = get_project_root()
    report = WrapUpReport()

    # 1. 변경 사항 수집
    changed_files, diff_stat = collect_changes(project_root)
    report.changed_files = changed_files

    if not changed_files:
        report.steps.append(StepResult(
            name="변경 사항 수집",
            status=WrapUpStatus.SKIPPED,
            message="변경 사항 없음"
        ))
        return report

    report.steps.append(StepResult(
        name="변경 사항 수집",
        status=WrapUpStatus.SUCCESS,
        message=f"{len(changed_files)}개 파일 변경",
        details=changed_files[:10]
    ))

    # 2. 문서 업데이트 확인
    if not skip_docs:
        doc_result = check_docs_update(project_root, changed_files)
        report.steps.append(doc_result)
        if doc_result.status == WrapUpStatus.FAILED and not auto:
            return report

    # 3. 테스트 실행
    if not skip_test:
        test_result = run_tests(project_root)
        report.steps.append(test_result)
        if test_result.status == WrapUpStatus.FAILED:
            return report

    # 4. 커밋 메시지 생성
    commit_message = generate_commit_message(changed_files, diff_stat)
    report.commit_message = commit_message

    # 5. Git 커밋
    commit_result = create_commit(project_root, commit_message, dry_run)
    report.steps.append(commit_result)

    if commit_result.status == WrapUpStatus.SUCCESS:
        # 커밋 해시 추출
        code, hash_out, _ = run_command(["git", "rev-parse", "--short", "HEAD"], cwd=project_root)
        report.commit_hash = hash_out.strip() if code == 0 else None

    # 6. 외부 동기화
    if not no_sync and commit_result.status == WrapUpStatus.SUCCESS:
        if not sync_slack_only:
            confluence_result = sync_confluence(
                project_root,
                report.commit_hash or "unknown",
                commit_message
            )
            report.steps.append(confluence_result)

        if not sync_confluence_only:
            test_status = "통과" if not skip_test else "건너뜀"
            slack_result = sync_slack(
                report.commit_hash or "unknown",
                commit_message,
                test_status
            )
            report.steps.append(slack_result)

    return report


def format_report(report: WrapUpReport) -> str:
    """리포트 포맷팅"""
    lines = []

    lines.append("")
    lines.append("━" * 50)
    lines.append("🔄 작업 정리 결과")
    lines.append("━" * 50)
    lines.append("")

    status_icons = {
        WrapUpStatus.SUCCESS: "✅",
        WrapUpStatus.FAILED: "❌",
        WrapUpStatus.SKIPPED: "⏭️",
    }

    for step in report.steps:
        icon = status_icons.get(step.status, "❓")
        lines.append(f"{icon} {step.name}: {step.message}")

        for detail in step.details[:5]:
            lines.append(f"   {detail}")

    lines.append("")
    lines.append("━" * 50)

    if report.is_successful:
        if report.commit_hash:
            lines.append(f"🎉 작업 정리 완료! 커밋: {report.commit_hash}")
        else:
            lines.append("🎉 작업 정리 완료!")
    else:
        lines.append("⚠️ 작업 정리 실패 - 위 에러 확인 필요")

    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="AX Wrap-up - 작업 정리")
    parser.add_argument("--skip-docs", action="store_true", help="문서 업데이트 건너뛰기")
    parser.add_argument("--skip-test", action="store_true", help="테스트 건너뛰기")
    parser.add_argument("--auto", action="store_true", help="모든 확인 자동 승인")
    parser.add_argument("--dry-run", action="store_true", help="실제 커밋 없이 미리보기")
    parser.add_argument("--no-sync", action="store_true", help="외부 동기화 건너뛰기")
    parser.add_argument("--sync-confluence", action="store_true", help="Confluence만 동기화")
    parser.add_argument("--sync-slack", action="store_true", help="Slack만 알림")

    args = parser.parse_args()

    print("🔄 작업 정리 시작...")

    report = run_wrap_up(
        skip_docs=args.skip_docs,
        skip_test=args.skip_test,
        auto=args.auto,
        dry_run=args.dry_run,
        no_sync=args.no_sync,
        sync_confluence_only=args.sync_confluence,
        sync_slack_only=args.sync_slack
    )

    print(format_report(report))

    sys.exit(0 if report.is_successful else 1)


if __name__ == "__main__":
    main()
