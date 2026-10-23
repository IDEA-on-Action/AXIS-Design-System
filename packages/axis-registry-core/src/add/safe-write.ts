/**
 * 안전한 파일 쓰기 공용 헬퍼 (WI-0045 FR-4 · D12 · D15 · D17 · D19)
 *
 * `axis add` 가 쓰던 경로 이탈 검사 · 링크 판정 · O_NOFOLLOW 쓰기를 `axis init` 의 utils.ts 쓰기(D17)와 함께 쓰려고
 * 여기로 뺐습니다. add.ts 는 종전 이름을 그대로 다시 내보냅니다.
 *
 * - 새 파일은 `O_CREAT|O_EXCL|O_NOFOLLOW` 로 엽니다. 판정 뒤 같은 이름의 파일 · 링크가 생겼으면 EEXIST 로 멈춥니다(n3).
 * - 덮어쓰기는 `O_WRONLY|O_NOFOLLOW` 로 열고(자르지 않음) 연 fd 를 fstat 해 일반 파일이고 하드링크가 아닌지(nlink 1)
 *   다시 본 뒤에만 자르고 씁니다(D19 경합 재확인). 판정 뒤 하드링크가 생겼으면 내용을 건드리지 않고 HARDLINK 오류를 던집니다.
 * - 계획 단계의 하드링크 판정은 `hardLinkReason`(lstat)입니다. 내용이 같아 건너뛰거나 `-y` 로 건너뛰는 파일은 쓰지 않으므로
 *   호출한 쪽이 이 판정을 부르지 않습니다.
 */

import { constants as fsConstants, existsSync, lstatSync, realpathSync, statSync } from "node:fs";
import path from "node:path";
import fs from "fs-extra";

/**
 * 새 파일 플래그(n3). 판정 뒤(대화형 확인 대기 중 등) 같은 이름의 파일이 생겼으면 EEXIST 로 멈추고 덮어쓰지 않습니다.
 * 마지막 경로 구성요소가 링크면 열지 않습니다(O_EXCL 은 링크도 「있음」으로 봅니다)
 */
export const NEW_FILE_FLAGS =
  fsConstants.O_WRONLY | fsConstants.O_CREAT | fsConstants.O_EXCL | (fsConstants.O_NOFOLLOW ?? 0);

/**
 * 덮어쓰기 플래그. 열 때 자르지 않습니다(O_TRUNC 없음). 연 fd 를 fstat 로 다시 확인(D19)한 뒤에만 ftruncate 합니다.
 * O_CREAT 를 넣지 않아, 판정 뒤 파일이 지워졌으면 ENOENT 로 알고 새 파일(O_EXCL)로 다시 엽니다(표기 `+` 와 실제 동작 일치)
 */
export const OVERWRITE_FLAGS = fsConstants.O_WRONLY | (fsConstants.O_NOFOLLOW ?? 0);

/** 하드링크로 이어진 파일을 덮어쓰지 않을 때 던지는 오류 코드(D19) */
export const HARDLINK_ERROR_CODE = "EAXISHARDLINK";

/** 일반 파일이 아닌 대상을 덮어쓰지 않을 때 던지는 오류 코드 */
export const NOT_REGULAR_ERROR_CODE = "EAXISNOTREG";

function codedError(code: string, message: string): NodeJS.ErrnoException {
  const e = new Error(message) as NodeJS.ErrnoException;
  e.code = code;
  return e;
}

/**
 * child 가 parent 와 같거나 그 안인지(두 경로 모두 절대 경로). 밖은 relative 가 `..` 이거나 `..<구분자>` 로 시작하거나
 * 절대 경로(다른 드라이브)일 때뿐입니다. `..ui` 처럼 `..` 로 시작하는 정상 하위 이름은 안입니다(m4).
 * impl 은 테스트에서 path.win32 를 넣어 Windows 판정을 고정하려고 받습니다.
 */
export function isSameOrInside(parent: string, child: string, impl: path.PlatformPath = path): boolean {
  const rel = impl.relative(parent, child);
  if (rel === "") return true;
  return !(rel === ".." || rel.startsWith(`..${impl.sep}`) || impl.isAbsolute(rel));
}

/** 가장 가까운 기존 상위 경로 */
function nearestExisting(p: string): string {
  let cur = p;
  while (!existsSync(cur)) {
    const up = path.dirname(cur);
    if (up === cur) return cur;
    cur = up;
  }
  return cur;
}

/**
 * 경로 이탈 검사. 쓸 파일의 경로(논리), 가장 가까운 기존 상위 디렉터리의 realpath, 파일이 이미 있으면 그 realpath 가
 * 모두 프로젝트 루트(realpath) 안이어야 합니다. 밖이면 이유를, 안이면 null 을 돌려줍니다.
 * 부모 디렉터리를 만든 뒤에는 `checkParentInside` 로 한 번 더 봅니다(쓰기 직전).
 *
 * allowOutsideLink: 기존 대상이 프로젝트 밖 파일을 가리키는 심볼릭 링크인 경우만 여기서 거부하지 않습니다(D15).
 * 그런 링크는 덮어쓰기 판정 뒤 쓰지 않는 경우(같은 내용 · 건너뜀)에만 통과하고, 써야 하면 runAdd 가 거부합니다.
 * 상위 디렉터리 이탈 · 깨진 링크 · 디렉터리를 가리키는 링크 · 일반 파일이 아닌 대상(FIFO · 장치, 링크면 따라간 대상)은
 * 이 옵션과 관계없이 거부합니다.
 */
export function escapeReason(root: string, target: string, options: { allowOutsideLink?: boolean } = {}): string | null {
  const realRoot = realpathSync(root);
  if (!isSameOrInside(path.resolve(root), path.resolve(target)) || path.resolve(target) === path.resolve(root)) {
    return `경로가 프로젝트 디렉터리 밖입니다(${target})`;
  }
  const anchor = nearestExisting(path.dirname(target));
  const realAnchor = realpathSync(anchor);
  if (!isSameOrInside(realRoot, realAnchor)) {
    return `상위 디렉터리의 실제 위치(${realAnchor})가 프로젝트 디렉터리 밖입니다`;
  }
  let st: ReturnType<typeof lstatSync> | null = null;
  try {
    st = lstatSync(target);
  } catch {
    st = null;
  }
  if (st) {
    if (st.isDirectory()) return `같은 이름의 디렉터리가 있습니다(${target})`;
    // 프로젝트 안 경로는 init 과 같이 프로젝트 기준 상대 경로로 보여 줍니다
    const shown = path.relative(path.resolve(root), path.resolve(target)).split(path.sep).join("/");
    let realTarget: string;
    try {
      realTarget = realpathSync(target);
    } catch {
      return `기존 파일 ${shown} 이 깨진 심볼릭 링크라 따라갈 수 없습니다(링크를 지우거나 고친 뒤 다시 실행하세요)`;
    }
    if (!isSameOrInside(realRoot, realTarget) && !(options.allowOutsideLink && st.isSymbolicLink())) {
      return `기존 파일의 실제 위치(${realTarget})가 프로젝트 디렉터리 밖입니다`;
    }
    // lstat 는 링크 자체를 보므로, 디렉터리를 가리키는 링크는 링크를 따라가 한 번 더 봅니다
    let followed: ReturnType<typeof statSync>;
    try {
      followed = statSync(realTarget);
    } catch {
      return `기존 파일 정보를 읽지 못했습니다(${target})`;
    }
    if (followed.isDirectory()) {
      return `같은 이름의 링크가 디렉터리(${realTarget})를 가리킵니다(${target})`;
    }
    // FIFO · 문자 장치(/dev/zero 등) · 소켓은 읽으면 끝나지 않거나 끝없이 커지므로 읽기 전에 거부합니다.
    // 링크면 따라간 대상으로 봅니다(init planUtilsWrite 와 같은 기준)
    if (!followed.isFile()) {
      const where = st.isSymbolicLink() ? `링크 대상(${realTarget})이` : "기존 파일이";
      return `${where} 일반 파일이 아니라 비교 · 덮어쓰기를 할 수 없습니다(${shown})`;
    }
  }
  return null;
}

/** 마지막 경로 구성요소가 심볼릭 링크인지(없으면 false) */
export function isSymlink(p: string): boolean {
  try {
    return lstatSync(p).isSymbolicLink();
  } catch {
    return false;
  }
}

/** 기존 대상이 프로젝트 밖을 가리키는 심볼릭 링크면 그 실제 위치를, 아니면 null 을 돌려줍니다(D15) */
export function outsideLinkTarget(root: string, target: string): string | null {
  if (!isSymlink(target)) return null;
  try {
    const realTarget = realpathSync(target);
    return isSameOrInside(realpathSync(root), realTarget) ? null : realTarget;
  } catch {
    return null;
  }
}

/**
 * 계획 단계의 하드링크 판정(D19). 대상이 일반 파일이고 링크 수(nlink)가 2 이상이면 그 수를, 아니면 null 을 돌려줍니다.
 * lstat 이라 심볼릭 링크 자체는 보지 않습니다(링크는 D12 · D15 규칙이 따로 막습니다). 대상이 없으면 null 입니다.
 */
export function hardLinkCount(target: string): number | null {
  try {
    const st = lstatSync(target);
    return st.isFile() && st.nlink >= 2 ? st.nlink : null;
  } catch {
    return null;
  }
}

/** 하드링크 거부 문구(D19). 경로와 이유를 함께 적습니다 */
export function hardLinkMessage(shownPath: string, nlink: number): string {
  return (
    `기존 파일 ${shownPath} 이 다른 경로와 하드링크로 이어진 파일이라(링크 수 ${nlink}) 덮어쓰지 않습니다. ` +
    "덮어쓰면 이어진 다른 경로의 내용도 바뀝니다. 하드링크를 끊은(파일을 복사해 바꾼) 뒤 다시 실행하세요"
  );
}

/**
 * 쓴 뒤 사후 검사(M2). realpath(대상)가 프로젝트 밖이면 그 실제 경로를, 안이면 null 을 돌려줍니다.
 * 쓰기 직전 재검사와 쓰기 사이에 상위 디렉터리가 밖을 가리키는 링크로 바뀌면(O_NOFOLLOW 는 마지막 구성요소만 막음)
 * 파일이 밖에 쓰일 수 있어, 쓴 뒤 실제 위치를 다시 봅니다. 밖이면 그 경로를 알리고 rc 1 로 끝낼 뿐 지우지 않습니다(m3).
 */
export function writtenOutside(root: string, target: string): string | null {
  const realRoot = realpathSync(root);
  let realTarget: string;
  try {
    realTarget = realpathSync(target);
  } catch {
    // 쓴 직전 파일을 찾지 못하면 위치를 확인할 수 없으므로 밖으로 봅니다(보수적)
    return target;
  }
  return isSameOrInside(realRoot, realTarget) ? null : realTarget;
}

/**
 * 대상을 O_NOFOLLOW 로 열어 내용을 씁니다. 마지막 구성요소가 쓰기 직전에 링크로 바뀌었으면 ELOOP 로 멈춥니다.
 * mode 'new' 는 O_EXCL 이라 그 사이 같은 이름의 파일 · 링크가 생겼으면 EEXIST 로 멈춥니다(n3).
 * mode 'overwrite' 는 연 fd 를 fstat 해 일반 파일이 아니면 NOT_REGULAR_ERROR_CODE, 링크 수가 2 이상이면
 * HARDLINK_ERROR_CODE 로 멈추고(D19, 내용은 자르기 전이라 그대로), 통과한 뒤에만 자르고 씁니다.
 * 덮어쓰기로 판정한 파일이 그 사이 지워졌으면 새 파일로 만들고 'new' 를 돌려줍니다.
 */
export async function writeNoFollow(
  target: string,
  content: string,
  mode: "new" | "overwrite"
): Promise<"new" | "overwrite"> {
  let actual = mode;
  let fd: number;
  if (mode === "overwrite") {
    try {
      fd = await fs.open(target, OVERWRITE_FLAGS);
    } catch (e) {
      // 덮어쓰기로 판정한 파일이 그 사이 지워졌으면 새 파일로 만듭니다. 그 사이 다시 생겼으면 EEXIST 로 멈춥니다
      if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
      actual = "new";
      fd = await fs.open(target, NEW_FILE_FLAGS, 0o666);
    }
  } else {
    fd = await fs.open(target, NEW_FILE_FLAGS, 0o666);
  }
  try {
    if (actual === "overwrite") {
      // 경합 재확인(D19): 계획 단계(lstat) 뒤 하드링크가 생겼거나 일반 파일이 아니게 됐으면 자르지 않고 멈춥니다
      const st = await fs.fstat(fd);
      if (!st.isFile()) throw codedError(NOT_REGULAR_ERROR_CODE, `${target} 이 일반 파일이 아닙니다`);
      if (st.nlink >= 2) throw codedError(HARDLINK_ERROR_CODE, hardLinkMessage(target, st.nlink));
      await fs.ftruncate(fd, 0);
    }
    await fs.writeFile(fd, content);
  } finally {
    await fs.close(fd);
  }
  return actual;
}

/**
 * 링크를 따라가는 덮어쓰기(init 의 axis.config.json 용, D19). 종전처럼 링크를 따라가 쓰되(config 링크 규칙은 바꾸지 않음),
 * 연 fd 를 fstat 해 일반 파일이 아니거나 링크 수가 2 이상이면 자르지 않고 멈춥니다. 없으면 만듭니다.
 */
export async function overwriteFollowingLinks(target: string, content: string): Promise<void> {
  const fd = await fs.open(target, fsConstants.O_WRONLY | fsConstants.O_CREAT, 0o666);
  try {
    const st = await fs.fstat(fd);
    if (!st.isFile()) throw codedError(NOT_REGULAR_ERROR_CODE, `${target} 이 일반 파일이 아닙니다`);
    if (st.nlink >= 2) throw codedError(HARDLINK_ERROR_CODE, hardLinkMessage(target, st.nlink));
    await fs.ftruncate(fd, 0);
    await fs.writeFile(fd, content);
  } finally {
    await fs.close(fd);
  }
}

/** 부모 디렉터리를 만든 뒤 그 realpath 가 프로젝트 안인지 */
export function checkParentInside(root: string, target: string): string | null {
  const realRoot = realpathSync(root);
  const realParent = realpathSync(path.dirname(target));
  if (!isSameOrInside(realRoot, realParent)) {
    return `부모 디렉터리의 실제 위치(${realParent})가 프로젝트 디렉터리 밖입니다`;
  }
  return escapeReason(root, target);
}
