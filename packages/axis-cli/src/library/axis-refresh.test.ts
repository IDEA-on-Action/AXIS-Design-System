/**
 * refreshAxisLibrary 테스트 (WI-0057 D1)
 *
 * 픽스처 저장소에서 AXIS 항목만 다시 만들 때 외부 소스 항목이 바이트 · 객체 그대로인지, 낡은 AXIS 항목이 지워지는지,
 * 같은 소스로 다시 돌리면 아무 파일도 바뀌지 않는지(결정성) 봅니다.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import os from "os";
import path from "path";
import { refreshAxisLibrary, defaultUpdatedAt } from "./axis-refresh.js";

const T0 = "2026-01-01T00:00:00.000Z";
const T1 = "2026-10-23T00:00:00.000Z";
const T2 = "2026-12-31T00:00:00.000Z";

function pub(id: string, slug: string, type: string, category: string, extra: Record<string, unknown> = {}) {
  return {
    id,
    slug,
    name: slug,
    description: `${slug} 설명`,
    category,
    source: { type, registry: `@${type}`, url: type === "axis" ? `https://axis-design-system.pages.dev/x/${slug}` : `https://example.test/${slug}` },
    tags: [type],
    code: { files: [], dependencies: [], devDependencies: [], registryDeps: [] },
    status: "active",
    updatedAt: T0,
    ...extra,
  };
}
const idx = (c: ReturnType<typeof pub>) => ({
  id: c.id,
  slug: c.slug,
  name: c.name,
  description: c.description,
  category: c.category,
  source: c.source.type,
  tags: c.tags,
  status: c.status,
});
const srch = (c: ReturnType<typeof pub>) => ({
  id: c.id,
  slug: c.slug,
  name: c.name,
  description: c.description,
  category: c.category,
  source: c.source.type,
  tags: c.tags,
  url: `/library/${c.category}/${c.slug}`,
});

const CATEGORIES = [
  { id: "ui", name: "UI", description: "기본", icon: "layers", order: 1 },
  { id: "agentic", name: "Agentic", description: "에이전트", icon: "bot", order: 2 },
  { id: "form", name: "Form", description: "폼", icon: "text-cursor-input", order: 3 },
];

describe("refreshAxisLibrary", () => {
  let root = "";
  let lib = "";
  const shadcnButton = pub("shadcn-button", "button", "shadcn", "ui");
  const monetHero = pub("monet-hero", "hero", "monet", "ui");
  // index.json 에서만 빠진 외부 항목(2026-02-01 손수정과 같은 모양)
  const shadcnInput = pub("shadcn-input", "input", "shadcn", "form");
  const staleAxis = pub("axis-step-indicator", "step-indicator", "axis", "agentic");
  const oldAxisCard = pub("axis-card", "card", "axis", "ui");

  async function writeJson(rel: string, data: unknown) {
    await fs.outputFile(path.join(lib, rel), JSON.stringify(data, null, 2));
  }

  async function snapshot(): Promise<Record<string, string>> {
    const out: Record<string, string> = {};
    for (const rel of ["index.json", "search-index.json", "meta.json"]) {
      out[rel] = await fs.readFile(path.join(lib, rel), "utf-8");
    }
    for (const dir of ["categories", "components"]) {
      for (const n of (await fs.readdir(path.join(lib, dir))).sort()) {
        out[`${dir}/${n}`] = await fs.readFile(path.join(lib, dir, n), "utf-8");
      }
    }
    return out;
  }

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), "axis-refresh-"));
    lib = path.join(root, "apps/web/public/library");
    // 소스: ui-react card · agentic approval-card, 문서 라우트: components/card · agentic/approval-dialog
    await fs.outputFile(
      path.join(root, "packages/axis-ui-react/src/card/index.tsx"),
      "/**\n * 카드\n */\nexport function Card() { return null; }\n"
    );
    await fs.outputFile(path.join(root, "packages/axis-ui-react/src/card/card.test.tsx"), "test\n");
    // shadcn button 과 slug 가 겹치는 새 AXIS 컴포넌트
    await fs.outputFile(
      path.join(root, "packages/axis-ui-react/src/button/index.tsx"),
      "/**\n * 버튼\n */\nexport function Button() { return null; }\n"
    );
    await fs.outputFile(path.join(root, "apps/web/src/app/(docs)/components/button/page.tsx"), "");
    await fs.outputFile(
      path.join(root, "packages/axis-agentic-ui/src/approval-card/index.tsx"),
      "/**\n * 승인 카드\n */\nexport function ApprovalCard() { return null; }\n"
    );
    await fs.outputFile(path.join(root, "apps/web/src/app/(docs)/components/card/page.tsx"), "");
    await fs.outputFile(path.join(root, "apps/web/src/app/(docs)/agentic/approval-dialog/page.tsx"), "");

    const indexEntries = [idx(shadcnButton), idx(staleAxis), idx(monetHero), idx(oldAxisCard)];
    await writeJson("index.json", { version: "1.0.0", updatedAt: T0, stats: { total: 0, bySource: {}, byCategory: {} }, categories: CATEGORIES, components: indexEntries });
    await writeJson("search-index.json", [srch(shadcnButton), srch(shadcnInput), srch(monetHero), srch(staleAxis), srch(oldAxisCard)]);
    await writeJson("meta.json", { version: "1.0.0", updatedAt: T0, stats: { total: 0, bySource: {}, byCategory: {} }, categories: CATEGORIES, tags: [] });
    const cat = (id: string, comps: unknown[]) => ({ category: id, name: id, description: id, icon: "x", count: comps.length, components: comps });
    await writeJson("categories/ui.json", cat("ui", [shadcnButton, monetHero, oldAxisCard]));
    await writeJson("categories/agentic.json", cat("agentic", [staleAxis]));
    await writeJson("categories/form.json", cat("form", [shadcnInput]));
    // 외부 파일은 일부러 키 순서 · 들여쓰기를 다르게 둡니다. 바이트 그대로인지 보려는 것입니다
    await fs.outputFile(path.join(lib, "components/button.json"), JSON.stringify(shadcnButton) + "\n");
    await fs.outputFile(path.join(lib, "components/hero.json"), JSON.stringify(monetHero, null, 4));
    await writeJson("components/input.json", shadcnInput);
    await writeJson("components/step-indicator.json", staleAxis);
    await writeJson("components/card.json", oldAxisCard);
  });

  afterEach(async () => {
    if (root) await fs.remove(root);
  });

  it("AXIS 항목만 다시 만들고 외부 항목은 내용 그대로 components/<id>.json 으로 옮깁니다", async () => {
    const before = await snapshot();
    const result = await refreshAxisLibrary({ rootDir: root, updatedAt: T1 });

    expect(result.added).toEqual(["axis-button", "axis-approval-card"]);
    expect(result.changed).toEqual(["axis-card"]);
    expect(result.removed).toEqual(["axis-step-indicator"]);
    // 옛 components/<slug>.json 은 모두 지우고 항목마다 components/<id>.json (WI-0060 D2)
    expect(result.removedFiles.sort()).toEqual([
      "components/button.json",
      "components/card.json",
      "components/hero.json",
      "components/input.json",
      "components/step-indicator.json",
    ]);
    // 새 AXIS button 과 상세 주소(/library/ui/button)가 겹치는 shadcn button 만 slug 를 바꿉니다(WI-0060)
    expect(result.renamedSlugs).toEqual({ "shadcn-button": "shadcn-button" });

    const after = await snapshot();
    expect(Object.keys(after).filter((k) => k.startsWith("components/")).sort()).toEqual([
      "components/axis-approval-card.json",
      "components/axis-button.json",
      "components/axis-card.json",
      "components/monet-hero.json",
      "components/shadcn-button.json",
      "components/shadcn-input.json",
    ]);
    // 외부 파일: 내용이 같으면 옛 파일 바이트 그대로 옮김(키 순서 · 들여쓰기 유지)
    expect(after["components/monet-hero.json"]).toBe(before["components/hero.json"]);
    expect(after["components/shadcn-input.json"]).toBe(before["components/input.json"]);
    // slug 가 바뀐 shadcn button 은 자기 데이터(AXIS 코드 아님)를 새 slug 로
    const shadcnButtonFile = JSON.parse(after["components/shadcn-button.json"]);
    expect(shadcnButtonFile).toEqual({ ...shadcnButton, slug: "shadcn-button" });
    const axisButtonFile = JSON.parse(after["components/axis-button.json"]);
    expect(axisButtonFile.id).toBe("axis-button");
    expect(axisButtonFile.slug).toBe("button");

    const index = JSON.parse(after["index.json"]);
    const search = JSON.parse(after["search-index.json"]);
    const meta = JSON.parse(after["meta.json"]);
    // 외부 항목 순서: search-index 순서(shadcn-button, shadcn-input, monet-hero), 그 뒤 AXIS 수집 순서
    expect(index.components.map((c: { id: string }) => c.id)).toEqual([
      "shadcn-button",
      "shadcn-input",
      "monet-hero",
      "axis-button",
      "axis-card",
      "axis-approval-card",
    ]);
    // index.json 에서 빠져 있던 shadcn-input 은 같은 형태로 채워집니다
    expect(index.components[1]).toEqual(idx(shadcnInput));
    const renamedButton = { ...shadcnButton, slug: "shadcn-button" };
    expect(index.components[0]).toEqual(idx(renamedButton));
    expect(search.slice(0, 3)).toEqual([srch(renamedButton), srch(shadcnInput), srch(monetHero)]);
    expect(search[0].url).toBe("/library/ui/shadcn-button");
    expect(search.find((s: { id: string }) => s.id === "axis-button").url).toBe("/library/ui/button");
    expect(search.map((s: { id: string }) => s.id)).toEqual(index.components.map((c: { id: string }) => c.id));

    const ui = JSON.parse(after["categories/ui.json"]);
    expect(ui.components.slice(0, 2)).toEqual([renamedButton, monetHero]);
    expect(ui.components.map((c: { id: string }) => c.id)).toEqual(["shadcn-button", "monet-hero", "axis-button", "axis-card"]);
    expect(ui.count).toBe(4);
    expect(JSON.parse(after["categories/form.json"]).components).toEqual([shadcnInput]);
    const agentic = JSON.parse(after["categories/agentic.json"]);
    expect(agentic.components.map((c: { id: string }) => c.id)).toEqual(["axis-approval-card"]);

    // AXIS 항목: 문서 별칭 · 테스트 파일 제외 · updatedAt
    const approval = JSON.parse(after["components/axis-approval-card.json"]);
    expect(approval.source.url).toBe("https://axis-design-system.pages.dev/agentic/approval-dialog");
    expect(approval.updatedAt).toBe(T1);
    const card = JSON.parse(after["components/axis-card.json"]);
    expect(card.code.files.map((f: { path: string }) => f.path)).toEqual(["index.tsx"]);

    // 통계 · updatedAt
    expect(index.stats).toEqual({
      total: 6,
      bySource: { shadcn: 2, monet: 1, axis: 3 },
      byCategory: { ui: 4, form: 1, agentic: 1 },
    });
    expect(meta.stats).toEqual(index.stats);
    expect(index.updatedAt).toBe(T1);
    expect(meta.updatedAt).toBe(T1);
    expect(meta.categories).toEqual(CATEGORIES);
  });

  it("같은 소스로 다시 돌리면 updatedAt 을 바꿔 줘도 아무 파일도 바뀌지 않습니다", async () => {
    await refreshAxisLibrary({ rootDir: root, updatedAt: T1 });
    const first = await snapshot();
    const second = await refreshAxisLibrary({ rootDir: root, updatedAt: T2 });
    expect(second.writtenFiles).toEqual([]);
    expect(second.removedFiles).toEqual([]);
    // 이미 바꾼 slug(shadcn-button)는 다시 겹치지 않습니다
    expect(second.renamedSlugs).toEqual({});
    expect(second.added).toEqual([]);
    expect(second.changed).toEqual([]);
    expect(second.unchanged.sort()).toEqual(["axis-approval-card", "axis-button", "axis-card"]);
    expect(await snapshot()).toEqual(first);
  });

  it("소스가 바뀐 항목만 새 updatedAt 을 받습니다", async () => {
    await refreshAxisLibrary({ rootDir: root, updatedAt: T1 });
    await fs.appendFile(path.join(root, "packages/axis-ui-react/src/card/index.tsx"), "export const Y = 2;\n");
    const r = await refreshAxisLibrary({ rootDir: root, updatedAt: T2 });
    expect(r.changed).toEqual(["axis-card"]);
    expect(r.unchanged).toEqual(["axis-button", "axis-approval-card"]);
    expect(JSON.parse(await fs.readFile(path.join(lib, "components/axis-card.json"), "utf-8")).updatedAt).toBe(T2);
    expect(JSON.parse(await fs.readFile(path.join(lib, "components/axis-approval-card.json"), "utf-8")).updatedAt).toBe(T1);
  });

  it("카테고리가 다른 같은 slug 는 주소가 달라 바꾸지 않고, 각자 자기 파일을 가집니다", async () => {
    // shadcn data-display/card 와 AXIS ui/card: 주소가 달라 slug 유지(배포 데이터의 25쌍과 같은 모양)
    const shadcnCard = pub("shadcn-card", "card", "shadcn", "form");
    const s = JSON.parse(await fs.readFile(path.join(lib, "search-index.json"), "utf-8"));
    await writeJson("search-index.json", [...s, srch(shadcnCard)]);
    const form = JSON.parse(await fs.readFile(path.join(lib, "categories/form.json"), "utf-8"));
    await writeJson("categories/form.json", { ...form, count: 2, components: [...form.components, shadcnCard] });
    const r = await refreshAxisLibrary({ rootDir: root, updatedAt: T1 });
    expect(r.renamedSlugs).toEqual({ "shadcn-button": "shadcn-button" });
    const after = await snapshot();
    expect(JSON.parse(after["components/shadcn-card.json"])).toEqual(shadcnCard);
    expect(JSON.parse(after["components/axis-card.json"]).source.type).toBe("axis");
    const index = JSON.parse(after["index.json"]);
    const routes = index.components.map((c: { category: string; slug: string }) => `${c.category}/${c.slug}`);
    expect(new Set(routes).size).toBe(routes.length);
  });

  it("dryRun 은 파일을 바꾸지 않습니다", async () => {
    const before = await snapshot();
    const r = await refreshAxisLibrary({ rootDir: root, updatedAt: T1, dryRun: true });
    expect(r.writtenFiles.length).toBeGreaterThan(0);
    expect(await snapshot()).toEqual(before);
  });

  it("AXIS 컴포넌트를 하나도 못 찾으면 아무것도 지우지 않고 멈춥니다", async () => {
    const before = await snapshot();
    await expect(refreshAxisLibrary({ rootDir: path.join(root, "없는-경로"), libraryDir: lib, updatedAt: T1 })).rejects.toThrow(
      /하나도 찾지 못했습니다/
    );
    expect(await snapshot()).toEqual(before);
  });

  it("updatedAt 형식이 틀리면 멈춥니다", async () => {
    await expect(refreshAxisLibrary({ rootDir: root, updatedAt: "2026-10-23" })).rejects.toThrow(/ISO 8601/);
  });

  it("defaultUpdatedAt 은 KST 날짜의 00:00Z 입니다", () => {
    // 2026-10-22T16:00Z 는 KST 2026-10-23 01:00
    expect(defaultUpdatedAt(new Date("2026-10-22T16:00:00Z"))).toBe("2026-10-23T00:00:00.000Z");
    expect(defaultUpdatedAt(new Date("2026-10-22T14:59:59Z"))).toBe("2026-10-22T00:00:00.000Z");
  });
});
