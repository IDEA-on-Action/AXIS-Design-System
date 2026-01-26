import * as React from "react";
import { cn } from "@axis-ds/ui-react";
import { SEVERITY_LABELS } from "../constants/a11y-labels";

export type Severity = "info" | "warning" | "error";

export interface ApprovalAction {
  label: string;
  variant?: "default" | "secondary" | "ghost" | "destructive";
  onClick: () => void;
}

export interface ApprovalCardProps {
  /** 고유 ID (접근성용) */
  id?: string;
  /** 제목 */
  title: string;
  /** 설명 */
  description?: string;
  /** 심각도 (색상 결정) */
  severity?: Severity;
  /** 액션 버튼 목록 */
  actions: ApprovalAction[];
  /** 추가 내용 */
  children?: React.ReactNode;
  /** 추가 클래스 */
  className?: string;
}

const severityStyles: Record<Severity, { border: string; icon: string; bg: string }> = {
  info: {
    border: "border-l-[var(--axis-color-blue-500)]",
    icon: "text-[var(--axis-color-blue-500)]",
    bg: "bg-[var(--axis-surface-info)]",
  },
  warning: {
    border: "border-l-[var(--axis-color-yellow-500)]",
    icon: "text-[var(--axis-color-yellow-500)]",
    bg: "bg-[var(--axis-surface-warning)]",
  },
  error: {
    border: "border-l-[var(--axis-color-red-500)]",
    icon: "text-[var(--axis-color-red-500)]",
    bg: "bg-[var(--axis-surface-error)]",
  },
};

const severityIcons: Record<Severity, React.ReactNode> = {
  info: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

const actionVariantStyles: Record<string, string> = {
  default: "bg-[var(--axis-button-bg-default)] text-white hover:bg-[var(--axis-button-bg-hover)]",
  secondary: "bg-[var(--axis-button-secondary-bg-default)] text-[var(--axis-text-primary)] hover:bg-[var(--axis-button-secondary-bg-hover)]",
  ghost: "bg-transparent text-[var(--axis-text-primary)] hover:bg-[var(--axis-surface-secondary)]",
  destructive: "bg-[var(--axis-button-destructive-bg-default)] text-white hover:bg-[var(--axis-button-destructive-bg-hover)]",
};

/**
 * 사용자 승인이 필요한 작업을 표시하는 카드 컴포넌트
 */
export function ApprovalCard({
  id,
  title,
  description,
  severity = "info",
  actions,
  children,
  className,
}: ApprovalCardProps) {
  const styles = severityStyles[severity];
  const generatedId = React.useId();
  const baseId = id || generatedId;
  const titleId = `${baseId}-title`;
  const descId = `${baseId}-desc`;
  const severityLabel = SEVERITY_LABELS[severity];

  return (
    <div
      role="region"
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      className={cn(
        "rounded-lg border border-l-4 p-4",
        "bg-[var(--axis-surface-default)] border-[var(--axis-border-default)]",
        styles.border,
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("flex-shrink-0 mt-0.5", styles.icon)} aria-hidden="true">
          {severityIcons[severity]}
        </div>
        <div className="flex-1 min-w-0">
          <span className="sr-only">{severityLabel} 알림:</span>
          <h4 id={titleId} className="text-sm font-semibold text-[var(--axis-text-primary)]">
            {title}
          </h4>
          {description && (
            <p id={descId} className="mt-1 text-sm text-[var(--axis-text-secondary)]">
              {description}
            </p>
          )}
          {children && <div className="mt-3">{children}</div>}
          <div className="flex flex-wrap gap-2 mt-4">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                  actionVariantStyles[action.variant || "default"]
                )}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
