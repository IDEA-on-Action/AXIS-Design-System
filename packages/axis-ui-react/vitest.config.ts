import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: {
    jsxInject: `import React from 'react'`,
    jsx: "automatic",
  },
  test: {
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}", "src/index.ts"],
    },
  },
});
