import * as React from "react";
import { cn } from "@axis-ds/ui-react";

export type TimelineStepStatus = "pending" | "running" | "complete" | "error" | "skipped";

export interface TimelineStep {
  id: string;
  label: string;
  status: TimelineStepStatus;
  timestamp?: Date;
  description?: string;
}

export interface StepTimelineProps {
  steps: TimelineStep[];
  orientation?: "vertical" | "horizontal";
  className?: string;
}

/**
 * 단계별 타임라인 컴포넌트
 */
export function StepTimeline({
  steps,
  orientation = "vertical",
  className,
}: StepTimelineProps) {
  const isVertical = orientation === "vertical";

  return (
    <div
      className={cn(
        isVertical ? "flex flex-col gap-4" : "flex items-center gap-2",
        className
      )}
    >
      {steps.map((step, index) => (
        <div
          key={step.id}
          className={cn(
            "relative flex",
            isVertical ? "items-start gap-3" : "flex-col items-center"
          )}
        >
          {/* 연결선 */}
          {index < steps.length - 1 && (
            <div
              className={cn(
                "absolute bg-[var(--axis-border-default)]",
                isVertical
                  ? "left-2.5 top-6 w-0.5 h-full -translate-x-1/2"
                  : "top-2.5 left-6 h-0.5 w-full"
              )}
            />
          )}

          {/* 상태 인디케이터 */}
          <div
            className={cn(
              "relative z-10 w-5 h-5 rounded-full flex items-center justify-center",
              step.status === "complete" && "bg-[var(--axis-color-green-500)]",
              step.status === "running" && "bg-[var(--axis-color-blue-500)] animate-pulse",
              step.status === "error" && "bg-[var(--axis-color-red-500)]",
              step.status === "skipped" && "bg-[var(--axis-color-gray-300)]",
              step.status === "pending" && "bg-[var(--axis-color-gray-300)]"
            )}
          >
            {step.status === "complete" && (
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>

          {/* 라벨 */}
          <div className={cn(isVertical ? "flex-1" : "text-center mt-2")}>
            <p className="text-sm font-medium text-[var(--axis-text-primary)]">
              {step.label}
            </p>
            {step.description && (
              <p className="text-xs text-[var(--axis-text-secondary)]">
                {step.description}
              </p>
            )}
            {step.timestamp && (
              <p className="text-xs text-[var(--axis-text-tertiary)]">
                {step.timestamp.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
