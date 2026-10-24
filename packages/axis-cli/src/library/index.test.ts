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

// fs-extra 의 pathExists 는 콜백 오버로드가 마지막이라 vi.mocked 가 반환 타입을 void 로 잡아요.
// 프로미스 오버로드로 좁혀 mockResolvedValue(boolean) 를 실제 타입대로 씁니다(같은 모의 함수 참조).
const pathExistsMock = vi.mocked(fs.pathExists as (path: string) => Promise<boolean>);


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

  // 실제 원격(ui.shadcn.com · registry.monet.design)에 접속하지 않도록 fetch 를 mock 으로 바꿉니다(WI-0045 D10).
  // collectAll 과 같은 수집 경로를 타는 generateIndex · saveIndex 도 같은 mock 을 씁니다.
  // 테스트 의도(소스별 결과 Map · 결과 형태)는 같고, 네트워크가 막힌 환경에서도 같은 결과가 나옵니다.
  // shadcn index 는 두 항목을 주고, 항목 조회는 그 이름만 200, 나머지는 404 로 답합니다.
  const requested: string[] = [];
  // vi.fn 이 아닌 일반 함수: 바깥 afterEach 의 vi.resetAllMocks 가 구현을 지우지 않게 합니다
  const mockFetch = async (input: unknown): Promise<Response> => {
    const url = String(input);
    requested.push(url);
    const json = (status: number, body: unknown) =>
      ({ ok: status >= 200 && status < 300, status, json: async () => body, text: async () => JSON.stringify(body) }) as unknown as Response;
    if (url === "https://ui.shadcn.com/r/index.json") {
      return json(200, { items: [{ name: "button", description: "Button" }, { name: "card" }] });
    }
    const m = /^https:\/\/ui\.shadcn\.com\/r\/(button|card)\.json$/.exec(url);
    if (m) {
      return json(200, {
        name: m[1],
        type: "registry:ui",
        files: [{ path: `ui/${m[1]}.tsx`, content: `export const ${m[1]} = 1;\n`, type: "registry:ui" }],
      });
    }
    return json(404, { error: "not found" });
  };

  beforeEach(() => {
    curator = new LibraryCurator({ dataDir: ".test/library" });
    vi.clearAllMocks();
    requested.length = 0;
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.resetAllMocks();
    vi.unstubAllGlobals();
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
    it("fetch mock 이 실제 원격 대신 응답한다(측정 대조)", async () => {
      const results = await curator.collectAll(["shadcn"]);
      expect(requested).toContain("https://ui.shadcn.com/r/index.json");
      // mock index 의 두 항목(button · card)만 수집된다(실제 원격 · 기본 목록이 아님)
      expect(results.get("shadcn")?.collected).toBe(2);
      expect(results.get("shadcn")?.success).toBe(true);
      expect(requested.every((u) => u.startsWith("https://"))).toBe(true);
    });

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
      const writeJSONCalls = vi.mocked(fs.writeJSON).mock.calls;
      expect(writeJSONCalls.length).toBeGreaterThan(1);
    });
  });

  describe("loadIndex", () => {
    it("should return null when index does not exist", async () => {
      pathExistsMock.mockResolvedValue(false);
      const index = await curator.loadIndex();
      expect(index).toBeNull();
    });

    it("should load index when it exists", async () => {
      const mockIndex = {
        version: "1.0.0",
        components: [],
        stats: { total: 0 },
      };

      pathExistsMock.mockResolvedValue(true);
      vi.mocked(fs.readJSON).mockResolvedValue(mockIndex);

      const index = await curator.loadIndex();
      expect(index).toEqual(mockIndex);
    });
  });

  describe("searchComponents", () => {
    it("should return empty array when index does not exist", async () => {
      pathExistsMock.mockResolvedValue(false);
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

      pathExistsMock.mockResolvedValue(true);
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

      pathExistsMock.mockResolvedValue(true);
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

      pathExistsMock.mockResolvedValue(true);
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

      pathExistsMock.mockResolvedValue(true);
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

      pathExistsMock.mockResolvedValue(true);
      vi.mocked(fs.readJSON).mockResolvedValue(mockIndex);

      const results = await curator.searchComponents("", { source: "axis" });
      expect(results).toHaveLength(1);
      expect(results[0].source.type).toBe("axis");
    });
  });
});
