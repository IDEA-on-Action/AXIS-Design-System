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
  /**
   * 시각 표시 로케일(기본 "ko-KR"). formatTime 이 있으면 쓰지 않습니다.
   */
  locale?: string;
  /**
   * 시각 표시 시간대(IANA 이름, 예: "Asia/Seoul"). 지정하면 서버 렌더와 브라우저 결과가 같아
   * 첫 렌더부터 시각을 표시합니다. 없으면 브라우저 시간대로 표시하고, 서버 렌더 · 하이드레이션
   * 첫 렌더에서는 비워 두었다가 하이드레이션 뒤에 채웁니다(서버와 브라우저 시간대가 달라 생기는
   * 하이드레이션 불일치 방지, WI-0069).
   */
  timeZone?: string;
  /**
   * 시각 문자열을 직접 만드는 함수. 지정하면 locale · timeZone 대신 이 결과를 첫 렌더부터 씁니다.
   * 서버 렌더와 브라우저에서 같은 값을 돌려줘야 합니다(Date 의 지역 시간 메서드를 쓰면 시간대에 따라 달라짐).
   * 함수라서 서버 컴포넌트에서는 넘길 수 없습니다(그때는 locale · timeZone 을 쓰세요).
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

const roleStyles: Record<MessageRole, { container: string; bubble: string }> = {
  user: {
    container: "flex-row-reverse",
    bubble: "bg-[var(--axis-agent-message-user-bg)] text-[var(--axis-agent-message-user-text)] rounded-br-sm",
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
    <svg aria-hidden="true" className="w-3 h-3 animate-spin motion-reduce:![animation-duration:3s]" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  ),
  sent: (
    <svg aria-hidden="true" className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg aria-hidden="true" className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
  locale = "ko-KR",
  timeZone,
  formatTime,
}: MessageBubbleProps) {
  const roleLabel = MESSAGE_ROLE_LABELS[role];
  const hydrated = useHydrated();
  // 서버와 브라우저에서 같은 결과가 보장될 때만 첫 렌더부터 시각을 쓴다
  const deterministic = formatTime !== undefined || timeZone !== undefined;
  const timeText =
    timestamp && (deterministic || hydrated)
      ? formatTime
        ? formatTime(timestamp)
        : timestamp.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", timeZone })
      : "";

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
              {timeText}
            </time>
          )}
          {metadata && (
            <span className="text-xs text-[var(--axis-text-tertiary)]">{metadata}</span>
          )}
          {status && (
            <span
              role="img"
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
