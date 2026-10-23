/**
 * library 링크 네트워크 검사 (WI-0057 D4, 수동 실행 전용)
 *
 * `apps/web/public/library` 의 링크 필드(components/*.json · categories/*.json 의 source.url)를 모아 중복을 빼고
 * 각각 GET 으로 요청(리다이렉트 추적)해 최종 응답 코드를 봅니다. 원격 상태에 따라 결과가 흔들리므로 CI 에 넣지 않습니다.
 * 머지 전 판정은 오프라인 검사(`pnpm check-library-links`)가 맡고, 이 스크립트는 배포 뒤 · 외부 링크 점검용입니다.
 *
 * 요청 대상: 위 링크 필드의 URL 만 (코드 본문 속 예시 URL 은 링크가 아니라 제외). 인증 헤더 · 쿠키를 보내지 않습니다.
 *
 * 옵션
 *   --library <dir>   library 디렉터리 (기본: apps/web/public/library)
 *   --host <host>     이 호스트의 링크만 검사 (예: axis-design-system.pages.dev). 여러 번 지정 가능
 *   --timeout <ms>    요청당 제한 시간 (기본 20000)
 *
 * 종료 코드
 *   0: 링크 1개 이상을 검사했고 모두 2xx
 *   1: 2xx 가 아닌 응답 또는 요청 실패가 있음
 *   2: 측정 실패 (디렉터리 없음, 검사할 링크 0개)
 */

import fs from "node:fs";
import path from "node:path";

const opts = { library: "apps/web/public/library", hosts: [], timeout: 20000 };
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const key = argv[i];
  const value = argv[i + 1];
  if (!value) fail(`${key} 값이 없습니다`);
  if (key === "--library") opts.library = value;
  else if (key === "--host") opts.hosts.push(value);
  else if (key === "--timeout") opts.timeout = Number(value);
  else fail(`알 수 없는 옵션: ${key}`);
  i++;
}

function fail(message) {
  console.error(`측정 실패: ${message}`);
  process.exit(2);
}

const libraryDir = path.resolve(opts.library);
const urls = new Set();
for (const sub of ["components", "categories"]) {
  const dir = path.join(libraryDir, sub);
  if (!fs.existsSync(dir)) fail(`디렉터리가 없습니다: ${dir}`);
  for (const name of fs.readdirSync(dir).filter((n) => n.endsWith(".json"))) {
    const data = JSON.parse(fs.readFileSync(path.join(dir, name), "utf-8"));
    const items = Array.isArray(data.components) ? data.components : [data];
    for (const c of items) {
      const u = c?.source?.url;
      if (typeof u === "string" && /^https?:\/\//.test(u)) urls.add(u);
    }
  }
}
let targets = [...urls].sort();
if (opts.hosts.length > 0) targets = targets.filter((u) => opts.hosts.includes(new URL(u).host));
if (targets.length === 0) fail("검사할 링크가 0개입니다");

async function check(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeout);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": "axis-library-link-check/1.0" },
    });
    await res.body?.cancel();
    return { url, status: res.status, final: res.url, redirected: res.redirected };
  } catch (error) {
    return { url, status: 0, final: "", redirected: false, error: error instanceof Error ? error.message : String(error) };
  } finally {
    clearTimeout(timer);
  }
}

const results = [];
const queue = [...targets];
await Promise.all(
  Array.from({ length: 4 }, async () => {
    while (queue.length > 0) results.push(await check(queue.shift()));
  })
);
results.sort((a, b) => a.url.localeCompare(b.url));

const byHost = new Map();
for (const r of results) {
  const host = new URL(r.url).host;
  const key = `${host} ${r.status || "ERR"}${r.redirected ? " (리다이렉트)" : ""}`;
  byHost.set(key, (byHost.get(key) || 0) + 1);
}
console.log(`검사 링크 ${results.length}개`);
for (const [key, n] of [...byHost.entries()].sort()) console.log(`  ${key}: ${n}`);
const bad = results.filter((r) => r.status < 200 || r.status >= 300);
for (const r of bad) console.log(`  ✗ ${r.status || "ERR"} ${r.url}${r.error ? ` (${r.error})` : ""}`);
if (bad.length > 0) {
  console.log(`2xx 아님 ${bad.length}개`);
  process.exit(1);
}
console.log("모두 2xx");
