import * as React from "react";
import { cn } from "@axis-ds/ui-react";
import { FEEDBACK_LABELS } from "../constants/a11y-labels";

export type FeedbackType = "like" | "dislike" | "none";

export interface FeedbackButtonsProps {
  /** 메시지 ID */
  messageId: string;
  /** 초기 피드백 상태 */
  initialFeedback?: FeedbackType;
  /** 피드백 변경 콜백 */
  onFeedback?: (messageId: string, feedback: FeedbackType) => void;
  /** 크기 */
  size?: "sm" | "md";
  /** 추가 클래스 */
  className?: string;
}

const sizeStyles = {
  sm: "p-1",
  md: "p-1.5",
};

const iconSizes = {
  sm: "w-3.5 h-3.5",
  md: "w-4 h-4",
};

/**
 * 좋아요/싫어요 피드백 버튼 컴포넌트
 */
export function FeedbackButtons({
  messageId,
  initialFeedback = "none",
  onFeedback,
  size = "sm",
  className,
}: FeedbackButtonsProps) {
  const [feedback, setFeedback] = React.useState<FeedbackType>(initialFeedback);

  const handleFeedback = (type: FeedbackType) => {
    const newFeedback = feedback === type ? "none" : type;
    setFeedback(newFeedback);
    onFeedback?.(messageId, newFeedback);
  };

  return (
    <div
      role="group"
      aria-label="메시지 피드백"
      className={cn("inline-flex items-center gap-1", className)}
    >
      <button
        onClick={() => handleFeedback("like")}
        aria-pressed={feedback === "like"}
        aria-label={FEEDBACK_LABELS.like}
        className={cn(
          "rounded-md transition-colors",
          sizeStyles[size],
          feedback === "like"
            ? "text-[var(--axis-color-green-500)] bg-[var(--axis-color-green-500)]/10"
            : "text-[var(--axis-text-tertiary)] hover:text-[var(--axis-text-secondary)] hover:bg-[var(--axis-surface-secondary)]"
        )}
      >
        <svg className={iconSizes[size]} fill={feedback === "like" ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14zm-9 11H3a2 2 0 01-2-2v-7a2 2 0 012-2h2" />
        </svg>
      </button>
      <button
        onClick={() => handleFeedback("dislike")}
        aria-pressed={feedback === "dislike"}
        aria-label={FEEDBACK_LABELS.dislike}
        className={cn(
          "rounded-md transition-colors",
          sizeStyles[size],
          feedback === "dislike"
            ? "text-[var(--axis-color-red-500)] bg-[var(--axis-color-red-500)]/10"
            : "text-[var(--axis-text-tertiary)] hover:text-[var(--axis-text-secondary)] hover:bg-[var(--axis-surface-secondary)]"
        )}
      >
        <svg className={iconSizes[size]} fill={feedback === "dislike" ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 15V19a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3H10zm9-13h2a2 2 0 012 2v7a2 2 0 01-2 2h-2" />
        </svg>
      </button>
    </div>
  );
}
