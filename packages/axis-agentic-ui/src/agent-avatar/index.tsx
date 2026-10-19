import * as React from "react";
import { cn } from "@axis-ds/ui-react";
import { AGENT_STATUS_LABELS } from "../constants/a11y-labels";

export interface AgentAvatarProps {
  /** 에이전트 이름 */
  name: string;
  /** 이미지 URL */
  src?: string;
  /** 크기 */
  size?: "sm" | "md" | "lg" | "xl";
  /** 상태 표시 */
  status?: "online" | "busy" | "offline";
  /** 에이전트 타입 */
  type?: "assistant" | "tool" | "system";
  /** 추가 클래스 */
  className?: string;
}

const sizeStyles = {
  sm: "w-6 h-6 text-xs",
  md: "w-8 h-8 text-sm",
  lg: "w-10 h-10 text-base",
  xl: "w-12 h-12 text-lg",
};

const statusStyles = {
  online: "bg-[var(--axis-status-success)]",
  busy: "bg-[var(--axis-status-warning)]",
  offline: "bg-[var(--axis-status-neutral)]",
};

const typeColors = {
  assistant: "bg-[var(--axis-agent-avatar-assistant)]",
  tool: "bg-[var(--axis-agent-avatar-tool)]",
  system: "bg-[var(--axis-agent-avatar-system)]",
};

/**
 * 에이전트 아바타 컴포넌트
 */
export function AgentAvatar({
  name,
  src,
  size = "md",
  status,
  type = "assistant",
  className,
}: AgentAvatarProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const statusLabel = status ? AGENT_STATUS_LABELS[status] : "";
  const ariaLabel = `${name}${statusLabel ? `, ${statusLabel}` : ""}`;

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className={cn("relative inline-flex", className)}
    >
      {src ? (
        <img
          src={src}
          alt=""
          aria-hidden="true"
          className={cn(
            "rounded-full object-cover",
            sizeStyles[size]
          )}
        />
      ) : (
        <div
          aria-hidden="true"
          className={cn(
            "rounded-full flex items-center justify-center font-medium text-[var(--axis-agent-avatar-text)]",
            sizeStyles[size],
            typeColors[type]
          )}
        >
          {initials}
        </div>
      )}
      {status && (
        <span
          aria-hidden="true"
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-2 border-[var(--axis-surface-default)]",
            size === "sm" ? "w-2 h-2" : "w-3 h-3",
            statusStyles[status]
          )}
        />
      )}
    </div>
  );
}
