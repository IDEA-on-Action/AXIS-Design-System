import * as React from "react";
import { cn } from "../utils";

/** 여러 줄의 텍스트를 입력받는 텍스트 영역 컴포넌트. 최소 높이, 포커스 링, 비활성 상태 스타일을 포함한다. */
const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentPropsWithoutRef<"textarea">
>(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      "flex min-h-[80px] w-full rounded-md border border-[var(--axis-border-default)] bg-[var(--axis-surface-primary)] px-3 py-2 text-sm",
      "text-[var(--axis-text-primary)]",
      "ring-offset-[var(--axis-surface-primary)]",
      "placeholder:text-[var(--axis-text-tertiary)]",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--axis-ring)] focus-visible:ring-offset-2",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    ref={ref}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export { Textarea };
