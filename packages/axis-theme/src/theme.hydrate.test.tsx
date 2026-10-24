/**
 * ThemeProvider 하이드레이션 (WI-0068)
 *
 * 마크업 data-brand · 저장값을 초기값으로 읽으면 서버 렌더(defaultBrand)와 클라이언트 첫 렌더가 달라질 수 있다.
 * ctx.brand 를 그리는 소비자(브랜드 전환 UI)에서 하이드레이션 불일치가 나지 않는지, 하이드레이션 첫 커밋이
 * 서버 마크업 속성을 지우지 않는지 본다. 같은 하네스로 일부러 불일치를 만드는 대조 컴포넌트를 돌려,
 * 이 하네스가 불일치를 실제로 잡는다는 것(양성 대조군)도 함께 보인다.
 */
import * as React from "react";
import { act } from "react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import { ThemeProvider, useTheme } from "./index";

function BrandProbe() {
  const { brand } = useTheme();
  return <span data-testid="b">{`brand:${brand ?? "none"}`}</span>;
}

/** 대조군: 렌더 중에 마크업을 바로 읽는 소비자(서버는 none, 클라이언트는 마크업 값) */
function NaiveMarkupProbe() {
  const [v] = React.useState(() =>
    typeof document === "undefined" ? "none" : document.documentElement.getAttribute("data-brand") ?? "none"
  );
  return <span data-testid="b">{`brand:${v}`}</span>;
}

/** 서버 HTML 을 만들고(서버에는 마크업 · 저장값이 없다고 가정) 같은 트리를 하이드레이션한다 */
async function hydrate(tree: React.ReactElement, serverTree: React.ReactElement = tree, serverHtml?: string) {
  const server = serverHtml ?? renderToString(serverTree);
  const container = document.createElement("div");
  container.innerHTML = server;
  document.body.appendChild(container);
  const errors: unknown[] = [];
  const consoleError = vi.spyOn(console, "error").mockImplementation((...args) => { errors.push(args[0]); });
  const records: Array<string | null> = [];
  const observer = new MutationObserver((list) => {
    for (const m of list) if (m.attributeName === "data-brand") records.push(document.documentElement.getAttribute("data-brand"));
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-brand"] });
  let root: ReturnType<typeof hydrateRoot> | undefined;
  await act(async () => {
    root = hydrateRoot(container, tree, { onRecoverableError: (e) => { errors.push(e); } });
  });
  await act(async () => { await Promise.resolve(); });
  observer.disconnect();
  consoleError.mockRestore();
  const text = container.querySelector("[data-testid=b]")?.textContent;
  return { server, text, errors, records, unmount: () => act(() => root?.unmount()), container };
}

// 직접 만든 root 에서 act 를 쓰므로 act 환경을 켠다(testing-library render 와 같은 설정)
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

beforeEach(() => {
  document.documentElement.removeAttribute("data-brand");
  document.body.innerHTML = "";
  localStorage.clear();
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
  });
});

describe("ThemeProvider 하이드레이션 (WI-0068)", () => {
  it("양성 대조군: 렌더 중 마크업을 읽는 소비자는 이 하네스에서 불일치 오류가 잡힌다", async () => {
    // 서버 HTML 은 마크업 없는 상태로 만든다(jsdom 의 서버 렌더도 document 를 보므로 속성은 그 뒤에 붙인다)
    const server = renderToString(<NaiveMarkupProbe />);
    expect(server).toContain("brand:none");
    document.documentElement.setAttribute("data-brand", "ontology");
    const r = await hydrate(<NaiveMarkupProbe />, <NaiveMarkupProbe />, server);
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it("마크업 data-brand + defaultBrand 없음: 불일치 없이 하이드레이션하고, 끝나면 ctx.brand 가 마크업 값이다", async () => {
    document.documentElement.setAttribute("data-brand", "ontology");
    const r = await hydrate(<ThemeProvider><BrandProbe /></ThemeProvider>);
    expect(r.server).toContain("brand:none");
    expect(r.errors).toEqual([]);
    expect(r.text).toBe("brand:ontology");
    expect(document.documentElement.getAttribute("data-brand")).toBe("ontology");
    // 하이드레이션 첫 커밋이 서버 마크업 속성을 지웠다가 다시 붙이지 않는다
    expect(r.records.filter((v) => v === null)).toEqual([]);
  });

  it("저장값 「끔」 + 마크업 data-brand: 불일치 없이 하이드레이션하고, 끝나면 꺼진다", async () => {
    localStorage.setItem("axis-brand", "");
    document.documentElement.setAttribute("data-brand", "ontology");
    const r = await hydrate(<ThemeProvider defaultBrand="ontology"><BrandProbe /></ThemeProvider>);
    expect(r.server).toContain("brand:ontology");
    expect(r.errors).toEqual([]);
    expect(r.text).toBe("brand:none");
    expect(document.documentElement.hasAttribute("data-brand")).toBe(false);
  });

  it("defaultBrand 만 있고 마크업 · 저장값이 없으면 하이드레이션 뒤 속성이 붙는다", async () => {
    const r = await hydrate(<ThemeProvider defaultBrand="ontology"><BrandProbe /></ThemeProvider>);
    expect(r.errors).toEqual([]);
    expect(r.text).toBe("brand:ontology");
    expect(document.documentElement.getAttribute("data-brand")).toBe("ontology");
  });

  it("하이드레이션한 Provider 를 언마운트하면 마크업 값으로 되돌린다", async () => {
    document.documentElement.setAttribute("data-brand", "ontology");
    localStorage.setItem("axis-brand", "saved");
    const r = await hydrate(<ThemeProvider><BrandProbe /></ThemeProvider>);
    expect(document.documentElement.getAttribute("data-brand")).toBe("saved");
    r.unmount();
    expect(document.documentElement.getAttribute("data-brand")).toBe("ontology");
  });
});
