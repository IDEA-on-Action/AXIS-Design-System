/**
 * WI-0055 D13: mcp 는 axis.config.json 의 registry 를 공개 https 주소일 때만 씁니다(SSRF · 신뢰할 수 없는 저장소 대비).
 * 환경변수는 제한하지 않고, cli 는 바뀌지 않습니다. 결과에는 주소와 출처를 항상 적습니다.
 *
 * 네트워크는 쓰지 않습니다. DNS 는 lookup 주입, 원격은 fetchImpl 주입(요청 URL · init 기록)으로 봅니다.
 */

import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { createServer, request as httpRequest, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createClientFor } from "@axis-ds/registry-core/add";
import {
  blockedAddressReason,
  createPinnedFetch,
  publicRegistryUrlProblem,
  type FetchLike,
  type LookupAll,
} from "@axis-ds/registry-core/registry";
import { formatInstallResult, handleInstallComponent } from "./install.js";
import { formatComponentList, handleListComponents } from "./list.js";
import { mcpClientFactory } from "./registry-source.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY_DIR = path.resolve(HERE, "../../../../apps/web/public/r");
const DEFAULT_URL = "https://axis-design-system.pages.dev/r";

/** 이름 → 주소 표. 없는 이름은 ENOTFOUND */
function fakeLookup(table: Record<string, string[]>): LookupAll & { calls: string[] } {
  const calls: string[] = [];
  const fn = (async (host: string) => {
    calls.push(host);
    const addrs = table[host];
    if (!addrs) throw Object.assign(new Error(`getaddrinfo ENOTFOUND ${host}`), { code: "ENOTFOUND" });
    return addrs.map((address) => ({ address, family: address.includes(":") ? 6 : 4 }));
  }) as LookupAll & { calls: string[] };
  fn.calls = calls;
  return fn;
}

interface Recorded {
  url: string;
  redirect?: string;
}

/** serveBases 로 시작하는 URL 은 저장소 레지스트리 파일로, redirectBases 는 302 로, 나머지는 503 으로 답합니다 */
function fakeFetch(options: { serveBases?: string[]; redirectBases?: string[] } = {}): FetchLike & { calls: Recorded[] } {
  const calls: Recorded[] = [];
  const fn = (async (url: string, init?: { redirect?: string }) => {
    calls.push({ url, ...(init?.redirect ? { redirect: init.redirect } : {}) });
    if (options.redirectBases?.some((b) => url.startsWith(b))) {
      return { ok: false, status: 302, text: async () => "" };
    }
    if (options.serveBases?.some((b) => url.startsWith(b))) {
      const file = path.join(REGISTRY_DIR, path.basename(url));
      if (existsSync(file)) return { ok: true, status: 200, text: async () => readFileSync(file, "utf8") };
      return { ok: false, status: 404, text: async () => "" };
    }
    return { ok: false, status: 503, text: async () => "" };
  }) as FetchLike & { calls: Recorded[] };
  fn.calls = calls;
  return fn;
}

let work: string;
beforeEach(() => {
  work = mkdtempSync(path.join(tmpdir(), "axis-mcp-guard-"));
});
afterEach(() => {
  rmSync(work, { recursive: true, force: true });
});

function project(registry: string): string {
  const dir = path.join(work, `p${Math.random().toString(36).slice(2, 8)}`);
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, "package.json"), JSON.stringify({ name: "p", private: true }));
  writeFileSync(path.join(dir, "axis.config.json"), JSON.stringify({ componentsDir: "components/ui", registry }));
  return dir;
}

const PUBLIC_DNS = {
  "registry.example.com": ["93.184.216.34", "2606:2800:220:1::1"],
  "internal.example.com": ["10.20.30.40"],
  "mixed.example.com": ["93.184.216.34", "192.168.0.10"],
  "rebind6.example.com": ["::ffff:127.0.0.1"],
};

describe("publicRegistryUrlProblem (코어 host-guard)", () => {
  const lookup = fakeLookup(PUBLIC_DNS);
  const blocked = [
    "https://10.0.0.1/r",
    "https://172.16.5.4/r",
    "https://172.31.255.255/r",
    "https://192.168.1.1/r",
    "https://100.64.0.1/r",
    "https://169.254.169.254/r",
    "https://127.0.0.1/r",
    "https://0.0.0.0/r",
    "https://2130706433/r", // 127.0.0.1 의 10진 표기(URL 파서가 점 표기로 바꿈)
    "https://0x7f.1/r",
    "https://[::1]/r",
    "https://[::]/r",
    "https://[fe80::1]/r",
    "https://[fd12:3456::1]/r",
    "https://[::ffff:10.0.0.1]/r", // URL 파서가 [::ffff:a00:1] 로 바꿈
    "https://[::ffff:7f00:1]/r",
    "https://[64:ff9b::a9fe:a9fe]/r", // NAT64 로 169.254.169.254
    "https://localhost/r",
    "https://api.localhost/r",
    "https://printer.local/r",
    "http://registry.example.com/r",
    "https://internal.example.com/r",
    "https://mixed.example.com/r",
    "https://rebind6.example.com/r",
    "https://nowhere.example.com/r", // 조회 실패도 거부
  ];
  for (const url of blocked) {
    it(`거부: ${url}`, async () => {
      expect(await publicRegistryUrlProblem(url, lookup)).not.toBeNull();
    });
  }
  const allowed = ["https://registry.example.com/r", "https://8.8.8.8/r", "https://[2606:4700::1]/r", "https://172.32.0.1/r", "https://100.128.0.1/r"];
  // IANA 특수 목적 주소 보강(2026-10-24 보안 리뷰)
  const blockedMore = [
    "198.18.0.1", "198.19.255.255", "192.0.0.8", "192.0.2.1", "198.51.100.7", "203.0.113.9", "192.88.99.1",
    "240.0.0.1", "255.255.255.255", "64:ff9b:1::1", "100::1", "100:0:0:1::5",
    "2002:a00:1::1", // 6to4 가 품은 10.0.0.1
    "2002:7f00:1::",
    "2001:0:a00:1::1", // Teredo 서버 10.0.0.1
    "2001:0:4136:e378:8000:63bf:80ff:fffe", // Teredo 클라이언트(비트 반전) 127.0.0.1
    "2001:db8::1", "2001:2::1", "2001:10::1", "3fff::1", "5f00::1", "::ffff:198.18.0.1",
  ];
  for (const ip of blockedMore) {
    it(`거부(보강): ${ip}`, () => {
      expect(blockedAddressReason(ip)).not.toBeNull();
    });
  }
  const allowedMore = [
    "198.20.0.1", "192.0.3.1", "203.0.114.1",
    "2002:5db8:d822::1", // 6to4 가 품은 93.184.216.34
    "2001:0:4136:e378:8000:63bf:a247:27dd", // Teredo 서버 65.54.227.120 · 클라이언트 93.184.216.34
    "2001:4860:4860::8888",
  ];
  for (const ip of allowedMore) {
    it(`허용(보강): ${ip}`, () => {
      expect(blockedAddressReason(ip)).toBeNull();
    });
  }
  for (const url of allowed) {
    it(`허용: ${url}`, async () => {
      expect(await publicRegistryUrlProblem(url, lookup)).toBeNull();
    });
  }
});

describe("mcp: config 의 registry 제한 (D13)", () => {
  const rejected: [string, string][] = [
    ["사설 IP", "https://10.0.0.1/r"],
    ["http", "http://registry.example.com/r"],
    ["localhost", "https://localhost/r"],
    ["사설로 풀리는 이름", "https://internal.example.com/r"],
  ];
  for (const [label, registry] of rejected) {
    it(`${label}(${registry}) 는 쓰지 않고 기본 주소로, 안내 · 출처 기본값`, async () => {
      const dir = project(registry);
      const fetchImpl = fakeFetch({ serveBases: [DEFAULT_URL] });
      const lookup = fakeLookup(PUBLIC_DNS);
      const r = await handleListComponents({}, { cwd: dir, createClient: mcpClientFactory({ env: {}, lookup, fetchImpl, bundledDir: REGISTRY_DIR }) });
      expect(r.totalCount).toBe(28);
      expect(fetchImpl.calls.length).toBeGreaterThan(0);
      expect(fetchImpl.calls.every((c) => c.url.startsWith(`${DEFAULT_URL}/`))).toBe(true);
      expect(r.notices.some((n) => n.startsWith(`axis.config.json 의 registry(${registry})를 쓰지 않습니다`))).toBe(true);
      expect(r.source).toBe(`원격 레지스트리 (version 1.5.0) · 주소 ${DEFAULT_URL} (기본값)`);
    });
  }

  it("공인 https config 는 그대로 쓰고 리다이렉트를 따라가지 않게 요청(redirect: manual)", async () => {
    const dir = project("https://registry.example.com/r");
    const fetchImpl = fakeFetch({ serveBases: ["https://registry.example.com/r"] });
    const r = await handleListComponents({}, { cwd: dir, createClient: mcpClientFactory({ env: {}, lookup: fakeLookup(PUBLIC_DNS), fetchImpl, bundledDir: REGISTRY_DIR }) });
    expect(r.notices).toEqual([]);
    expect(fetchImpl.calls.map((c) => c.url)).toEqual(["https://registry.example.com/r/index.json"]);
    expect(fetchImpl.calls[0].redirect).toBe("manual");
    expect(r.source).toBe("원격 레지스트리 (version 1.5.0) · 주소 https://registry.example.com/r (axis.config.json registry)");
    expect(formatComponentList(r)).toContain("주소 https://registry.example.com/r (axis.config.json registry)");
  });

  it("공인 config 가 리다이렉트하면 따라가지 않고 동봉본으로(다른 주소 요청 0건)", async () => {
    const dir = project("https://registry.example.com/r");
    const fetchImpl = fakeFetch({ redirectBases: ["https://registry.example.com/r"] });
    const r = await handleListComponents({}, { cwd: dir, createClient: mcpClientFactory({ env: {}, lookup: fakeLookup(PUBLIC_DNS), fetchImpl, bundledDir: REGISTRY_DIR }) });
    expect(r.totalCount).toBe(28);
    expect(fetchImpl.calls.map((c) => c.url)).toEqual(["https://registry.example.com/r/index.json"]);
    expect(r.notices.join("\n")).toContain("리다이렉트(HTTP 302)를 따라가지 않습니다");
    expect(r.source).toContain("출처 동봉본 · 시도한 원격 https://registry.example.com/r (axis.config.json registry)");
  });

  it("환경변수는 루프백도 허용(제한 없음), 리다이렉트 옵션도 없음", async () => {
    const dir = project("https://10.0.0.1/r");
    const env = { AXIS_REGISTRY_URL: "http://127.0.0.1:4873/r" };
    const fetchImpl = fakeFetch({ serveBases: ["http://127.0.0.1:4873/r"] });
    const lookup = fakeLookup({});
    const r = await handleListComponents({}, { cwd: dir, createClient: mcpClientFactory({ env, lookup, fetchImpl, bundledDir: REGISTRY_DIR }) });
    expect(r.notices).toEqual([]);
    expect(lookup.calls).toEqual([]);
    expect(fetchImpl.calls[0]).toEqual({ url: "http://127.0.0.1:4873/r/index.json" });
    expect(r.source).toBe("원격 레지스트리 (version 1.5.0) · 주소 http://127.0.0.1:4873/r (환경변수 AXIS_REGISTRY_URL)");
  });

  it("install: 사설 config 는 무시하고 기본 주소(실패 시 동봉본)로 설치, 결과에 주소 · 출처", async () => {
    const dir = project("https://192.168.0.5/r");
    const fetchImpl = fakeFetch();
    const r = await handleInstallComponent(
      { name: "separator", targetDir: dir },
      { createClient: mcpClientFactory({ env: {}, lookup: fakeLookup(PUBLIC_DNS), fetchImpl, bundledDir: REGISTRY_DIR }) }
    );
    expect(r.success).toBe(true);
    expect(fetchImpl.calls.some((c) => c.url.includes("192.168.0.5"))).toBe(false);
    expect(r.source).toContain(`출처 동봉본 · 시도한 원격 ${DEFAULT_URL} (기본값)`);
    const text = formatInstallResult(r);
    expect(text).toContain("axis.config.json 의 registry(https://192.168.0.5/r)를 쓰지 않습니다");
    expect(text).toContain(`- **레지스트리**: MCP 에 포함된 레지스트리 (version 1.5.0) · 출처 동봉본`);
  });

  it("설치 전에 멈춰도(없는 targetDir) 레지스트리 줄이 있음", async () => {
    const r = await handleInstallComponent({ name: "separator", targetDir: path.join(work, "nope") }, {});
    expect(formatInstallResult(r)).toContain("- **레지스트리**: 레지스트리를 조회하지 않음");
  });

  it("주소의 userinfo · 쿼리는 가려서 적음", async () => {
    const dir = project("https://user:secret@10.0.0.1/r");
    const r = await handleListComponents({}, { cwd: dir, createClient: mcpClientFactory({ env: {}, lookup: fakeLookup(PUBLIC_DNS), fetchImpl: fakeFetch(), bundledDir: REGISTRY_DIR }) });
    const all = [...r.notices, r.source].join("\n");
    expect(all).not.toContain("secret");
    expect(all).toContain("https://***@10.0.0.1/r");
  });
});

describe("cli 는 바뀌지 않음", () => {
  it("제한을 켜지 않은 createClientFor 는 사설 config 도 그대로(cli 종전)", async () => {
    const dir = project("https://10.0.0.1/r");
    const notices: string[] = [];
    const lookup = fakeLookup({});
    const client = await createClientFor(dir, (m) => notices.push(m), {}, { bundledDir: REGISTRY_DIR });
    expect(client.remote).toEqual({ url: "https://10.0.0.1/r", source: "config" });
    expect(notices).toEqual([]);
    expect(lookup.calls).toEqual([]);
  });
});

describe("연결 단계 재판정 (DNS 리바인딩)", () => {
  let server: Server | undefined;
  let hits: { url: string; host?: string }[] = [];
  beforeEach(async () => {
    hits = [];
    server = createServer((req, res) => {
      hits.push({ url: req.url ?? "", host: req.headers.host });
      const file = path.join(REGISTRY_DIR, path.basename(req.url ?? ""));
      if (existsSync(file)) res.writeHead(200, { "content-type": "application/json" }).end(readFileSync(file));
      else res.writeHead(404).end();
    });
    await new Promise<void>((done) => server!.listen(0, "127.0.0.1", () => done()));
  });
  afterEach(async () => {
    await new Promise<void>((done) => server!.close(() => done()));
  });
  const port = () => (server!.address() as AddressInfo).port;

  it("양성 대조: 판정이 허용하면 lookup 결과 주소로 연결하고 Host 는 원래 이름", async () => {
    const lookup = fakeLookup({ "registry.example.com": ["127.0.0.1"] });
    const fetchImpl = createPinnedFetch({ lookupAll: lookup, judge: () => null, request: httpRequest, port: port() });
    const res = await fetchImpl("https://registry.example.com/r/index.json", { headers: { accept: "application/json" } });
    expect(res.status).toBe(200);
    expect(JSON.parse(await res.text()).items.length).toBe(30);
    expect(hits).toEqual([{ url: "/r/index.json", host: `registry.example.com:${port()}` }]);
    expect(lookup.calls).toEqual(["registry.example.com"]);
  });

  it("검사 때는 공인, 연결 때는 루프백으로 바뀌면 연결하지 않고 동봉본으로(서버 요청 0건)", async () => {
    let n = 0;
    const calls: string[] = [];
    const rebinding: LookupAll = async (host) => {
      calls.push(host);
      n++;
      return n === 1 ? [{ address: "93.184.216.34", family: 4 }] : [{ address: "127.0.0.1", family: 4 }];
    };
    const dir = project("https://registry.example.com/r");
    const r = await handleListComponents({}, {
      cwd: dir,
      createClient: mcpClientFactory({ env: {}, lookup: rebinding, bundledDir: REGISTRY_DIR, connect: { request: httpRequest, port: port() } }),
    });
    expect(calls.length).toBeGreaterThanOrEqual(2);
    expect(hits).toEqual([]);
    expect(r.totalCount).toBe(28);
    expect(r.source).toContain("출처 동봉본 · 시도한 원격 https://registry.example.com/r (axis.config.json registry)");
    expect(r.notices.join("\n")).toContain("연결 단계에서 registry.example.com 가 127.0.0.1(루프백 주소(127.0.0.0/8))로 풀려 연결하지 않습니다");
  });

  it("공인 결과에 사설 주소가 하나라도 섞이면 연결하지 않음", async () => {
    const lookup = fakeLookup({ "registry.example.com": ["93.184.216.34", "10.1.1.1"] });
    const fetchImpl = createPinnedFetch({ lookupAll: lookup, request: httpRequest, port: port() });
    await expect(fetchImpl("https://registry.example.com/r/index.json")).rejects.toThrow("10.1.1.1");
    expect(hits).toEqual([]);
  });

  it("응답 크기 상한을 넘으면 실패", async () => {
    const lookup = fakeLookup({ "registry.example.com": ["127.0.0.1"] });
    const fetchImpl = createPinnedFetch({ lookupAll: lookup, judge: () => null, request: httpRequest, port: port(), maxBytes: 100 });
    await expect(fetchImpl("https://registry.example.com/r/index.json")).rejects.toThrow("100 바이트를 넘어");
  });

  it("env · 기본값 경로는 재판정 fetch 를 쓰지 않음(제한 없는 경로는 종전 fetch)", async () => {
    const lookup = fakeLookup({});
    const env = { AXIS_REGISTRY_URL: `http://127.0.0.1:${port()}/r` };
    const r = await handleListComponents({}, { cwd: work, createClient: mcpClientFactory({ env, lookup, bundledDir: REGISTRY_DIR }) });
    expect(r.source).toContain("(환경변수 AXIS_REGISTRY_URL)");
    expect(hits.map((h) => h.url)).toEqual(["/r/index.json"]);
    expect(lookup.calls).toEqual([]);
  });
});
