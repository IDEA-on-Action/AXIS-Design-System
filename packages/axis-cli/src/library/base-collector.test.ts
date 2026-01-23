/**
 * BaseCollector 단위 테스트
 */

import { describe, it, expect } from "vitest";
import { BaseCollector } from "./base-collector.js";
import type { ComponentMeta, ComponentListItem, CodeFile } from "./types.js";

// 테스트용 구체 클래스
class TestCollector extends BaseCollector {
  readonly sourceType = "shadcn" as const;

  async listComponents(): Promise<ComponentListItem[]> {
    return [
      { id: "test-button", name: "Button", description: "Test button", category: "ui", source: "shadcn" },
      { id: "test-input", name: "Input", description: "Test input", category: "form", source: "shadcn" },
    ];
  }

  async collectComponent(id: string): Promise<ComponentMeta> {
    const codeFiles: CodeFile[] = [
      { path: "button.tsx", content: "export const Button = () => <button>Click</button>", type: "component" },
    ];

    return this.createBaseMeta("Button", "Test button component", codeFiles, {
      registry: "@shadcn",
      url: "https://ui.shadcn.com/docs/components/button",
    });
  }

  // 테스트용으로 protected 메서드 노출
  public testClassifyCategory(name: string, code?: string) {
    return this.classifyCategory(name, code);
  }

  public testExtractTags(name: string, code?: string) {
    return this.extractTags(name, code);
  }

  public testCalculateChecksum(content: string) {
    return this.calculateChecksum(content);
  }

  public testGenerateSlug(name: string) {
    return this.generateSlug(name);
  }
}

describe("BaseCollector", () => {
  const collector = new TestCollector();

  describe("classifyCategory", () => {
    it("should classify form components", () => {
      expect(collector.testClassifyCategory("input")).toBe("form");
      expect(collector.testClassifyCategory("select")).toBe("form");
      expect(collector.testClassifyCategory("checkbox")).toBe("form");
      expect(collector.testClassifyCategory("textarea")).toBe("form");
      expect(collector.testClassifyCategory("label")).toBe("form");
    });

    it("should classify navigation components", () => {
      expect(collector.testClassifyCategory("tabs")).toBe("navigation");
      expect(collector.testClassifyCategory("breadcrumb")).toBe("navigation");
      expect(collector.testClassifyCategory("pagination")).toBe("navigation");
      expect(collector.testClassifyCategory("menu")).toBe("navigation");
    });

    it("should classify feedback components", () => {
      expect(collector.testClassifyCategory("toast")).toBe("feedback");
      expect(collector.testClassifyCategory("alert")).toBe("feedback");
      expect(collector.testClassifyCategory("progress")).toBe("feedback");
      expect(collector.testClassifyCategory("skeleton")).toBe("feedback");
    });

    it("should classify overlay components", () => {
      expect(collector.testClassifyCategory("dialog")).toBe("overlay");
      expect(collector.testClassifyCategory("modal")).toBe("overlay");
      expect(collector.testClassifyCategory("popover")).toBe("overlay");
      expect(collector.testClassifyCategory("tooltip")).toBe("overlay");
      expect(collector.testClassifyCategory("drawer")).toBe("overlay");
    });

    it("should classify layout components", () => {
      expect(collector.testClassifyCategory("separator")).toBe("layout");
      expect(collector.testClassifyCategory("divider")).toBe("layout");
      expect(collector.testClassifyCategory("grid")).toBe("layout");
      expect(collector.testClassifyCategory("container")).toBe("layout");
    });

    it("should classify data-display components", () => {
      expect(collector.testClassifyCategory("table")).toBe("data-display");
      expect(collector.testClassifyCategory("avatar")).toBe("data-display");
      expect(collector.testClassifyCategory("badge")).toBe("data-display");
      // card matches data-display pattern
      expect(collector.testClassifyCategory("card")).toBe("data-display");
    });

    it("should classify chart components", () => {
      expect(collector.testClassifyCategory("chart")).toBe("chart");
      expect(collector.testClassifyCategory("bar-chart")).toBe("chart");
      expect(collector.testClassifyCategory("pie-chart")).toBe("chart");
    });

    it("should classify agentic components", () => {
      expect(collector.testClassifyCategory("streaming")).toBe("agentic");
      expect(collector.testClassifyCategory("agent")).toBe("agentic");
      expect(collector.testClassifyCategory("tool-call")).toBe("agentic");
      expect(collector.testClassifyCategory("approval")).toBe("agentic");
    });

    it("should default to ui for unknown components", () => {
      // button has no matching pattern, so it defaults to ui
      expect(collector.testClassifyCategory("button")).toBe("ui");
      expect(collector.testClassifyCategory("unknown-component")).toBe("ui");
    });

    it("should classify by code content when name is ambiguous", () => {
      const agenticCode = `
        import { StreamingText } from '@axis-ds/agentic-ui';
        export function MyComponent() { return <StreamingText />; }
      `;
      expect(collector.testClassifyCategory("my-component", agenticCode)).toBe("agentic");
    });
  });

  describe("extractTags", () => {
    it("should extract tags based on name patterns", () => {
      // button name adds "interactive" tag
      const buttonTags = collector.testExtractTags("button");
      expect(buttonTags).toContain("interactive");

      // card name adds "container" tag
      const cardTags = collector.testExtractTags("card");
      expect(cardTags).toContain("container");

      // input name adds "input" tag
      const inputTags = collector.testExtractTags("input");
      expect(inputTags).toContain("input");
    });

    it("should extract tags from code patterns", () => {
      const code = `
        import { useState } from 'react';
        import { motion } from 'framer-motion';
      `;
      const tags = collector.testExtractTags("my-component", code);
      expect(tags).toContain("stateful");
      expect(tags).toContain("animated");
    });

    it("should identify accessible components", () => {
      const code = `
        export function Button({ onClick }) {
          return <button aria-label="Click me" onClick={onClick}>Click</button>;
        }
      `;
      const tags = collector.testExtractTags("button", code);
      expect(tags).toContain("accessible");
    });

    it("should identify components with side effects", () => {
      const code = `
        import { useEffect } from 'react';
        export function MyComponent() {
          useEffect(() => {}, []);
          return <div />;
        }
      `;
      const tags = collector.testExtractTags("my-component", code);
      expect(tags).toContain("side-effects");
    });
  });

  describe("calculateChecksum", () => {
    it("should generate consistent checksums", () => {
      const content = "export const Button = () => <button>Click</button>";
      const checksum1 = collector.testCalculateChecksum(content);
      const checksum2 = collector.testCalculateChecksum(content);
      expect(checksum1).toBe(checksum2);
    });

    it("should generate different checksums for different content", () => {
      const content1 = "export const Button = () => <button>Click</button>";
      const content2 = "export const Button = () => <button>Submit</button>";
      const checksum1 = collector.testCalculateChecksum(content1);
      const checksum2 = collector.testCalculateChecksum(content2);
      expect(checksum1).not.toBe(checksum2);
    });

    it("should return 8 character hex string", () => {
      const content = "test content";
      const checksum = collector.testCalculateChecksum(content);
      expect(checksum).toHaveLength(8);
      expect(/^[a-f0-9]+$/.test(checksum)).toBe(true);
    });
  });

  describe("generateSlug", () => {
    it("should convert to lowercase", () => {
      expect(collector.testGenerateSlug("Button")).toBe("button");
      expect(collector.testGenerateSlug("CARD")).toBe("card");
    });

    it("should handle already lowercase names", () => {
      expect(collector.testGenerateSlug("button")).toBe("button");
    });

    it("should replace spaces with hyphens", () => {
      expect(collector.testGenerateSlug("Streaming Text")).toBe("streaming-text");
    });

    it("should replace non-alphanumeric with hyphens", () => {
      expect(collector.testGenerateSlug("my_component")).toBe("my-component");
      expect(collector.testGenerateSlug("my.component")).toBe("my-component");
    });

    it("should remove leading and trailing hyphens", () => {
      expect(collector.testGenerateSlug("-button-")).toBe("button");
      expect(collector.testGenerateSlug("--card--")).toBe("card");
    });

    // Note: Current implementation doesn't convert PascalCase to kebab-case
    // StreamingText becomes "streamingtext" not "streaming-text"
    it("should handle PascalCase (current behavior)", () => {
      expect(collector.testGenerateSlug("StreamingText")).toBe("streamingtext");
      expect(collector.testGenerateSlug("ToolCallCard")).toBe("toolcallcard");
    });
  });

  describe("listComponents", () => {
    it("should return component list", async () => {
      const list = await collector.listComponents();
      expect(list).toHaveLength(2);
      expect(list[0].id).toBe("test-button");
      expect(list[1].id).toBe("test-input");
    });
  });

  describe("collectComponent", () => {
    it("should collect component metadata", async () => {
      const meta = await collector.collectComponent("test-button");
      expect(meta.name).toBe("Button");
      expect(meta.description).toBe("Test button component");
      expect(meta.source.type).toBe("shadcn");
      // code is an object with files array, not an array itself
      expect(meta.code).toHaveProperty("files");
      expect(meta.code.files).toHaveLength(1);
    });

    it("should have valid meta structure", async () => {
      const meta = await collector.collectComponent("test-button");
      expect(meta).toHaveProperty("id");
      expect(meta).toHaveProperty("slug");
      expect(meta).toHaveProperty("name");
      expect(meta).toHaveProperty("description");
      expect(meta).toHaveProperty("source");
      expect(meta).toHaveProperty("category");
      expect(meta).toHaveProperty("tags");
      expect(meta).toHaveProperty("code");
      expect(meta).toHaveProperty("status");
      expect(meta).toHaveProperty("checksum");
    });
  });

  describe("collectAll", () => {
    it("should collect all components", async () => {
      const result = await collector.collectAll();
      expect(result.success).toBe(true);
      expect(result.collected).toBe(2);
      expect(result.items).toHaveLength(2);
    });

    it("should return valid result structure", async () => {
      const result = await collector.collectAll();
      expect(result).toHaveProperty("source");
      expect(result).toHaveProperty("timestamp");
      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("collected");
      expect(result).toHaveProperty("updated");
      expect(result).toHaveProperty("failed");
      expect(result).toHaveProperty("items");
      expect(result).toHaveProperty("errors");
    });
  });
});
