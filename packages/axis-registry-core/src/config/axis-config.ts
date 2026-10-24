import fs from "fs-extra";
import path from "path";
import { AXIS_SITE_URL } from "../site.js";

/** `axis.config.json` 의 `$schema` 값. 파일은 apps/web/public/schema.json 이고 사이트에 배포됩니다(WI-0056 D2) */
export const AXIS_CONFIG_SCHEMA_URL = `${AXIS_SITE_URL}/schema.json`;

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
  /** `axis add` 가 agentic- 항목을 쓰는 위치. 없으면 componentsDir 의 형제 `agentic` 입니다(WI-0045 FR-4) */
  agenticDir?: string;
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
  /** 기존 axis.config.json 의 agenticDir. init 은 묻지 않고, 다시 실행할 때 기존 값을 지키는 데만 씁니다 */
  agenticDir?: string;
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
    ...(answers.agenticDir !== undefined ? { agenticDir: answers.agenticDir } : {}),
    ...(answers.tailwindConfig !== undefined ? { tailwindConfig: answers.tailwindConfig } : {}),
    globalCss: answers.globalCss,
    registry,
  };
}

/**
 * `axis template init` 이 쓰는 설정. 키 순서가 곧 파일의 키 순서입니다.
 * 템플릿은 create-next-app 구조(`app/layout.tsx` · `app/globals.css`)라 globalCss 는 `./app/globals.css` 입니다(WI-0037 D1, 종전 `./globals.css`).
 */
export function createTemplateConfig(template: string): AxisConfig {
  return {
    $schema: AXIS_CONFIG_SCHEMA_URL,
    template,
    componentsDir: "./components/ui",
    tailwindConfig: "./tailwind.config.ts",
    globalCss: "./app/globals.css",
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
