import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "../utils";

/** 다이얼로그의 루트 컴포넌트. 열림/닫힘 상태를 관리한다. */
const Dialog = DialogPrimitive.Root;

/** 다이얼로그를 여는 트리거 버튼 컴포넌트 */
const DialogTrigger = DialogPrimitive.Trigger;

/** 다이얼로그 콘텐츠를 포털로 렌더링하는 컴포넌트 */
const DialogPortal = DialogPrimitive.Portal;

/** 다이얼로그를 닫는 버튼 컴포넌트 */
const DialogClose = DialogPrimitive.Close;

/** 다이얼로그가 열릴 때 배경을 덮는 오버레이 컴포넌트. 페이드 인/아웃 애니메이션을 포함한다. */
const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-[var(--axis-dialog-overlay-bg)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = "DialogOverlay";

/** 다이얼로그의 본문 콘텐츠 컴포넌트. 화면 중앙에 위치하며, 오버레이와 함께 포털로 렌더링된다. */
const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg duration-200",
        "bg-[var(--axis-dialog-content-bg)] border-[var(--axis-dialog-content-border)]",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
        "sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = "DialogContent";

/** 다이얼로그 상단 헤더 영역. 제목과 설명을 포함하는 레이아웃 컴포넌트이다. */
const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

/** 다이얼로그 하단 푸터 영역. 액션 버튼들을 배치하는 레이아웃 컴포넌트이다. */
const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

/** 다이얼로그의 제목 컴포넌트. 접근성을 위해 aria-labelledby로 연결된다. */
const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight text-[var(--axis-text-primary)]",
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = "DialogTitle";

/** 다이얼로그의 설명 텍스트 컴포넌트. 접근성을 위해 aria-describedby로 연결된다. */
const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-[var(--axis-text-secondary)]", className)}
    {...props}
  />
));
DialogDescription.displayName = "DialogDescription";

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
