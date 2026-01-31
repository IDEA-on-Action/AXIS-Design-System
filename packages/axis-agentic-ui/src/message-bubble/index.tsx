import * as React from "react";
import { cn } from "@axis-ds/ui-react";
import { MESSAGE_ROLE_LABELS } from "../constants/a11y-labels";

export type MessageRole = "user" | "assistant" | "system";
export type MessageStatus = "sending" | "sent" | "error";

export interface MessageBubbleProps {
  /** 메시지 역할 */
  role: MessageRole;
  /** 메시지 내용 */
  content: React.ReactNode;
  /** 타임스탬프 */
  timestamp?: Date;
  /** 아바타 (ReactNode 또는 이미지 URL) */
  avatar?: React.ReactNode | string;
  /** 전송 상태 */
  status?: MessageStatus;
  /** 하단 액션 영역 */
  actions?: React.ReactNode;
  /** 메타데이터 (모델명 등) */
  metadata?: string;
  /** 추가 클래스 */
  className?: string;
}

const roleStyles: Record<MessageRole, { container: string; bubble: string }> = {
  user: {
    container: "flex-row-reverse",
    bubble: "bg-[var(--axis-color-blue-500)] text-white rounded-br-sm",
  },
  assistant: {
    container: "flex-row",
    bubble: "bg-[var(--axis-surface-secondary)] text-[var(--axis-text-primary)] rounded-bl-sm",
  },
  system: {
    container: "justify-center",
    bubble: "bg-[var(--axis-surface-tertiary)] text-[var(--axis-text-secondary)] text-xs italic",
  },
};

const statusIcons: Record<MessageStatus, React.ReactNode> = {
  sending: (
    <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  ),
  sent: (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
    </svg>
  ),
};

/**
 * 대화 메시지 버블 컴포넌트
 */
export function MessageBubble({
  role,
  content,
  timestamp,
  avatar,
  status,
  actions,
  metadata,
  className,
}: MessageBubbleProps) {
  const roleLabel = MESSAGE_ROLE_LABELS[role];

  const renderAvatar = () => {
    if (!avatar) return null;
    if (typeof avatar === "string") {
      return (
        <img
          src={avatar}
          alt=""
          aria-hidden="true"
          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
        />
      );
    }
    return <div className="flex-shrink-0">{avatar}</div>;
  };

  return (
    <div
      role="article"
      aria-label={`${roleLabel} 메시지`}
      className={cn("flex items-start gap-2", roleStyles[role].container, className)}
    >
      {role !== "system" && renderAvatar()}
      <div className={cn("max-w-[80%]", role === "system" && "max-w-full")}>
        <div
          className={cn(
            "rounded-lg px-3 py-2",
            roleStyles[role].bubble
          )}
        >
          <div className="text-sm whitespace-pre-wrap">{content}</div>
        </div>
        <div className="flex items-center gap-2 mt-1 px-1">
          {timestamp && (
            <time
              dateTime={timestamp.toISOString()}
              className="text-xs text-[var(--axis-text-tertiary)]"
            >
              {timestamp.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
            </time>
          )}
          {metadata && (
            <span className="text-xs text-[var(--axis-text-tertiary)]">{metadata}</span>
          )}
          {status && (
            <span
              className={cn(
                "text-[var(--axis-text-tertiary)]",
                status === "error" && "text-[var(--axis-text-error)]"
              )}
              aria-label={status === "sending" ? "전송 중" : status === "sent" ? "전송됨" : "전송 실패"}
            >
              {statusIcons[status]}
            </span>
          )}
        </div>
        {actions && <div className="mt-1">{actions}</div>}
      </div>
    </div>
  );
}
