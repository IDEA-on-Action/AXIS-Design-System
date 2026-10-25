import * as React from "react";
import { cn } from "@axis-ds/ui-react";
import { STATUS_LABELS } from "../constants/a11y-labels";

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
  /**
   * 시각 표시 로케일. 없으면 실행 환경의 기본 로케일입니다(이전과 같음). formatTime 이 있으면 쓰지 않습니다.
   */
  locale?: string;
  /**
   * 시각 표시 시간대(IANA 이름, 예: "Asia/Seoul"). locale 과 함께 지정하면 서버 렌더와 브라우저 결과가 같아
   * 첫 렌더부터 시각을 표시합니다. 둘 중 하나라도 없으면 실행 환경 값에 따라 달라지므로, 서버 렌더 ·
   * 하이드레이션 첫 렌더에서는 비워 두었다가 하이드레이션 뒤에 채웁니다(하이드레이션 불일치 방지, WI-0069).
   */
  timeZone?: string;
  /**
   * 시각 문자열을 직접 만드는 함수. 지정하면 locale · timeZone 대신 이 결과를 첫 렌더부터 씁니다.
   * 서버 렌더와 브라우저에서 같은 값을 돌려줘야 합니다. 함수라서 서버 컴포넌트에서는 넘길 수 없습니다.
   */
  formatTime?: (date: Date) => string;
}

const noopSubscribe = () => () => {};

/** 하이드레이션이 끝났는지. 서버 렌더와 하이드레이션 첫 렌더는 false, 그 뒤와 클라이언트 전용 렌더는 true */
function useHydrated(): boolean {
  return React.useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}

/**
 * 단계별 타임라인 컴포넌트
 */
export function StepTimeline({
  steps,
  orientation = "vertical",
  className,
  locale,
  timeZone,
  formatTime,
}: StepTimelineProps) {
  const isVertical = orientation === "vertical";
  const hydrated = useHydrated();
  // 서버와 브라우저에서 같은 결과가 보장될 때만 첫 렌더부터 시각을 쓴다
  const deterministic = formatTime !== undefined || (locale !== undefined && timeZone !== undefined);
  const formatStepTime = (date: Date): string => {
    if (!deterministic && !hydrated) return "";
    if (formatTime) return formatTime(date);
    return timeZone !== undefined
      ? date.toLocaleTimeString(locale, { timeZone })
      : date.toLocaleTimeString(locale);
  };

  return (
    <div
      role="list"
      aria-label="작업 타임라인"
      className={cn(
        isVertical ? "flex flex-col gap-4" : "flex items-center gap-2",
        className
      )}
    >
      {steps.map((step, index) => (
        <div
          key={step.id}
          role="listitem"
          aria-current={step.status === "running" ? "step" : undefined}
          className={cn(
            "relative flex",
            isVertical ? "items-start gap-3" : "flex-col items-center"
          )}
        >
          {/* 연결선 */}
          {index < steps.length - 1 && (
            <div
              aria-hidden="true"
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
            aria-hidden="true"
            className={cn(
              "relative z-10 w-5 h-5 rounded-full flex items-center justify-center",
              step.status === "complete" && "bg-[var(--axis-text-success)]",
              step.status === "running" && "bg-[var(--axis-status-running)] animate-pulse motion-reduce:![animation-duration:5s]",
              step.status === "error" && "bg-[var(--axis-status-error)]",
              step.status === "skipped" && "bg-[var(--axis-status-neutral-muted)]",
              step.status === "pending" && "bg-[var(--axis-status-neutral-muted)]"
            )}
          >
            {step.status === "complete" && (
              <svg className="w-3 h-3 text-[var(--axis-status-success-contrast)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>

          {/* 라벨 */}
          <div className={cn(isVertical ? "flex-1" : "text-center mt-2")}>
            <span className="sr-only">{STATUS_LABELS[step.status]}:</span>
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
                <time dateTime={step.timestamp.toISOString()}>{formatStepTime(step.timestamp)}</time>
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
