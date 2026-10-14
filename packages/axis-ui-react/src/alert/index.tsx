import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../utils";

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-current",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--axis-surface-default)] text-[var(--axis-text-primary)] border-[var(--axis-border-default)]",
        info: "bg-[var(--axis-surface-info)] text-[var(--axis-text-info)] border-[var(--axis-border-info)] [&>svg]:text-[var(--axis-icon-info)]",
        success:
          "bg-[var(--axis-surface-success)] text-[var(--axis-text-success)] border-[var(--axis-border-success)] [&>svg]:text-[var(--axis-icon-success)]",
        warning:
          "bg-[var(--axis-surface-warning)] text-[var(--axis-text-warning)] border-[var(--axis-border-warning)] [&>svg]:text-[var(--axis-icon-warning)]",
        destructive:
          "bg-[var(--axis-surface-error)] text-[var(--axis-text-error)] border-[var(--axis-border-error)] [&>svg]:text-[var(--axis-icon-error)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

/**
 * Alert 컴포넌트 Props
 * @property variant - 알림 스타일 변형 (default, info, success, warning, destructive)
 */
export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {}

/** 사용자에게 중요한 메시지를 전달하는 알림 컴포넌트 */
const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
);
Alert.displayName = "Alert";

/** 알림의 제목을 표시하는 컴포넌트 */
const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

/** 알림의 상세 설명을 표시하는 컴포넌트 */
const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription, alertVariants };
