import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { createRef, useState } from "react";
import { renderToString } from "react-dom/server";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./index";

/**
 * WI-0073 Tooltip 지속성. Radix 는 트리거를 담은 요소의 scroll 에 툴팁을 닫는다.
 * 래퍼는 트리거에 포커스가 있는 동안의 스크롤 닫힘만 무시하고, 나머지 닫힘 경로는 그대로 둔다.
 * 실제 포커스 스크롤(브라우저가 트리거를 화면 안으로 옮기는 것)은 jsdom 에서 일어나지 않으므로
 * scroll 이벤트를 직접 보내 같은 경로를 태운다. 실브라우저 판정은 apps/web/e2e/tooltip-persistence.spec.ts.
 */

function Basic(props: { onOpenChange?: (open: boolean) => void; open?: boolean; defaultOpen?: boolean }) {
  return (
    <TooltipProvider>
      <Tooltip {...props}>
        <TooltipTrigger>도움말</TooltipTrigger>
        <TooltipContent>설명</TooltipContent>
      </Tooltip>
      <button type="button">다음</button>
    </TooltipProvider>
  );
}

const trigger = () => screen.getByRole("button", { name: "도움말" });
const tip = () => screen.queryByRole("tooltip");

/** Radix 는 onFocus 에서 연다. pointerdown 이 없으면 키보드 포커스로 본다 */
function focusTrigger() {
  act(() => {
    trigger().focus();
  });
}

/** 스크롤 플래그는 다음 태스크에서 꺼지므로 타이머를 흘려 보낸다 */
async function scroll(target: EventTarget = document) {
  await act(async () => {
    fireEvent.scroll(target);
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe("Tooltip 지속성 (WI-0073)", () => {
  it("트리거에 포커스가 있으면 문서 스크롤 뒤에도 열린 채다", async () => {
    render(<Basic />);
    focusTrigger();
    expect(tip()).toHaveTextContent("설명");
    await scroll(document);
    expect(tip()).toHaveTextContent("설명");
    expect(trigger()).toHaveAttribute("data-state", "instant-open");
  });

  it("트리거를 담은 요소의 스크롤에도 열린 채다", async () => {
    const { container } = render(<Basic />);
    focusTrigger();
    await scroll(container);
    expect(tip()).not.toBeNull();
  });

  it("포커스 없이 열린 툴팁은 스크롤에 닫힌다(Radix 동작 유지)", async () => {
    render(<Basic defaultOpen />);
    expect(tip()).not.toBeNull();
    expect(document.activeElement).not.toBe(trigger());
    await scroll(document);
    expect(tip()).toBeNull();
    expect(trigger()).toHaveAttribute("data-state", "closed");
  });

  it("포커스가 있어도 Esc 로 닫힌다", async () => {
    render(<Basic />);
    focusTrigger();
    act(() => {
      fireEvent.keyDown(document, { key: "Escape" });
    });
    expect(tip()).toBeNull();
    expect(document.activeElement).toBe(trigger());
  });

  it("스크롤 직후(플래그가 켜진 같은 태스크)에 누른 Esc 도 닫는다", () => {
    render(<Basic />);
    focusTrigger();
    act(() => {
      fireEvent.scroll(document);
      fireEvent.keyDown(document, { key: "Escape" });
    });
    expect(tip()).toBeNull();
  });

  it("Esc 로 닫은 뒤 다시 포커스해서 연 툴팁도 스크롤에 남는다(닫힘 표시가 남지 않음)", async () => {
    render(<Basic />);
    focusTrigger();
    act(() => {
      fireEvent.keyDown(document, { key: "Escape" });
    });
    act(() => {
      screen.getByRole("button", { name: "다음" }).focus();
    });
    focusTrigger();
    expect(tip()).not.toBeNull();
    await scroll(document);
    expect(tip()).not.toBeNull();
  });

  it("다른 요소로 포커스가 옮겨 가면 닫힌다", () => {
    render(<Basic />);
    focusTrigger();
    act(() => {
      screen.getByRole("button", { name: "다음" }).focus();
    });
    expect(tip()).toBeNull();
  });

  it("포커스 뒤 스크롤 플래그가 꺼지면 블러로 정상 닫힌다", async () => {
    render(<Basic />);
    focusTrigger();
    await scroll(document);
    act(() => {
      trigger().blur();
    });
    expect(tip()).toBeNull();
  });

  it("제어 모드: 포커스 중 스크롤 닫힘은 onOpenChange(false) 로 전달하지 않고, Esc 는 전달한다", async () => {
    const onOpenChange = vi.fn();
    function Controlled() {
      const [open, setOpen] = useState(false);
      return (
        <Basic
          open={open}
          onOpenChange={(next) => {
            onOpenChange(next);
            setOpen(next);
          }}
        />
      );
    }
    render(<Controlled />);
    focusTrigger();
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(tip()).not.toBeNull();
    onOpenChange.mockClear();
    await scroll(document);
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(tip()).not.toBeNull();
    act(() => {
      fireEvent.keyDown(document, { key: "Escape" });
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(tip()).toBeNull();
  });

  it("제어 모드: open={false} 를 유지하면 포커스해도 열리지 않는다(소비자 제어 존중)", () => {
    const onOpenChange = vi.fn();
    render(<Basic open={false} onOpenChange={onOpenChange} />);
    focusTrigger();
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(tip()).toBeNull();
  });

  it("소비자 onEscapeKeyDown 이 preventDefault 하면 닫지 않는다", () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>도움말</TooltipTrigger>
          <TooltipContent onEscapeKeyDown={(event) => event.preventDefault()}>설명</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
    focusTrigger();
    act(() => {
      fireEvent.keyDown(document, { key: "Escape" });
    });
    expect(tip()).not.toBeNull();
  });

  it("TooltipTrigger 는 ref 를 그대로 전달한다", () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger ref={ref}>도움말</TooltipTrigger>
          <TooltipContent>설명</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
    expect(ref.current).toBe(trigger());
  });

  it("서버 렌더가 오류 없이 트리거를 그린다", () => {
    const html = renderToString(<Basic />);
    expect(html).toContain("도움말");
    expect(html).toContain('data-state="closed"');
  });
});
