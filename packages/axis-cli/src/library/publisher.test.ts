/**
 * Publisher 단위 테스트
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs-extra";
import { Publisher, resolveRouteSlugs, withRouteSlugs } from "./publisher.js";
import type { ComponentMeta, LibraryIndex } from "./types.js";

// fs-extra 모킹
vi.mock("fs-extra", () => ({
  default: {
    ensureDir: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn().mockResolvedValue(undefined),
    writeJSON: vi.fn().mockResolvedValue(undefined),
    pathExists: vi.fn().mockResolvedValue(false),
    readJson: vi.fn().mockResolvedValue({}),
    remove: vi.fn().mockResolvedValue(undefined),
  },
}));

// fs-extra 의 pathExists 는 콜백 오버로드가 마지막이라 vi.mocked 가 반환 타입을 void 로 잡아요.
// 프로미스 오버로드로 좁혀 mockResolvedValue(boolean) 를 실제 타입대로 씁니다(같은 모의 함수 참조).
const pathExistsMock = vi.mocked(fs.pathExists as (path: string) => Promise<boolean>);


// 테스트용 인덱스 데이터
const mockIndex: LibraryIndex = {
  version: "1.0.0",
  updatedAt: "2026-01-23T10:00:00Z",
  stats: {
    total: 3,
    bySource: { shadcn: 2, axis: 1 },
    byCategory: { ui: 2, agentic: 1 },
  },
  components: [
    {
      id: "shadcn-button",
      slug: "button",
      name: "Button",
      description: "Button component",
      source: { type: "shadcn", registry: "@shadcn", url: "https://ui.shadcn.com" },
      category: "ui",
      tags: ["ui", "interactive"],
      code: { files: [{ path: "button.tsx", content: "export const Button = () => {}", type: "component" }], dependencies: [], devDependencies: [], registryDeps: [] },
      status: "active",
      checksum: "abc123",
      collectedAt: "2026-01-01",
      updatedAt: "2026-01-23",
    },
    {
      id: "shadcn-card",
      slug: "card",
      name: "Card",
      description: "Card component",
      source: { type: "shadcn", registry: "@shadcn", url: "https://ui.shadcn.com" },
      category: "ui",
      tags: ["ui", "container"],
      code: { files: [{ path: "card.tsx", content: "export const Card = () => {}", type: "component" }], dependencies: [], devDependencies: [], registryDeps: [] },
      status: "active",
      checksum: "def456",
      collectedAt: "2026-01-01",
      updatedAt: "2026-01-23",
    },
    {
      id: "axis-streaming-text",
      slug: "streaming-text",
      name: "Streaming Text",
      description: "Streaming text component",
      source: { type: "axis", registry: "@axis", url: "https://axis-design-system.pages.dev" },
      category: "agentic",
      tags: ["agentic", "streaming"],
      code: { files: [{ path: "streaming-text.tsx", content: "export const StreamingText = () => {}", type: "component" }], dependencies: [], devDependencies: [], registryDeps: [] },
      status: "active",
      checksum: "ghi789",
      collectedAt: "2026-01-01",
      updatedAt: "2026-01-23",
    },
  ],
  categories: [
    { id: "ui", name: "UI", description: "UI components", icon: "layers", order: 1 },
    { id: "agentic", name: "Agentic", description: "Agentic components", icon: "bot", order: 2 },
  ],
  tags: [
    { id: "ui", name: "ui", count: 2 },
    { id: "agentic", name: "agentic", count: 1 },
  ],
};

describe("Publisher", () => {
  let publisher: Publisher;

  beforeEach(() => {
    publisher = new Publisher();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("publish", () => {
    it("should publish library index successfully", async () => {
      const result = await publisher.publish(mockIndex);

      expect(result.success).toBe(true);
      expect(result.stats.totalComponents).toBe(3);
      expect(result.stats.categoriesPublished).toBe(2);
      expect(result.files.length).toBeGreaterThan(0);
    });

    it("should create output directory", async () => {
      await publisher.publish(mockIndex);
      expect(fs.ensureDir).toHaveBeenCalled();
    });

    it("should write index.json", async () => {
      await publisher.publish(mockIndex);

      const calls = vi.mocked(fs.writeFile).mock.calls;
      const indexCall = calls.find((call) => String(call[0]).includes("index.json"));
      expect(indexCall).toBeDefined();
    });

    it("should write category files", async () => {
      await publisher.publish(mockIndex);

      const calls = vi.mocked(fs.writeFile).mock.calls;
      const categoryFiles = calls.filter((call) => String(call[0]).includes("categories"));
      expect(categoryFiles.length).toBeGreaterThan(0);
    });

    it("should write component files", async () => {
      await publisher.publish(mockIndex);

      const calls = vi.mocked(fs.writeFile).mock.calls;
      const componentFiles = calls.filter((call) => String(call[0]).includes("components"));
      expect(componentFiles.length).toBe(3);
    });

    it("상세 데이터 파일을 components/<id>.json 으로 씁니다 (WI-0060 D2)", async () => {
      await publisher.publish(mockIndex);

      const written = vi
        .mocked(fs.writeFile)
        .mock.calls.map((call) => String(call[0]).replace(/\\/g, "/"))
        .filter((p) => p.includes("/components/"));
      expect(written.sort()).toEqual([
        "apps/web/public/library/components/axis-streaming-text.json",
        "apps/web/public/library/components/shadcn-button.json",
        "apps/web/public/library/components/shadcn-card.json",
      ]);
    });

    it("같은 상세 주소를 쓰는 외부 항목은 slug 를 <source>-<slug> 로 바꿔 씁니다 (WI-0060)", async () => {
      const axisButton: ComponentMeta = { ...mockIndex.components[2], id: "axis-button", slug: "button", name: "Button", category: "ui" };
      const result = await publisher.publish({ ...mockIndex, components: [...mockIndex.components, axisButton] });
      expect(result.success).toBe(true);

      const calls = vi.mocked(fs.writeFile).mock.calls;
      const contentOf = (suffix: string) =>
        JSON.parse(String(calls.find((call) => String(call[0]).replace(/\\/g, "/").endsWith(suffix))![1]));
      expect(contentOf("components/shadcn-button.json").slug).toBe("shadcn-button");
      expect(contentOf("components/axis-button.json").slug).toBe("button");
      const search = contentOf("search-index.json") as Array<{ id: string; url: string }>;
      expect(search.find((s) => s.id === "shadcn-button")!.url).toBe("/library/ui/shadcn-button");
      expect(search.find((s) => s.id === "axis-button")!.url).toBe("/library/ui/button");
      const index = contentOf("library/index.json") as { components: Array<{ id: string; slug: string }> };
      expect(index.components.find((c) => c.id === "shadcn-button")!.slug).toBe("shadcn-button");
      // 원본 입력은 바꾸지 않습니다
      expect(mockIndex.components[0].slug).toBe("button");
    });

    it("should generate search index", async () => {
      await publisher.publish(mockIndex, { generateSearchIndex: true });

      const calls = vi.mocked(fs.writeFile).mock.calls;
      const searchCall = calls.find((call) => String(call[0]).includes("search-index.json"));
      expect(searchCall).toBeDefined();
    });

    it("should respect custom output directory", async () => {
      const customDir = "custom/output/dir";
      await publisher.publish(mockIndex, { outputDir: customDir });

      const ensureDirCalls = vi.mocked(fs.ensureDir).mock.calls;
      const hasCustomDir = ensureDirCalls.some((call) => String(call[0]).includes(customDir));
      expect(hasCustomDir).toBe(true);
    });

    it("should minify output when option is set", async () => {
      await publisher.publish(mockIndex, { minify: true });

      const calls = vi.mocked(fs.writeFile).mock.calls;
      // 압축된 JSON은 줄바꿈이 없음
      const hasMinified = calls.some((call) => {
        const content = call[1];
        return typeof content === "string" && !content.includes("\n");
      });
      expect(hasMinified).toBe(true);
    });
  });

  describe("clean", () => {
    it("should remove output directory", async () => {
      pathExistsMock.mockResolvedValue(true);
      await publisher.clean();
      expect(fs.remove).toHaveBeenCalled();
    });

    it("should not fail if directory does not exist", async () => {
      pathExistsMock.mockResolvedValue(false);
      await expect(publisher.clean()).resolves.not.toThrow();
    });
  });

  describe("getStatus", () => {
    it("should return exists: false when no deployment", async () => {
      pathExistsMock.mockResolvedValue(false);
      const status = await publisher.getStatus();
      expect(status.exists).toBe(false);
    });

    it("should return status when deployment exists", async () => {
      pathExistsMock.mockResolvedValue(true);
      vi.mocked(fs.readJson).mockResolvedValue({
        updatedAt: "2026-01-23T10:00:00Z",
        stats: { total: 10 },
      });

      const status = await publisher.getStatus();
      expect(status.exists).toBe(true);
      expect(status.lastUpdated).toBe("2026-01-23T10:00:00Z");
      expect(status.componentCount).toBe(10);
    });
  });
});

describe("resolveRouteSlugs (WI-0060)", () => {
  const item = (id: string, slug: string, category: string, source: string) => ({ id, slug, category, source });

  it("같은 (category, slug) 면 AXIS 가 slug 를 지키고 외부 항목은 <source>-<slug>", () => {
    const r = resolveRouteSlugs([
      item("shadcn-button", "button", "ui", "shadcn"),
      item("axis-button", "button", "ui", "axis"),
      item("monet-button", "button", "ui", "monet"),
    ]);
    expect(Object.fromEntries(r)).toEqual({ "shadcn-button": "shadcn-button", "axis-button": "button", "monet-button": "monet-button" });
  });

  it("카테고리가 다르면 주소가 달라 바꾸지 않습니다", () => {
    const r = resolveRouteSlugs([item("shadcn-badge", "badge", "data-display", "shadcn"), item("axis-badge", "badge", "ui", "axis")]);
    expect(Object.fromEntries(r)).toEqual({ "shadcn-badge": "badge", "axis-badge": "badge" });
  });

  it("AXIS 가 없으면 순서상 첫 항목이 slug 를 지킵니다", () => {
    const r = resolveRouteSlugs([item("monet-hero", "hero", "ui", "monet"), item("shadcn-hero", "hero", "ui", "shadcn")]);
    expect(Object.fromEntries(r)).toEqual({ "monet-hero": "hero", "shadcn-hero": "shadcn-hero" });
  });

  it("source 가 { type } 형태여도 같게 판정하고, 결과에 다시 돌려도 바뀌지 않습니다", () => {
    const once = withRouteSlugs([
      { id: "shadcn-toggle", slug: "toggle", category: "ui", source: { type: "shadcn" } },
      { id: "axis-toggle", slug: "toggle", category: "ui", source: { type: "axis" } },
    ]);
    expect(once.map((c) => c.slug)).toEqual(["shadcn-toggle", "toggle"]);
    expect(withRouteSlugs(once)).toEqual(once);
  });

  it("한 주소에 AXIS 가 둘이거나 바꾼 뒤에도 겹치면 멈춥니다", () => {
    expect(() => resolveRouteSlugs([item("axis-a", "a", "ui", "axis"), item("axis-a2", "a", "ui", "axis")])).toThrow(/AXIS 항목/);
    expect(() =>
      resolveRouteSlugs([
        item("shadcn-x", "x", "ui", "shadcn"),
        item("axis-x", "x", "ui", "axis"),
        item("other", "shadcn-x", "ui", "monet"),
      ])
    ).toThrow(/겹칩니다/);
  });
});
