import * as React from "react";
import { cn } from "@axis-ds/ui-react";
import { STATUS_LABELS } from "../constants/a11y-labels";

export type StepStatus = "pending" | "running" | "complete" | "error";

export interface Step {
  id: string;
  label: string;
  status: StepStatus;
  description?: string;
}

export interface RunProgressProps {
  /** 전체 실행 상태 */
  status: "idle" | "running" | "complete" | "error";
  /** 단계 목록 */
  steps: Step[];
  /** 현재 진행 중인 단계 인덱스 */
  currentStep?: number;
  /** 취소 콜백 */
  onCancel?: () => void;
  /** 재시도 콜백 */
  onRetry?: () => void;
  /** 추가 클래스 */
  className?: string;
}

const statusColors: Record<StepStatus, string> = {
  pending: "bg-[var(--axis-color-gray-300)]",
  running: "bg-[var(--axis-color-blue-500)] animate-pulse",
  complete: "bg-[var(--axis-color-green-500)]",
  error: "bg-[var(--axis-color-red-500)]",
};

const statusIcons: Record<StepStatus, React.ReactNode> = {
  pending: null,
  running: (
    <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  ),
  complete: (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
};

/**
 * 에이전트 실행 진행 상태를 표시하는 컴포넌트
 */
export function RunProgress({
  status,
  steps,
  currentStep,
  onCancel,
  onRetry,
  className,
}: RunProgressProps) {
  const progressPercent = React.useMemo(() => {
    const completed = steps.filter((s) => s.status === "complete").length;
    return Math.round((completed / steps.length) * 100);
  }, [steps]);

  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        "bg-[var(--axis-surface-default)] border-[var(--axis-border-default)]",
        className
      )}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {status === "running" && (
            <div className="w-2 h-2 rounded-full bg-[var(--axis-color-blue-500)] animate-pulse" />
          )}
          <span className="text-sm font-medium text-[var(--axis-text-primary)]">
            {status === "idle" && "대기 중"}
            {status === "running" && "실행 중"}
            {status === "complete" && "완료"}
            {status === "error" && "오류 발생"}
          </span>
        </div>
        <span className="text-xs text-[var(--axis-text-secondary)]">
          {progressPercent}%
        </span>
      </div>

      {/* 진행 바 */}
      <div
        role="progressbar"
        aria-valuenow={progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`실행 진행률 ${progressPercent}%`}
        className="w-full h-1.5 rounded-full bg-[var(--axis-surface-secondary)] mb-4"
      >
        <div
          className="h-full rounded-full bg-[var(--axis-color-blue-500)] transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* 단계 목록 */}
      <div role="list" aria-label="실행 단계" className="space-y-2">
        {steps.map((step, index) => (
          <div
            key={step.id}
            role="listitem"
            aria-current={currentStep === index ? "step" : undefined}
            className={cn(
              "flex items-center gap-3 p-2 rounded-md transition-colors",
              currentStep === index && "bg-[var(--axis-surface-secondary)]"
            )}
          >
            <div
              className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center text-white text-xs",
                statusColors[step.status]
              )}
              aria-hidden="true"
            >
              {statusIcons[step.status] || index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <span className="sr-only">{STATUS_LABELS[step.status]}:</span>
              <p className="text-sm font-medium text-[var(--axis-text-primary)] truncate">
                {step.label}
              </p>
              {step.description && (
                <p className="text-xs text-[var(--axis-text-secondary)] truncate">
                  {step.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 액션 버튼 */}
      {(onCancel || onRetry) && (
        <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-[var(--axis-border-default)]">
          {status === "running" && onCancel && (
            <button
              onClick={onCancel}
              className="px-3 py-1.5 text-sm rounded-md bg-[var(--axis-surface-secondary)] text-[var(--axis-text-primary)] hover:bg-[var(--axis-surface-tertiary)]"
            >
              취소
            </button>
          )}
          {status === "error" && onRetry && (
            <button
              onClick={onRetry}
              className="px-3 py-1.5 text-sm rounded-md bg-[var(--axis-color-blue-500)] text-white hover:bg-[var(--axis-color-blue-600)]"
            >
              재시도
            </button>
          )}
        </div>
      )}
    </div>
  );
}
