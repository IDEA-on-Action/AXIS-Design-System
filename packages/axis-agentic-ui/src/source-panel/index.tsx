import * as React from "react";
import { cn } from "@axis-ds/ui-react";

export type SourceType = "web" | "file" | "database" | "api";

export interface Source {
  id: string;
  type: SourceType;
  title: string;
  url?: string;
  path?: string;
  snippet?: string;
  relevance?: number;
}

export interface SourcePanelProps {
  sources: Source[];
  expandable?: boolean;
  defaultExpanded?: boolean;
  maxItems?: number;
  className?: string;
}

const sourceIcons: Record<SourceType, React.ReactNode> = {
  web: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  ),
  file: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  database: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
    </svg>
  ),
  api: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
};

/**
 * AI 응답의 출처/근거를 표시하는 패널
 */
export function SourcePanel({
  sources,
  expandable = true,
  defaultExpanded = false,
  maxItems = 5,
  className,
}: SourcePanelProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);
  const displayedSources = isExpanded ? sources : sources.slice(0, maxItems);
  const hasMore = sources.length > maxItems;

  if (sources.length === 0) return null;

  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        "bg-[var(--axis-surface-secondary)] border-[var(--axis-border-default)]",
        className
      )}
    >
      <h4 className="text-xs font-medium text-[var(--axis-text-secondary)] mb-2">
        출처 ({sources.length}개)
      </h4>
      <div className="space-y-2">
        {displayedSources.map((source) => (
          <div
            key={source.id}
            className="flex items-start gap-2 p-2 rounded-md bg-[var(--axis-surface-default)]"
          >
            <span className="text-[var(--axis-icon-secondary)] mt-0.5">
              {sourceIcons[source.type]}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--axis-text-primary)] truncate">
                {source.url ? (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {source.title}
                  </a>
                ) : (
                  source.title
                )}
              </p>
              {source.snippet && (
                <p className="text-xs text-[var(--axis-text-secondary)] line-clamp-2 mt-0.5">
                  {source.snippet}
                </p>
              )}
              {source.path && (
                <code className="text-xs text-[var(--axis-text-tertiary)]">
                  {source.path}
                </code>
              )}
            </div>
            {source.relevance !== undefined && (
              <span className="text-xs text-[var(--axis-text-tertiary)]">
                {Math.round(source.relevance * 100)}%
              </span>
            )}
          </div>
        ))}
      </div>
      {expandable && hasMore && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 text-xs text-[var(--axis-text-brand)] hover:underline"
        >
          {isExpanded ? "접기" : `${sources.length - maxItems}개 더 보기`}
        </button>
      )}
    </div>
  );
}
