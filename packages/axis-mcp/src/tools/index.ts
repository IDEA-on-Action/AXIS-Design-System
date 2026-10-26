/**
 * AXIS Design System MCP - 도구 익스포트
 */

export {
  handleSearchComponents,
  formatSearchResult,
  type SearchComponentsParams,
  type SearchComponentsResult,
} from "./search.js";

export {
  handleGetComponent,
  handleGetToken,
  formatComponentDetail,
  formatTokenDetail,
  type ComponentDetail,
  type GetComponentParams,
  type GetComponentResult,
  type GetTokenParams,
} from "./get.js";

export {
  handleListComponents,
  handleListTokens,
  formatComponentList,
  formatTokenList,
  type ListComponentsParams,
  type ListTokensParams,
  type ListComponentsResult,
  type ListTokensResult,
} from "./list.js";

export {
  handleInstallComponent,
  formatInstallResult,
  type InstallComponentParams,
} from "./install.js";

export {
  MCP_BUNDLED_LABEL,
  type ComponentFilter,
  type RegistryComponent,
  type RegistryDeps,
} from "./registry-source.js";

// 프롬프트 도구
export {
  handleDetect,
  formatDetectResult,
  handleAnalyze,
  formatAnalyzeResult,
  handleRefine,
  formatRefineResult,
  handleValidate,
  formatValidateResult,
  handleSave,
  formatSaveResult,
  type PromptCategory,
  type DetectParams,
  type DetectResult,
  type AnalyzeParams,
  type AnalyzeResult,
  type RefineParams,
  type RefineResult,
  type ValidateParams,
  type ValidateResult,
  type SaveParams,
  type SaveResultType,
} from "./prompt/index.js";

// 템플릿 도구
export {
  handleListTemplates,
  formatListTemplatesResult,
  handleGetTemplate,
  formatGetTemplateResult,
  handleApplyTemplate,
  formatApplyTemplateResult,
  handleDiffTemplate,
  formatDiffTemplateResult,
  handleCheckProject,
  formatCheckProjectResult,
  type ListTemplatesParams,
  type ListTemplatesResult,
  type GetTemplateParams,
  type GetTemplateResult,
  type ApplyTemplateParams,
  type ApplyTemplateResult,
  type DiffTemplateParams,
  type DiffTemplateResult,
  type CheckProjectParams,
  type CheckProjectResult,
} from "./template.js";

// 브랜드 도구 (WI-0028 FR-4)
export {
  handleListBrands,
  formatListBrandsResult,
  handleGetBrand,
  formatGetBrandResult,
  tokensInstallCommandFor,
  type ListBrandsParams,
  type ListBrandsResult,
  type GetBrandParams,
  type GetBrandResult,
} from "./brand.js";
