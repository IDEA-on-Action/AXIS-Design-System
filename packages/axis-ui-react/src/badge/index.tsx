import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[var(--axis-badge-default-bg)] text-[var(--axis-badge-default-text)]",
        secondary:
          "border-transparent bg-[var(--axis-bg-muted)] text-[var(--axis-text-secondary)]",
        destructive:
          "border-transparent bg-[var(--axis-badge-error-bg)] text-[var(--axis-badge-error-text)]",
        success:
          "border-transparent bg-[var(--axis-badge-success-bg)] text-[var(--axis-badge-success-text)]",
        warning:
          "border-transparent bg-[var(--axis-badge-warning-bg)] text-[var(--axis-badge-warning-text)]",
        error:
          "border-transparent bg-[var(--axis-badge-error-bg)] text-[var(--axis-badge-error-text)]",
        info:
          "border-transparent bg-[var(--axis-badge-info-bg)] text-[var(--axis-badge-info-text)]",
        outline: "border-[var(--axis-border-default)] text-[var(--axis-text-primary)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

/**
 * Badge 컴포넌트 Props
 * @property variant - 배지 스타일 변형 (default, secondary, destructive, success, warning, error, info, outline)
 */
export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

/** 상태나 카테고리를 나타내는 작은 라벨 컴포넌트 */
const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };
