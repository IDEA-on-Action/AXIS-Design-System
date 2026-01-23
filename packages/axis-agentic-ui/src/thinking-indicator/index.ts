import * as React from "react";
import { cn } from "@axis-ds/ui-react";

export interface ThinkingIndicatorProps {
  /** 표시할 텍스트 */
  text?: string;
  /** 크기 */
  size?: "sm" | "md" | "lg";
  /** 추가 클래스 */
  className?: string;
}

const sizeStyles = {
  sm: "text-xs gap-1",
  md: "text-sm gap-1.5",
  lg: "text-base gap-2",
};

const dotSizes = {
  sm: "w-1 h-1",
  md: "w-1.5 h-1.5",
  lg: "w-2 h-2",
};

/**
 * AI가 생각 중임을 표시하는 인디케이터
 */
export function ThinkingIndicator({
  text = "생각 중",
  size = "md",
  className,
}: ThinkingIndicatorProps) {
  return (
    <div
      className={cn(
        "flex items-center text-[var(--axis-text-secondary)]",
        sizeStyles[size],
        className
      )}
    >
      <span>{text}</span>
      <div className="flex gap-0.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              "rounded-full bg-current animate-bounce",
              dotSizes[size]
            )}
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
