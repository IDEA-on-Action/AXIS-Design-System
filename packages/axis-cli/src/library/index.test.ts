/**
 * LibraryCurator 통합 테스트
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs-extra";
import { LibraryCurator } from "./index.js";

// fs-extra 모킹
vi.mock("fs-extra", () => ({
  default: {
    ensureDir: vi.fn().mockResolvedValue(undefined),
    writeJSON: vi.fn().mockResolvedValue(undefined),
    readJSON: vi.fn().mockResolvedValue(null),
    pathExists: vi.fn().mockResolvedValue(false),
    readdir: vi.fn().mockResolvedValue([]),
    readFile: vi.fn().mockResolvedValue(""),
  },
}));

// ora 모킹
vi.mock("ora", () => ({
  default: () => ({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
    stop: vi.fn().mockReturnThis(),
  }),
}));

describe("LibraryCurator", () => {
  let curator: LibraryCurator;

  beforeEach(() => {
    curator = new LibraryCurator({ dataDir: ".test/library" });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("constructor", () => {
    it("should create instance with default options", () => {
      const defaultCurator = new LibraryCurator();
      expect(defaultCurator).toBeInstanceOf(LibraryCurator);
    });

    it("should accept custom data directory", () => {
      const customCurator = new LibraryCurator({ dataDir: "custom/path" });
      expect(customCurator).toBeInstanceOf(LibraryCurator);
    });
  });

  describe("collectAll", () => {
    it("should collect from all sources by default", async () => {
      const results = await curator.collectAll();

      expect(results).toBeInstanceOf(Map);
      // 4개 소스: shadcn, monet, v0, axis
      expect(results.size).toBe(4);
    });

    it("should collect from specific sources when specified", async () => {
      const results = await curator.collectAll(["shadcn"]);

      expect(results.size).toBe(1);
      expect(results.has("shadcn")).toBe(true);
    });

    it("should handle collection errors gracefully", async () => {
      // shadcn만 수집 (에러 발생해도 계속 진행)
      const results = await curator.collectAll(["shadcn", "monet"]);

      expect(results.size).toBe(2);
      // 각 결과에 에러 정보가 있을 수 있음
      for (const [, result] of results) {
        expect(result).toHaveProperty("success");
        expect(result).toHaveProperty("collected");
      }
    });
  });

  describe("generateIndex", () => {
    it("should generate library index", async () => {
      const index = await curator.generateIndex();

      expect(index).toHaveProperty("version");
      expect(index).toHaveProperty("updatedAt");
      expect(index).toHaveProperty("stats");
      expect(index).toHaveProperty("components");
      expect(index).toHaveProperty("categories");
      expect(index).toHaveProperty("tags");
    });

    it("should have valid stats structure", async () => {
      const index = await curator.generateIndex();

      expect(index.stats).toHaveProperty("total");
      expect(index.stats).toHaveProperty("bySource");
      expect(index.stats).toHaveProperty("byCategory");
      expect(typeof index.stats.total).toBe("number");
    });

    it("should have 10 default categories", async () => {
      const index = await curator.generateIndex();

      expect(index.categories).toHaveLength(10);
      expect(index.categories[0]).toHaveProperty("id");
      expect(index.categories[0]).toHaveProperty("name");
      expect(index.categories[0]).toHaveProperty("description");
    });
  });

  describe("saveIndex", () => {
    it("should save index to file", async () => {
      const index = await curator.generateIndex();
      await curator.saveIndex(index);

      expect(fs.ensureDir).toHaveBeenCalled();
      expect(fs.writeJSON).toHaveBeenCalled();
    });

    it("should create category files", async () => {
      const index = await curator.generateIndex();
      await curator.saveIndex(index);

      // 전체 인덱스 + 카테고리별 파일
      const writeJSONCalls = (fs.writeJSON as any).mock.calls;
      expect(writeJSONCalls.length).toBeGreaterThan(1);
    });
  });

  describe("loadIndex", () => {
    it("should return null when index does not exist", async () => {
      vi.mocked(fs.pathExists).mockResolvedValue(false);
      const index = await curator.loadIndex();
      expect(index).toBeNull();
    });

    it("should load index when it exists", async () => {
      const mockIndex = {
        version: "1.0.0",
        components: [],
        stats: { total: 0 },
      };

      vi.mocked(fs.pathExists).mockResolvedValue(true);
      vi.mocked(fs.readJSON).mockResolvedValue(mockIndex);

      const index = await curator.loadIndex();
      expect(index).toEqual(mockIndex);
    });
  });

  describe("searchComponents", () => {
    it("should return empty array when index does not exist", async () => {
      vi.mocked(fs.pathExists).mockResolvedValue(false);
      const results = await curator.searchComponents("button");
      expect(results).toEqual([]);
    });

    it("should search by name", async () => {
      const mockIndex = {
        version: "1.0.0",
        components: [
          { name: "Button", description: "A button", tags: [], category: "ui", source: { type: "shadcn" } },
          { name: "Card", description: "A card", tags: [], category: "ui", source: { type: "shadcn" } },
        ],
        stats: { total: 2 },
      };

      vi.mocked(fs.pathExists).mockResolvedValue(true);
      vi.mocked(fs.readJSON).mockResolvedValue(mockIndex);

      const results = await curator.searchComponents("button");
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("Button");
    });

    it("should search by description", async () => {
      const mockIndex = {
        version: "1.0.0",
        components: [
          { name: "StreamingText", description: "Real-time text streaming", tags: [], category: "agentic", source: { type: "axis" } },
          { name: "Card", description: "A card container", tags: [], category: "ui", source: { type: "shadcn" } },
        ],
        stats: { total: 2 },
      };

      vi.mocked(fs.pathExists).mockResolvedValue(true);
      vi.mocked(fs.readJSON).mockResolvedValue(mockIndex);

      const results = await curator.searchComponents("streaming");
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("StreamingText");
    });

    it("should search by tags", async () => {
      const mockIndex = {
        version: "1.0.0",
        components: [
          { name: "Button", description: "A button", tags: ["interactive", "form"], category: "ui", source: { type: "shadcn" } },
          { name: "Card", description: "A card", tags: ["container"], category: "ui", source: { type: "shadcn" } },
        ],
        stats: { total: 2 },
      };

      vi.mocked(fs.pathExists).mockResolvedValue(true);
      vi.mocked(fs.readJSON).mockResolvedValue(mockIndex);

      const results = await curator.searchComponents("interactive");
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("Button");
    });

    it("should filter by category", async () => {
      const mockIndex = {
        version: "1.0.0",
        components: [
          { name: "Button", description: "A button", tags: [], category: "ui", source: { type: "shadcn" } },
          { name: "StreamingText", description: "Streaming", tags: [], category: "agentic", source: { type: "axis" } },
        ],
        stats: { total: 2 },
      };

      vi.mocked(fs.pathExists).mockResolvedValue(true);
      vi.mocked(fs.readJSON).mockResolvedValue(mockIndex);

      const results = await curator.searchComponents("", { category: "agentic" });
      expect(results).toHaveLength(1);
      expect(results[0].category).toBe("agentic");
    });

    it("should filter by source", async () => {
      const mockIndex = {
        version: "1.0.0",
        components: [
          { name: "Button", description: "A button", tags: [], category: "ui", source: { type: "shadcn" } },
          { name: "StreamingText", description: "Streaming", tags: [], category: "agentic", source: { type: "axis" } },
        ],
        stats: { total: 2 },
      };

      vi.mocked(fs.pathExists).mockResolvedValue(true);
      vi.mocked(fs.readJSON).mockResolvedValue(mockIndex);

      const results = await curator.searchComponents("", { source: "axis" });
      expect(results).toHaveLength(1);
      expect(results[0].source.type).toBe("axis");
    });
  });
});
