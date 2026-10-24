/**
 * GitHub Project 동기화 명령어
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs-extra';
import {
  parseProjectTodo,
  extractAllWorkItems,
  filterByWiIds,
} from './parser.js';
import { GitHubClient } from './github-client.js';
import { WiMapper, generateIssueTitle, generateIssueBody } from './mapper.js';
import type {
  SyncOptions,
  SyncResult,
  SyncItemResult,
  WorkItem,
  LocalStatus,
  ProjectV2Info,
} from './types.js';

// 상태 매핑
const statusMap: Record<LocalStatus, 'Todo' | 'In Progress' | 'Done'> = {
  '✅': 'Done',
  '🔄': 'In Progress',
  '⏳': 'Todo',
};

/**
 * 기본 경로
 */
const DEFAULT_TODO_PATH = 'project-todo.md';
const DEFAULT_MAPPING_PATH = '.github/wi-mapping.json';

/**
 * sync 명령어 등록
 */
export function registerSyncCommand(program: Command): void {
  const syncCmd = program
    .command('sync')
    .description('GitHub Project와 project-todo.md 동기화');

  // 기본 sync 명령
  syncCmd
    .option('--dry-run', '미리보기 모드 (실제 변경 없음)')
    .option('--wi <ids...>', '특정 WI만 동기화 (예: WI-0001 WI-0002)')
    .option('-v, --verbose', '상세 출력')
    .option('--token <token>', 'GitHub 토큰 (기본: gh auth token 사용)')
    .action(async (options) => {
      await runSync({
        dryRun: options.dryRun,
        wiIds: options.wi,
        verbose: options.verbose,
        token: options.token,
      });
    });

  // status 서브 명령
  syncCmd
    .command('status')
    .description('현재 동기화 상태 확인')
    .action(async () => {
      await showSyncStatus();
    });

  // init 서브 명령
  syncCmd
    .command('init')
    .description('동기화 설정 초기화')
    .option('--owner <owner>', 'GitHub 저장소 소유자', 'thoughtandaction')
    .option('--repo <repo>', 'GitHub 저장소 이름', 'axis')
    .option('--project <number>', 'GitHub Project 번호', '4')
    .action(async (options) => {
      await initSync(options.owner, options.repo, parseInt(options.project, 10));
    });
}

/**
 * 동기화 실행
 */
async function runSync(options: SyncOptions): Promise<void> {
  const spinner = ora();
  const result: SyncResult = {
    success: true,
    timestamp: new Date().toISOString(),
    summary: { total: 0, created: 0, updated: 0, skipped: 0, failed: 0 },
    items: [],
    errors: [],
  };

  try {
    // 1. project-todo.md 파싱
    spinner.start('project-todo.md 파싱 중...');
    const todoPath = path.resolve(DEFAULT_TODO_PATH);

    if (!(await fs.pathExists(todoPath))) {
      throw new Error(`project-todo.md를 찾을 수 없습니다: ${todoPath}`);
    }

    const parseResult = await parseProjectTodo(todoPath);
    let workItems = extractAllWorkItems(parseResult);

    if (options.wiIds && options.wiIds.length > 0) {
      workItems = filterByWiIds(workItems, options.wiIds);
    }

    spinner.succeed(`${workItems.length}개 Work Item 파싱 완료`);

    if (workItems.length === 0) {
      console.log(chalk.yellow('\n동기화할 Work Item이 없습니다.'));
      return;
    }

    // 2. 매핑 파일 로드
    spinner.start('매핑 파일 로드 중...');
    const mapper = new WiMapper(path.resolve(DEFAULT_MAPPING_PATH));
    await mapper.load();
    spinner.succeed('매핑 파일 로드 완료');

    // 3. GitHub 클라이언트 초기화
    spinner.start('GitHub 연결 중...');
    const { owner, repo } = mapper.getRepository();
    const client = new GitHubClient(owner, repo, options.token);
    spinner.succeed('GitHub 연결 완료');

    // 4. Project 정보 조회
    spinner.start('GitHub Project 정보 조회 중...');
    const projectNumber = mapper.getProjectNumber();
    const projectInfo = await client.getProjectInfo(projectNumber);
    mapper.setProjectId(projectInfo.id);
    spinner.succeed(`Project: ${projectInfo.title}`);

    // 5. 기존 프로젝트 아이템 조회
    spinner.start('프로젝트 아이템 조회 중...');
    const projectItems = await client.getProjectItems(projectInfo.id);
    mapper.syncFromProjectItems(projectItems);
    spinner.succeed(`${projectItems.length}개 프로젝트 아이템 조회 완료`);

    // 6. 동기화 실행
    console.log(chalk.blue('\n📦 동기화 시작\n'));

    if (options.dryRun) {
      console.log(chalk.yellow('🔍 Dry Run 모드 - 실제 변경 없음\n'));
    }

    result.summary.total = workItems.length;

    for (const workItem of workItems) {
      const itemResult = await syncWorkItem(
        workItem,
        mapper,
        client,
        projectInfo,
        options
      );
      result.items.push(itemResult);

      switch (itemResult.action) {
        case 'create':
          result.summary.created++;
          break;
        case 'update':
          result.summary.updated++;
          break;
        case 'skip':
          result.summary.skipped++;
          break;
        case 'error':
          result.summary.failed++;
          result.errors.push(itemResult.error || '알 수 없는 오류');
          break;
      }

      printItemResult(itemResult);
    }

    // 7. 매핑 파일 저장
    if (!options.dryRun) {
      spinner.start('매핑 파일 저장 중...');
      await mapper.save();
      spinner.succeed('매핑 파일 저장 완료');
    }

    // 8. 결과 요약
    printSummary(result);

  } catch (error) {
    spinner.fail(`오류 발생: ${(error as Error).message}`);
    result.success = false;
    result.errors.push((error as Error).message);
  }
}

/**
 * 단일 Work Item 동기화
 */
async function syncWorkItem(
  workItem: WorkItem,
  mapper: WiMapper,
  client: GitHubClient,
  projectInfo: ProjectV2Info,
  options: SyncOptions
): Promise<SyncItemResult> {
  const mapping = mapper.findByWiId(workItem.wiId);
  const targetStatus = statusMap[workItem.status];

  // 상태 옵션 ID 결정
  const statusOptionId =
    targetStatus === 'Done'
      ? projectInfo.statusField.options.done
      : targetStatus === 'In Progress'
      ? projectInfo.statusField.options.inProgress
      : projectInfo.statusField.options.todo;

  try {
    if (!mapping) {
      // 새 Issue 생성 필요
      if (options.dryRun) {
        return {
          wiId: workItem.wiId,
          action: 'create',
          newStatus: workItem.status,
        };
      }

      // Issue 생성
      const issue = await client.createIssue(
        generateIssueTitle(workItem),
        generateIssueBody(workItem)
      );

      // Project에 추가
      const itemId = await client.addIssueToProject(projectInfo.id, issue.id);

      // Status 업데이트
      await client.updateItemStatus(
        projectInfo.id,
        itemId,
        projectInfo.statusField.id,
        statusOptionId
      );

      // 매핑 저장
      mapper.upsertMapping(workItem.wiId, issue.number, itemId, workItem.status);

      return {
        wiId: workItem.wiId,
        action: 'create',
        newStatus: workItem.status,
        issueNumber: issue.number,
        projectItemId: itemId,
      };
    } else {
      // 기존 매핑 존재
      const previousStatus = mapping.lastStatus;

      if (previousStatus === workItem.status) {
        // 상태 변경 없음
        return {
          wiId: workItem.wiId,
          action: 'skip',
          previousStatus,
          newStatus: workItem.status,
          issueNumber: mapping.issueNumber,
          projectItemId: mapping.projectItemId,
        };
      }

      // 상태 업데이트 필요
      if (options.dryRun) {
        return {
          wiId: workItem.wiId,
          action: 'update',
          previousStatus,
          newStatus: workItem.status,
          issueNumber: mapping.issueNumber,
        };
      }

      // Project Item ID 확보
      let itemId = mapping.projectItemId;

      if (!itemId) {
        // Issue가 프로젝트에 없으면 추가
        const issue = await client.getIssue(mapping.issueNumber);
        if (issue) {
          itemId = await client.addIssueToProject(projectInfo.id, issue.id);
        }
      }

      if (itemId) {
        // Status 업데이트
        await client.updateItemStatus(
          projectInfo.id,
          itemId,
          projectInfo.statusField.id,
          statusOptionId
        );

        // 매핑 업데이트
        mapper.upsertMapping(workItem.wiId, mapping.issueNumber, itemId, workItem.status);
      }

      return {
        wiId: workItem.wiId,
        action: 'update',
        previousStatus,
        newStatus: workItem.status,
        issueNumber: mapping.issueNumber,
        projectItemId: itemId,
      };
    }
  } catch (error) {
    return {
      wiId: workItem.wiId,
      action: 'error',
      newStatus: workItem.status,
      error: (error as Error).message,
    };
  }
}

/**
 * 항목별 결과 출력
 */
function printItemResult(result: SyncItemResult): void {
  const statusIcons = {
    create: chalk.green('+'),
    update: chalk.yellow('~'),
    skip: chalk.gray('-'),
    error: chalk.red('✗'),
  };

  const icon = statusIcons[result.action];
  const wiId = chalk.cyan(result.wiId);
  const status = result.newStatus;

  let message = `${icon} ${wiId} ${status}`;

  if (result.action === 'update' && result.previousStatus) {
    message += chalk.gray(` (${result.previousStatus} → ${result.newStatus})`);
  }

  if (result.action === 'create' && result.issueNumber) {
    message += chalk.gray(` → Issue #${result.issueNumber}`);
  }

  if (result.action === 'error') {
    message += chalk.red(` - ${result.error}`);
  }

  console.log(`  ${message}`);
}

/**
 * 요약 출력
 */
function printSummary(result: SyncResult): void {
  console.log(chalk.blue('\n📊 동기화 결과\n'));
  console.log(`  전체: ${result.summary.total}`);
  console.log(chalk.green(`  생성: ${result.summary.created}`));
  console.log(chalk.yellow(`  업데이트: ${result.summary.updated}`));
  console.log(chalk.gray(`  스킵: ${result.summary.skipped}`));

  if (result.summary.failed > 0) {
    console.log(chalk.red(`  실패: ${result.summary.failed}`));
  }

  console.log();
}

/**
 * 동기화 상태 확인
 */
async function showSyncStatus(): Promise<void> {
  const spinner = ora();

  try {
    // 매핑 파일 로드
    spinner.start('상태 확인 중...');
    const mapper = new WiMapper(path.resolve(DEFAULT_MAPPING_PATH));
    await mapper.load();

    // project-todo.md 파싱
    const todoPath = path.resolve(DEFAULT_TODO_PATH);
    if (!(await fs.pathExists(todoPath))) {
      throw new Error(`project-todo.md를 찾을 수 없습니다: ${todoPath}`);
    }

    const parseResult = await parseProjectTodo(todoPath);
    const workItems = extractAllWorkItems(parseResult);

    spinner.succeed('상태 확인 완료');

    // 결과 출력
    console.log(chalk.blue('\n📋 동기화 상태\n'));

    const { owner, repo } = mapper.getRepository();
    const projectNumber = mapper.getProjectNumber();

    console.log(chalk.gray(`저장소: ${owner}/${repo}`));
    console.log(chalk.gray(`프로젝트: #${projectNumber}`));
    console.log();

    console.log(chalk.bold('Work Items:'));

    let synced = 0;
    let unsynced = 0;

    for (const wi of workItems) {
      const mapping = mapper.findByWiId(wi.wiId);
      const icon = mapping ? chalk.green('✓') : chalk.yellow('○');
      const issueInfo = mapping
        ? chalk.gray(` → #${mapping.issueNumber}`)
        : chalk.yellow(' (미동기화)');

      console.log(`  ${icon} ${chalk.cyan(wi.wiId)} ${wi.status} ${wi.title}${issueInfo}`);

      if (mapping) {
        synced++;
      } else {
        unsynced++;
      }
    }

    console.log();
    console.log(chalk.gray(`동기화됨: ${synced}, 미동기화: ${unsynced}`));
    console.log();

  } catch (error) {
    spinner.fail(`오류: ${(error as Error).message}`);
  }
}

/**
 * 동기화 설정 초기화
 */
async function initSync(owner: string, repo: string, projectNumber: number): Promise<void> {
  const spinner = ora();

  try {
    spinner.start('설정 초기화 중...');

    const mappingPath = path.resolve(DEFAULT_MAPPING_PATH);

    const mapping = {
      version: '1.0.0',
      repository: { owner, repo },
      project: { number: projectNumber },
      mappings: [],
      updatedAt: new Date().toISOString(),
    };

    await fs.ensureDir(path.dirname(mappingPath));
    await fs.writeJSON(mappingPath, mapping, { spaces: 2 });

    spinner.succeed('설정 초기화 완료');

    console.log(chalk.blue('\n✓ 동기화 설정 완료\n'));
    console.log(chalk.gray(`  매핑 파일: ${DEFAULT_MAPPING_PATH}`));
    console.log(chalk.gray(`  저장소: ${owner}/${repo}`));
    console.log(chalk.gray(`  프로젝트: #${projectNumber}`));
    console.log();
    console.log(chalk.cyan('다음 명령어로 동기화를 시작하세요:'));
    console.log(chalk.cyan('  npx @axis-ds/cli sync'));
    console.log();

  } catch (error) {
    spinner.fail(`오류: ${(error as Error).message}`);
  }
}

// 타입 재내보내기
export * from './types.js';
export * from './parser.js';
export * from './github-client.js';
export * from './mapper.js';
