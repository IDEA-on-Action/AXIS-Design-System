"use client";

/**
 * AXIS Design System - Theme Provider
 * @packageDocumentation
 */

// "use client" 를 모듈 전체에 두는 근거(WI-0050 FR-4 · D3)
// - 모듈 최상위에서 createContext 를 호출해서, 지시문이 없으면 서버 컴포넌트가 import 만 해도
//   `createContext is not a function` 으로 빌드 전체가 멈춘다
// - 런타임 내보내기는 ThemeProvider(useState · useEffect) 와 useTheme(useContext 훅) 둘뿐이고
//   둘 다 클라이언트 전용이다. 서버에서 호출할 비컴포넌트 함수(상수 · 유틸)는 없어서 파일을 나누지 않는다
// - 나머지 내보내기는 타입(Theme · ThemeProviderProps · ThemeContextValue)이라 런타임 영향이 없다
// - 단일 엔트리 번들이라 esbuild 가 엔트리 맨 앞 지시문을 ESM · CJS 산출물에 그대로 남긴다
//   (CJS 는 "use strict" 다음 줄). 서버 컴포넌트에 쓸 비컴포넌트 내보내기를 더하게 되면
//   이 파일에 두지 말고 지시문 없는 별도 엔트리(서브패스)로 낸다

import * as React from "react";

/** 테마 모드 타입. "light"(라이트), "dark"(다크), "system"(시스템 설정 따름) */
type Theme = "light" | "dark" | "system";

interface ThemeProviderProps {
  /** 테마를 적용할 자식 요소 */
  children: React.ReactNode;
  /** 초기 테마 모드 (기본값: "system") */
  defaultTheme?: Theme;
  /** localStorage에 테마를 저장할 키 (기본값: "axis-theme") */
  storageKey?: string;
  /** 초기 브랜드 이름. `<html data-brand>`에 붙는다 (기본값: 없음) */
  defaultBrand?: string;
  /** localStorage에 브랜드를 저장할 키 (기본값: "axis-brand") */
  brandStorageKey?: string;
}

interface ThemeContextValue {
  /** 현재 설정된 테마 모드 */
  theme: Theme;
  /** 테마를 변경하는 함수 */
  setTheme: (theme: Theme) => void;
  /** 실제 적용된 테마 ("system"인 경우 OS 설정에 따라 "light" 또는 "dark") */
  resolvedTheme: "light" | "dark";
  /** 현재 브랜드 이름 (없으면 undefined, 기본 토큰 사용) */
  brand: string | undefined;
  /** 브랜드를 변경하는 함수. undefined를 주면 속성과 저장값을 지운다 */
  setBrand: (brand: string | undefined) => void;
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

/**
 * 시스템 테마 감지
 */
function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * 저장된 브랜드 읽기. 서버 렌더와 localStorage 예외(사생활 보호 모드 등)에서는 undefined.
 * 빈 문자열은 브랜드 없음으로 본다.
 */
function readBrand(key: string): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return window.localStorage.getItem(key) || undefined;
  } catch {
    return undefined;
  }
}

/**
 * 브랜드 저장. 값이 없으면(undefined · 빈 문자열) 저장값을 지운다.
 * localStorage 예외는 무시한다(저장 실패해도 현재 화면의 브랜드 전환은 유지).
 */
function writeBrand(key: string, value: string | undefined): void {
  if (typeof window === "undefined") return;
  try {
    if (value) {
      window.localStorage.setItem(key, value);
    } else {
      window.localStorage.removeItem(key);
    }
  } catch {
    // 저장 실패는 무시한다
  }
}

/**
 * AXIS 테마 프로바이더
 * 라이트/다크 모드 및 시스템 테마 지원
 */
export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "axis-theme",
  defaultBrand,
  brandStorageKey = "axis-brand",
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(() => {
    if (typeof window === "undefined") return defaultTheme;
    return (localStorage.getItem(storageKey) as Theme) || defaultTheme;
  });

  const [resolvedTheme, setResolvedTheme] = React.useState<"light" | "dark">(() =>
    theme === "system" ? getSystemTheme() : theme
  );

  // 저장값이 기본값보다 우선한다(theme 초기화와 같은 규칙). 서버에서는 기본값만 쓴다
  const [brand, setBrandState] = React.useState<string | undefined>(() => {
    if (typeof window === "undefined") return defaultBrand || undefined;
    return readBrand(brandStorageKey) ?? (defaultBrand || undefined);
  });

  React.useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");

    const resolved = theme === "system" ? getSystemTheme() : theme;
    root.classList.add(resolved);
    root.setAttribute("data-theme", resolved);
    setResolvedTheme(resolved);
  }, [theme]);

  // 브랜드 속성은 theme effect 와 따로 둔다(theme 동작 불변)
  React.useEffect(() => {
    const root = window.document.documentElement;
    if (brand) {
      root.setAttribute("data-brand", brand);
    } else {
      root.removeAttribute("data-brand");
    }
  }, [brand]);

  React.useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const resolved = getSystemTheme();
      const root = window.document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(resolved);
      root.setAttribute("data-theme", resolved);
      setResolvedTheme(resolved);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const setTheme = React.useCallback(
    (newTheme: Theme) => {
      localStorage.setItem(storageKey, newTheme);
      setThemeState(newTheme);
    },
    [storageKey]
  );

  const setBrand = React.useCallback(
    (newBrand: string | undefined) => {
      writeBrand(brandStorageKey, newBrand);
      setBrandState(newBrand || undefined);
    },
    [brandStorageKey]
  );

  const value = React.useMemo(
    () => ({ theme, setTheme, resolvedTheme, brand, setBrand }),
    [theme, setTheme, resolvedTheme, brand, setBrand]
  );

  return React.createElement(ThemeContext.Provider, { value }, children);
}

/**
 * 현재 테마 상태를 가져오는 훅
 */
export function useTheme(): ThemeContextValue {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error(
      "useTheme은 ThemeProvider 내부에서만 사용 가능합니다. " +
      "앱 루트에 <ThemeProvider>를 추가하세요. " +
      "예: <ThemeProvider><App /></ThemeProvider>"
    );
  }
  return context;
}

export type { Theme, ThemeProviderProps, ThemeContextValue };
