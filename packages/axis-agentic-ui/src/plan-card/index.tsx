import * as React from "react";
import { cn } from "@axis-ds/ui-react";
import { PLAN_STATUS_LABELS, STATUS_LABELS } from "../constants/a11y-labels";

export type PlanStatus = "draft" | "pending" | "approved" | "rejected" | "executing" | "completed";
export type PlanStepStatus = "pending" | "running" | "complete" | "error" | "skipped";

export interface PlanStep {
  id: string;
  label: string;
  status: PlanStepStatus;
  description?: string;
}

export interface PlanCardProps {
  /** 계획 제목 */
  title: string;
  /** 단계 목록 */
  steps: PlanStep[];
  /** 계획 상태 */
  status?: PlanStatus;
  /** 승인 콜백 */
  onApprove?: () => void;
  /** 수정 콜백 */
  onEdit?: () => void;
  /** 거절 콜백 */
  onReject?: () => void;
  /** 추가 클래스 */
  className?: string;
}

const planStatusStyles: Record<PlanStatus, { border: string; badge: string }> = {
  draft: {
    border: "border-l-[var(--axis-color-gray-400)]",
    badge: "bg-[var(--axis-color-gray-100)] text-[var(--axis-color-gray-600)]",
  },
  pending: {
    border: "border-l-[var(--axis-color-yellow-500)]",
    badge: "bg-[var(--axis-color-yellow-500)]/10 text-[var(--axis-color-yellow-600)]",
  },
  approved: {
    border: "border-l-[var(--axis-color-green-500)]",
    badge: "bg-[var(--axis-color-green-500)]/10 text-[var(--axis-color-green-600)]",
  },
  rejected: {
    border: "border-l-[var(--axis-color-red-500)]",
    badge: "bg-[var(--axis-color-red-500)]/10 text-[var(--axis-color-red-600)]",
  },
  executing: {
    border: "border-l-[var(--axis-color-blue-500)]",
    badge: "bg-[var(--axis-color-blue-500)]/10 text-[var(--axis-color-blue-600)]",
  },
  completed: {
    border: "border-l-[var(--axis-color-green-500)]",
    badge: "bg-[var(--axis-color-green-500)]/10 text-[var(--axis-color-green-600)]",
  },
};

const stepStatusIcons: Record<PlanStepStatus, React.ReactNode> = {
  pending: (
    <svg className="w-4 h-4 text-[var(--axis-color-gray-400)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" strokeWidth={2} />
    </svg>
  ),
  running: (
    <svg className="w-4 h-4 text-[var(--axis-color-blue-500)] animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  ),
  complete: (
    <svg className="w-4 h-4 text-[var(--axis-color-green-500)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-4 h-4 text-[var(--axis-color-red-500)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  skipped: (
    <svg className="w-4 h-4 text-[var(--axis-color-gray-400)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
    </svg>
  ),
};

/**
 * AI 실행 계획을 표시하고 승인/거절하는 카드 컴포넌트
 */
export function PlanCard({
  title,
  steps,
  status = "pending",
  onApprove,
  onEdit,
  onReject,
  className,
}: PlanCardProps) {
  const styles = planStatusStyles[status];
  const titleId = React.useId();
  const statusLabel = PLAN_STATUS_LABELS[status];
  const completedCount = steps.filter((s) => s.status === "complete").length;

  return (
    <div
      role="region"
      aria-labelledby={titleId}
      className={cn(
        "rounded-lg border border-l-4 overflow-hidden",
        "bg-[var(--axis-surface-default)] border-[var(--axis-border-default)]",
        styles.border,
        className
      )}
    >
      {/* 헤더 */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-[var(--axis-icon-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h4 id={titleId} className="text-sm font-semibold text-[var(--axis-text-primary)]">
              {title}
            </h4>
          </div>
          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", styles.badge)}>
            {statusLabel}
          </span>
        </div>

        {/* 진행률 */}
        <div className="flex items-center gap-2 text-xs text-[var(--axis-text-tertiary)]">
          <span>{completedCount}/{steps.length} 단계</span>
          {steps.length > 0 && (
            <div className="flex-1 h-1 rounded-full bg-[var(--axis-surface-secondary)] overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--axis-color-green-500)] transition-all"
                style={{ width: `${(completedCount / steps.length) * 100}%` }}
                aria-hidden="true"
              />
            </div>
          )}
        </div>
      </div>

      {/* 단계 목록 */}
      <div role="list" aria-label="실행 단계" className="border-t border-[var(--axis-border-default)] divide-y divide-[var(--axis-border-default)]">
        {steps.map((step) => {
          const stepStatusLabel = STATUS_LABELS[step.status] || step.status;
          return (
            <div
              key={step.id}
              role="listitem"
              aria-current={step.status === "running" ? "step" : undefined}
              className="flex items-start gap-3 px-4 py-2.5"
            >
              <span aria-hidden="true" className="mt-0.5 flex-shrink-0">
                {stepStatusIcons[step.status]}
              </span>
              <div className="flex-1 min-w-0">
                <span className="sr-only">{stepStatusLabel}:</span>
                <p className="text-sm text-[var(--axis-text-primary)]">{step.label}</p>
                {step.description && (
                  <p className="text-xs text-[var(--axis-text-secondary)] mt-0.5">{step.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 액션 버튼 */}
      {(status === "pending" || status === "draft") && (onApprove || onEdit || onReject) && (
        <div className="flex gap-2 p-3 border-t border-[var(--axis-border-default)] bg-[var(--axis-surface-secondary)]">
          {onApprove && (
            <button
              onClick={onApprove}
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-[var(--axis-color-green-500)] text-white hover:bg-[var(--axis-color-green-600)] transition-colors"
            >
              승인
            </button>
          )}
          {onEdit && (
            <button
              onClick={onEdit}
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-[var(--axis-button-secondary-bg-default)] text-[var(--axis-text-primary)] hover:bg-[var(--axis-button-secondary-bg-hover)] transition-colors"
            >
              수정
            </button>
          )}
          {onReject && (
            <button
              onClick={onReject}
              className="px-3 py-1.5 text-xs font-medium rounded-md text-[var(--axis-color-red-500)] hover:bg-[var(--axis-color-red-500)]/10 transition-colors"
            >
              거절
            </button>
          )}
        </div>
      )}
    </div>
  );
}
