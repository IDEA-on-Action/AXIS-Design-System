import * as React from "react";
import { cn } from "@axis-ds/ui-react";

export interface RecoveryBannerProps {
  /** 에러 메시지 */
  message: string;
  /** 상세 설명 */
  description?: string;
  /** 재시도 콜백 */
  onRetry?: () => void;
  /** 무시 콜백 */
  onDismiss?: () => void;
  /** 추가 클래스 */
  className?: string;
}

/**
 * 에러 발생 시 복구 옵션을 제공하는 배너
 */
export function RecoveryBanner({
  message,
  description,
  onRetry,
  onDismiss,
  className,
}: RecoveryBannerProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg border",
        "bg-[var(--axis-surface-error)] border-[var(--axis-color-red-200)]",
        className
      )}
      role="alert"
    >
      <svg
        className="w-5 h-5 text-[var(--axis-color-red-500)] flex-shrink-0 mt-0.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--axis-text-error)]">
          {message}
        </p>
        {description && (
          <p className="mt-1 text-sm text-[var(--axis-text-secondary)]">
            {description}
          </p>
        )}
        <div className="flex gap-2 mt-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-3 py-1.5 text-sm font-medium rounded-md bg-[var(--axis-color-red-500)] text-white hover:bg-[var(--axis-color-red-600)] transition-colors"
            >
              재시도
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="px-3 py-1.5 text-sm font-medium rounded-md bg-transparent text-[var(--axis-text-primary)] hover:bg-[var(--axis-surface-secondary)] transition-colors"
            >
              무시
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
