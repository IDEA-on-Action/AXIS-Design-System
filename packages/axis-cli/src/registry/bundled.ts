/**
 * CLI 동봉 레지스트리 (WI-0045 FR-3 · D1)
 *
 * cli 빌드 때 scripts/copy-registry.mjs 가 apps/web/public/r(배포되는 유일한 레지스트리)을 dist/registry/ 로 복사합니다.
 * 저장소에 커밋하지 않는 산출물이고(dist/ 는 .gitignore), npm 배포 파일(files: ["dist"])에 들어갑니다.
 */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseJsonText } from "./schema.js";

/** dist/registry 를 찾습니다. tsup 이 이 모듈을 dist 바로 아래 청크로 묶으므로 `./registry` 가 1순위입니다 */
export function findBundledRegistryDir(moduleUrl: string = import.meta.url): string | null {
  const here = path.dirname(fileURLToPath(moduleUrl));
  for (const dir of [path.join(here, "registry"), path.join(here, "..", "registry")]) {
    if (existsSync(path.join(dir, "index.json"))) return dir;
  }
  return null;
}

/** 동봉본에서 JSON 파일 하나를 읽습니다. 없거나 깨졌으면 던집니다 */
export function readBundledJson(dir: string, fileName: string): unknown {
  const file = path.join(dir, fileName);
  let text: string;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    throw new Error(`동봉 레지스트리에 ${fileName} 가 없습니다(${dir})`);
  }
  return parseJsonText(text, `동봉 레지스트리 ${fileName}`);
}
