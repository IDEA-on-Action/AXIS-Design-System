/**
 * Library Curator - 타입 정의
 */

// ============================================================================
// Source Types
// ============================================================================

export type SourceType = 'shadcn' | 'monet' | 'v0' | 'axis' | 'custom';

export type ComponentCategory =
  | 'ui'
  | 'agentic'
  | 'layout'
  | 'form'
  | 'data-display'
  | 'feedback'
  | 'navigation'
  | 'overlay'
  | 'chart'
  | 'utility';

export type ComponentStatus = 'active' | 'deprecated' | 'draft';

export type FileType = 'component' | 'hook' | 'util' | 'style' | 'type';

// ============================================================================
// Core Types
// ============================================================================

export interface CodeFile {
  path: string;
  content: string;
  type: FileType;
}

export interface Example {
  name: string;
  code: string;
  description?: string;
}

export interface SourceInfo {
  type: SourceType;
  registry: string;
  url: string;
  version?: string;
}

export interface CodeInfo {
  files: CodeFile[];
  dependencies: string[];
  devDependencies: string[];
  registryDeps: string[];
}

export interface PreviewInfo {
  thumbnail?: string;
  demoUrl?: string;
  examples?: Example[];
}

// ============================================================================
// Component Metadata
// ============================================================================

export interface ComponentMeta {
  id: string;
  slug: string;
  name: string;
  description: string;
  source: SourceInfo;
  category: ComponentCategory;
  subcategory?: string;
  tags: string[];
  code: CodeInfo;
  preview?: PreviewInfo;
  status: ComponentStatus;
  collectedAt: string;
  updatedAt: string;
  checksum: string;
}

export interface ComponentListItem {
  id: string;
  name: string;
  description: string;
  category?: ComponentCategory;
  source?: SourceType;
}

// ============================================================================
// Collection Types
// ============================================================================

export interface CollectOptions {
  incremental?: boolean;
  filter?: {
    categories?: ComponentCategory[];
    tags?: string[];
  };
}

export interface CollectionItem {
  id: string;
  name: string;
  status: 'new' | 'updated' | 'unchanged';
  checksum: string;
}

export interface CollectionError {
  id: string;
  error: string;
  recoverable: boolean;
}

export interface CollectionResult {
  source: SourceType;
  timestamp: string;
  success: boolean;
  collected: number;
  updated: number;
  failed: number;
  items: CollectionItem[];
  errors: CollectionError[];
}

export interface ChangeSet {
  added: string[];
  modified: string[];
  removed: string[];
}

// ============================================================================
// Collector Interface
// ============================================================================

export interface ICollector {
  readonly sourceType: SourceType;
  listComponents(): Promise<ComponentListItem[]>;
  collectComponent(id: string): Promise<ComponentMeta>;
  collectAll(options?: CollectOptions): Promise<CollectionResult>;
  detectChanges(lastChecksum: Record<string, string>): Promise<ChangeSet>;
}

// ============================================================================
// Library Index
// ============================================================================

export interface CategoryDefinition {
  id: ComponentCategory;
  name: string;
  description: string;
  icon?: string;
  order: number;
}

export interface TagDefinition {
  id: string;
  name: string;
  count: number;
}

export interface LibraryStats {
  total: number;
  bySource: Partial<Record<SourceType, number>>;
  byCategory: Partial<Record<ComponentCategory, number>>;
}

export interface LibraryIndex {
  version: string;
  updatedAt: string;
  stats: LibraryStats;
  components: ComponentMeta[];
  categories: CategoryDefinition[];
  tags: TagDefinition[];
}
