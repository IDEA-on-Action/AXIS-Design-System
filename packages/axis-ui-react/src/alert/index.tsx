import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../utils";

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-current",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--axis-surface-primary)] text-[var(--axis-text-primary)] border-[var(--axis-border-default)]",
        info: "bg-[var(--axis-blue-100)] text-[var(--axis-blue-900)] border-[var(--axis-blue-200)] [&>svg]:text-[var(--axis-blue-600)]",
        success:
          "bg-[var(--axis-green-100)] text-[var(--axis-green-900)] border-[var(--axis-green-200)] [&>svg]:text-[var(--axis-green-600)]",
        warning:
          "bg-[var(--axis-yellow-100)] text-[var(--axis-yellow-900)] border-[var(--axis-yellow-200)] [&>svg]:text-[var(--axis-yellow-600)]",
        destructive:
          "bg-[var(--axis-red-100)] text-[var(--axis-red-900)] border-[var(--axis-red-200)] [&>svg]:text-[var(--axis-red-600)]",
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
