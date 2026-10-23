import * as React from "react";
import { render, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { StreamingText, type StreamingTextProps } from "./index";

// WI-0052: 첫 글자 누락 · undefined 덧붙음 · StrictMode 빈 화면 회귀 방지
const SPEED = 10;
const TEXT = "스트리밍 완료 문장";

function setup(strict: boolean, initial: StreamingTextProps) {
  const wrap = (p: StreamingTextProps) => {
    const el = <StreamingText speed={SPEED} {...p} />;
    return strict ? <React.StrictMode>{el}</React.StrictMode> : el;
  };
  const utils = render(wrap(initial));
  const shown = () => utils.container.querySelector("span")?.textContent ?? "";
  const tick = (n = 1) => {
    for (let i = 0; i < n; i++) {
      act(() => {
        vi.advanceTimersByTime(SPEED);
      });
    }
  };
  const rerender = (p: StreamingTextProps) => utils.rerender(wrap(p));
  return { ...utils, shown, tick, rerender };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe.each([
  ["StrictMode 끔", false],
  ["StrictMode 켬", true],
])("StreamingText 스트리밍 (%s)", (_label, strict) => {
  it("A. 앞에서부터 한 글자씩 보이고 끝나면 text 와 같으며 onComplete 는 1회", () => {
    const onComplete = vi.fn();
    const s = setup(strict, { text: TEXT, onComplete });
    expect(s.shown()).toBe("");

    const mid: string[] = [];
    for (let i = 0; i < 3; i++) {
      s.tick();
      mid.push(s.shown());
    }
    expect(mid).toEqual(["스", "스트", "스트리"]);
    expect(onComplete).not.toHaveBeenCalled();

    s.tick(Array.from(TEXT).length + 5);
    expect(s.shown()).toBe(TEXT);
    expect(s.shown()).not.toContain("undefined");
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("A'. 스트리밍 중에는 aria-busy 가 true, 끝나면 false", () => {
    const s = setup(strict, { text: "가나" });
    s.tick();
    expect(s.getByRole("region")).toHaveAttribute("aria-busy", "true");
    s.tick(5);
    expect(s.getByRole("region")).toHaveAttribute("aria-busy", "false");
  });

  it("B. 스트리밍 도중 이어 붙이면 현재 위치에서 계속 흘리고, 따라잡을 때마다 onComplete 1회", () => {
    const onComplete = vi.fn();
    const s = setup(strict, { text: "가나다라", onComplete });
    s.tick(2);
    expect(s.shown()).toBe("가나");

    s.rerender({ text: "가나다라마바", onComplete });
    expect(s.shown()).toBe("가나");
    s.tick();
    expect(s.shown()).toBe("가나다");
    s.tick(10);
    expect(s.shown()).toBe("가나다라마바");
    expect(onComplete).toHaveBeenCalledTimes(1);

    s.rerender({ text: "가나다라마바사", onComplete });
    s.tick(5);
    expect(s.shown()).toBe("가나다라마바사");
    expect(onComplete).toHaveBeenCalledTimes(2);
  });

  it("C. text 가 통째 바뀌면 처음부터 다시 흘림", () => {
    const s = setup(strict, { text: "가나다" });
    s.tick(10);
    expect(s.shown()).toBe("가나다");

    s.rerender({ text: "ABC" });
    expect(s.shown()).toBe("");
    s.tick();
    expect(s.shown()).toBe("A");
    s.tick(10);
    expect(s.shown()).toBe("ABC");
  });

  it("D. isComplete=true 면 즉시 전체 표시, 커서 없음, onComplete 안 부름", () => {
    const onComplete = vi.fn();
    const s = setup(strict, { text: TEXT, isComplete: true, onComplete });
    expect(s.shown()).toBe(TEXT);
    expect(s.container.querySelector("[aria-hidden='true']")).toBeNull();
    s.tick(20);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("D'. 스트리밍 도중 isComplete=true 가 되면 즉시 전체 표시하고 onComplete 안 부름", () => {
    const onComplete = vi.fn();
    const s = setup(strict, { text: TEXT, onComplete });
    s.tick(2);
    s.rerender({ text: TEXT, isComplete: true, onComplete });
    expect(s.shown()).toBe(TEXT);
    s.tick(20);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("E. 코드 포인트 단위로 흘려 이모지를 반쪽으로 보이지 않음", () => {
    const s = setup(strict, { text: "a😀b" });
    s.tick();
    expect(s.shown()).toBe("a");
    s.tick();
    expect(s.shown()).toBe("a😀");
    s.tick(5);
    expect(s.shown()).toBe("a😀b");
  });

  it("G. 빈 text 로 시작하면 onComplete 를 부르지 않고, 내용이 오면 흘린 뒤 1회 부름", () => {
    const onComplete = vi.fn();
    const s = setup(strict, { text: "", onComplete });
    s.tick(5);
    expect(s.shown()).toBe("");
    expect(onComplete).not.toHaveBeenCalled();

    s.rerender({ text: "가나", onComplete });
    s.tick(5);
    expect(s.shown()).toBe("가나");
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("F. 부모가 매 렌더 새 onComplete 를 넘겨도 진행이 멈추지 않음", () => {
    const calls: number[] = [];
    const s = setup(strict, { text: "가나다라", onComplete: () => calls.push(1) });
    s.tick();
    s.rerender({ text: "가나다라", onComplete: () => calls.push(2) });
    s.tick();
    expect(s.shown()).toBe("가나");
    s.tick(10);
    expect(s.shown()).toBe("가나다라");
    expect(calls).toEqual([2]);
  });
});
