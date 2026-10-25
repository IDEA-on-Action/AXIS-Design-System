/**
 * dependencies 항목 공유 코어 (WI-0051)
 *
 * `axis check`(packages/axis-cli/src/template/template-check.ts)와 MCP `axis.check_project`(packages/axis-mcp/src/tools/template.ts)가
 * 같은 로직을 따로 갖고 있던 것을 옮겼습니다. 종전에는 package.json 선언만 보고 「모두 설치되어 있습니다」로 표시해,
 * node_modules 가 아예 없는 프로젝트도 pass 였습니다(1.6.0 · MCP 1.3.3 실측, 거짓 초록).
 *
 * 판정
 * 1. package.json 없음 → fail. 항목 이름은 CLI · MCP 모두 `dependencies` 입니다(종전 CLI 는 `package.json`)
 * 2. 필수(tailwindcss) 선언 없음 → fail, 권장(clsx · tailwind-merge) 선언 없음 → warn(종전과 같은 문구)
 * 3. 선언된 대상(필수 · 권장 + 선언된 `@axis-ds/*`)이 설치되지 않음 → warn. 설치본은 `findInstalledPackage`(상위 디렉터리 탐색)로
 *    봅니다. 안내 명령은 lockfile 로 고릅니다(`detectInstallCommand`). WARN 이라 종료 코드는 바뀌지 않습니다(사용자 결정).
 *    `@axis-ds/*` 의 전이 의존(cva · @radix-ui/*)은 그 패키지가 설치되면 따라오므로 보지 않습니다.
 * 4. Plug'n'Play(`.pnp.cjs`)는 node_modules 가 없어 설치본을 읽지 않고 선언 기준으로 pass 하며, 그 사실을 문구에 남깁니다.
 * 5. 필수 · 권장 의존성은 앱 package.json 에 선언이 없으면 워크스페이스 루트(`findWorkspaceRoot`, `.git` 에서 중단) package.json 의
 *    선언도 인정하고, 문구 끝에 「워크스페이스 루트에 선언: …」을 붙입니다(WI-0081, 사용자 결정). 워크스페이스가 아닌 상위의 선언은
 *    인정하지 않습니다. `@axis-ds/*` 설치 확인 대상은 종전대로 앱 선언만 봅니다.
 */

import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { detectInstallCommand, findInstalledPackage, findWorkspaceRoot, hasDependency, isPlainObject, isPnpProject } from "../project.js";

/** dependencies 항목. CLI · MCP 의 `CheckResult` 와 같은 모양입니다. */
export interface DependenciesCheckResult {
  name: "dependencies";
  severity: "pass" | "warn" | "fail";
  message: string;
}

/** 필수 의존성 */
export const REQUIRED_DEPENDENCIES = ["tailwindcss"] as const;
/** 권장 의존성(컴포넌트의 cn()) */
export const RECOMMENDED_DEPENDENCIES = ["clsx", "tailwind-merge"] as const;

/** package.json 의 dependencies · devDependencies 에 선언된 `@axis-ds/*` 이름(선언 순서, 중복 없음) */
function declaredAxisPackages(pkg: Record<string, unknown>): string[] {
  const out: string[] = [];
  for (const field of ["dependencies", "devDependencies"]) {
    const deps = pkg[field];
    if (!isPlainObject(deps)) continue;
    for (const name of Object.keys(deps)) if (name.startsWith("@axis-ds/") && !out.includes(name)) out.push(name);
  }
  return out;
}

/** 앱이 곧 루트가 아닐 때 워크스페이스 루트 package.json(읽지 못하면 `undefined`, WI-0081) */
function workspaceRootPackage(baseDir: string): Record<string, unknown> | undefined {
  const root = findWorkspaceRoot(baseDir);
  if (root === undefined || root === baseDir) return undefined;
  try {
    const parsed: unknown = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
    return isPlainObject(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

/** dependencies 항목을 판정합니다(WI-0051). */
export function checkDependencies(baseDirInput: string): DependenciesCheckResult {
  const baseDir = resolve(baseDirInput);
  let pkg: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(readFileSync(join(baseDir, "package.json"), "utf8"));
    if (!isPlainObject(parsed)) throw new Error("not object");
    pkg = parsed;
  } catch (err) {
    if ((err as NodeJS.ErrnoException)?.code === "ENOENT") {
      return { name: "dependencies", severity: "fail", message: "package.json 파일이 없습니다" };
    }
    return { name: "dependencies", severity: "fail", message: "package.json 을 읽지 못했습니다(JSON 확인)" };
  }

  // 앱 선언이 우선이고, 앱에 없을 때만 워크스페이스 루트 선언을 봅니다(WI-0081)
  const rootPkg = workspaceRootPackage(baseDir);
  const fromRoot = (d: string) => !hasDependency(pkg, d) && rootPkg !== undefined && Boolean(hasDependency(rootPkg, d));
  const missingRequired = REQUIRED_DEPENDENCIES.filter((d) => !hasDependency(pkg, d) && !fromRoot(d));
  if (missingRequired.length > 0) {
    return { name: "dependencies", severity: "fail", message: `필수 의존성 누락: ${missingRequired.join(", ")}` };
  }
  const missingRecommended = RECOMMENDED_DEPENDENCIES.filter((d) => !hasDependency(pkg, d) && !fromRoot(d));
  const rootDeclared = [...REQUIRED_DEPENDENCIES, ...RECOMMENDED_DEPENDENCIES].filter((d) => fromRoot(d));
  const rootNote = rootDeclared.length > 0 ? `워크스페이스 루트에 선언: ${rootDeclared.join(", ")}` : undefined;

  const targets = [
    ...[...REQUIRED_DEPENDENCIES, ...RECOMMENDED_DEPENDENCIES].filter((d) => hasDependency(pkg, d) !== undefined || fromRoot(d)),
    ...declaredAxisPackages(pkg),
  ];
  const pnp = isPnpProject(baseDir);
  const notInstalled = pnp ? [] : targets.filter((d) => findInstalledPackage(baseDir, d) === undefined);

  const problems: string[] = [];
  if (missingRecommended.length > 0) problems.push(`권장 의존성 누락: ${missingRecommended.join(", ")}`);
  if (notInstalled.length > 0) {
    problems.push(`선언됐지만 설치되지 않은 의존성: ${notInstalled.join(", ")} → ${detectInstallCommand(baseDir)}`);
  }
  if (problems.length > 0) {
    return { name: "dependencies", severity: "warn", message: problems.join(" / ") + (rootNote ? ` (${rootNote})` : "") };
  }

  const note = rootNote ? `, ${rootNote}` : "";
  return {
    name: "dependencies",
    severity: "pass",
    message: pnp
      ? `필수 및 권장 의존성이 선언되어 있습니다 (Plug'n'Play 라 설치본은 확인하지 않음, ${targets.length}개${note})`
      : `필수 및 권장 의존성이 선언 · 설치되어 있습니다 (${targets.length}개 확인${note})`,
  };
}
