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
 *    인정하지 않습니다.
 *    WI-0086: 이 판정은 project.ts 의 공용 헬퍼 `declaredDependency` 로 옮겼고, tailwind-core · init · add 가 같은 헬퍼를 씁니다.
 * 6. WI-0094(사용자 결정 Q11 · Q19): `@axis-ds/*` 설치 확인 대상에 워크스페이스 루트 package.json 의 `@axis-ds/*` 선언(앱에 없는 것)도
 *    넣습니다(이름 필터 없음, 앱 lockfile 이 있어도 무시하지 않음). 루트 출처 미설치는 「워크스페이스 루트에 선언돼 있지만 설치되지
 *    않았습니다」로 따로 알리고, 「워크스페이스 루트에 선언: …」 표시에도 넣습니다. WARN 이라 종료 코드는 바뀌지 않습니다.
 *    종전(WI-0081 1.3 · 배치 6c)에는 앱 선언만 봐서 루트 전용 · 미설치가 PASS 「N개 확인」이었습니다.
 * 7. WI-0091(사용자 결정 Q1 · Q5): Plug'n'Play 면 루트 선언을 인정하지 않고 앱 선언만 봅니다. 필수 · 권장 의존성이 루트에만 있으면
 *    미선언과 같은 심각도(필수 FAIL · 권장 WARN)로 내되 「워크스페이스 루트에만 선언돼 Plug'n'Play 에서 앱이 해석하지 못함」 문구를
 *    씁니다. 루트에만 있는 `@axis-ds/*` 는 확인 대상에 넣지 않습니다(Plug'n'Play 는 설치본을 읽지 않으므로 대상 수만 늘어남).
 *    추가 결정 A3: 대신 「<이름> 가 워크스페이스 루트에만 선언돼 Plug'n'Play 에서 앱이 해석하지 못합니다」 WARN 으로 알립니다
 *    (종전에는 알리지 않아 ui-react 만 루트에 둔 PnP 앱이 PASS 였음, 측정 M7). 종료 코드는 바뀌지 않습니다.
 * 8. WI-0096: 미설치 안내의 명령은 `installCommandPhrase` 로 만듭니다. npm 이고 그 묶음에 워크스페이스 루트 선언이 있으면
 *    「워크스페이스 루트에서 npm install」(앱 디렉터리의 npm install 은 루트 선언을 설치하지 않음, npm 7 ~ 10 실측). pnpm · yarn 은 종전 그대로,
 *    WARN 이라 종료 코드도 그대로입니다.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  PNP_ROOT_ONLY_NOTE,
  declaredDependency,
  detectInstallCommand,
  findInstalledPackage,
  installCommandPhrase,
  isPlainObject,
  isPnpProject,
  pnpRootOnlyDependency,
  resolveBaseDir,
  workspaceRootPackage,
} from "../project.js";

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

/** dependencies 항목을 판정합니다(WI-0051). */
export function checkDependencies(baseDirInput: string): DependenciesCheckResult {
  const baseDir = resolveBaseDir(baseDirInput);
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

  // 앱 선언이 우선이고, 앱에 없을 때만 워크스페이스 루트 선언을 봅니다(WI-0081, WI-0086 부터 공용 헬퍼 declaredDependency).
  // WI-0091: Plug'n'Play 면 루트 선언을 인정하지 않고(appOnlyInPnp), 루트에만 있는 것은 전용 문구로 따로 알립니다.
  const rootPkg = workspaceRootPackage(baseDir) ?? null;
  const pnp = isPnpProject(baseDir);
  const declared = (d: string) => declaredDependency(baseDir, pkg, d, rootPkg, { appOnlyInPnp: true });
  const pnpRootOnly = (d: string) => pnpRootOnlyDependency(baseDir, pkg, d, rootPkg) !== undefined;
  const fromRoot = (d: string) => declared(d)?.source === "root";
  const missingRequired = REQUIRED_DEPENDENCIES.filter((d) => declared(d) === undefined && !pnpRootOnly(d));
  const pnpRootRequired = REQUIRED_DEPENDENCIES.filter((d) => pnpRootOnly(d));
  if (missingRequired.length > 0 || pnpRootRequired.length > 0) {
    const fails: string[] = [];
    if (missingRequired.length > 0) fails.push(`필수 의존성 누락: ${missingRequired.join(", ")}`);
    if (pnpRootRequired.length > 0) fails.push(`필수 의존성 ${pnpRootRequired.join(", ")} 가 ${PNP_ROOT_ONLY_NOTE} → 앱 package.json 에 선언하세요`);
    return { name: "dependencies", severity: "fail", message: fails.join(" / ") };
  }
  const missingRecommended = RECOMMENDED_DEPENDENCIES.filter((d) => declared(d) === undefined && !pnpRootOnly(d));
  const pnpRootRecommended = RECOMMENDED_DEPENDENCIES.filter((d) => pnpRootOnly(d));

  // `@axis-ds/*` 설치 확인 대상: 앱 선언 다음 워크스페이스 루트 선언(WI-0094, 앱에 없는 것만). Plug'n'Play 면 루트는 보지 않습니다(WI-0091).
  const appAxis = declaredAxisPackages(pkg);
  const rootOnlyAxis = rootPkg !== null ? declaredAxisPackages(rootPkg).filter((d) => !appAxis.includes(d)) : [];
  const rootAxis = pnp ? [] : rootOnlyAxis;
  // 추가 결정 A3: Plug'n'Play 에서 루트에만 선언한 `@axis-ds/*` 는 대상에 넣지 않되, 필수 · 권장과 같은 전용 문구 WARN 으로 알립니다(종료 코드 불변)
  const pnpRootAxis = pnp ? rootOnlyAxis : [];
  const rootDeclared: string[] = [...[...REQUIRED_DEPENDENCIES, ...RECOMMENDED_DEPENDENCIES].filter((d) => fromRoot(d)), ...rootAxis];
  const rootNote = rootDeclared.length > 0 ? `워크스페이스 루트에 선언: ${rootDeclared.join(", ")}` : undefined;

  const targets = [
    ...[...REQUIRED_DEPENDENCIES, ...RECOMMENDED_DEPENDENCIES].filter((d) => declared(d) !== undefined),
    ...appAxis,
    ...rootAxis,
  ];
  const notInstalled = pnp ? [] : targets.filter((d) => findInstalledPackage(baseDir, d) === undefined);
  const notInstalledRoot = notInstalled.filter((d) => rootAxis.includes(d));
  const notInstalledOther = notInstalled.filter((d) => !rootAxis.includes(d));

  const problems: string[] = [];
  if (missingRecommended.length > 0) problems.push(`권장 의존성 누락: ${missingRecommended.join(", ")}`);
  if (pnpRootRecommended.length > 0) problems.push(`권장 의존성 ${pnpRootRecommended.join(", ")} 가 ${PNP_ROOT_ONLY_NOTE} → 앱 package.json 에 선언하세요`);
  if (pnpRootAxis.length > 0) problems.push(`${pnpRootAxis.join(", ")} 가 ${PNP_ROOT_ONLY_NOTE} → 앱 package.json 에 선언하세요`);
  // WI-0096: npm 은 앱 디렉터리의 npm install 이 루트 선언을 설치하지 않으므로, 묶음에 루트 선언이 있으면 「워크스페이스 루트에서 npm install」
  const installCommand = detectInstallCommand(baseDir);
  if (notInstalledOther.length > 0) {
    const phrase = installCommandPhrase(installCommand, notInstalledOther.some((d) => fromRoot(d)));
    problems.push(`선언됐지만 설치되지 않은 의존성: ${notInstalledOther.join(", ")} → ${phrase}`);
  }
  if (notInstalledRoot.length > 0) {
    problems.push(
      `워크스페이스 루트에 선언돼 있지만 설치되지 않았습니다: ${notInstalledRoot.join(", ")} → ${installCommandPhrase(installCommand, true)}`
    );
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
