import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import { Avatar } from "./index";

/**
 * jsdom 의 img 는 리소스를 불러오지 않아 complete=false · naturalWidth=0 이고 decode 가 없다.
 * 마운트 시 판정(WI-0054)을 시험하려고 prototype 에 브라우저 상태를 흉내 낸다.
 */
const proto = HTMLImageElement.prototype;
const saved = new Map<string, PropertyDescriptor | undefined>();
function mockImage(state: {
  complete: boolean;
  naturalWidth: number;
  decode?: (() => Promise<void>) | null;
}) {
  for (const key of ["complete", "naturalWidth", "decode"]) {
    if (!saved.has(key)) saved.set(key, Object.getOwnPropertyDescriptor(proto, key));
  }
  Object.defineProperty(proto, "complete", { configurable: true, get: () => state.complete });
  Object.defineProperty(proto, "naturalWidth", { configurable: true, get: () => state.naturalWidth });
  if (state.decode) {
    Object.defineProperty(proto, "decode", { configurable: true, writable: true, value: state.decode });
  } else {
    delete (proto as { decode?: unknown }).decode;
  }
}
afterEach(() => {
  for (const [key, desc] of saved) {
    if (desc) Object.defineProperty(proto, key, desc);
    else delete (proto as unknown as Record<string, unknown>)[key];
  }
  saved.clear();
});

/** 깨진 이미지: 브라우저 3종 실측에서 decode 는 EncodingError 로 거부된다 */
const rejectDecode = () => Promise.reject(new DOMException("broken", "EncodingError"));
/** 정상 로드인데 naturalWidth 가 0 인 이미지(예: width="0" SVG): decode 는 이행된다 */
const resolveDecode = () => Promise.resolve();

describe("Avatar", () => {
  it("src 있을 때 img 렌더", () => {
    render(<Avatar src="https://example.com/photo.jpg" alt="사용자" />);
    const img = screen.getByRole("img", { name: "사용자" });
    expect(img).toBeInTheDocument();
    expect(img.getAttribute("src")).toBe("https://example.com/photo.jpg");
  });

  it("src 없을 때 alt에서 이니셜 fallback 표시 (John Doe -> JD)", () => {
    render(<Avatar alt="John Doe" />);
    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("src 없을 때 한글 이름 이니셜 추출 (홍 길동 -> 홍길)", () => {
    render(<Avatar alt="홍 길동" />);
    expect(screen.getByText("홍길")).toBeInTheDocument();
  });

  it("fallback prop이 alt 이니셜보다 우선", () => {
    render(<Avatar alt="John Doe" fallback="AB" />);
    expect(screen.getByText("AB")).toBeInTheDocument();
    expect(screen.queryByText("JD")).toBeNull();
  });

  it("alt 없을 때 '?' 표시", () => {
    render(<Avatar />);
    expect(screen.getByText("?")).toBeInTheDocument();
  });

  it("img 로드 에러 시 fallback으로 전환", () => {
    render(<Avatar src="https://example.com/broken.jpg" alt="Test User" />);
    const img = screen.getByRole("img");
    fireEvent.error(img);
    // 에러 후 이니셜 fallback 표시
    expect(screen.getByText("TU")).toBeInTheDocument();
    // img는 더 이상 없음
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("size=sm 시 sm 클래스 포함", () => {
    const { container } = render(<Avatar size="sm" alt="A" />);
    const wrapper = container.firstElementChild!;
    expect(wrapper.className).toContain("h-8");
    expect(wrapper.className).toContain("w-8");
  });

  it("size=default 시 기본 크기 클래스 포함", () => {
    const { container } = render(<Avatar size="default" alt="A" />);
    const wrapper = container.firstElementChild!;
    expect(wrapper.className).toContain("h-10");
    expect(wrapper.className).toContain("w-10");
  });

  it("size=lg 시 lg 클래스 포함", () => {
    const { container } = render(<Avatar size="lg" alt="A" />);
    const wrapper = container.firstElementChild!;
    expect(wrapper.className).toContain("h-12");
    expect(wrapper.className).toContain("w-12");
  });

  it("size=xl 시 xl 클래스 포함", () => {
    const { container } = render(<Avatar size="xl" alt="A" />);
    const wrapper = container.firstElementChild!;
    expect(wrapper.className).toContain("h-16");
    expect(wrapper.className).toContain("w-16");
  });

  it("ref 전달", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Avatar ref={ref} alt="Ref Test" />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe("Avatar 마운트 시 이미 끝난 이미지 판정 (WI-0054)", () => {
  it("SSR 뒤 하이드레이션 전에 이미 실패한 이미지는 하이드레이션 뒤 fallback 으로 바뀐다", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    let root: ReturnType<typeof hydrateRoot> | undefined;
    try {
      // 서버가 만든 마크업(신뢰하는 입력: 이 테스트의 renderToString 결과)
      container.innerHTML = renderToString(<Avatar src="/broken.png" alt="Broken User" />);
      // 하이드레이션 전: 서버 마크업의 img 가 있고, 그 이미지는 이미 오류로 끝난 상태
      expect(container.querySelector("img")).not.toBeNull();
      mockImage({ complete: true, naturalWidth: 0, decode: rejectDecode });
      const recoverable: unknown[] = [];
      await act(async () => {
        root = hydrateRoot(container, <Avatar src="/broken.png" alt="Broken User" />, {
          onRecoverableError: (e) => recoverable.push(e),
        });
      });
      expect(container.querySelector("img")).toBeNull();
      expect(container.textContent).toBe("BU");
      expect(recoverable).toEqual([]);
    } finally {
      // 실패해도 다음 테스트에 img 가 남지 않게 정리
      act(() => root?.unmount());
      container.remove();
    }
  });

  it("complete && naturalWidth 0 이고 decode 가 거부되면 fallback", async () => {
    const decode = vi.fn(rejectDecode);
    mockImage({ complete: true, naturalWidth: 0, decode });
    render(<Avatar src="/broken.png" alt="Test User" />);
    expect(await screen.findByText("TU")).toBeInTheDocument();
    expect(screen.queryByRole("img")).toBeNull();
    expect(decode).toHaveBeenCalledTimes(1);
  });

  it("naturalWidth 0 이어도 decode 가 이행되면(고유 크기 없는 SVG 등) 이미지 유지", async () => {
    const decode = vi.fn(resolveDecode);
    mockImage({ complete: true, naturalWidth: 0, decode });
    render(<Avatar src="/zero.svg" alt="Svg User" />);
    await act(async () => {
      await Promise.resolve();
    });
    expect(decode).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("img", { name: "Svg User" })).toBeInTheDocument();
    expect(screen.queryByText("SU")).toBeNull();
  });

  it("아직 로딩 중(complete=false)이면 판정하지 않고 onError 가 받는다", async () => {
    const decode = vi.fn(rejectDecode);
    mockImage({ complete: false, naturalWidth: 0, decode });
    render(<Avatar src="/slow.png" alt="Slow User" />);
    await act(async () => {
      await Promise.resolve();
    });
    expect(decode).not.toHaveBeenCalled();
    const img = screen.getByRole("img");
    fireEvent.error(img);
    expect(screen.getByText("SU")).toBeInTheDocument();
  });

  it("naturalWidth 가 있으면(정상 로드) decode 를 부르지 않고 이미지 유지", async () => {
    const decode = vi.fn(rejectDecode);
    mockImage({ complete: true, naturalWidth: 64, decode });
    render(<Avatar src="/ok.png" alt="Ok User" />);
    await act(async () => {
      await Promise.resolve();
    });
    expect(decode).not.toHaveBeenCalled();
    expect(screen.getByRole("img")).toBeInTheDocument();
  });

  it("decode 가 없는 환경이면 판정하지 않는다(종전 동작)", async () => {
    mockImage({ complete: true, naturalWidth: 0, decode: null });
    render(<Avatar src="/broken.png" alt="Old Env" />);
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByRole("img")).toBeInTheDocument();
  });

  it("decode 대기 중 src 가 바뀌면 이전 src 의 거부로 새 이미지를 실패 처리하지 않는다", async () => {
    let rejectFirst: ((e: unknown) => void) | undefined;
    const pending = new Promise<void>((_, reject) => {
      rejectFirst = reject;
    });
    const decode = vi.fn(() => pending);
    mockImage({ complete: true, naturalWidth: 0, decode });
    const { rerender } = render(<Avatar src="/a.png" alt="Race User" />);
    expect(decode).toHaveBeenCalledTimes(1);
    // 새 src 는 로딩 중으로 둔다
    mockImage({ complete: false, naturalWidth: 0, decode });
    rerender(<Avatar src="/b.png" alt="Race User" />);
    await act(async () => {
      rejectFirst?.(new DOMException("broken", "EncodingError"));
      await pending.catch(() => undefined);
    });
    const img = screen.getByRole("img");
    expect(img.getAttribute("src")).toBe("/b.png");
  });
});

describe("Avatar src 변경 시 오류 상태 초기화 (WI-0054)", () => {
  it("onError 로 fallback 이 된 뒤 src 가 바뀌면 새 이미지를 다시 렌더", () => {
    const { rerender } = render(<Avatar src="/broken.png" alt="Test User" />);
    fireEvent.error(screen.getByRole("img"));
    expect(screen.getByText("TU")).toBeInTheDocument();
    rerender(<Avatar src="/ok.png" alt="Test User" />);
    const img = screen.getByRole("img");
    expect(img.getAttribute("src")).toBe("/ok.png");
    expect(screen.queryByText("TU")).toBeNull();
  });

  it("실패한 src 로 되돌아오면(A → B → A) 다시 시도한다", () => {
    const { rerender } = render(<Avatar src="/a.png" alt="Test User" />);
    fireEvent.error(screen.getByRole("img"));
    expect(screen.queryByRole("img")).toBeNull();
    rerender(<Avatar src="/b.png" alt="Test User" />);
    expect(screen.getByRole("img").getAttribute("src")).toBe("/b.png");
    rerender(<Avatar src="/a.png" alt="Test User" />);
    expect(screen.getByRole("img").getAttribute("src")).toBe("/a.png");
  });
});
