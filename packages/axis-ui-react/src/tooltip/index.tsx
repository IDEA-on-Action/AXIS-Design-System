import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "../utils";

/** 툴팁 시스템의 프로바이더 컴포넌트. delayDuration 등 전역 설정을 관리한다. */
const TooltipProvider = TooltipPrimitive.Provider;

/**
 * 래퍼 Tooltip 과 Trigger · Content 가 나누는 상태.
 * Radix 는 닫힘 이유를 onOpenChange 로 알려 주지 않아서, 스크롤로 생긴 닫힘인지를 래퍼가 직접 기록한다.
 */
interface TooltipPersistenceContextValue {
  triggerRef: React.MutableRefObject<HTMLElement | null>;
  /** Esc · 바깥 포인터 누름처럼 사용자가 명시적으로 닫은 경우. 이때는 포커스가 있어도 닫는다 */
  markDismiss: () => void;
}

const TooltipPersistenceContext = React.createContext<TooltipPersistenceContextValue | null>(null);

// 서버 렌더에서는 useLayoutEffect 가 돌지 않으므로 브라우저에서만 쓴다.
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

type TooltipProps = React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Root>;

/**
 * 툴팁의 루트 컴포넌트. 열림/닫힘 상태를 관리한다.
 *
 * Radix Tooltip 은 트리거를 담은 요소가 스크롤되면 닫힌다. 화면 밖 트리거로 Tab 하면 브라우저가 트리거를
 * 화면 안으로 스크롤하고, 그 스크롤이 막 열린 툴팁을 닫는다(WCAG 1.4.13 지속성, WI-0073).
 * 이 래퍼는 open 을 직접 제어해 **트리거에 포커스가 있는 동안 스크롤로 생긴 닫힘**만 무시한다.
 * Esc · 포인터 이탈 · 블러 · 클릭 · 포커스 없는 hover 툴팁의 스크롤 닫힘은 Radix 동작 그대로다.
 * open · defaultOpen · onOpenChange 는 그대로 통과한다(제어 · 비제어 모두).
 */
function Tooltip({ open: openProp, defaultOpen, onOpenChange, ...props }: TooltipProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen ?? false);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : uncontrolledOpen;

  const triggerRef = React.useRef<HTMLElement | null>(null);
  /** 지금 처리 중인 스크롤 이벤트가 있는지. Radix 의 scroll 핸들러보다 먼저 켜고 다음 태스크에서 끈다 */
  const scrollingRef = React.useRef(false);
  const dismissRef = React.useRef(false);

  // Radix TooltipContent 도 window scroll(capture)을 듣는다. 같은 대상 · 같은 단계의 리스너는 등록 순서로 불리므로
  // 콘텐츠보다 먼저(레이아웃 단계, 빈 의존성으로 재등록 없이) 등록해 플래그가 Radix 의 onClose 보다 앞서 켜지게 한다.
  useIsomorphicLayoutEffect(() => {
    let timer = 0;
    const handleScroll = () => {
      scrollingRef.current = true;
      window.clearTimeout(timer);
      // 마이크로태스크는 리스너 사이에 비워지므로 Radix 리스너까지 플래그가 살아 있게 태스크 단위로 끈다
      timer = window.setTimeout(() => {
        scrollingRef.current = false;
      }, 0);
    };
    window.addEventListener("scroll", handleScroll, { capture: true });
    return () => {
      window.removeEventListener("scroll", handleScroll, { capture: true });
      window.clearTimeout(timer);
    };
  }, []);

  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      if (!next) {
        const dismissed = dismissRef.current;
        dismissRef.current = false;
        const trigger = triggerRef.current;
        const focused = trigger !== null && trigger.ownerDocument.activeElement === trigger;
        if (!dismissed && scrollingRef.current && focused) return;
      }
      if (!isControlled) setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange]
  );

  const markDismiss = React.useCallback(() => {
    dismissRef.current = true;
  }, []);

  const contextValue = React.useMemo(() => ({ triggerRef, markDismiss }), [markDismiss]);

  return (
    <TooltipPersistenceContext.Provider value={contextValue}>
      <TooltipPrimitive.Root {...props} open={open} onOpenChange={handleOpenChange} />
    </TooltipPersistenceContext.Provider>
  );
}
Tooltip.displayName = "Tooltip";

/** 툴팁을 표시하기 위한 트리거 요소 */
const TooltipTrigger = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Trigger>
>((props, forwardedRef) => {
  const persistence = React.useContext(TooltipPersistenceContext);
  const ref = React.useCallback(
    (node: HTMLButtonElement | null) => {
      if (persistence) persistence.triggerRef.current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    },
    [persistence, forwardedRef]
  );
  return <TooltipPrimitive.Trigger ref={ref} {...props} />;
});
TooltipTrigger.displayName = "TooltipTrigger";

/** 툴팁의 콘텐츠를 표시하는 컴포넌트. 포탈을 통해 렌더링되며 방향별 슬라이드 애니메이션을 지원한다. */
const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, onEscapeKeyDown, onPointerDownOutside, ...props }, ref) => {
  const persistence = React.useContext(TooltipPersistenceContext);
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        onEscapeKeyDown={(event) => {
          onEscapeKeyDown?.(event);
          if (!event.defaultPrevented) persistence?.markDismiss();
        }}
        onPointerDownOutside={(event) => {
          onPointerDownOutside?.(event);
          if (!event.defaultPrevented) persistence?.markDismiss();
        }}
        className={cn(
          "z-50 overflow-hidden rounded-md bg-[var(--axis-surface-inverse)] px-3 py-1.5 text-xs text-[var(--axis-text-inverse)]",
          "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 motion-reduce:!animate-none",
          "data-[side=bottom]:slide-in-from-top-2",
          "data-[side=left]:slide-in-from-right-2",
          "data-[side=right]:slide-in-from-left-2",
          "data-[side=top]:slide-in-from-bottom-2",
          className
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
});
TooltipContent.displayName = "TooltipContent";

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
