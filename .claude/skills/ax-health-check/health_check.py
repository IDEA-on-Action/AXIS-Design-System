#!/usr/bin/env python3
"""
AX Health Check Skill - 프로젝트 점검

프로젝트의 전반적인 상태를 점검합니다:
1. 의존성 확인 (Python ≥3.11, Node.js ≥20)
2. 타입 체크 (mypy, tsc)
3. 린트 검사 (ruff, eslint)
4. 빌드 테스트 (pip, pnpm)
5. 버전 동기화 (package.json ↔ pyproject.toml ↔ Git tag)

사용법:
    python health_check.py [--quick] [--full] [--fix] [--json]

옵션:
    --quick     빠른 점검 (타입/린트만)
    --full      전체 점검 (테스트 포함)
    --fix       자동 수정 가능한 항목 수정
    --json      JSON 형식으로 결과 출력
"""

import argparse
import io
import json
import re
import subprocess
import sys
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any

# Windows 콘솔 UTF-8 출력 설정
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')


class CheckStatus(Enum):
    PASS = "pass"
    WARN = "warn"
    FAIL = "fail"
    SKIP = "skip"


@dataclass
class CheckResult:
    name: str
    status: CheckStatus
    message: str
    details: list[str] = field(default_factory=list)
    suggestions: list[str] = field(default_factory=list)


@dataclass
class HealthCheckReport:
    checks: list[CheckResult] = field(default_factory=list)

    @property
    def passed(self) -> int:
        return sum(1 for c in self.checks if c.status == CheckStatus.PASS)

    @property
    def failed(self) -> int:
        return sum(1 for c in self.checks if c.status == CheckStatus.FAIL)

    @property
    def warnings(self) -> int:
        return sum(1 for c in self.checks if c.status == CheckStatus.WARN)

    @property
    def skipped(self) -> int:
        return sum(1 for c in self.checks if c.status == CheckStatus.SKIP)

    @property
    def total(self) -> int:
        return len(self.checks)

    @property
    def is_healthy(self) -> bool:
        return self.failed == 0


def run_command(cmd: list[str], cwd: Path | None = None, timeout: int = 60) -> tuple[int, str, str]:
    """명령 실행 및 결과 반환"""
    try:
        result = subprocess.run(
            cmd,
            cwd=cwd,
            capture_output=True,
            text=True,
            encoding='utf-8',
            errors='replace',
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


def check_python_version() -> CheckResult:
    """Python 버전 확인"""
    code, stdout, stderr = run_command(["python", "--version"])
    if code != 0:
        return CheckResult(
            name="Python 버전",
            status=CheckStatus.FAIL,
            message="Python을 찾을 수 없습니다",
            suggestions=["Python 3.11+ 설치"]
        )

    version_match = re.search(r"Python (\d+)\.(\d+)", stdout)
    if version_match:
        major, minor = int(version_match.group(1)), int(version_match.group(2))
        if major >= 3 and minor >= 11:
            return CheckResult(
                name="Python 버전",
                status=CheckStatus.PASS,
                message=f"Python {major}.{minor}"
            )
        else:
            return CheckResult(
                name="Python 버전",
                status=CheckStatus.WARN,
                message=f"Python {major}.{minor} (권장: 3.11+)",
                suggestions=["Python 3.11+ 업그레이드 권장"]
            )

    return CheckResult(
        name="Python 버전",
        status=CheckStatus.WARN,
        message="버전 확인 실패"
    )


def check_nodejs_version() -> CheckResult:
    """Node.js 버전 확인"""
    code, stdout, stderr = run_command(["node", "--version"])
    if code != 0:
        return CheckResult(
            name="Node.js 버전",
            status=CheckStatus.FAIL,
            message="Node.js를 찾을 수 없습니다",
            suggestions=["Node.js 20+ 설치"]
        )

    version_match = re.search(r"v(\d+)", stdout)
    if version_match:
        major = int(version_match.group(1))
        if major >= 20:
            return CheckResult(
                name="Node.js 버전",
                status=CheckStatus.PASS,
                message=f"Node.js v{major}"
            )
        else:
            return CheckResult(
                name="Node.js 버전",
                status=CheckStatus.WARN,
                message=f"Node.js v{major} (권장: 20+)",
                suggestions=["Node.js 20+ 업그레이드 권장"]
            )

    return CheckResult(
        name="Node.js 버전",
        status=CheckStatus.WARN,
        message="버전 확인 실패"
    )


def check_python_lint(project_root: Path, fix: bool = False) -> CheckResult:
    """Python 린트 검사 (ruff)"""
    backend_path = project_root / "backend"
    if not backend_path.exists():
        return CheckResult(
            name="Python 린트 (ruff)",
            status=CheckStatus.SKIP,
            message="backend/ 디렉토리 없음"
        )

    cmd = ["ruff", "check", "backend/"]
    if fix:
        cmd.append("--fix")

    code, stdout, stderr = run_command(cmd, cwd=project_root)

    if code == 0:
        return CheckResult(
            name="Python 린트 (ruff)",
            status=CheckStatus.PASS,
            message="에러 0개"
        )
    else:
        # 에러 개수 추출
        error_lines = [l for l in stdout.split("\n") if l.strip()]
        error_count = len(error_lines)
        return CheckResult(
            name="Python 린트 (ruff)",
            status=CheckStatus.FAIL,
            message=f"에러 {error_count}개",
            details=error_lines[:10],  # 최대 10개만
            suggestions=["ruff check --fix backend/" if not fix else "수동 수정 필요"]
        )


def check_python_types(project_root: Path) -> CheckResult:
    """Python 타입 체크 (mypy)"""
    backend_path = project_root / "backend"
    if not backend_path.exists():
        return CheckResult(
            name="Python 타입 (mypy)",
            status=CheckStatus.SKIP,
            message="backend/ 디렉토리 없음"
        )

    code, stdout, stderr = run_command(
        ["mypy", "backend/", "--ignore-missing-imports", "--no-error-summary"],
        cwd=project_root,
        timeout=120
    )

    if code == 0:
        return CheckResult(
            name="Python 타입 (mypy)",
            status=CheckStatus.PASS,
            message="에러 없음"
        )
    else:
        error_lines = [l for l in stdout.split("\n") if "error:" in l]
        return CheckResult(
            name="Python 타입 (mypy)",
            status=CheckStatus.FAIL,
            message=f"에러 {len(error_lines)}개",
            details=error_lines[:10],
            suggestions=["타입 에러 수정 필요"]
        )


def check_typescript_lint(project_root: Path, fix: bool = False) -> CheckResult:
    """TypeScript 린트 검사 (eslint)"""
    package_json = project_root / "package.json"
    if not package_json.exists():
        return CheckResult(
            name="TypeScript 린트 (eslint)",
            status=CheckStatus.SKIP,
            message="package.json 없음"
        )

    cmd = ["pnpm", "lint"]
    if fix:
        cmd.append("--fix")

    code, stdout, stderr = run_command(cmd, cwd=project_root, timeout=120)

    if code == 0:
        return CheckResult(
            name="TypeScript 린트 (eslint)",
            status=CheckStatus.PASS,
            message="에러 없음"
        )
    else:
        return CheckResult(
            name="TypeScript 린트 (eslint)",
            status=CheckStatus.FAIL,
            message="에러 발견",
            details=[stderr[:500] if stderr else stdout[:500]],
            suggestions=["pnpm lint --fix"]
        )


def check_typescript_types(project_root: Path) -> CheckResult:
    """TypeScript 타입 체크"""
    package_json = project_root / "package.json"
    if not package_json.exists():
        return CheckResult(
            name="TypeScript 타입 (tsc)",
            status=CheckStatus.SKIP,
            message="package.json 없음"
        )

    code, stdout, stderr = run_command(
        ["pnpm", "type-check"],
        cwd=project_root,
        timeout=120
    )

    if code == 0:
        return CheckResult(
            name="TypeScript 타입 (tsc)",
            status=CheckStatus.PASS,
            message="에러 없음"
        )
    else:
        return CheckResult(
            name="TypeScript 타입 (tsc)",
            status=CheckStatus.FAIL,
            message="타입 에러 발견",
            details=[stderr[:500] if stderr else stdout[:500]],
            suggestions=["타입 에러 수정 필요"]
        )


def check_build(project_root: Path) -> CheckResult:
    """빌드 테스트"""
    package_json = project_root / "package.json"
    if not package_json.exists():
        return CheckResult(
            name="빌드 테스트",
            status=CheckStatus.SKIP,
            message="package.json 없음"
        )

    code, stdout, stderr = run_command(
        ["pnpm", "build"],
        cwd=project_root,
        timeout=300
    )

    if code == 0:
        return CheckResult(
            name="빌드 테스트",
            status=CheckStatus.PASS,
            message="빌드 성공"
        )
    else:
        return CheckResult(
            name="빌드 테스트",
            status=CheckStatus.FAIL,
            message="빌드 실패",
            details=[stderr[:500] if stderr else stdout[:500]],
            suggestions=["빌드 에러 수정 필요"]
        )


def check_version_sync(project_root: Path) -> CheckResult:
    """버전 동기화 확인"""
    versions: dict[str, str | None] = {
        "package.json": None,
        "pyproject.toml": None,
        "git_tag": None,
    }

    # package.json
    package_json = project_root / "package.json"
    if package_json.exists():
        try:
            with open(package_json) as f:
                data = json.load(f)
                versions["package.json"] = data.get("version")
        except Exception:
            pass

    # pyproject.toml
    pyproject = project_root / "pyproject.toml"
    if pyproject.exists():
        try:
            with open(pyproject) as f:
                content = f.read()
                match = re.search(r'version\s*=\s*"([^"]+)"', content)
                if match:
                    versions["pyproject.toml"] = match.group(1)
        except Exception:
            pass

    # Git tag
    code, stdout, _ = run_command(["git", "describe", "--tags", "--abbrev=0"], cwd=project_root)
    if code == 0 and stdout.strip():
        tag = stdout.strip()
        # v 접두사 제거
        versions["git_tag"] = tag.lstrip("v")

    # 비교
    valid_versions = {k: v for k, v in versions.items() if v}
    if not valid_versions:
        return CheckResult(
            name="버전 동기화",
            status=CheckStatus.SKIP,
            message="버전 정보 없음"
        )

    unique_versions = set(valid_versions.values())
    details = [f"{k}: {v}" for k, v in versions.items() if v]

    if len(unique_versions) == 1:
        return CheckResult(
            name="버전 동기화",
            status=CheckStatus.PASS,
            message=f"동기화됨 (v{list(unique_versions)[0]})",
            details=details
        )
    else:
        return CheckResult(
            name="버전 동기화",
            status=CheckStatus.WARN,
            message="버전 불일치",
            details=details,
            suggestions=["버전 동기화 필요"]
        )


def run_health_check(quick: bool = False, full: bool = False, fix: bool = False) -> HealthCheckReport:
    """전체 헬스 체크 실행"""
    project_root = get_project_root()
    report = HealthCheckReport()

    # 1. 의존성 확인
    report.checks.append(check_python_version())
    report.checks.append(check_nodejs_version())

    if quick:
        # 빠른 점검: 타입/린트만
        report.checks.append(check_python_lint(project_root, fix))
        report.checks.append(check_python_types(project_root))
        report.checks.append(check_typescript_lint(project_root, fix))
        report.checks.append(check_typescript_types(project_root))
    else:
        # 기본/전체 점검
        report.checks.append(check_python_lint(project_root, fix))
        report.checks.append(check_python_types(project_root))
        report.checks.append(check_typescript_lint(project_root, fix))
        report.checks.append(check_typescript_types(project_root))
        report.checks.append(check_build(project_root))
        report.checks.append(check_version_sync(project_root))

        if full:
            # TODO: 테스트 실행 추가
            pass

    return report


def format_report_text(report: HealthCheckReport) -> str:
    """텍스트 형식 리포트"""
    lines = []

    lines.append("")
    lines.append("━" * 50)
    lines.append("📊 프로젝트 점검 결과")
    lines.append("━" * 50)
    lines.append("")

    status_icons = {
        CheckStatus.PASS: "✅",
        CheckStatus.FAIL: "❌",
        CheckStatus.WARN: "⚠️",
        CheckStatus.SKIP: "⏭️",
    }

    for check in report.checks:
        icon = status_icons.get(check.status, "❓")
        lines.append(f"{icon} {check.name}: {check.message}")

        for detail in check.details[:5]:
            lines.append(f"   {detail}")

        for suggestion in check.suggestions:
            lines.append(f"   💡 {suggestion}")

    lines.append("")
    lines.append("━" * 50)
    lines.append("📈 요약")
    lines.append("━" * 50)
    lines.append("")
    lines.append(f"통과: {report.passed}/{report.total}")
    lines.append(f"실패: {report.failed}")
    lines.append(f"경고: {report.warnings}")
    lines.append(f"건너뜀: {report.skipped}")
    lines.append("")

    if report.is_healthy:
        lines.append("🎉 프로젝트 상태: 양호")
    else:
        lines.append("⚠️ 프로젝트 상태: 점검 필요")

    return "\n".join(lines)


def format_report_json(report: HealthCheckReport) -> str:
    """JSON 형식 리포트"""
    data = {
        "summary": {
            "total": report.total,
            "passed": report.passed,
            "failed": report.failed,
            "warnings": report.warnings,
            "skipped": report.skipped,
            "is_healthy": report.is_healthy,
        },
        "checks": [
            {
                "name": c.name,
                "status": c.status.value,
                "message": c.message,
                "details": c.details,
                "suggestions": c.suggestions,
            }
            for c in report.checks
        ],
    }
    return json.dumps(data, ensure_ascii=False, indent=2)


def main():
    parser = argparse.ArgumentParser(description="AX Health Check - 프로젝트 점검")
    parser.add_argument("--quick", action="store_true", help="빠른 점검 (타입/린트만)")
    parser.add_argument("--full", action="store_true", help="전체 점검 (테스트 포함)")
    parser.add_argument("--fix", action="store_true", help="자동 수정 적용")
    parser.add_argument("--json", action="store_true", help="JSON 형식 출력")

    args = parser.parse_args()

    print("🔍 프로젝트 점검 시작...")

    report = run_health_check(quick=args.quick, full=args.full, fix=args.fix)

    if args.json:
        print(format_report_json(report))
    else:
        print(format_report_text(report))

    # 실패가 있으면 exit code 1
    sys.exit(0 if report.is_healthy else 1)


if __name__ == "__main__":
    main()
