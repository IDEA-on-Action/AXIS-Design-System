/**
 * AXIS Design System - Theme Provider
 * @packageDocumentation
 */

import * as React from "react";

type Theme = "light" | "dark" | "system";

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
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
 * AXIS 테마 프로바이더
 * 라이트/다크 모드 및 시스템 테마 지원
 */
export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "axis-theme",
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(() => {
    if (typeof window === "undefined") return defaultTheme;
    return (localStorage.getItem(storageKey) as Theme) || defaultTheme;
  });

  const [resolvedTheme, setResolvedTheme] = React.useState<"light" | "dark">(() =>
    theme === "system" ? getSystemTheme() : theme
  );

  React.useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");

    const resolved = theme === "system" ? getSystemTheme() : theme;
    root.classList.add(resolved);
    root.setAttribute("data-theme", resolved);
    setResolvedTheme(resolved);
  }, [theme]);

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

  const value = React.useMemo(
    () => ({ theme, setTheme, resolvedTheme }),
    [theme, setTheme, resolvedTheme]
  );

  return React.createElement(ThemeContext.Provider, { value }, children);
}

/**
 * 현재 테마 상태를 가져오는 훅
 */
export function useTheme(): ThemeContextValue {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

export type { Theme, ThemeProviderProps, ThemeContextValue };
