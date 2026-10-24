import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-[var(--axis-radius-control,0.375rem)] text-[length:var(--axis-control-font-size-md,0.875rem)] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--axis-button-bg-default)] text-[var(--axis-button-text-default)] hover:bg-[var(--axis-button-bg-hover)] active:bg-[var(--axis-button-bg-active)] focus-visible:ring-[var(--axis-button-border-focus)]",
        secondary:
          "bg-[var(--axis-button-secondary-bg-default)] text-[var(--axis-button-secondary-text-default)] hover:bg-[var(--axis-button-secondary-bg-hover)] active:bg-[var(--axis-button-secondary-bg-active)]",
        ghost:
          "bg-[var(--axis-button-ghost-bg-default)] text-[var(--axis-button-ghost-text-default)] hover:bg-[var(--axis-button-ghost-bg-hover)] active:bg-[var(--axis-button-ghost-bg-active)]",
        destructive:
          "bg-[var(--axis-button-destructive-bg-default)] text-[var(--axis-button-destructive-text-default)] hover:bg-[var(--axis-button-destructive-bg-hover)] active:bg-[var(--axis-button-destructive-bg-active)]",
        outline:
          "border border-[var(--axis-border-default)] bg-transparent hover:bg-[var(--axis-surface-secondary)] text-[var(--axis-text-primary)]",
        link: "text-[var(--axis-text-brand)] underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-[var(--axis-control-h-sm,2rem)] px-3 text-[length:var(--axis-control-font-size-sm,0.75rem)]",
        default: "h-[var(--axis-control-h-md,2.5rem)] px-4 py-2",
        lg: "h-[var(--axis-control-h-lg,3rem)] px-6 text-[length:var(--axis-control-font-size-lg,1rem)]",
        icon: "h-[var(--axis-control-h-md,2.5rem)] w-[var(--axis-control-h-md,2.5rem)]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

/**
 * Button 컴포넌트 Props
 * @property variant - 버튼 스타일 변형 (default, secondary, ghost, destructive, outline, link)
 * @property size - 버튼 크기 (sm, default, lg, icon)
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Slot 패턴을 사용하여 자식 요소를 버튼으로 렌더링 */
  asChild?: boolean;
}

/** 다양한 스타일 변형과 크기를 지원하는 버튼 컴포넌트 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
