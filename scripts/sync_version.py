#!/usr/bin/env python3
"""
버전 동기화 스크립트

프로젝트 내 모든 버전 참조를 동기화합니다.

사용법:
    python scripts/sync_version.py                 # 현재 버전 확인
    python scripts/sync_version.py 0.7.0           # 0.7.0으로 업데이트
    python scripts/sync_version.py --check         # 버전 불일치 체크만
"""

import argparse
import json
import re
import sys
from pathlib import Path


def get_project_root() -> Path:
    """프로젝트 루트 디렉토리 반환"""
    return Path(__file__).parent.parent


def read_pyproject_version(root: Path) -> str | None:
    """pyproject.toml에서 버전 읽기"""
    pyproject = root / "pyproject.toml"
    if not pyproject.exists():
        return None

    content = pyproject.read_text(encoding="utf-8")
    match = re.search(r'^version\s*=\s*"([^"]+)"', content, re.MULTILINE)
    return match.group(1) if match else None


def read_api_version(root: Path) -> str | None:
    """main.py에서 API_VERSION 읽기"""
    main_py = root / "backend" / "api" / "main.py"
    if not main_py.exists():
        return None

    content = main_py.read_text(encoding="utf-8")
    match = re.search(r'^API_VERSION\s*=\s*"([^"]+)"', content, re.MULTILINE)
    return match.group(1) if match else None


def read_web_package_version(root: Path) -> str | None:
    """apps/web/package.json에서 버전 읽기"""
    package_json = root / "apps" / "web" / "package.json"
    if not package_json.exists():
        return None

    content = json.loads(package_json.read_text(encoding="utf-8"))
    return content.get("version")


def update_pyproject_version(root: Path, version: str) -> bool:
    """pyproject.toml 버전 업데이트"""
    pyproject = root / "pyproject.toml"
    if not pyproject.exists():
        return False

    content = pyproject.read_text(encoding="utf-8")
    new_content = re.sub(
        r'^(version\s*=\s*)"[^"]+"',
        f'\\1"{version}"',
        content,
        flags=re.MULTILINE,
    )
    pyproject.write_text(new_content, encoding="utf-8")
    return True


def update_api_version(root: Path, version: str) -> bool:
    """main.py API_VERSION 업데이트"""
    main_py = root / "backend" / "api" / "main.py"
    if not main_py.exists():
        return False

    content = main_py.read_text(encoding="utf-8")
    new_content = re.sub(
        r'^(API_VERSION\s*=\s*)"[^"]+"',
        f'\\1"{version}"',
        content,
        flags=re.MULTILINE,
    )
    main_py.write_text(new_content, encoding="utf-8")
    return True


def update_web_package_version(root: Path, version: str) -> bool:
    """apps/web/package.json 버전 업데이트"""
    package_json = root / "apps" / "web" / "package.json"
    if not package_json.exists():
        return False

    content = json.loads(package_json.read_text(encoding="utf-8"))
    content["version"] = version
    package_json.write_text(
        json.dumps(content, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    return True


def main():
    parser = argparse.ArgumentParser(description="프로젝트 버전 동기화")
    parser.add_argument("version", nargs="?", help="설정할 버전 (예: 0.7.0)")
    parser.add_argument("--check", action="store_true", help="버전 불일치 체크만 수행")
    args = parser.parse_args()

    root = get_project_root()

    # 현재 버전 읽기
    versions = {
        "pyproject.toml": read_pyproject_version(root),
        "main.py (API_VERSION)": read_api_version(root),
        "apps/web/package.json": read_web_package_version(root),
    }

    print("현재 버전:")
    print("-" * 40)
    for file, ver in versions.items():
        status = ver if ver else "(없음)"
        print(f"  {file}: {status}")
    print()

    # 불일치 체크
    valid_versions = [v for v in versions.values() if v]
    unique_versions = set(valid_versions)

    if len(unique_versions) > 1:
        print("⚠️  버전 불일치 발견!")
        if args.check:
            sys.exit(1)
    elif len(unique_versions) == 1:
        print(f"✅ 모든 버전 일치: {unique_versions.pop()}")
    else:
        print("⚠️  버전 정보를 찾을 수 없습니다.")

    if args.check:
        sys.exit(0 if len(unique_versions) <= 1 else 1)

    # 버전 업데이트
    if args.version:
        print(f"\n버전 업데이트: {args.version}")
        print("-" * 40)

        if update_pyproject_version(root, args.version):
            print("  ✅ pyproject.toml 업데이트 완료")
        else:
            print("  ❌ pyproject.toml 업데이트 실패")

        if update_api_version(root, args.version):
            print("  ✅ main.py (API_VERSION) 업데이트 완료")
        else:
            print("  ❌ main.py 업데이트 실패")

        if update_web_package_version(root, args.version):
            print("  ✅ apps/web/package.json 업데이트 완료")
        else:
            print("  ❌ apps/web/package.json 업데이트 실패")

        print(f"\n✅ 모든 버전이 {args.version}으로 동기화되었습니다.")


if __name__ == "__main__":
    main()
