import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../utils";

/** 토스트 알림 시스템의 프로바이더 컴포넌트. 앱 루트에 배치하여 토스트 기능을 활성화한다. */
const ToastProvider = ToastPrimitives.Provider;

/** 토스트 알림이 표시되는 뷰포트 영역. 화면 하단 우측에 고정 위치로 렌더링된다. */
const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default:
          "border-[var(--axis-border-default)] bg-[var(--axis-surface-default)] text-[var(--axis-text-primary)]",
        success:
          "border-[var(--axis-border-success)] bg-[var(--axis-surface-success)] text-[var(--axis-text-success)]",
        error:
          "border-[var(--axis-border-error)] bg-[var(--axis-surface-error)] text-[var(--axis-text-error)]",
        warning:
          "border-transparent bg-[var(--axis-surface-warning)] text-[var(--axis-text-warning)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

/** 토스트 알림의 루트 컴포넌트. default, success, error, warning 변형을 지원하며 스와이프로 닫을 수 있다. */
const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => (
  <ToastPrimitives.Root
    ref={ref}
    className={cn(toastVariants({ variant }), className)}
    {...props}
  />
));
Toast.displayName = ToastPrimitives.Root.displayName;

/** 토스트 내에 표시되는 액션 버튼 컴포넌트. 사용자 상호작용을 위한 CTA를 제공한다. */
const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors",
      "border-[var(--axis-border-default)] bg-transparent",
      "hover:bg-[var(--axis-surface-secondary)]",
      "focus:outline-none focus:ring-2 focus:ring-[var(--axis-border-focus)]",
      "disabled:pointer-events-none disabled:opacity-50",
      className
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

/** 토스트를 닫는 닫기 버튼 컴포넌트. 호버 시 표시되며 X 아이콘을 포함한다. */
const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 text-[var(--axis-text-secondary)] opacity-0 transition-opacity",
      "hover:text-[var(--axis-text-primary)]",
      "focus:opacity-100 focus:outline-none focus:ring-2",
      "group-hover:opacity-100",
      className
    )}
    toast-close=""
    {...props}
  >
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

/** 토스트의 제목을 표시하는 컴포넌트 */
const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold", className)}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

/** 토스트의 상세 설명을 표시하는 컴포넌트 */
const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm opacity-90", className)}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
};
