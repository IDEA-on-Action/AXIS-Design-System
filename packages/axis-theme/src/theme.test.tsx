import { render, screen, renderHook, act } from "@testing-library/react";
import { ThemeProvider, useTheme } from "./index";

// matchMedia mock 헬퍼
function mockMatchMedia(prefersDark: boolean) {
  const listeners: Array<() => void> = [];
  const mql = {
    matches: prefersDark,
    media: "(prefers-color-scheme: dark)",
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn((_event: string, cb: () => void) => {
      listeners.push(cb);
    }),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };

  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockReturnValue(mql),
  });

  return { mql, listeners };
}

beforeEach(() => {
  // documentElement 클래스 초기화
  document.documentElement.classList.remove("light", "dark");
  document.documentElement.removeAttribute("data-theme");

  // localStorage 초기화
  localStorage.clear();

  // 기본 matchMedia mock (light 모드)
  mockMatchMedia(false);
});

// ─── ThemeProvider ───────────────────────────────────────────────

describe("ThemeProvider", () => {
  it("기본 렌더링 시 children을 표시한다", () => {
    render(
      <ThemeProvider>
        <span>테스트 자식</span>
      </ThemeProvider>
    );
    expect(screen.getByText("테스트 자식")).toBeInTheDocument();
  });

  it('defaultTheme="light" 시 documentElement에 "light" 클래스를 추가한다', () => {
    render(
      <ThemeProvider defaultTheme="light">
        <div />
      </ThemeProvider>
    );
    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it('defaultTheme="dark" 시 documentElement에 "dark" 클래스를 추가한다', () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <div />
      </ThemeProvider>
    );
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.classList.contains("light")).toBe(false);
  });

  it('defaultTheme="system" 시 시스템 라이트 모드에 따라 "light" 클래스를 추가한다', () => {
    mockMatchMedia(false); // 시스템: light
    render(
      <ThemeProvider defaultTheme="system">
        <div />
      </ThemeProvider>
    );
    expect(document.documentElement.classList.contains("light")).toBe(true);
  });

  it('defaultTheme="system" 시 시스템 다크 모드에 따라 "dark" 클래스를 추가한다', () => {
    mockMatchMedia(true); // 시스템: dark
    render(
      <ThemeProvider defaultTheme="system">
        <div />
      </ThemeProvider>
    );
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("localStorage에 저장된 테마를 복원한다", () => {
    localStorage.setItem("axis-theme", "dark");
    render(
      <ThemeProvider>
        <div />
      </ThemeProvider>
    );
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("커스텀 storageKey로 localStorage에서 테마를 복원한다", () => {
    localStorage.setItem("my-theme", "dark");
    render(
      <ThemeProvider storageKey="my-theme">
        <div />
      </ThemeProvider>
    );
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("data-theme 속성을 설정한다", () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <div />
      </ThemeProvider>
    );
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it('data-theme 속성이 "system" 시 실제 resolved 테마로 설정된다', () => {
    mockMatchMedia(true); // 시스템: dark
    render(
      <ThemeProvider defaultTheme="system">
        <div />
      </ThemeProvider>
    );
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });
});

// ─── useTheme ────────────────────────────────────────────────────

describe("useTheme", () => {
  it("ThemeProvider 없이 사용 시 에러를 throw 한다", () => {
    // 콘솔 에러 억제
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => {
      renderHook(() => useTheme());
    }).toThrow("useTheme은 ThemeProvider 내부에서만 사용 가능합니다");
    consoleSpy.mockRestore();
  });

  it("현재 theme 값을 반환한다", () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => (
        <ThemeProvider defaultTheme="dark">{children}</ThemeProvider>
      ),
    });
    expect(result.current.theme).toBe("dark");
  });

  it('theme이 "system"일 때 resolvedTheme으로 실제 테마를 반환한다', () => {
    mockMatchMedia(true); // 시스템: dark
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => (
        <ThemeProvider defaultTheme="system">{children}</ThemeProvider>
      ),
    });
    expect(result.current.theme).toBe("system");
    expect(result.current.resolvedTheme).toBe("dark");
  });

  it("resolvedTheme이 light/dark 중 하나를 반환한다", () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => (
        <ThemeProvider defaultTheme="light">{children}</ThemeProvider>
      ),
    });
    expect(result.current.resolvedTheme).toBe("light");
  });

  it("setTheme 호출 시 테마를 변경한다", () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => (
        <ThemeProvider defaultTheme="light">{children}</ThemeProvider>
      ),
    });

    act(() => {
      result.current.setTheme("dark");
    });

    expect(result.current.theme).toBe("dark");
    expect(result.current.resolvedTheme).toBe("dark");
  });

  it("setTheme 호출 시 localStorage에 저장한다", () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => (
        <ThemeProvider defaultTheme="light">{children}</ThemeProvider>
      ),
    });

    act(() => {
      result.current.setTheme("dark");
    });

    expect(localStorage.getItem("axis-theme")).toBe("dark");
  });

  it("setTheme 호출 시 documentElement 클래스를 변경한다", () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => (
        <ThemeProvider defaultTheme="light">{children}</ThemeProvider>
      ),
    });

    expect(document.documentElement.classList.contains("light")).toBe(true);

    act(() => {
      result.current.setTheme("dark");
    });

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.classList.contains("light")).toBe(false);
  });

  it("setTheme 호출 시 data-theme 속성을 업데이트한다", () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => (
        <ThemeProvider defaultTheme="light">{children}</ThemeProvider>
      ),
    });

    act(() => {
      result.current.setTheme("dark");
    });

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it('setTheme("system") 호출 시 시스템 테마로 해석한다', () => {
    mockMatchMedia(true); // 시스템: dark
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => (
        <ThemeProvider defaultTheme="light">{children}</ThemeProvider>
      ),
    });

    act(() => {
      result.current.setTheme("system");
    });

    expect(result.current.theme).toBe("system");
    expect(result.current.resolvedTheme).toBe("dark");
  });
});

// ─── 시스템 테마 변경 감지 ─────────────────────────────────────────

describe("시스템 테마 변경 감지", () => {
  it('theme이 "system"일 때 matchMedia change 이벤트에 리스너를 등록한다', () => {
    const { mql } = mockMatchMedia(false);
    render(
      <ThemeProvider defaultTheme="system">
        <div />
      </ThemeProvider>
    );
    expect(mql.addEventListener).toHaveBeenCalledWith("change", expect.any(Function));
  });

  it('theme이 "light"일 때 matchMedia change 이벤트 리스너를 등록하지 않는다', () => {
    const { mql } = mockMatchMedia(false);
    render(
      <ThemeProvider defaultTheme="light">
        <div />
      </ThemeProvider>
    );
    expect(mql.addEventListener).not.toHaveBeenCalled();
  });

  it("시스템 테마가 변경되면 documentElement 클래스를 업데이트한다", () => {
    const { listeners } = mockMatchMedia(false);
    render(
      <ThemeProvider defaultTheme="system">
        <div />
      </ThemeProvider>
    );
    expect(document.documentElement.classList.contains("light")).toBe(true);

    // 시스템 다크 모드로 전환 시뮬레이션
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockReturnValue({
        matches: true,
        media: "(prefers-color-scheme: dark)",
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    });

    act(() => {
      listeners.forEach((cb) => cb());
    });

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.classList.contains("light")).toBe(false);
  });
});
