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
        default: "bg-[var(--axis-progress-fill-default,var(--axis-surface-brand))]",
        success: "bg-[var(--axis-progress-fill-success,var(--axis-color-green-500))]",
        warning: "bg-[var(--axis-progress-fill-warning,var(--axis-color-yellow-500))]",
        destructive: "bg-[var(--axis-progress-fill-destructive,var(--axis-color-red-500))]",
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
            // 불확정: 트랙 폭 1/3 인 표시기가 왕복한다(@axis-ds/tokens 의 progress-indeterminate keyframes).
            // 꽉 찬 막대(100% 완료)로 보이지 않도록 폭을 줄인다. 움직임 줄이기 설정에서는 멈추지 않고
            // 느리게(1.5s → 4s) 왕복해 처리 중임을 계속 알린다(WI-0071).
            // duration-[1500ms]: tailwindcss-animate 는 duration-300 을 animation-duration 에도 적용해 왕복이
            // 0.3s 로 빨라진다(실측). keyframes 의 1.5s 와 같은 값으로 덮는다(progress.test 가 토큰 값과 대조)
            indeterminate &&
              "w-1/3 duration-[1500ms] animate-progress-indeterminate motion-reduce:![animation-duration:4s]"
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
