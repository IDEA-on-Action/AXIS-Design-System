/**
 * GitHub API 클라이언트 (GraphQL)
 */

import { execSync } from 'child_process';
import type {
  ProjectV2Info,
  ProjectItem,
  GitHubProjectStatus,
  StatusOptionIds,
} from './types.js';

/**
 * GitHub GraphQL API 엔드포인트
 */
const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql';

/**
 * GitHub API 클라이언트
 */
export class GitHubClient {
  private token: string;
  private owner: string;
  private repo: string;

  constructor(owner: string, repo: string, token?: string) {
    this.owner = owner;
    this.repo = repo;
    this.token = token || this.getTokenFromGhCli();
  }

  /**
   * gh CLI에서 토큰 가져오기
   */
  private getTokenFromGhCli(): string {
    try {
      const token = execSync('gh auth token', {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore'],
      }).trim();

      if (!token) {
        throw new Error('토큰이 비어있습니다.');
      }

      return token;
    } catch {
      throw new Error(
        'GitHub 토큰을 가져올 수 없습니다. gh CLI 설치 및 인증이 필요합니다.\n' +
          '  설치: https://cli.github.com\n' +
          '  인증: gh auth login'
      );
    }
  }

  /**
   * GraphQL 요청 실행
   */
  private async graphql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
    const response = await fetch(GITHUB_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`GitHub API 오류: ${response.status} ${response.statusText}`);
    }

    const result = await response.json() as { data?: T; errors?: Array<{ message: string }> };

    if (result.errors && result.errors.length > 0) {
      throw new Error(`GraphQL 오류: ${result.errors.map((e) => e.message).join(', ')}`);
    }

    return result.data as T;
  }

  /**
   * Project V2 정보 조회
   */
  async getProjectInfo(projectNumber: number): Promise<ProjectV2Info> {
    const query = `
      query GetProject($owner: String!, $repo: String!, $number: Int!) {
        repository(owner: $owner, name: $repo) {
          projectV2(number: $number) {
            id
            title
            url
            field(name: "Status") {
              ... on ProjectV2SingleSelectField {
                id
                options {
                  id
                  name
                }
              }
            }
          }
        }
      }
    `;

    interface QueryResult {
      repository: {
        projectV2: {
          id: string;
          title: string;
          url: string;
          field: {
            id: string;
            options: Array<{ id: string; name: string }>;
          };
        };
      };
    }

    const data = await this.graphql<QueryResult>(query, {
      owner: this.owner,
      repo: this.repo,
      number: projectNumber,
    });

    const project = data.repository.projectV2;
    const statusField = project.field;

    // Status 옵션 ID 매핑
    const options: StatusOptionIds = {
      todo: '',
      inProgress: '',
      done: '',
    };

    for (const opt of statusField.options) {
      const nameLower = opt.name.toLowerCase();
      if (nameLower === 'todo' || nameLower === 'to do') {
        options.todo = opt.id;
      } else if (nameLower === 'in progress' || nameLower === 'in-progress') {
        options.inProgress = opt.id;
      } else if (nameLower === 'done' || nameLower === 'completed') {
        options.done = opt.id;
      }
    }

    return {
      id: project.id,
      title: project.title,
      url: project.url,
      statusField: {
        id: statusField.id,
        options,
      },
    };
  }

  /**
   * 프로젝트의 모든 아이템 조회
   */
  async getProjectItems(projectId: string): Promise<ProjectItem[]> {
    const query = `
      query GetProjectItems($projectId: ID!, $cursor: String) {
        node(id: $projectId) {
          ... on ProjectV2 {
            items(first: 100, after: $cursor) {
              pageInfo {
                hasNextPage
                endCursor
              }
              nodes {
                id
                content {
                  ... on Issue {
                    id
                    number
                    title
                    url
                  }
                }
                fieldValueByName(name: "Status") {
                  ... on ProjectV2ItemFieldSingleSelectValue {
                    name
                  }
                }
              }
            }
          }
        }
      }
    `;

    interface ItemNode {
      id: string;
      content?: {
        id: string;
        number: number;
        title: string;
        url: string;
      };
      fieldValueByName?: {
        name: string;
      };
    }

    interface QueryResult {
      node: {
        items: {
          pageInfo: {
            hasNextPage: boolean;
            endCursor: string;
          };
          nodes: ItemNode[];
        };
      };
    }

    const items: ProjectItem[] = [];
    let cursor: string | null = null;
    let hasMore: boolean = true;

    while (hasMore) {
      const result: QueryResult = await this.graphql<QueryResult>(query, {
        projectId,
        cursor,
      });

      const itemsPage = result.node.items;

      for (const node of itemsPage.nodes) {
        items.push({
          id: node.id,
          content: node.content,
          fieldValues: {
            status: node.fieldValueByName?.name as GitHubProjectStatus | undefined,
          },
        });
      }

      hasMore = itemsPage.pageInfo.hasNextPage;
      cursor = itemsPage.pageInfo.endCursor;
    }

    return items;
  }

  /**
   * Issue 생성
   */
  async createIssue(title: string, body?: string, labels?: string[]): Promise<{ id: string; number: number }> {
    const query = `
      mutation CreateIssue($repositoryId: ID!, $title: String!, $body: String, $labelIds: [ID!]) {
        createIssue(input: {
          repositoryId: $repositoryId
          title: $title
          body: $body
          labelIds: $labelIds
        }) {
          issue {
            id
            number
          }
        }
      }
    `;

    // 먼저 repository ID 조회
    const repoQuery = `
      query GetRepoId($owner: String!, $repo: String!) {
        repository(owner: $owner, name: $repo) {
          id
        }
      }
    `;

    interface RepoResult {
      repository: { id: string };
    }

    const repoData = await this.graphql<RepoResult>(repoQuery, {
      owner: this.owner,
      repo: this.repo,
    });

    interface IssueResult {
      createIssue: {
        issue: { id: string; number: number };
      };
    }

    const data = await this.graphql<IssueResult>(query, {
      repositoryId: repoData.repository.id,
      title,
      body,
      labelIds: labels,
    });

    return data.createIssue.issue;
  }

  /**
   * Issue를 Project에 추가
   */
  async addIssueToProject(projectId: string, issueId: string): Promise<string> {
    const query = `
      mutation AddToProject($projectId: ID!, $contentId: ID!) {
        addProjectV2ItemById(input: {
          projectId: $projectId
          contentId: $contentId
        }) {
          item {
            id
          }
        }
      }
    `;

    interface Result {
      addProjectV2ItemById: {
        item: { id: string };
      };
    }

    const data = await this.graphql<Result>(query, {
      projectId,
      contentId: issueId,
    });

    return data.addProjectV2ItemById.item.id;
  }

  /**
   * Project Item의 Status 업데이트
   */
  async updateItemStatus(
    projectId: string,
    itemId: string,
    fieldId: string,
    optionId: string
  ): Promise<void> {
    const query = `
      mutation UpdateStatus($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
        updateProjectV2ItemFieldValue(input: {
          projectId: $projectId
          itemId: $itemId
          fieldId: $fieldId
          value: { singleSelectOptionId: $optionId }
        }) {
          projectV2Item {
            id
          }
        }
      }
    `;

    await this.graphql(query, {
      projectId,
      itemId,
      fieldId,
      optionId,
    });
  }

  /**
   * Issue 번호로 Issue 정보 조회
   */
  async getIssue(issueNumber: number): Promise<{ id: string; title: string; state: string } | null> {
    const query = `
      query GetIssue($owner: String!, $repo: String!, $number: Int!) {
        repository(owner: $owner, name: $repo) {
          issue(number: $number) {
            id
            title
            state
          }
        }
      }
    `;

    interface QueryResult {
      repository: {
        issue: { id: string; title: string; state: string } | null;
      };
    }

    try {
      const data = await this.graphql<QueryResult>(query, {
        owner: this.owner,
        repo: this.repo,
        number: issueNumber,
      });

      return data.repository.issue;
    } catch {
      return null;
    }
  }
}
