import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import os from "os";
import path from "path";
import {
  AXIS_CONFIG_SCHEMA_URL,
  createInitConfig,
  createTemplateConfig,
  readAxisConfig,
} from "./axis-config.js";

// 기대값은 정정 전(f1777ee) 산출물입니다.
// `axis init -y` 는 빌드한 CLI 를 임시 디렉터리에서 실행해 받은 파일 그대로이고,
// `axis template init` 은 template-apply.ts 의 객체 리터럴을 옮긴 것입니다(WI-0028 T1-3).
const INIT_Y_BEFORE = `{
  "$schema": "https://axis.minu.best/schema.json",
  "componentsDir": "./src/components/ui",
  "tailwindConfig": "./tailwind.config.ts",
  "globalCss": "./src/app/globals.css",
  "registry": "https://axis-design-system.pages.dev/r"
}
`;

const TEMPLATE_INIT_BEFORE = `{
  "$schema": "https://axis.minu.best/schema.json",
  "template": "theme-only",
  "componentsDir": "./components/ui",
  "tailwindConfig": "./tailwind.config.ts",
  "globalCss": "./globals.css"
}
`;

let tmp: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), "axis-config-"));
});

afterEach(async () => {
  await fs.remove(tmp);
});

/** 두 init 경로와 같은 방식(`fs.writeJSON`, 2칸)으로 써서 파일 내용을 돌려줍니다. */
async function writeAndRead(value: unknown): Promise<string> {
  const file = path.join(tmp, "axis.config.json");
  await fs.writeJSON(file, value, { spaces: 2 });
  return fs.readFile(file, "utf-8");
}

describe("createInitConfig (axis init)", () => {
  it("-y 기본값의 파일 내용이 정정 전과 바이트 단위로 같다", async () => {
    const config = createInitConfig(
      {
        componentsDir: "./src/components/ui",
        tailwindConfig: "./tailwind.config.ts",
        globalCss: "./src/app/globals.css",
      },
      "https://axis-design-system.pages.dev/r"
    );
    expect(await writeAndRead(config)).toBe(INIT_Y_BEFORE);
  });

  it("키 순서가 $schema · componentsDir · tailwindConfig · globalCss · registry 이고 brand 를 쓰지 않는다", () => {
    const config = createInitConfig(
      { componentsDir: "a", tailwindConfig: "b", globalCss: "c" },
      "r"
    );
    expect(Object.keys(config)).toEqual([
      "$schema",
      "componentsDir",
      "tailwindConfig",
      "globalCss",
      "registry",
    ]);
    expect(config).not.toHaveProperty("brand");
  });

  it("음성 대조군: 값이 하나라도 다르면 정정 전 내용과 다르다", async () => {
    const config = createInitConfig(
      {
        componentsDir: "./src/components/ui",
        tailwindConfig: "./tailwind.config.ts",
        globalCss: "./app/globals.css",
      },
      "https://axis-design-system.pages.dev/r"
    );
    expect(await writeAndRead(config)).not.toBe(INIT_Y_BEFORE);
  });
});

describe("createTemplateConfig (axis template init)", () => {
  it("파일 내용이 정정 전과 바이트 단위로 같다", async () => {
    expect(await writeAndRead(createTemplateConfig("theme-only"))).toBe(TEMPLATE_INIT_BEFORE);
  });

  it("키 순서가 $schema · template · componentsDir · tailwindConfig · globalCss 이고 brand 를 쓰지 않는다", () => {
    const config = createTemplateConfig("x");
    expect(Object.keys(config)).toEqual([
      "$schema",
      "template",
      "componentsDir",
      "tailwindConfig",
      "globalCss",
    ]);
    expect(config).not.toHaveProperty("brand");
  });
});

describe("readAxisConfig", () => {
  it("파일이 없으면 null", async () => {
    expect(await readAxisConfig(tmp)).toBeNull();
  });

  it("brand 를 포함한 내용을 그대로 읽는다", async () => {
    await fs.writeJSON(path.join(tmp, "axis.config.json"), {
      $schema: AXIS_CONFIG_SCHEMA_URL,
      globalCss: "./globals.css",
      brand: "sample",
    });
    expect(await readAxisConfig(tmp)).toEqual({
      $schema: AXIS_CONFIG_SCHEMA_URL,
      globalCss: "./globals.css",
      brand: "sample",
    });
  });

  it("JSON 이 깨졌으면 오류를 던진다", async () => {
    await fs.writeFile(path.join(tmp, "axis.config.json"), "{ broken");
    await expect(readAxisConfig(tmp)).rejects.toThrow();
  });
});
