import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../utils";

const progressVariants = cva(
  "relative h-2 w-full overflow-hidden rounded-full bg-[var(--axis-surface-tertiary)]",
  {
    variants: {
      size: {
        sm: "h-1",
        default: "h-2",
        lg: "h-3",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

const progressIndicatorVariants = cva(
  "h-full w-full flex-1 transition-all duration-300 ease-in-out",
  {
    variants: {
      variant: {
        default: "bg-[var(--axis-brand-500)]",
        success: "bg-[var(--axis-green-500)]",
        warning: "bg-[var(--axis-yellow-500)]",
        destructive: "bg-[var(--axis-red-500)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface ProgressProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof progressVariants>,
    VariantProps<typeof progressIndicatorVariants> {
  /** 진행률 (0-100) */
  value?: number;
  /** 최대값 */
  max?: number;
  /** 불확정 상태 (로딩 애니메이션) */
  indeterminate?: boolean;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      className,
      value = 0,
      max = 100,
      size,
      variant,
      indeterminate = false,
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={indeterminate ? undefined : value}
        className={cn(progressVariants({ size }), className)}
        {...props}
      >
        <div
          className={cn(
            progressIndicatorVariants({ variant }),
            indeterminate && "animate-progress-indeterminate"
          )}
          style={
            indeterminate
              ? undefined
              : { transform: `translateX(-${100 - percentage}%)` }
          }
        />
      </div>
    );
  }
);
Progress.displayName = "Progress";

export { Progress, progressVariants, progressIndicatorVariants };
