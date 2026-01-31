/**
 * project-todo.md 파서
 */

import fs from 'fs-extra';
import type { WorkItem, ParseResult, ParseError, LocalStatus } from './types.js';

/**
 * 진행 중 테이블 행 파싱 정규식
 * | # | 항목 | WI ID | Phase | 우선순위 | 상태 |
 */
const IN_PROGRESS_ROW_REGEX =
  /\|\s*(\d+)\s*\|\s*([^|]+)\|\s*\[?(WI-\d{4})\]?(?:\([^)]*\))?\s*\|\s*([^|]*)\|\s*([^|]*)\|\s*(✅|🔄|⏳)\s*\|/;

/**
 * 완료 테이블 행 파싱 정규식
 * | # | 항목 | WI ID | Phase | 완료일 |
 */
const COMPLETED_ROW_REGEX =
  /\|\s*(\d+)\s*\|\s*([^|]+)\|\s*\[?(WI-\d{4})\]?(?:\([^)]*\))?\s*\|\s*([^|]*)\|\s*([^|]*)\|/;

/**
 * 섹션 헤더 정규식
 */
const SECTION_HEADER_REGEX = /^###\s+(진행 중|완료)/;

/**
 * project-todo.md 파일을 파싱하여 Work Item 목록 추출
 */
export async function parseProjectTodo(filePath: string): Promise<ParseResult> {
  const content = await fs.readFile(filePath, 'utf-8');
  return parseContent(content);
}

/**
 * 문자열 내용 파싱
 */
export function parseContent(content: string): ParseResult {
  const lines = content.split('\n');
  const inProgress: WorkItem[] = [];
  const completed: WorkItem[] = [];
  const errors: ParseError[] = [];

  let currentSection: 'none' | 'inProgress' | 'completed' = 'none';
  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;

    // 섹션 헤더 감지
    const sectionMatch = line.match(SECTION_HEADER_REGEX);
    if (sectionMatch) {
      currentSection = sectionMatch[1] === '진행 중' ? 'inProgress' : 'completed';
      inTable = false;
      continue;
    }

    // 테이블 시작 감지
    if (line.trim().startsWith('| #') || line.trim().startsWith('|---')) {
      inTable = true;
      continue;
    }

    // 빈 줄이면 테이블 종료
    if (line.trim() === '' || !line.trim().startsWith('|')) {
      inTable = false;
      continue;
    }

    // 테이블 행 파싱
    if (inTable && currentSection !== 'none') {
      try {
        const workItem = parseTableRow(line, currentSection);
        if (workItem) {
          if (currentSection === 'inProgress') {
            inProgress.push(workItem);
          } else {
            completed.push(workItem);
          }
        }
      } catch (error) {
        // WI ID가 없는 행은 무시 (오류로 처리하지 않음)
        if (line.includes('WI-')) {
          errors.push({
            line: lineNumber,
            content: line,
            message: (error as Error).message,
          });
        }
      }
    }
  }

  return { inProgress, completed, errors };
}

/**
 * 테이블 행 파싱
 */
function parseTableRow(
  line: string,
  section: 'inProgress' | 'completed'
): WorkItem | null {
  if (section === 'inProgress') {
    const match = line.match(IN_PROGRESS_ROW_REGEX);
    if (!match) {
      // WI ID가 없는 행은 null 반환
      if (!line.includes('WI-')) {
        return null;
      }
      throw new Error('진행 중 테이블 행 파싱 실패');
    }

    const [, index, title, wiId, phase, priority, status] = match;

    // WI 링크 추출
    const linkMatch = line.match(/\[WI-\d{4}\]\(([^)]+)\)/);

    return {
      index: parseInt(index, 10),
      title: title.trim(),
      wiId: wiId.trim(),
      phase: phase.trim(),
      priority: priority.trim(),
      status: status.trim() as LocalStatus,
      link: linkMatch ? linkMatch[1] : undefined,
    };
  } else {
    const match = line.match(COMPLETED_ROW_REGEX);
    if (!match) {
      if (!line.includes('WI-')) {
        return null;
      }
      throw new Error('완료 테이블 행 파싱 실패');
    }

    const [, index, title, wiId, phase] = match;

    const linkMatch = line.match(/\[WI-\d{4}\]\(([^)]+)\)/);

    return {
      index: parseInt(index, 10),
      title: title.trim(),
      wiId: wiId.trim(),
      phase: phase.trim(),
      priority: '',
      status: '✅' as LocalStatus,
      link: linkMatch ? linkMatch[1] : undefined,
    };
  }
}

/**
 * 모든 WI 추출 (중복 제거)
 */
export function extractAllWorkItems(result: ParseResult): WorkItem[] {
  const allItems = [...result.inProgress, ...result.completed];
  const seen = new Set<string>();
  return allItems.filter((item) => {
    if (seen.has(item.wiId)) {
      return false;
    }
    seen.add(item.wiId);
    return true;
  });
}

/**
 * 특정 WI ID 필터링
 */
export function filterByWiIds(items: WorkItem[], wiIds: string[]): WorkItem[] {
  const targetSet = new Set(wiIds.map((id) => id.toUpperCase()));
  return items.filter((item) => targetSet.has(item.wiId.toUpperCase()));
}
