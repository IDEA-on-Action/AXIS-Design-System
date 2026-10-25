import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { axeCheck } from "./test-utils/axe";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ScrollArea,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "./index";

/**
 * WI-0069: 문서 페이지 axe(브라우저)에서 나온 ui-react 비대비 결함 중 컴포넌트 원인 3종을 고정한다.
 * (Input file · Slider 는 문서 예제에 이름이 없던 것이라 문서 쪽에서 고쳤다)
 * jest-axe 의 toHaveNoViolations 는 incomplete 를 보지 않으므로, 브라우저에서 incomplete 로만 나온
 * aria-valid-attr-value 는 incomplete 까지 단언한다.
 */
async function ruleHits(ui: Parameters<typeof axeCheck>[0], ruleIds: string[]) {
  const r = await axeCheck(ui, { runOnly: { type: "rule", values: ruleIds } });
  return {
    violations: r.violations.flatMap((v) => v.nodes.map((n) => `${v.id} ${n.html}`)),
    incomplete: r.incomplete.flatMap((v) => v.nodes.map((n) => `${v.id} ${n.html}`)),
    ran: [...r.passes, ...r.inapplicable, ...r.violations, ...r.incomplete].map((v) => v.id),
  };
}

describe("닫힌 트리거의 aria-controls (Dialog · Popover · Sheet, WI-0069)", () => {
  const cases = [
    {
      name: "Dialog",
      ui: (props: { open?: boolean; onOpenChange?: (o: boolean) => void; defaultOpen?: boolean }) => (
        <Dialog {...props}>
          <DialogTrigger>열기</DialogTrigger>
          <DialogContent>
            <DialogTitle>제목</DialogTitle>
            <DialogDescription>설명</DialogDescription>
          </DialogContent>
        </Dialog>
      ),
    },
    {
      name: "Sheet",
      ui: (props: { open?: boolean; onOpenChange?: (o: boolean) => void; defaultOpen?: boolean }) => (
        <Sheet {...props}>
          <SheetTrigger>열기</SheetTrigger>
          <SheetContent>
            <SheetTitle>제목</SheetTitle>
            <SheetDescription>설명</SheetDescription>
          </SheetContent>
        </Sheet>
      ),
    },
    {
      name: "Popover",
      ui: (props: { open?: boolean; onOpenChange?: (o: boolean) => void; defaultOpen?: boolean }) => (
        <Popover {...props}>
          <PopoverTrigger>열기</PopoverTrigger>
          <PopoverContent>내용</PopoverContent>
        </Popover>
      ),
    },
  ];

  for (const { name, ui } of cases) {
    it(`${name}: 닫힌 동안 aria-controls 가 없고 axe aria-valid-attr-value 위반 · incomplete 0`, async () => {
      const hits = await ruleHits(ui({}), ["aria-valid-attr-value"]);
      expect(hits.ran).toContain("aria-valid-attr-value");
      expect(hits.violations).toEqual([]);
      expect(hits.incomplete).toEqual([]);
    });

    it(`${name}: 비제어 - 열면 aria-controls 가 콘텐츠 id 를 가리키고, 닫으면 다시 빠진다`, async () => {
      render(ui({}));
      const trigger = screen.getByRole("button", { name: "열기" });
      expect(trigger).not.toHaveAttribute("aria-controls");
      expect(trigger).toHaveAttribute("aria-expanded", "false");
      await act(async () => {
        fireEvent.click(trigger);
      });
      expect(trigger).toHaveAttribute("aria-expanded", "true");
      const id = trigger.getAttribute("aria-controls");
      expect(id).toBeTruthy();
      expect(document.getElementById(id as string)).not.toBeNull();
      await act(async () => {
        fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
      });
      expect(trigger).toHaveAttribute("aria-expanded", "false");
      expect(trigger).not.toHaveAttribute("aria-controls");
    });

    it(`${name}: 제어 - open · onOpenChange 를 그대로 통과한다`, async () => {
      const onOpenChange = vi.fn();
      const { rerender } = render(ui({ open: false, onOpenChange }));
      const trigger = screen.getByRole("button", { name: "열기" });
      await act(async () => {
        fireEvent.click(trigger);
      });
      expect(onOpenChange).toHaveBeenCalledWith(true);
      // 제어 모드라 부모가 open 을 바꾸기 전에는 닫힌 채다
      expect(trigger).toHaveAttribute("aria-expanded", "false");
      rerender(ui({ open: true, onOpenChange }));
      expect(trigger).toHaveAttribute("aria-expanded", "true");
      expect(trigger).toHaveAttribute("aria-controls");
    });

    it(`${name}: defaultOpen 으로 열린 채 시작한다`, () => {
      render(ui({ defaultOpen: true }));
      // 모달(Dialog · Sheet)이 열리면 바깥은 aria-hidden 이라 역할 조회에서 숨겨진 요소까지 본다
      const trigger = screen.getByRole("button", { name: "열기", hidden: true });
      expect(trigger).toHaveAttribute("aria-expanded", "true");
      expect(trigger).toHaveAttribute("aria-controls");
    });
  }
});

describe("CommandSeparator (WI-0069)", () => {
  beforeAll(() => {
    // jsdom 에는 scrollIntoView 가 없다(cmdk 가 선택 항목으로 스크롤할 때 부른다)
    if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = vi.fn();
  });

  const ui = (
    <Command label="명령">
      <CommandInput placeholder="검색" />
      <CommandList>
        <CommandGroup heading="제안">
          <CommandItem>캘린더</CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="설정">
          <CommandItem>프로필</CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  );

  it("listbox 안에 role=separator 를 두지 않는다(axe aria-required-children 위반 0)", async () => {
    const hits = await ruleHits(ui, ["aria-required-children"]);
    expect(hits.ran).toContain("aria-required-children");
    expect(hits.violations).toEqual([]);
    const { container } = render(ui);
    const sep = container.querySelector("[cmdk-separator]");
    expect(sep).not.toBeNull();
    expect(sep).not.toHaveAttribute("role");
    expect(sep).toHaveAttribute("aria-hidden", "true");
  });

  it("검색 중에는 숨기고(cmdk 동작), alwaysRender 면 남긴다", async () => {
    const { container, rerender } = render(ui);
    const input = screen.getByPlaceholderText("검색");
    await act(async () => {
      fireEvent.change(input, { target: { value: "캘" } });
    });
    expect(container.querySelector("[cmdk-separator]")).toBeNull();
    rerender(
      <Command label="명령">
        <CommandInput placeholder="검색" />
        <CommandList>
          <CommandSeparator alwaysRender />
        </CommandList>
      </Command>,
    );
    expect(container.querySelector("[cmdk-separator]")).not.toBeNull();
  });
});

describe("ScrollArea 뷰포트 (WI-0069)", () => {
  it("뷰포트가 키보드 포커스를 받는다(tabIndex 0, axe scrollable-region-focusable)", () => {
    const { container } = render(
      <ScrollArea className="h-20">
        <p>긴 내용</p>
      </ScrollArea>,
    );
    const viewport = container.querySelector("[data-radix-scroll-area-viewport]");
    expect(viewport).not.toBeNull();
    expect(viewport).toHaveAttribute("tabindex", "0");
  });
});
