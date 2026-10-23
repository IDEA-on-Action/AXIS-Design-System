/**
 * AxisCollector 테스트 (WI-0057)
 *
 * 실제 저장소 루트로 수집기를 돌려 문서 URL 이 실재하는 문서 라우트만 가리키는지, 테스트 파일 · 단일 파일 ·
 * 데모 페이지가 컴포넌트로 잡히지 않는지 봅니다. 기대 목록은 하드코딩하지 않고 같은 저장소를 직접 읽어 만듭니다.
 * 수집기 자체는 원격에 접속하지 않습니다.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "fs-extra";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { AxisCollector, DOCS_SLUG_ALIASES } from "./axis-collector.js";
import type { ComponentMeta } from "./types.js";
import { AXIS_SITE_URL } from "../site.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const DOCS_APP = path.join(ROOT, "apps/web/src/app/(docs)");
const PACKAGES = [
  { dir: "packages/axis-ui-react/src", route: "components", category: "ui" },
  { dir: "packages/axis-agentic-ui/src", route: "agentic", category: "agentic" },
] as const;

/** 패키지 src 바로 아래에서 index.tsx 가 있는 디렉터리 (수집기와 독립적으로 셉니다) */
function componentDirs(dir: string): string[] {
  const full = path.join(ROOT, dir);
  return fs
    .readdirSync(full)
    .filter((n) => fs.existsSync(path.join(full, n, "index.tsx")))
    .sort();
}

describe("AxisCollector (실제 저장소)", () => {
  const collector = new AxisCollector({ rootDir: ROOT });
  let metas: ComponentMeta[] = [];

  beforeAll(async () => {
    const list = await collector.listComponents();
    metas = [];
    for (const item of list) metas.push(await collector.collectComponent(item.id));
  });

  it("두 패키지의 컴포넌트 디렉터리를 하나도 빠짐없이, 그것만 수집합니다", () => {
    const expected = PACKAGES.flatMap((p) => componentDirs(p.dir).map((s) => `axis-${s}`));
    // 양성 대조: 기대 목록이 비어 있으면 아래 비교가 무의미합니다
    expect(expected.length).toBeGreaterThan(40);
    expect(metas.map((m) => m.id)).toEqual(expected);
  });

  it("패키지 루트의 단일 파일(a11y.test.tsx 등)을 컴포넌트로 잡지 않습니다", () => {
    const rootFiles = PACKAGES.flatMap((p) =>
      fs.readdirSync(path.join(ROOT, p.dir)).filter((n) => /\.tsx?$/.test(n))
    );
    // 양성 대조: 루트 단일 파일이 실제로 있어야 이 판정이 의미가 있습니다
    expect(rootFiles).toContain("a11y.test.tsx");
    expect(metas.map((m) => m.slug)).not.toContain("a11y-test");
  });

  it("코드 파일에 테스트 · 스토리 파일을 넣지 않고, 파일 순서는 이름순입니다", () => {
    const withTests = PACKAGES.flatMap((p) =>
      componentDirs(p.dir).filter((s) =>
        fs.readdirSync(path.join(ROOT, p.dir, s)).some((n) => /\.test\.tsx?$/.test(n))
      )
    );
    // 양성 대조: 테스트 파일을 가진 컴포넌트가 실제로 있어야 합니다
    expect(withTests.length).toBeGreaterThan(0);
    for (const m of metas) {
      const paths = m.code.files.map((f) => f.path);
      expect(paths.filter((p) => /\.(test|spec|stories)\.tsx?$/.test(p))).toEqual([]);
      expect(paths).toEqual([...paths].sort());
      expect(paths).toContain("index.tsx");
    }
  });

  it("카테고리는 패키지로 정합니다", () => {
    for (const p of PACKAGES) {
      for (const s of componentDirs(p.dir)) {
        const m = metas.find((x) => x.slug === s);
        // 같은 이름이 두 패키지에 있으면 앞(ui-react)의 것이 남습니다
        if (m && p.category === "agentic" && componentDirs(PACKAGES[0].dir).includes(s)) continue;
        expect(m?.category).toBe(p.category);
      }
    }
  });

  it("모든 문서 URL 은 실재하는 (docs) 라우트를 가리킵니다", () => {
    const withUrl = metas.filter((m) => m.source.url);
    expect(withUrl.length).toBe(metas.length);
    for (const m of withUrl) {
      expect(m.source.url.startsWith(`${AXIS_SITE_URL}/`)).toBe(true);
      const routePath = m.source.url.slice(AXIS_SITE_URL.length + 1);
      expect(fs.existsSync(path.join(DOCS_APP, routePath, "page.tsx")), m.source.url).toBe(true);
    }
  });

  it("approval-card 는 별칭 표대로 /agentic/approval-dialog 문서를 가리킵니다", () => {
    // 양성 대조: 이름 그대로의 라우트는 없고 별칭 대상은 있어야 이 판정이 별칭 경로를 지납니다
    expect(fs.existsSync(path.join(DOCS_APP, "agentic/approval-card/page.tsx"))).toBe(false);
    expect(fs.existsSync(path.join(DOCS_APP, "agentic/approval-dialog/page.tsx"))).toBe(true);
    expect(DOCS_SLUG_ALIASES["agentic/approval-card"]).toBe("agentic/approval-dialog");
    const m = metas.find((x) => x.id === "axis-approval-card");
    expect(m?.source.url).toBe(`${AXIS_SITE_URL}/agentic/approval-dialog`);
  });

  it("데모 페이지(page.tsx)는 코드로 실리지 않습니다", () => {
    for (const m of metas) {
      expect(m.code.files.map((f) => f.path)).not.toContain("page.tsx");
    }
  });
});

describe("AxisCollector 문서 URL 규칙 (픽스처)", () => {
  let root = "";

  beforeAll(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), "axis-collector-"));
    const comp = (pkg: string, slug: string) =>
      fs.outputFile(path.join(root, pkg, slug, "index.tsx"), `/**\n * ${slug} 설명\n */\nexport const X = 1;\n`);
    await comp("packages/axis-ui-react/src", "button");
    await comp("packages/axis-ui-react/src", "no-docs");
    await comp("packages/axis-agentic-ui/src", "approval-card");
    await fs.outputFile(path.join(root, "apps/web/src/app/(docs)/components/button/page.tsx"), "");
    await fs.outputFile(path.join(root, "apps/web/src/app/(docs)/agentic/approval-dialog/page.tsx"), "");
    // 예전 데모 페이지 위치. 컴포넌트로 잡히면 안 됩니다
    await fs.outputFile(path.join(root, "apps/web/src/app/agentic/step-indicator/page.tsx"), "export default 1;\n");
  });

  afterAll(async () => {
    if (root) await fs.remove(root);
  });

  it("라우트가 있으면 그 주소, 별칭 대상이 있으면 별칭 주소, 둘 다 없으면 빈 URL", async () => {
    const c = new AxisCollector({ rootDir: root });
    const ids = (await c.listComponents()).map((i) => i.id);
    expect(ids).toEqual(["axis-button", "axis-no-docs", "axis-approval-card"]);
    expect((await c.collectComponent("axis-button")).source.url).toBe(`${AXIS_SITE_URL}/components/button`);
    expect((await c.collectComponent("axis-approval-card")).source.url).toBe(`${AXIS_SITE_URL}/agentic/approval-dialog`);
    expect((await c.collectComponent("axis-no-docs")).source.url).toBe("");
  });

  it("설명은 컴포넌트 이름 선언 바로 앞 JSDoc 을 먼저 씁니다(Props JSDoc 이 먼저 있어도)", async () => {
    await fs.outputFile(
      path.join(root, "packages/axis-ui-react/src/dropdown-menu/index.tsx"),
      [
        "/**",
        " * DropdownMenu Props",
        " * @property open - 열림",
        " */",
        "export interface DropdownMenuProps { open?: boolean }",
        "",
        "/** 드롭다운 메뉴의 루트 컴포넌트 */",
        "const DropdownMenu = Root;",
        "",
        "/** 트리거 */",
        "const DropdownMenuTrigger = Trigger;",
        "",
      ].join("\n")
    );
    const c = new AxisCollector({ rootDir: root });
    expect((await c.collectComponent("axis-dropdown-menu")).description).toBe("드롭다운 메뉴의 루트 컴포넌트");
    // 이름 선언 JSDoc 이 없으면 종전대로 파일 첫 여러 줄 JSDoc 의 첫 줄
    expect((await c.collectComponent("axis-button")).description).toBe("button 설명");
  });

  it("별칭 대상 라우트도 없으면 빈 URL", async () => {
    await fs.remove(path.join(root, "apps/web/src/app/(docs)/agentic/approval-dialog"));
    const c = new AxisCollector({ rootDir: root });
    expect((await c.collectComponent("axis-approval-card")).source.url).toBe("");
  });
});
