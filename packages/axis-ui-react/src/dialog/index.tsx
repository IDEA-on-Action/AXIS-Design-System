import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "../utils";

/**
 * 다이얼로그의 루트 컴포넌트. 열림/닫힘 상태를 관리한다.
 *
 * Radix 는 닫힌 동안에도 트리거에 aria-controls 를 두는데, 콘텐츠는 열릴 때만 DOM 에 있어
 * 없는 id 를 가리킨다(axe aria-valid-attr-value, WI-0069). 열림 상태를 이 래퍼가 알고 있다가
 * 닫힌 동안에는 트리거의 aria-controls 를 뺀다. open · defaultOpen · onOpenChange 는 그대로 통과한다.
 */
const DialogOpenContext = React.createContext<boolean | null>(null);

function Dialog({
  open: openProp,
  defaultOpen,
  onOpenChange,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen ?? false);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : uncontrolledOpen;
  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange]
  );
  return (
    <DialogOpenContext.Provider value={open}>
      <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange} {...props} />
    </DialogOpenContext.Provider>
  );
}
Dialog.displayName = "Dialog";

/** 다이얼로그를 여는 트리거 버튼 컴포넌트. 닫힌 동안에는 aria-controls 를 두지 않는다. */
const DialogTrigger = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Trigger>
>((props, ref) => {
  const open = React.useContext(DialogOpenContext);
  // Dialog 밖에서 쓰면(null) Radix 동작 그대로. 사용자가 넘긴 aria-controls 는 뒤에서 덮어쓴다
  return <DialogPrimitive.Trigger ref={ref} {...(open === false ? { "aria-controls": undefined } : {})} {...props} />;
});
DialogTrigger.displayName = "DialogTrigger";

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
      "fixed inset-0 z-50 bg-[var(--axis-dialog-overlay-bg)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 motion-reduce:!animate-none",
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
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-[shadow:var(--axis-shadow-lg)] duration-200",
        "bg-[var(--axis-dialog-content-bg)] border-[var(--axis-dialog-content-border)]",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] motion-reduce:!animate-none",
        "sm:rounded-[var(--axis-radius-surface,0.5rem)]",
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
