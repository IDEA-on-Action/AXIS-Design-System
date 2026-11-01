/**
 * 떠 있는 레이어의 토큰 그림자 (WI-0107 · WI-0108)
 *
 * Dialog · Select · Toast · Popover · DropdownMenu · Sheet 처럼 화면 위에 떠 있는 레이어는
 * Tailwind 고정 그림자(shadow-md · shadow-lg) 대신 브랜드가 값을 정하는 var(--axis-shadow-lg) 토큰을 쓴다.
 * ontology 브랜드는 카드 그림자만 끄고 떠 있는 레이어의 고도는 이 토큰으로 표현한다.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "./sheet";

const TOKEN_SHADOW = "shadow-[shadow:var(--axis-shadow-lg)]";
// bare `shadow` · Tailwind 4 `shadow-xs` · `shadow-inner` 도 고정 그림자라 함께 잡는다
const FIXED_SHADOW = /(?:^|\s)shadow(?:-(?:xs|sm|md|lg|xl|2xl|inner))?(?=\s|$)/;

function expectTokenShadow(el: HTMLElement) {
  expect(el.className).toContain(TOKEN_SHADOW);
  expect(el.className).not.toMatch(FIXED_SHADOW);
}

describe("떠 있는 레이어가 토큰 그림자를 씀 (WI-0108)", () => {
  it("PopoverContent", () => {
    render(
      <Popover open>
        <PopoverTrigger>열기</PopoverTrigger>
        <PopoverContent data-testid="content">내용</PopoverContent>
      </Popover>
    );
    expectTokenShadow(screen.getByTestId("content"));
  });

  it("DropdownMenuContent · DropdownMenuSubContent", () => {
    render(
      <DropdownMenu open modal={false}>
        <DropdownMenuTrigger>열기</DropdownMenuTrigger>
        <DropdownMenuContent data-testid="content">
          <DropdownMenuItem>항목</DropdownMenuItem>
          <DropdownMenuSub open>
            <DropdownMenuSubTrigger>더 보기</DropdownMenuSubTrigger>
            <DropdownMenuSubContent data-testid="sub">
              <DropdownMenuItem>하위 항목</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    expectTokenShadow(screen.getByTestId("content"));
    expectTokenShadow(screen.getByTestId("sub"));
  });

  it("SheetContent (네 방향 모두)", () => {
    for (const side of ["top", "right", "bottom", "left"] as const) {
      const { unmount } = render(
        <Sheet open>
          <SheetContent side={side} data-testid="content">
            <SheetTitle>제목</SheetTitle>
            <SheetDescription>설명</SheetDescription>
          </SheetContent>
        </Sheet>
      );
      expectTokenShadow(screen.getByTestId("content"));
      unmount();
    }
  });

  it("className 의 shadow-none 이 토큰 그림자를 대체 (cn 그림자 그룹 병합)", () => {
    render(
      <Popover open>
        <PopoverTrigger>열기</PopoverTrigger>
        <PopoverContent data-testid="content" className="shadow-none">
          내용
        </PopoverContent>
      </Popover>
    );
    const el = screen.getByTestId("content");
    expect(el.className).toContain("shadow-none");
    expect(el.className).not.toContain(TOKEN_SHADOW);
  });
});

/** ui-react · agentic-ui 소스에서 떠 있는 레이어 표시(z-50 · z-[n] · fixed)와 고정 그림자를 함께 가진 문자열 리터럴 */
describe("떠 있는 레이어 문자열에 Tailwind 고정 그림자가 없음 (WI-0108)", () => {
  // jsdom 환경의 URL 은 node:url 과 달라 import.meta.url 대신 vitest 가 주는 __dirname 을 쓴다
  const PKG_SRC = __dirname;
  const roots = [PKG_SRC, join(PKG_SRC, "../../axis-agentic-ui/src")];
  const LITERAL = /"([^"\n]*)"|'([^'\n]*)'|`([^`]*)`/g;
  const FLOATING = /(?:^|\s)(?:z-50|z-\[\d+\]|fixed)(?=\s|$)/;

  function sources(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const p = join(dir, e.name);
      if (e.isDirectory()) return e.name === "node_modules" ? [] : sources(p);
      return /\.tsx?$/.test(e.name) && !/\.test\.tsx?$/.test(e.name) ? [p] : [];
    });
  }

  it("검사 대상 파일이 있고(측정 확인) 위반이 0건", () => {
    const files = roots.flatMap(sources);
    expect(files.length).toBeGreaterThan(30);
    const hits: string[] = [];
    let floating = 0;
    for (const file of files) {
      for (const m of readFileSync(file, "utf8").matchAll(LITERAL)) {
        const s = m[1] ?? m[2] ?? m[3] ?? "";
        if (!FLOATING.test(s)) continue;
        floating++;
        if (FIXED_SHADOW.test(s)) hits.push(`${relative(PKG_SRC, file)}: ${s.slice(0, 80)}`);
      }
    }
    // 양성 대조: 떠 있는 레이어 문자열을 실제로 찾았는지(0이면 측정 실패)
    expect(floating).toBeGreaterThan(5);
    expect(hits).toEqual([]);
  });
});
