/**
 * 테스트 전용: fixture 를 임시 디렉터리에 펼칩니다(WI-0028 plan 5장 12, 6.1).
 * 빌드 진입점(tsup)에 들어가지 않고 테스트에서만 import 합니다.
 */

import fs from "fs-extra";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { createTemplateConfig } from "../config/axis-config.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));

/** fixture 원본 루트 `packages/axis-cli/test/fixtures/theme` */
export const THEME_FIXTURES_DIR = path.resolve(HERE, "../../test/fixtures/theme");

/** theme-only 템플릿 원본(저장소). 이 파일이 바뀌면 fixture 도 같이 바뀝니다. */
export const THEME_ONLY_TEMPLATE = path.resolve(
  HERE,
  "../../../../apps/web/public/templates/theme-only.json"
);

export type TokensFixture = "1.3" | "1.3-unbuilt" | "1.2" | "none";
export type LayoutFixture = "theme-only" | "app-init" | "src-app" | "empty";

export interface MakeProjectOptions {
  tokens: TokensFixture;
  layout?: LayoutFixture;
}

/**
 * fixture 의 `_dist` 를 `dist` 로 바꿔 복사합니다.
 * `dist` · `node_modules` 는 루트 `.gitignore` 에 걸리므로 원본에서는 다른 이름을 씁니다.
 */
async function copyTokensPackage(fixture: Exclude<TokensFixture, "none">, dest: string) {
  const src = path.join(THEME_FIXTURES_DIR, `tokens-${fixture}`, "pkg");
  await fs.copy(src, dest);
  const underscored = path.join(dest, "_dist");
  if (await fs.pathExists(underscored)) {
    await fs.move(underscored, path.join(dest, "dist"));
  }
}

/** `apps/web/public/templates/theme-only.json` 의 files[] 를 그대로 펼치고 `initTemplate` 형태의 config 를 씁니다. */
async function writeThemeOnly(dir: string) {
  const template = (await fs.readJSON(THEME_ONLY_TEMPLATE)) as {
    files: { path: string; content: string }[];
  };
  for (const file of template.files) {
    const dest = path.join(dir, file.path);
    await fs.ensureDir(path.dirname(dest));
    await fs.writeFile(dest, file.content);
  }
  await fs.writeJSON(path.join(dir, "axis.config.json"), createTemplateConfig("theme-only"), {
    spaces: 2,
  });
}

/**
 * 임시 디렉터리에 프로젝트를 만듭니다. 돌려준 경로는 호출한 쪽이 `fs.remove` 로 지웁니다.
 * `layout` 을 주지 않으면(`empty`) `package.json` 만 있는 디렉터리입니다.
 */
export async function makeProject(options: MakeProjectOptions): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "axis-theme-"));
  const layout = options.layout ?? "empty";

  if (layout === "theme-only") {
    await writeThemeOnly(dir);
  } else if (layout === "app-init" || layout === "src-app") {
    await fs.copy(path.join(THEME_FIXTURES_DIR, "projects", layout), dir);
  } else {
    await fs.writeJSON(path.join(dir, "package.json"), { name: "empty", private: true }, { spaces: 2 });
  }

  if (options.tokens !== "none") {
    await copyTokensPackage(options.tokens, path.join(dir, "node_modules", "@axis-ds", "tokens"));
  }
  return dir;
}
