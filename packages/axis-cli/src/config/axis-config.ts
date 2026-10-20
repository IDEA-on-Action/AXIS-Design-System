import fs from "fs-extra";
import path from "path";

/** `axis.config.json` 의 `$schema` 값. 스키마 파일 자체는 아직 없습니다(WI-0028 U11). */
export const AXIS_CONFIG_SCHEMA_URL = "https://axis.minu.best/schema.json";

/** 설정 파일 이름 */
export const AXIS_CONFIG_FILE = "axis.config.json";

/**
 * `axis.config.json` 형태.
 * `axis init` · `axis template init` 이 만들고, `brand` 는 `axis theme add` 만 씁니다.
 */
export interface AxisConfig {
  $schema?: string;
  template?: string;
  componentsDir?: string;
  tailwindConfig?: string;
  globalCss?: string;
  registry?: string;
  /** `axis monet` 의 저장 위치(monet.ts 가 읽음) */
  monetDir?: string;
  /** `axis theme add` 가 기록하는 브랜드 이름 */
  brand?: string;
}

/** `axis init` 이 받는 경로 3개. `tailwindConfig` 는 Tailwind 4 이상에서 없습니다(WI-0044 FR-3). */
export interface InitConfigAnswers {
  componentsDir: string;
  tailwindConfig?: string;
  globalCss: string;
}

/**
 * `axis init` 이 쓰는 설정. 키 순서가 곧 파일의 키 순서입니다.
 * `tailwindConfig` 가 없으면(Tailwind 4) 키를 쓰지 않습니다. 타입에서 이미 선택 필드이고, 이 값을 읽는 코드가 없어
 * 빈 문자열보다 키 생략이 「설정 파일 없음」을 그대로 나타냅니다.
 */
export function createInitConfig(answers: InitConfigAnswers, registry: string): AxisConfig {
  return {
    $schema: AXIS_CONFIG_SCHEMA_URL,
    componentsDir: answers.componentsDir,
    ...(answers.tailwindConfig !== undefined ? { tailwindConfig: answers.tailwindConfig } : {}),
    globalCss: answers.globalCss,
    registry,
  };
}

/** `axis template init` 이 쓰는 설정. 키 순서가 곧 파일의 키 순서입니다. */
export function createTemplateConfig(template: string): AxisConfig {
  return {
    $schema: AXIS_CONFIG_SCHEMA_URL,
    template,
    componentsDir: "./components/ui",
    tailwindConfig: "./tailwind.config.ts",
    globalCss: "./globals.css",
  };
}

/**
 * `<baseDir>/axis.config.json` 을 읽습니다.
 * 파일이 없으면 `null` 을 돌려주고, JSON 이 깨졌으면 오류를 그대로 던집니다.
 */
export async function readAxisConfig(baseDir: string): Promise<AxisConfig | null> {
  const configPath = path.join(baseDir, AXIS_CONFIG_FILE);
  if (!(await fs.pathExists(configPath))) return null;
  return (await fs.readJSON(configPath)) as AxisConfig;
}
