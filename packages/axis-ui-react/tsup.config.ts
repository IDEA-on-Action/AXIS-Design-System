import { defineConfig } from "tsup";

/**
 * 모듈 보존 빌드 (WI-0050 D1)
 *
 * bundle:false 로 소스 파일 하나를 dist 파일 하나로 옮깁니다. 번들(splitting)하면 esbuild 가
 * "use client" 를 공용 chunk 로 옮기지 않아 필요한 컴포넌트만 클라이언트로 표시할 수 없습니다.
 * 상대 import 확장자 보정과 "use client" 삽입은 scripts/postbuild.mjs 가 맡습니다.
 * clean:true 로 빌드 전에 dist 를 비워 이전 빌드의 낡은 파일이 배포본에 섞이지 않게 합니다.
 */
export default defineConfig({
  entry: ["src/**/*.ts", "src/**/*.tsx", "!src/**/*.test.ts", "!src/**/*.test.tsx", "!src/test-utils/**"],
  format: ["cjs", "esm"],
  dts: true,
  bundle: false,
  clean: true,
});
