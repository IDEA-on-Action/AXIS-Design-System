import fs from "fs-extra";
import path from "path";
import { AXIS_SITE_URL } from "../site.js";

/** `axis.config.json` 의 `$schema` 값. 파일은 apps/web/public/schema.json 이고 사이트에 배포됩니다(WI-0056 D2) */
export const AXIS_CONFIG_SCHEMA_URL = `${AXIS_SITE_URL}/schema.json`;

/** 설정 파일 이름 */
export const AXIS_CONFIG_FILE = "axis.config.json";

/**
 * `axis.config.json` 형태.
 * `axis init` · `axis template init` 이 만들고, axis.config.json 을 담은 템플릿(ontology-console)을 `axis template apply` ·
 * MCP `axis.apply_template` 으로 적용하면 그 파일과 키 단위로 합칩니다(apply-files.ts `mergeAxisConfigJson`, 같은 키는 템플릿 값).
 * `brand` 를 쓰는 경로는 `axis theme add` 와, brand 를 담은 템플릿의 `axis template apply` · `template init` · MCP `axis.apply_template` 입니다.
 */
export interface AxisConfig {
  $schema?: string;
  /**
   * 적용한 템플릿 이름. `axis template init` 이 config 가 없을 때 쓰고(createTemplateConfig), axis.config.json 을 담은 템플릿의
   * apply · init · MCP apply_template 이 그 파일의 값으로 씁니다. `axis check` · MCP `axis.check_project` 가 템플릿별 규칙 검사를
   * 고르는 데 읽습니다(WI-0107, registry-core template-checks.ts 정적 표에 있는 값만)
   */
  template?: string;
  componentsDir?: string;
  /** `axis add` 가 agentic- 항목을 쓰는 위치. 없으면 componentsDir 의 형제 `agentic` 입니다(WI-0045 FR-4) */
  agenticDir?: string;
  tailwindConfig?: string;
  globalCss?: string;
  registry?: string;
  /** `axis monet` 의 저장 위치(monet.ts 가 읽음) */
  monetDir?: string;
  /** 브랜드 이름. `axis theme add` 와 brand 를 담은 템플릿(ontology-console)의 `axis template apply` · `template init` · MCP `axis.apply_template` 이 씁니다 */
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
