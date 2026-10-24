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
  /**
   * 초기 브랜드 이름. `<html data-brand>`에 붙는다 (기본값: 없음)
   * 우선순위: 저장값(setBrand(undefined)로 끈 상태 포함) > 서버 마크업 `<html data-brand>` > defaultBrand
   */
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
  /** 브랜드를 변경하는 함수. undefined를 주면 속성을 지우고 「끔」을 저장해 새로고침 뒤에도 꺼진 채 유지한다 */
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
 * 저장된 브랜드 읽기 (WI-0068)
 * - undefined: 저장값 없음(서버 렌더 · localStorage 예외 포함). 다음 순위(마크업 · defaultBrand)로 넘어간다
 * - "": 사용자가 setBrand(undefined)로 끈 상태(센티널). 새로고침 뒤에도 꺼진 채 유지한다
 * - 그 밖의 문자열: 저장된 브랜드
 */
function readStoredBrand(key: string): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const value = window.localStorage.getItem(key);
    return value === null ? undefined : value;
  } catch {
    return undefined;
  }
}

/** 서버 마크업이 붙여 둔 `<html data-brand>` 읽기. 없거나 빈 값이면 undefined */
function readMarkupBrand(): string | undefined {
  if (typeof document === "undefined") return undefined;
  return document.documentElement.getAttribute("data-brand") || undefined;
}

/**
 * 클라이언트 초기 브랜드 (WI-0068): 저장값("" 이면 꺼짐) > 마크업 data-brand > defaultBrand
 */
function resolveInitialBrand(key: string, defaultBrand: string | undefined): string | undefined {
  const stored = readStoredBrand(key);
  if (stored !== undefined) return stored || undefined;
  return readMarkupBrand() ?? (defaultBrand || undefined);
}

/**
 * 브랜드 저장. 값이 없으면(undefined · 빈 문자열) 빈 문자열을 저장해 「끔」을 기억한다(WI-0068).
 * 1.6.2 이하는 빈 문자열을 저장값 없음으로 읽으므로, 내려가도 그 버전의 동작(defaultBrand)으로 돌아갈 뿐이다.
 * localStorage 예외는 무시한다(저장 실패해도 현재 화면의 브랜드 전환은 유지).
 */
function writeBrand(key: string, value: string | undefined): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value || "");
  } catch {
    // 저장 실패는 무시한다
  }
}

const subscribeNothing = () => () => {};

/**
 * 서버 렌더와 하이드레이션 첫 렌더에서만 true (WI-0068)
 * 이때는 서버 HTML 과 같은 값(defaultBrand)으로 그리고, 하이드레이션이 끝난 뒤 클라이언트 값으로 맞춘다.
 * createRoot 로 처음부터 그리는 경우에는 처음부터 false 다.
 */
function useIsHydrating(): boolean {
  return React.useSyncExternalStore(subscribeNothing, () => false, () => true);
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

  // 초기 브랜드: 저장값("" 이면 꺼짐) > 마크업 data-brand > defaultBrand (WI-0068).
  // 서버 렌더 · 하이드레이션 첫 렌더는 defaultBrand 로 그리고(서버 HTML 과 같은 값, ctx.brand 불일치 방지)
  // DOM 을 건드리지 않는다. 하이드레이션 직후 렌더에서 클라이언트 값으로 바꾼다.
  const hydrating = useIsHydrating();
  const [brandState, setBrandState] = React.useState<{ value: string | undefined; resolved: boolean }>(() =>
    hydrating
      ? { value: defaultBrand || undefined, resolved: false }
      : { value: resolveInitialBrand(brandStorageKey, defaultBrand), resolved: true }
  );
  if (!hydrating && !brandState.resolved) {
    // 렌더 중 상태 보정(React 권장 패턴): 하이드레이션이 끝난 첫 렌더에서 한 번만 실행된다
    setBrandState({ value: resolveInitialBrand(brandStorageKey, defaultBrand), resolved: true });
  }
  const brand = brandState.value;
  const brandResolved = brandState.resolved;
  // 마운트 전 마크업 값. 언마운트 때 이 값으로 되돌려, 다음 Provider 가 앞 인스턴스가 붙인 속성을 마크업으로 읽지 않게 한다
  const markupBrandRef = React.useRef<string | null | undefined>(undefined);

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
    // 하이드레이션 첫 커밋에서는 서버 마크업을 그대로 둔다(바로 다음 렌더가 클라이언트 값으로 맞춘다)
    if (!brandResolved) return;
    const root = window.document.documentElement;
    if (markupBrandRef.current === undefined) markupBrandRef.current = root.getAttribute("data-brand");
    if (brand) {
      root.setAttribute("data-brand", brand);
    } else {
      root.removeAttribute("data-brand");
    }
  }, [brand, brandResolved]);

  // 언마운트: 마운트 전 마크업 값으로 되돌린다(이 Provider 가 붙이거나 지운 것만 원래대로)
  React.useEffect(
    () => () => {
      const before = markupBrandRef.current;
      if (before === undefined) return;
      const root = window.document.documentElement;
      if (before === null) root.removeAttribute("data-brand");
      else root.setAttribute("data-brand", before);
      markupBrandRef.current = undefined;
    },
    []
  );

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
      setBrandState({ value: newBrand || undefined, resolved: true });
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
