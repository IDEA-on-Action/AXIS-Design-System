import * as React from "react";
import { cn } from "../utils";

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
