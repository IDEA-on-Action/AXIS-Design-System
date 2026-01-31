import * as React from "react";
import { cn } from "@axis-ds/ui-react";

export interface TokenUsageIndicatorProps {
  /** 현재 사용 토큰 수 */
  current: number;
  /** 최대 토큰 수 */
  max: number;
  /** 비용 (USD) */
  cost?: number;
  /** 경고 임계치 (0-1, 기본 0.8) */
  warningThreshold?: number;
  /** 컴팩트 모드 */
  compact?: boolean;
  /** 추가 클래스 */
  className?: string;
}

/**
 * 토큰 사용량 및 비용 표시 컴포넌트
 */
export function TokenUsageIndicator({
  current,
  max,
  cost,
  warningThreshold = 0.8,
  compact = false,
  className,
}: TokenUsageIndicatorProps) {
  const ratio = max > 0 ? current / max : 0;
  const percentage = Math.min(Math.round(ratio * 100), 100);

  const getColor = () => {
    if (ratio >= 1) return "bg-[var(--axis-color-red-500)]";
    if (ratio >= warningThreshold) return "bg-[var(--axis-color-yellow-500)]";
    return "bg-[var(--axis-color-green-500)]";
  };

  const getTextColor = () => {
    if (ratio >= 1) return "text-[var(--axis-color-red-500)]";
    if (ratio >= warningThreshold) return "text-[var(--axis-color-yellow-500)]";
    return "text-[var(--axis-text-secondary)]";
  };

  const formatNumber = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

  if (compact) {
    return (
      <span
        role="meter"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={`토큰 사용량: ${current} / ${max}`}
        className={cn("inline-flex items-center gap-1 text-xs", getTextColor(), className)}
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        {formatNumber(current)}/{formatNumber(max)}
        {cost !== undefined && (
          <span className="text-[var(--axis-text-tertiary)]">(${cost.toFixed(4)})</span>
        )}
      </span>
    );
  }

  return (
    <div
      role="meter"
      aria-valuenow={current}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={`토큰 사용량: ${current} / ${max} (${percentage}%)`}
      className={cn("space-y-1", className)}
    >
      <div className="flex items-center justify-between text-xs">
        <span className="text-[var(--axis-text-secondary)]">토큰 사용량</span>
        <span className={getTextColor()}>
          {formatNumber(current)} / {formatNumber(max)}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-[var(--axis-surface-secondary)] overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", getColor())}
          style={{ width: `${percentage}%` }}
          aria-hidden="true"
        />
      </div>
      {cost !== undefined && (
        <div className="text-xs text-[var(--axis-text-tertiary)] text-right">
          ${cost.toFixed(4)}
        </div>
      )}
    </div>
  );
}
