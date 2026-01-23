/**
 * Publisher 단위 테스트
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs-extra";
import path from "path";
import { Publisher } from "./publisher.js";
import type { LibraryIndex, ComponentMeta } from "./types.js";

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
      code: [{ path: "button.tsx", content: "export const Button = () => {}", type: "component" }],
      dependencies: [],
      status: "stable",
      checksum: "abc123",
      createdAt: "2026-01-01",
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
      code: [{ path: "card.tsx", content: "export const Card = () => {}", type: "component" }],
      dependencies: [],
      status: "stable",
      checksum: "def456",
      createdAt: "2026-01-01",
      updatedAt: "2026-01-23",
    },
    {
      id: "axis-streaming-text",
      slug: "streaming-text",
      name: "Streaming Text",
      description: "Streaming text component",
      source: { type: "axis", registry: "@axis", url: "https://axis.minu.best" },
      category: "agentic",
      tags: ["agentic", "streaming"],
      code: [{ path: "streaming-text.tsx", content: "export const StreamingText = () => {}", type: "component" }],
      dependencies: [],
      status: "stable",
      checksum: "ghi789",
      createdAt: "2026-01-01",
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

      const calls = (fs.writeFile as any).mock.calls;
      const indexCall = calls.find((call: string[]) => call[0].includes("index.json"));
      expect(indexCall).toBeDefined();
    });

    it("should write category files", async () => {
      await publisher.publish(mockIndex);

      const calls = (fs.writeFile as any).mock.calls;
      const categoryFiles = calls.filter((call: string[]) => call[0].includes("categories"));
      expect(categoryFiles.length).toBeGreaterThan(0);
    });

    it("should write component files", async () => {
      await publisher.publish(mockIndex);

      const calls = (fs.writeFile as any).mock.calls;
      const componentFiles = calls.filter((call: string[]) => call[0].includes("components"));
      expect(componentFiles.length).toBe(3);
    });

    it("should generate search index", async () => {
      await publisher.publish(mockIndex, { generateSearchIndex: true });

      const calls = (fs.writeFile as any).mock.calls;
      const searchCall = calls.find((call: string[]) => call[0].includes("search-index.json"));
      expect(searchCall).toBeDefined();
    });

    it("should respect custom output directory", async () => {
      const customDir = "custom/output/dir";
      await publisher.publish(mockIndex, { outputDir: customDir });

      const ensureDirCalls = (fs.ensureDir as any).mock.calls;
      const hasCustomDir = ensureDirCalls.some((call: string[]) => call[0].includes(customDir));
      expect(hasCustomDir).toBe(true);
    });

    it("should minify output when option is set", async () => {
      await publisher.publish(mockIndex, { minify: true });

      const calls = (fs.writeFile as any).mock.calls;
      // 압축된 JSON은 줄바꿈이 없음
      const hasMinified = calls.some((call: string[]) => {
        const content = call[1];
        return typeof content === "string" && !content.includes("\n");
      });
      expect(hasMinified).toBe(true);
    });
  });

  describe("clean", () => {
    it("should remove output directory", async () => {
      vi.mocked(fs.pathExists).mockResolvedValue(true);
      await publisher.clean();
      expect(fs.remove).toHaveBeenCalled();
    });

    it("should not fail if directory does not exist", async () => {
      vi.mocked(fs.pathExists).mockResolvedValue(false);
      await expect(publisher.clean()).resolves.not.toThrow();
    });
  });

  describe("getStatus", () => {
    it("should return exists: false when no deployment", async () => {
      vi.mocked(fs.pathExists).mockResolvedValue(false);
      const status = await publisher.getStatus();
      expect(status.exists).toBe(false);
    });

    it("should return status when deployment exists", async () => {
      vi.mocked(fs.pathExists).mockResolvedValue(true);
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
