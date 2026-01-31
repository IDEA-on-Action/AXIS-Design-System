/**
 * WI ↔ GitHub Issue 매퍼
 */

import fs from 'fs-extra';
import path from 'path';
import type {
  MappingFile,
  WiMapping,
  WorkItem,
  ProjectItem,
  LocalStatus,
  STATUS_MAP,
} from './types.js';
import { GitHubClient } from './github-client.js';

/**
 * 매핑 파일 기본값
 */
const DEFAULT_MAPPING: MappingFile = {
  version: '1.0.0',
  repository: {
    owner: 'thoughtandaction',
    repo: 'axis',
  },
  project: {
    number: 4,
  },
  mappings: [],
  updatedAt: new Date().toISOString(),
};

/**
 * WI-Issue 매퍼
 */
export class WiMapper {
  private mappingPath: string;
  private mapping: MappingFile;

  constructor(mappingPath: string) {
    this.mappingPath = mappingPath;
    this.mapping = { ...DEFAULT_MAPPING };
  }

  /**
   * 매핑 파일 로드
   */
  async load(): Promise<void> {
    if (await fs.pathExists(this.mappingPath)) {
      try {
        this.mapping = await fs.readJSON(this.mappingPath);
      } catch {
        console.warn('매핑 파일 로드 실패, 기본값 사용');
        this.mapping = { ...DEFAULT_MAPPING };
      }
    }
  }

  /**
   * 매핑 파일 저장
   */
  async save(): Promise<void> {
    this.mapping.updatedAt = new Date().toISOString();
    await fs.ensureDir(path.dirname(this.mappingPath));
    await fs.writeJSON(this.mappingPath, this.mapping, { spaces: 2 });
  }

  /**
   * 저장소 정보 반환
   */
  getRepository(): { owner: string; repo: string } {
    return this.mapping.repository;
  }

  /**
   * 프로젝트 번호 반환
   */
  getProjectNumber(): number {
    return this.mapping.project.number;
  }

  /**
   * 프로젝트 ID 설정
   */
  setProjectId(id: string): void {
    this.mapping.project.id = id;
  }

  /**
   * WI ID로 매핑 찾기
   */
  findByWiId(wiId: string): WiMapping | undefined {
    return this.mapping.mappings.find(
      (m) => m.wiId.toUpperCase() === wiId.toUpperCase()
    );
  }

  /**
   * Issue 번호로 매핑 찾기
   */
  findByIssueNumber(issueNumber: number): WiMapping | undefined {
    return this.mapping.mappings.find((m) => m.issueNumber === issueNumber);
  }

  /**
   * 매핑 추가 또는 업데이트
   */
  upsertMapping(wiId: string, issueNumber: number, projectItemId?: string, status?: LocalStatus): void {
    const existing = this.findByWiId(wiId);

    if (existing) {
      existing.issueNumber = issueNumber;
      if (projectItemId) {
        existing.projectItemId = projectItemId;
      }
      existing.lastSyncedAt = new Date().toISOString();
      if (status) {
        existing.lastStatus = status;
      }
    } else {
      this.mapping.mappings.push({
        wiId: wiId.toUpperCase(),
        issueNumber,
        projectItemId,
        lastSyncedAt: new Date().toISOString(),
        lastStatus: status,
      });
    }
  }

  /**
   * 모든 매핑 반환
   */
  getAllMappings(): WiMapping[] {
    return [...this.mapping.mappings];
  }

  /**
   * GitHub 프로젝트 아이템에서 WI ID 추출
   */
  extractWiIdFromItem(item: ProjectItem): string | null {
    // Issue 제목에서 WI ID 추출 (예: "[WI-0001] 컴포넌트 문서화")
    const title = item.content?.title || '';
    const match = title.match(/\[?(WI-\d{4})\]?/i);
    return match ? match[1].toUpperCase() : null;
  }

  /**
   * 프로젝트 아이템으로 매핑 동기화
   */
  syncFromProjectItems(items: ProjectItem[]): void {
    for (const item of items) {
      if (!item.content) continue;

      const wiId = this.extractWiIdFromItem(item);
      if (wiId) {
        const existing = this.findByWiId(wiId);
        if (existing) {
          existing.projectItemId = item.id;
        } else {
          this.mapping.mappings.push({
            wiId,
            issueNumber: item.content.number,
            projectItemId: item.id,
            lastSyncedAt: new Date().toISOString(),
          });
        }
      }
    }
  }
}

/**
 * Issue 제목 생성
 */
export function generateIssueTitle(workItem: WorkItem): string {
  return `[${workItem.wiId}] ${workItem.title}`;
}

/**
 * Issue 본문 생성
 */
export function generateIssueBody(workItem: WorkItem): string {
  const lines = [
    `## Work Item: ${workItem.wiId}`,
    '',
    `**제목**: ${workItem.title}`,
    `**Phase**: ${workItem.phase}`,
    `**우선순위**: ${workItem.priority}`,
    '',
  ];

  if (workItem.link) {
    lines.push(`**WI 폴더**: [바로가기](${workItem.link})`);
    lines.push('');
  }

  lines.push('---');
  lines.push('');
  lines.push('> 이 Issue는 `project-todo.md`와 자동 동기화됩니다.');

  return lines.join('\n');
}
