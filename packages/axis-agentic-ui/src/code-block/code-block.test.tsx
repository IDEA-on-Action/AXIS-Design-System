import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CodeBlock } from "./index";

describe("CodeBlock", () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it("기본 렌더링 시 코드 텍스트를 표시한다", () => {
    render(<CodeBlock code="console.log('hello')" />);
    expect(screen.getByText("console.log('hello')")).toBeInTheDocument();
  });

  it("filename을 표시한다", () => {
    render(<CodeBlock code="const x = 1" filename="example.ts" />);
    expect(screen.getByText("example.ts")).toBeInTheDocument();
  });

  it("language를 표시한다", () => {
    render(<CodeBlock code="const x = 1" language="typescript" />);
    expect(screen.getByText("typescript")).toBeInTheDocument();
  });

  it("복사 버튼이 존재하고 aria-label이 '코드 복사'이다", () => {
    render(<CodeBlock code="test" />);
    const copyButton = screen.getByRole("button", { name: "코드 복사" });
    expect(copyButton).toBeInTheDocument();
  });

  it("복사 클릭 시 clipboard API를 호출하고 버튼 텍스트가 '복사됨'으로 변경된다", async () => {
    render(<CodeBlock code="test code" />);
    const copyButton = screen.getByRole("button", { name: "코드 복사" });
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith("test code");
    });
    await waitFor(() => {
      expect(screen.getByText("복사됨")).toBeInTheDocument();
    });
  });

  it("복사 클릭 시 onCopy 콜백을 호출한다", async () => {
    const onCopy = vi.fn();
    render(<CodeBlock code="callback test" onCopy={onCopy} />);
    const copyButton = screen.getByRole("button", { name: "코드 복사" });
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(onCopy).toHaveBeenCalledWith("callback test");
    });
  });

  it("showLineNumbers=true이면 줄 번호 테이블을 렌더한다", () => {
    const code = "line1\nline2\nline3";
    const { container } = render(
      <CodeBlock code={code} showLineNumbers />
    );
    const table = container.querySelector("table");
    expect(table).toBeInTheDocument();
    const rows = container.querySelectorAll("tr");
    expect(rows).toHaveLength(3);
  });

  it("showLineNumbers=false(기본)이면 테이블 없이 코드를 표시한다", () => {
    const { container } = render(<CodeBlock code="simple code" />);
    const table = container.querySelector("table");
    expect(table).not.toBeInTheDocument();
  });

  it("maxHeight가 설정되면 스크롤 컨테이너에 스타일이 적용된다", () => {
    const { container } = render(
      <CodeBlock code="test" maxHeight="300px" />
    );
    const scrollDiv = container.querySelector(".overflow-auto");
    expect(scrollDiv).toHaveStyle({ maxHeight: "300px" });
  });

  it("maxHeight가 없으면 style 속성이 설정되지 않는다", () => {
    const { container } = render(<CodeBlock code="test" />);
    const scrollDiv = container.querySelector(".overflow-auto");
    expect(scrollDiv).not.toHaveAttribute("style");
  });
});
