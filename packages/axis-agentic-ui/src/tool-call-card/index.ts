import * as React from "react";
import { cn } from "@axis-ds/ui-react";

export type ToolStatus = "pending" | "running" | "success" | "error";

export interface ToolCallCardProps {
  /** 도구 이름 */
  toolName: string;
  /** 도구 설명 */
  description?: string;
  /** 실행 상태 */
  status: ToolStatus;
  /** 입력 파라미터 */
  input?: Record<string, unknown>;
  /** 출력 결과 */
  output?: unknown;
  /** 에러 메시지 */
  error?: string;
  /** 실행 시간 (ms) */
  duration?: number;
  /** 펼침 상태 */
  defaultExpanded?: boolean;
  /** 추가 클래스 */
  className?: string;
}

const statusConfig: Record<ToolStatus, { color: string; icon: React.ReactNode }> = {
  pending: {
    color: "text-[var(--axis-color-gray-400)]",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" strokeWidth={2} />
      </svg>
    ),
  },
  running: {
    color: "text-[var(--axis-color-blue-500)]",
    icon: (
      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    ),
  },
  success: {
    color: "text-[var(--axis-color-green-500)]",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  error: {
    color: "text-[var(--axis-color-red-500)]",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  },
};

/**
 * AI 도구 호출 정보를 표시하는 카드 컴포넌트
 */
export function ToolCallCard({
  toolName,
  description,
  status,
  input,
  output,
  error,
  duration,
  defaultExpanded = false,
  className,
}: ToolCallCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);
  const config = statusConfig[status];

  return (
    <div
      className={cn(
        "rounded-lg border overflow-hidden",
        "bg-[var(--axis-surface-default)] border-[var(--axis-border-default)]",
        className
      )}
    >
      {/* 헤더 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-[var(--axis-surface-secondary)] transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className={config.color}>{config.icon}</span>
          <code className="text-sm font-mono text-[var(--axis-text-primary)]">
            {toolName}
          </code>
          {description && (
            <span className="text-xs text-[var(--axis-text-secondary)]">
              — {description}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {duration !== undefined && (
            <span className="text-xs text-[var(--axis-text-tertiary)]">
              {duration}ms
            </span>
          )}
          <svg
            className={cn(
              "w-4 h-4 text-[var(--axis-text-secondary)] transition-transform",
              isExpanded && "rotate-180"
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* 내용 */}
      {isExpanded && (
        <div className="border-t border-[var(--axis-border-default)] p-3 space-y-3">
          {input && (
            <div>
              <h5 className="text-xs font-medium text-[var(--axis-text-secondary)] mb-1">
                입력
              </h5>
              <pre className="text-xs p-2 rounded bg-[var(--axis-surface-secondary)] overflow-x-auto">
                <code className="text-[var(--axis-text-primary)]">
                  {JSON.stringify(input, null, 2)}
                </code>
              </pre>
            </div>
          )}
          {output && (
            <div>
              <h5 className="text-xs font-medium text-[var(--axis-text-secondary)] mb-1">
                출력
              </h5>
              <pre className="text-xs p-2 rounded bg-[var(--axis-surface-secondary)] overflow-x-auto">
                <code className="text-[var(--axis-text-primary)]">
                  {typeof output === "string" ? output : JSON.stringify(output, null, 2)}
                </code>
              </pre>
            </div>
          )}
          {error && (
            <div>
              <h5 className="text-xs font-medium text-[var(--axis-text-error)] mb-1">
                에러
              </h5>
              <pre className="text-xs p-2 rounded bg-[var(--axis-surface-error)] overflow-x-auto">
                <code className="text-[var(--axis-text-error)]">{error}</code>
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
