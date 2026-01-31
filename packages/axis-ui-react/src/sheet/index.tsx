import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../utils";

/** 화면 측면에서 슬라이드되어 나타나는 시트(Sheet) 컴포넌트의 루트 요소 */
const Sheet = SheetPrimitive.Root;

/** 시트를 열기 위한 트리거 버튼 컴포넌트 */
const SheetTrigger = SheetPrimitive.Trigger;

/** 시트를 닫기 위한 닫기 버튼 컴포넌트 */
const SheetClose = SheetPrimitive.Close;

/** 시트 콘텐츠를 포탈로 렌더링하는 컴포넌트 */
const SheetPortal = SheetPrimitive.Portal;

/** 시트가 열렸을 때 배경을 덮는 오버레이 컴포넌트. 페이드 인/아웃 애니메이션을 포함한다. */
const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
));
SheetOverlay.displayName = "SheetOverlay";

const sheetVariants = cva(
  "fixed z-50 gap-4 bg-[var(--axis-surface-primary)] border-[var(--axis-border-default)] p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom:
          "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        right:
          "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
      },
    },
    defaultVariants: {
      side: "right",
    },
  }
);

/**
 * SheetContent 컴포넌트의 Props 인터페이스
 * @property side - 시트가 나타나는 방향 (top, bottom, left, right). 기본값은 "right"
 */
interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {}

/** 시트의 메인 콘텐츠 영역. 오버레이와 닫기 버튼을 포함하며, 지정된 방향에서 슬라이드 인/아웃된다. */
const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ side = "right", className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(sheetVariants({ side }), className)}
      {...props}
    >
      <SheetPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-[var(--axis-surface-primary)] transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-[var(--axis-ring)] focus:ring-offset-2 disabled:pointer-events-none">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
        <span className="sr-only">Close</span>
      </SheetPrimitive.Close>
      {children}
    </SheetPrimitive.Content>
  </SheetPortal>
));
SheetContent.displayName = "SheetContent";

/** 시트 상단의 헤더 영역. 제목과 설명을 배치하는 레이아웃 컴포넌트. */
const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
);
SheetHeader.displayName = "SheetHeader";

/** 시트 하단의 푸터 영역. 액션 버튼 등을 배치하는 레이아웃 컴포넌트. */
const SheetFooter = ({
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
SheetFooter.displayName = "SheetFooter";

/** 시트의 제목을 표시하는 컴포넌트. 접근성을 위해 aria-labelledby와 연동된다. */
const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold text-[var(--axis-text-primary)]",
      className
    )}
    {...props}
  />
));
SheetTitle.displayName = "SheetTitle";

/** 시트의 부가 설명을 표시하는 컴포넌트. 접근성을 위해 aria-describedby와 연동된다. */
const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-sm text-[var(--axis-text-secondary)]", className)}
    {...props}
  />
));
SheetDescription.displayName = "SheetDescription";

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
