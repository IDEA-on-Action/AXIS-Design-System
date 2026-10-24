import { StrictMode, type ComponentProps, type ReactNode } from "react";
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
  document.documentElement.removeAttribute("data-brand");

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

// ─── brand (WI-0025 FR-6) ────────────────────────────────────────

describe("brand", () => {
  const wrapper =
    (props: Partial<ComponentProps<typeof ThemeProvider>> = {}) =>
    ({ children }: { children: ReactNode }) =>
      <ThemeProvider {...props}>{children}</ThemeProvider>;

  it("defaultBrand를 주면 documentElement에 data-brand가 붙는다", () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: wrapper({ defaultBrand: "ontology" }),
    });
    expect(document.documentElement.getAttribute("data-brand")).toBe("ontology");
    expect(result.current.brand).toBe("ontology");
  });

  it("defaultBrand를 주지 않으면 data-brand 속성이 없다", () => {
    const { result } = renderHook(() => useTheme(), { wrapper: wrapper() });
    expect(document.documentElement.hasAttribute("data-brand")).toBe(false);
    expect(result.current.brand).toBeUndefined();
  });

  it("setBrand 호출 시 data-brand와 localStorage를 갱신한다", () => {
    const { result } = renderHook(() => useTheme(), { wrapper: wrapper() });
    act(() => {
      result.current.setBrand("ontology");
    });
    expect(document.documentElement.getAttribute("data-brand")).toBe("ontology");
    expect(localStorage.getItem("axis-brand")).toBe("ontology");
    expect(result.current.brand).toBe("ontology");
  });

  it("setBrand(undefined) 호출 시 data-brand를 지우고 「끔」(빈 문자열)을 저장한다 (WI-0068)", () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: wrapper({ defaultBrand: "ontology" }),
    });
    act(() => {
      result.current.setBrand("ontology");
    });
    expect(localStorage.getItem("axis-brand")).toBe("ontology");
    act(() => {
      result.current.setBrand(undefined);
    });
    expect(document.documentElement.hasAttribute("data-brand")).toBe(false);
    expect(localStorage.getItem("axis-brand")).toBe("");
    expect(result.current.brand).toBeUndefined();
  });

  it("localStorage에 저장된 브랜드를 defaultBrand보다 우선해 복원한다", () => {
    localStorage.setItem("axis-brand", "saved");
    const { result } = renderHook(() => useTheme(), {
      wrapper: wrapper({ defaultBrand: "ontology" }),
    });
    expect(document.documentElement.getAttribute("data-brand")).toBe("saved");
    expect(result.current.brand).toBe("saved");
  });

  it("커스텀 brandStorageKey로 저장 · 복원한다", () => {
    localStorage.setItem("my-brand", "saved");
    const { result } = renderHook(() => useTheme(), {
      wrapper: wrapper({ brandStorageKey: "my-brand" }),
    });
    expect(result.current.brand).toBe("saved");
    act(() => {
      result.current.setBrand("ontology");
    });
    expect(localStorage.getItem("my-brand")).toBe("ontology");
    expect(localStorage.getItem("axis-brand")).toBeNull();
  });

  it("setTheme은 data-brand를 건드리지 않는다", () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: wrapper({ defaultTheme: "light", defaultBrand: "ontology" }),
    });
    act(() => {
      result.current.setTheme("dark");
    });
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.getAttribute("data-brand")).toBe("ontology");
    expect(localStorage.getItem("axis-brand")).toBeNull();
  });
});

// ─── brand 해제 유지 · 마크업 존중 (WI-0068) ─────────────────────────
// 「재마운트」는 같은 문서에서 unmount 뒤 다시 render 한 것으로, 새로고침의 대역이다(document · localStorage 유지).
// 실제 새로고침에서는 서버 마크업이 다시 오므로, 마크업 시나리오는 재마운트 전에 속성을 다시 붙여 같은 조건을 만든다.

describe("brand 해제 유지 · 마크업 존중 (WI-0068)", () => {
  function BrandProbe() {
    const { brand, setBrand } = useTheme();
    return (
      <button type="button" onClick={() => setBrand(undefined)}>
        {`brand:${brand ?? "none"}`}
      </button>
    );
  }
  const html = () => document.documentElement;

  it("S1 defaultBrand 로 켠 뒤 setBrand(undefined) 하고 재마운트해도 꺼진 채다", () => {
    const first = render(<ThemeProvider defaultBrand="ontology"><BrandProbe /></ThemeProvider>);
    expect(html().getAttribute("data-brand")).toBe("ontology");
    act(() => { screen.getByRole("button").click(); });
    expect(html().hasAttribute("data-brand")).toBe(false);
    first.unmount();
    render(<ThemeProvider defaultBrand="ontology"><BrandProbe /></ThemeProvider>);
    expect(html().hasAttribute("data-brand")).toBe(false);
    expect(screen.getByRole("button").textContent).toBe("brand:none");
  });

  it("S2 마크업 data-brand 만 있고 defaultBrand 가 없어도 마운트 때 지우지 않는다", () => {
    html().setAttribute("data-brand", "ontology");
    render(<ThemeProvider><BrandProbe /></ThemeProvider>);
    expect(html().getAttribute("data-brand")).toBe("ontology");
    expect(screen.getByRole("button").textContent).toBe("brand:ontology");
  });

  it("S3 마크업과 같은 defaultBrand 는 그대로 유지한다", () => {
    html().setAttribute("data-brand", "ontology");
    render(<ThemeProvider defaultBrand="ontology"><BrandProbe /></ThemeProvider>);
    expect(html().getAttribute("data-brand")).toBe("ontology");
  });

  it("S4 저장값이 마크업 · defaultBrand 보다 우선한다", () => {
    localStorage.setItem("axis-brand", "saved");
    html().setAttribute("data-brand", "ontology");
    render(<ThemeProvider defaultBrand="other"><BrandProbe /></ThemeProvider>);
    expect(html().getAttribute("data-brand")).toBe("saved");
  });

  it("S5 마크업과 defaultBrand 가 다르면 마크업이 이긴다(동작 변경: 1.6.2 까지는 defaultBrand)", () => {
    html().setAttribute("data-brand", "x");
    render(<ThemeProvider defaultBrand="ontology"><BrandProbe /></ThemeProvider>);
    expect(html().getAttribute("data-brand")).toBe("x");
    expect(screen.getByRole("button").textContent).toBe("brand:x");
  });

  it("S6 저장값 경로(defaultBrand 없음)에서 해제 뒤 재마운트해도 꺼진 채다", () => {
    localStorage.setItem("axis-brand", "ontology");
    const first = render(<ThemeProvider><BrandProbe /></ThemeProvider>);
    act(() => { screen.getByRole("button").click(); });
    first.unmount();
    render(<ThemeProvider><BrandProbe /></ThemeProvider>);
    expect(html().hasAttribute("data-brand")).toBe(false);
  });

  it("S7 마크업 브랜드를 끄고 새로고침(마크업이 다시 옴)해도 꺼진 채다", () => {
    html().setAttribute("data-brand", "ontology");
    const first = render(<ThemeProvider><BrandProbe /></ThemeProvider>);
    act(() => { screen.getByRole("button").click(); });
    expect(html().hasAttribute("data-brand")).toBe(false);
    first.unmount();
    html().setAttribute("data-brand", "ontology"); // 서버 마크업이 다시 온 상태
    render(<ThemeProvider><BrandProbe /></ThemeProvider>);
    expect(html().hasAttribute("data-brand")).toBe(false);
    expect(localStorage.getItem("axis-brand")).toBe("");
  });

  it("S8 언마운트하면 마운트 전 마크업 값으로 되돌려, 다른 defaultBrand 로 재마운트한 Provider 가 앞 값을 마크업으로 읽지 않는다", () => {
    const first = render(<ThemeProvider defaultBrand="a"><BrandProbe /></ThemeProvider>);
    expect(html().getAttribute("data-brand")).toBe("a");
    first.unmount();
    expect(html().hasAttribute("data-brand")).toBe(false);
    render(<ThemeProvider defaultBrand="b"><BrandProbe /></ThemeProvider>);
    expect(html().getAttribute("data-brand")).toBe("b");
  });

  it("S8-2 마크업이 있던 문서에서는 언마운트 때 그 마크업 값으로 되돌린다", () => {
    html().setAttribute("data-brand", "ontology");
    const first = render(<ThemeProvider><BrandProbe /></ThemeProvider>);
    act(() => { screen.getByRole("button").click(); });
    first.unmount();
    expect(html().getAttribute("data-brand")).toBe("ontology");
  });

  it("S9 StrictMode(이펙트 두 번 실행)에서도 마크업 · defaultBrand 결과가 같다", () => {
    html().setAttribute("data-brand", "ontology");
    render(<StrictMode><ThemeProvider defaultBrand="other"><BrandProbe /></ThemeProvider></StrictMode>);
    expect(html().getAttribute("data-brand")).toBe("ontology");
    expect(screen.getByRole("button").textContent).toBe("brand:ontology");
  });

  it("S10 구버전이 남긴 저장값 없음(null)은 마크업 · defaultBrand 로 넘어간다", () => {
    expect(localStorage.getItem("axis-brand")).toBeNull();
    render(<ThemeProvider defaultBrand="ontology"><BrandProbe /></ThemeProvider>);
    expect(html().getAttribute("data-brand")).toBe("ontology");
  });
});
