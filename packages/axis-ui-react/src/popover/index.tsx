import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "../utils";

/**
 * 팝오버의 루트 컴포넌트. 열림/닫힘 상태를 관리한다.
 *
 * Radix 는 닫힌 동안에도 트리거에 aria-controls 를 두는데, 콘텐츠는 열릴 때만 DOM 에 있어
 * 없는 id 를 가리킨다(axe aria-valid-attr-value, WI-0069). 열림 상태를 이 래퍼가 알고 있다가
 * 닫힌 동안에는 트리거의 aria-controls 를 뺀다. open · defaultOpen · onOpenChange 는 그대로 통과한다.
 */
const PopoverOpenContext = React.createContext<boolean | null>(null);

function Popover({
  open: openProp,
  defaultOpen,
  onOpenChange,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Root>) {
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
    <PopoverOpenContext.Provider value={open}>
      <PopoverPrimitive.Root open={open} onOpenChange={handleOpenChange} {...props} />
    </PopoverOpenContext.Provider>
  );
}
Popover.displayName = "Popover";

/** 팝오버를 여는 트리거 요소 컴포넌트. 닫힌 동안에는 aria-controls 를 두지 않는다. */
const PopoverTrigger = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Trigger>
>((props, ref) => {
  const open = React.useContext(PopoverOpenContext);
  // Popover 밖에서 쓰면(null) Radix 동작 그대로. 사용자가 넘긴 aria-controls 는 뒤에서 덮어쓴다
  return <PopoverPrimitive.Trigger ref={ref} {...(open === false ? { "aria-controls": undefined } : {})} {...props} />;
});
PopoverTrigger.displayName = "PopoverTrigger";

/** 팝오버의 본문 콘텐츠 컴포넌트. 포털을 통해 렌더링되며 트리거 요소에 상대적으로 위치한다. */
const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 w-72 rounded-md border border-[var(--axis-border-default)] bg-[var(--axis-surface-default)] p-4 text-[var(--axis-text-primary)] shadow-[shadow:var(--axis-shadow-lg)] outline-none",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 motion-reduce:!animate-none",
        className
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = "PopoverContent";

export { Popover, PopoverTrigger, PopoverContent };
