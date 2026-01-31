import * as React from "react";
import { cn } from "@axis-ds/ui-react";
import { DIFF_LABELS } from "../constants/a11y-labels";

export type DiffViewMode = "unified" | "split";

export interface DiffViewerProps {
  /** 변경 전 코드 */
  before: string;
  /** 변경 후 코드 */
  after: string;
  /** 파일명 */
  filename?: string;
  /** 표시 모드 */
  viewMode?: DiffViewMode;
  /** 추가 클래스 */
  className?: string;
}

type DiffLineType = "added" | "removed" | "unchanged";

interface DiffLine {
  type: DiffLineType;
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

/** LCS 기반 diff 알고리즘 */
function computeDiff(before: string, after: string): DiffLine[] {
  const oldLines = before.split("\n");
  const newLines = after.split("\n");
  const m = oldLines.length;
  const n = newLines.length;

  // LCS 테이블 구축
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // 역추적으로 diff 생성
  const result: DiffLine[] = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      result.unshift({ type: "unchanged", content: oldLines[i - 1], oldLineNumber: i, newLineNumber: j });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: "added", content: newLines[j - 1], newLineNumber: j });
      j--;
    } else if (i > 0) {
      result.unshift({ type: "removed", content: oldLines[i - 1], oldLineNumber: i });
      i--;
    }
  }

  return result;
}

const lineTypeStyles: Record<DiffLineType, string> = {
  added: "bg-[var(--axis-color-green-500)]/10",
  removed: "bg-[var(--axis-color-red-500)]/10",
  unchanged: "",
};

const lineTypeTextStyles: Record<DiffLineType, string> = {
  added: "text-[var(--axis-color-green-600)]",
  removed: "text-[var(--axis-color-red-600)]",
  unchanged: "text-[var(--axis-text-primary)]",
};

const lineTypeSymbols: Record<DiffLineType, string> = {
  added: "+",
  removed: "-",
  unchanged: " ",
};

/**
 * 코드 변경사항 비교 표시 컴포넌트
 */
export function DiffViewer({
  before,
  after,
  filename,
  viewMode = "unified",
  className,
}: DiffViewerProps) {
  const [mode, setMode] = React.useState<DiffViewMode>(viewMode);
  const diffLines = React.useMemo(() => computeDiff(before, after), [before, after]);

  const addedCount = diffLines.filter((l) => l.type === "added").length;
  const removedCount = diffLines.filter((l) => l.type === "removed").length;

  return (
    <div
      role="region"
      aria-label={filename ? `${filename} 변경사항` : "코드 변경사항"}
      className={cn(
        "rounded-lg border overflow-hidden",
        "bg-[var(--axis-surface-default)] border-[var(--axis-border-default)]",
        className
      )}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--axis-border-default)] bg-[var(--axis-surface-secondary)]">
        <div className="flex items-center gap-2 min-w-0">
          <svg className="w-4 h-4 text-[var(--axis-icon-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
          </svg>
          {filename && (
            <code className="text-xs font-mono text-[var(--axis-text-primary)] truncate">{filename}</code>
          )}
          <span className="text-xs text-[var(--axis-color-green-500)]" aria-label={`${addedCount}줄 ${DIFF_LABELS.added}`}>
            +{addedCount}
          </span>
          <span className="text-xs text-[var(--axis-color-red-500)]" aria-label={`${removedCount}줄 ${DIFF_LABELS.removed}`}>
            -{removedCount}
          </span>
        </div>
        <div className="flex items-center gap-1 bg-[var(--axis-surface-tertiary)] rounded-md p-0.5">
          <button
            onClick={() => setMode("unified")}
            aria-pressed={mode === "unified"}
            className={cn(
              "px-2 py-0.5 text-xs rounded transition-colors",
              mode === "unified"
                ? "bg-[var(--axis-surface-default)] text-[var(--axis-text-primary)] shadow-sm"
                : "text-[var(--axis-text-tertiary)] hover:text-[var(--axis-text-secondary)]"
            )}
          >
            통합
          </button>
          <button
            onClick={() => setMode("split")}
            aria-pressed={mode === "split"}
            className={cn(
              "px-2 py-0.5 text-xs rounded transition-colors",
              mode === "split"
                ? "bg-[var(--axis-surface-default)] text-[var(--axis-text-primary)] shadow-sm"
                : "text-[var(--axis-text-tertiary)] hover:text-[var(--axis-text-secondary)]"
            )}
          >
            분할
          </button>
        </div>
      </div>

      {/* Diff 본문 */}
      <div className="overflow-auto">
        {mode === "unified" ? (
          <UnifiedView lines={diffLines} />
        ) : (
          <SplitView lines={diffLines} />
        )}
      </div>
    </div>
  );
}

function UnifiedView({ lines }: { lines: DiffLine[] }) {
  return (
    <table className="w-full text-xs font-mono border-collapse" role="presentation">
      <tbody>
        {lines.map((line, i) => (
          <tr key={i} className={lineTypeStyles[line.type]}>
            <td className="select-none text-right px-2 py-0.5 text-[var(--axis-text-tertiary)] w-10 border-r border-[var(--axis-border-default)]">
              {line.oldLineNumber ?? ""}
            </td>
            <td className="select-none text-right px-2 py-0.5 text-[var(--axis-text-tertiary)] w-10 border-r border-[var(--axis-border-default)]">
              {line.newLineNumber ?? ""}
            </td>
            <td className={cn("select-none w-4 text-center py-0.5", lineTypeTextStyles[line.type])}>
              {lineTypeSymbols[line.type]}
            </td>
            <td className={cn("px-2 py-0.5 whitespace-pre", lineTypeTextStyles[line.type])}>
              {line.content}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SplitView({ lines }: { lines: DiffLine[] }) {
  // 왼쪽: removed + unchanged, 오른쪽: added + unchanged
  const leftLines: (DiffLine | null)[] = [];
  const rightLines: (DiffLine | null)[] = [];

  for (const line of lines) {
    if (line.type === "unchanged") {
      leftLines.push(line);
      rightLines.push(line);
    } else if (line.type === "removed") {
      leftLines.push(line);
      rightLines.push(null);
    } else {
      leftLines.push(null);
      rightLines.push(line);
    }
  }

  return (
    <table className="w-full text-xs font-mono border-collapse" role="presentation">
      <tbody>
        {leftLines.map((leftLine, i) => {
          const rightLine = rightLines[i];
          return (
            <tr key={i}>
              {/* 왼쪽 (before) */}
              <td className={cn("select-none text-right px-2 py-0.5 text-[var(--axis-text-tertiary)] w-10 border-r border-[var(--axis-border-default)]", leftLine ? lineTypeStyles[leftLine.type] : "")}>
                {leftLine?.oldLineNumber ?? ""}
              </td>
              <td className={cn("select-none w-4 text-center py-0.5", leftLine ? lineTypeTextStyles[leftLine.type] : "")}>
                {leftLine ? lineTypeSymbols[leftLine.type] : ""}
              </td>
              <td className={cn("px-2 py-0.5 whitespace-pre w-1/2 border-r border-[var(--axis-border-default)]", leftLine ? cn(lineTypeStyles[leftLine.type], lineTypeTextStyles[leftLine.type]) : "")}>
                {leftLine?.content ?? ""}
              </td>
              {/* 오른쪽 (after) */}
              <td className={cn("select-none text-right px-2 py-0.5 text-[var(--axis-text-tertiary)] w-10 border-r border-[var(--axis-border-default)]", rightLine ? lineTypeStyles[rightLine.type] : "")}>
                {rightLine?.newLineNumber ?? ""}
              </td>
              <td className={cn("select-none w-4 text-center py-0.5", rightLine ? lineTypeTextStyles[rightLine.type] : "")}>
                {rightLine ? lineTypeSymbols[rightLine.type] : ""}
              </td>
              <td className={cn("px-2 py-0.5 whitespace-pre w-1/2", rightLine ? cn(lineTypeStyles[rightLine.type], lineTypeTextStyles[rightLine.type]) : "")}>
                {rightLine?.content ?? ""}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
