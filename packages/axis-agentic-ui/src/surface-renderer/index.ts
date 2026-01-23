import * as React from "react";
import { cn } from "@axis-ds/ui-react";

export type SurfaceType = "text" | "code" | "table" | "chart" | "form" | "custom";

export interface Surface {
  id: string;
  type: SurfaceType;
  title?: string;
  content: unknown;
  metadata?: Record<string, unknown>;
}

export interface SurfaceRendererProps {
  surface: Surface;
  renderCustom?: (surface: Surface) => React.ReactNode;
  className?: string;
}

/**
 * 다양한 타입의 Surface를 동적으로 렌더링하는 컴포넌트
 */
export function SurfaceRenderer({
  surface,
  renderCustom,
  className,
}: SurfaceRendererProps) {
  const renderContent = () => {
    switch (surface.type) {
      case "text":
        return (
          <div className="prose prose-sm max-w-none text-[var(--axis-text-primary)]">
            {String(surface.content)}
          </div>
        );

      case "code":
        return (
          <pre className="p-3 rounded-md bg-[var(--axis-surface-secondary)] overflow-x-auto">
            <code className="text-sm font-mono text-[var(--axis-text-primary)]">
              {String(surface.content)}
            </code>
          </pre>
        );

      case "table":
        const tableData = surface.content as { headers: string[]; rows: string[][] };
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--axis-border-default)]">
                  {tableData.headers.map((header, i) => (
                    <th
                      key={i}
                      className="px-3 py-2 text-left font-medium text-[var(--axis-text-secondary)]"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.rows.map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-[var(--axis-border-default)] last:border-0"
                  >
                    {row.map((cell, j) => (
                      <td
                        key={j}
                        className="px-3 py-2 text-[var(--axis-text-primary)]"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case "chart":
        return (
          <div className="p-4 text-center text-[var(--axis-text-secondary)]">
            [차트: {surface.title || "데이터 시각화"}]
          </div>
        );

      case "form":
        return (
          <div className="p-4 text-center text-[var(--axis-text-secondary)]">
            [폼: {surface.title || "입력 양식"}]
          </div>
        );

      case "custom":
        if (renderCustom) {
          return renderCustom(surface);
        }
        return (
          <div className="p-4 text-center text-[var(--axis-text-secondary)]">
            [커스텀 Surface]
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        "bg-[var(--axis-surface-default)] border-[var(--axis-border-default)]",
        className
      )}
    >
      {surface.title && (
        <h4 className="text-sm font-medium text-[var(--axis-text-primary)] mb-3">
          {surface.title}
        </h4>
      )}
      {renderContent()}
    </div>
  );
}
