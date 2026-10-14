// @vitest-environment node
/**
 * ThemeProvider 서버 렌더 안전성 (WI-0025 FR-6)
 * 서버에는 window · document · localStorage 가 없으므로 렌더가 예외 없이 끝나야 한다.
 */
import { renderToString } from "react-dom/server";
import { ThemeProvider, useTheme } from "./index";

function BrandProbe() {
  const { brand, theme } = useTheme();
  return <span>{`${theme}:${brand ?? "none"}`}</span>;
}

describe("ThemeProvider SSR", () => {
  it("node 환경에는 window가 없다(전제 확인)", () => {
    expect(typeof window).toBe("undefined");
  });

  it("defaultBrand · brandStorageKey를 줘도 renderToString이 예외 없이 끝난다", () => {
    let html = "";
    expect(() => {
      html = renderToString(
        <ThemeProvider defaultTheme="dark" defaultBrand="ontology" brandStorageKey="k">
          <BrandProbe />
        </ThemeProvider>
      );
    }).not.toThrow();
    // 서버에서는 저장값을 읽지 않고 기본값을 쓴다
    expect(html).toContain("dark:ontology");
  });

  it("브랜드를 주지 않으면 brand는 undefined로 렌더된다", () => {
    const html = renderToString(
      <ThemeProvider>
        <BrandProbe />
      </ThemeProvider>
    );
    expect(html).toContain("system:none");
  });
});
