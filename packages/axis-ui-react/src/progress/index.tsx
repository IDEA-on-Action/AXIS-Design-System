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

/** Progress 컴포넌트의 Props 인터페이스. 크기 및 색상 변형과 불확정 상태를 지원한다. */
export interface ProgressProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof progressVariants>,
    VariantProps<typeof progressIndicatorVariants> {
  /** 진행률 값 (0부터 max까지). 기본값은 0이다. */
  value?: number;
  /** 진행률의 최대값. 기본값은 100이다. */
  max?: number;
  /** 불확정 상태 여부. true일 경우 진행률 대신 로딩 애니메이션을 표시한다. */
  indeterminate?: boolean;
}

/**
 * 진행 상태를 시각적으로 표시하는 프로그레스 바 컴포넌트.
 * progressbar 역할(role)과 ARIA 속성을 포함하여 접근성을 보장한다.
 * 크기(sm, default, lg)와 색상(default, success, warning, destructive) 변형을 지원한다.
 */
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
