/**
 * 레지스트리 클라이언트 테스트 (WI-0045 FR-3 · D1)
 *
 * 원격은 테스트 안에서 127.0.0.1 임시 포트(0 번 요청)로 띄운 http 서버이고, 각 테스트가 닫습니다.
 * 원격 · 동봉본 content 를 다르게 만들어 어느 출처에서 읽었는지를 결과로 가립니다.
 */

import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  RegistryClient,
  RegistryError,
  bundledFallbackMessage,
  isValidRegistryName,
  resolveRegistryUrl,
  normalizeRegistryBaseUrl,
  redactRegistryUrl,
  LEGACY_DEFAULT_REGISTRY_URL,
  LEGACY_REGISTRY_NOTICE,
  isLegacyDefaultRegistryUrl,
  fetchRegistryJson,
  sha256Hex,
  registryDependencyName,
  validateRegistryIndex,
  validateRegistryItem,
  DEFAULT_REGISTRY_URL,
} from "./index.js";

// ── 픽스처 ──────────────────────────────────────────────

function makeItem(name: string, content: string, extra: Record<string, unknown> = {}) {
  return {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name,
    type: "registry:ui",
    dependencies: [],
    registryDependencies: [],
    files: [{ path: `components/ui/${name}.tsx`, type: "registry:ui", content }],
    ...extra,
  };
}

function makeRegistry(version: string, tag: string) {
  const items = [
    makeItem("utils", `// utils ${tag}\n`, { type: "registry:lib" }),
    makeItem("button", `// button ${tag}\n`, { registryDependencies: ["utils"] }),
  ];
  const index = {
    name: "axis",
    homepage: "https://axis.minu.best",
    version,
    items: items.map((it) => ({ name: it.name, type: it.type, sha256: sha256Hex(it.files[0].content) })),
  };
  const files: Record<string, unknown> = { "index.json": index };
  for (const it of items) files[`${it.name}.json`] = it;
  return files;
}

let tmpDirs: string[] = [];
function writeBundled(version: string): string {
  const dir = mkdtempSync(path.join(tmpdir(), "axis-registry-bundled-"));
  tmpDirs.push(dir);
  for (const [f, data] of Object.entries(makeRegistry(version, "bundled"))) {
    writeFileSync(path.join(dir, f), JSON.stringify(data));
  }
  return dir;
}

type Handler = (req: IncomingMessage, res: ServerResponse) => void;

interface TestServer {
  url: string;
  requests: string[];
  close: () => Promise<void>;
}

let servers: TestServer[] = [];
async function startServer(handler: Handler): Promise<TestServer> {
  const requests: string[] = [];
  const server: Server = createServer((req, res) => {
    requests.push(req.url ?? "");
    handler(req, res);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  const ts: TestServer = {
    url: `http://127.0.0.1:${port}/r`,
    requests,
    close: () =>
      new Promise<void>((resolve) => {
        server.closeAllConnections();
        server.close(() => resolve());
      }),
  };
  servers.push(ts);
  return ts;
}

/** 원격 레지스트리 서버. override 로 특정 경로 응답을 바꿉니다 */
function registryHandler(files: Record<string, unknown>, override: Record<string, Handler> = {}): Handler {
  return (req, res) => {
    const name = (req.url ?? "").replace(/^\/r\//, "");
    if (override[name]) return override[name](req, res);
    if (name in files) {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify(files[name]));
      return;
    }
    res.writeHead(404, { "content-type": "text/html" });
    res.end("<!DOCTYPE html><html><body>404 Not Found</body></html>");
  };
}

/** 열었다 닫은 포트(접속 거부) */
async function refusedUrl(): Promise<string> {
  const s = await startServer(() => undefined);
  await s.close();
  servers = servers.filter((x) => x !== s);
  return s.url;
}

function collector() {
  const messages: string[] = [];
  return { messages, notify: (m: string) => messages.push(m) };
}

beforeEach(() => {
  tmpDirs = [];
  servers = [];
});

afterEach(async () => {
  for (const s of servers) await s.close();
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true });
});

// ── 조회 순서 ───────────────────────────────────────────

describe("resolveRegistryUrl (D1 순서)", () => {
  it("AXIS_REGISTRY_URL 이 config 보다 앞선다", () => {
    expect(
      resolveRegistryUrl({ env: { AXIS_REGISTRY_URL: "http://env/r" }, config: { registry: "http://cfg/r" } })
    ).toEqual({ url: "http://env/r", source: "env" });
  });

  it("env 가 비었거나 공백이면 config 의 registry", () => {
    expect(resolveRegistryUrl({ env: { AXIS_REGISTRY_URL: "  " }, config: { registry: "http://cfg/r" } })).toEqual({
      url: "http://cfg/r",
      source: "config",
    });
  });

  it("둘 다 없으면 기본값", () => {
    expect(resolveRegistryUrl({ env: {}, config: null })).toEqual({ url: DEFAULT_REGISTRY_URL, source: "default" });
    // D8: 기본 원격은 공개 base(pages.dev). axis.minu.best/r 는 Cloudflare 403 이라 바꿨습니다
    expect(DEFAULT_REGISTRY_URL).toBe("https://axis-design-system.pages.dev/r");
  });
});

describe("resolveRegistryUrl: 종전 기본값 이전 (D13)", () => {
  it("config 가 정확히 종전 기본값이면 새 기본값으로 읽고 원래 값을 남긴다", () => {
    expect(LEGACY_DEFAULT_REGISTRY_URL).toBe("https://axis.minu.best/r");
    expect(resolveRegistryUrl({ env: {}, config: { registry: "https://axis.minu.best/r" } })).toEqual({
      url: DEFAULT_REGISTRY_URL,
      source: "config",
      migratedFrom: "https://axis.minu.best/r",
    });
  });

  it("끝 슬래시 하나 차이는 같은 값으로 본다(앞뒤 공백은 종전처럼 무시)", () => {
    expect(resolveRegistryUrl({ env: {}, config: { registry: "https://axis.minu.best/r/" } })).toEqual({
      url: DEFAULT_REGISTRY_URL,
      source: "config",
      migratedFrom: "https://axis.minu.best/r/",
    });
    expect(resolveRegistryUrl({ env: {}, config: { registry: "  https://axis.minu.best/r  " } }).url).toBe(
      DEFAULT_REGISTRY_URL
    );
  });

  it.each([
    ["다른 경로 /rx", "https://axis.minu.best/rx"],
    ["다른 호스트", "https://mirror.example/r"],
    ["같은 호스트의 다른 스킴", "http://axis.minu.best/r"],
    ["하위 경로", "https://axis.minu.best/r/v2"],
  ])("사용자가 직접 지정한 다른 주소(%s)는 그대로 존중한다", (_label, registry) => {
    expect(resolveRegistryUrl({ env: {}, config: { registry } })).toEqual({ url: registry, source: "config" });
  });

  it("AXIS_REGISTRY_URL 이 있으면 그것이 우선이라 이전을 적용하지 않는다", () => {
    expect(
      resolveRegistryUrl({ env: { AXIS_REGISTRY_URL: "http://env/r" }, config: { registry: "https://axis.minu.best/r" } })
    ).toEqual({ url: "http://env/r", source: "env" });
    // 환경변수에 종전 기본값을 직접 주면 그 값을 그대로 씁니다(이전은 config 값에만)
    expect(
      resolveRegistryUrl({ env: { AXIS_REGISTRY_URL: "https://axis.minu.best/r" }, config: null })
    ).toEqual({ url: "https://axis.minu.best/r", source: "env" });
  });
});

describe("종전 기본값 판정: URL 정규화 비교 (D18)", () => {
  it.each([
    ["경로 끝 슬래시 둘", "https://axis.minu.best/r//"],
    ["경로 끝 슬래시 여럿", "https://axis.minu.best/r///"],
    ["대문자 스킴", "HTTPS://axis.minu.best/r"],
    ["대문자 호스트", "https://AXIS.Minu.BEST/r"],
    ["기본 포트 :443", "https://axis.minu.best:443/r"],
    ["기본 포트 :443 + 끝 슬래시", "https://axis.minu.best:443/r/"],
    ["앞뒤 공백", "  https://axis.minu.best/r  "],
    ["앞뒤 탭 · 줄바꿈", "\thttps://axis.minu.best/r/\n"],
  ])("%s(%j)는 종전 기본값으로 보고 새 기본값으로 이전", (_label, registry) => {
    expect(isLegacyDefaultRegistryUrl(registry)).toBe(true);
    const r = resolveRegistryUrl({ env: {}, config: { registry } });
    expect(r.url).toBe(DEFAULT_REGISTRY_URL);
    expect(r.migratedFrom).toBe(registry.trim());
  });

  it.each([
    ["다른 경로 /rx", "https://axis.minu.best/rx"],
    ["경로 대소문자 /R", "https://axis.minu.best/R"],
    ["하위 경로", "https://axis.minu.best/r/v2"],
    ["다른 호스트", "https://mirror.example/r"],
    ["호스트 접미 위장", "https://axis.minu.best.evil.example/r"],
    ["http 스킴(정규화 결과가 http://... 라 다름)", "http://axis.minu.best/r"],
    ["http 기본 포트 :80 도 스킴이 http 라 다름", "http://axis.minu.best:80/r"],
    ["https 에 :80(기본 포트가 아님)", "https://axis.minu.best:80/r"],
    ["다른 포트", "https://axis.minu.best:8443/r"],
    ["쿼리(조회에서도 거부)", "https://axis.minu.best/r?x=1"],
    ["해시(조회에서도 거부)", "https://axis.minu.best/r#x"],
    ["userinfo(조회에서도 거부)", "https://u:p@axis.minu.best/r"],
    ["중간 공백", "https://axis.minu.best/ r"],
    ["파싱 실패", "axis.minu.best/r"],
    ["빈 문자열", ""],
  ])("%s(%j)는 이전하지 않음", (_label, registry) => {
    expect(isLegacyDefaultRegistryUrl(registry)).toBe(false);
    const r = resolveRegistryUrl({ env: {}, config: { registry } });
    expect(r.migratedFrom).toBeUndefined();
  });

  it("두 판정이 같은 정규화를 쓴다: 이전 판정 == normalizeRegistryBaseUrl(앞뒤 공백 제거) 결과가 종전 기본값", () => {
    const samples = [
      "https://axis.minu.best/r//",
      "HTTPS://AXIS.MINU.BEST:443/r/",
      " https://axis.minu.best/r ",
      "https://axis.minu.best/rx",
      "http://axis.minu.best/r",
      "https://axis.minu.best/r?x",
      "nope",
    ];
    for (const raw of samples) {
      let normalized: string | null = null;
      try {
        normalized = normalizeRegistryBaseUrl(raw.trim());
      } catch {
        normalized = null;
      }
      expect(isLegacyDefaultRegistryUrl(raw), raw).toBe(normalized === LEGACY_DEFAULT_REGISTRY_URL);
    }
    // 양성 대조: 실제로 true 와 false 가 모두 나와야 함(한쪽만이면 대조가 빗나감)
    expect(samples.filter((x) => isLegacyDefaultRegistryUrl(x)).length).toBe(3);
  });

  it("normalizeRegistryBaseUrl 은 스킴 · 호스트 소문자, 스킴 기본 포트 제거, 경로 끝 / 모두 제거", () => {
    expect(normalizeRegistryBaseUrl("HTTPS://AXIS.Minu.Best:443/r//")).toBe("https://axis.minu.best/r");
    expect(normalizeRegistryBaseUrl("http://Mirror.Example:80/A/r/")).toBe("http://mirror.example/A/r");
    expect(normalizeRegistryBaseUrl("https://mirror.example:80/r")).toBe("https://mirror.example:80/r");
  });

  it("env 가 있으면 정규화상 종전 기본값이어도 이전하지 않음(D13 유지)", () => {
    expect(
      resolveRegistryUrl({ env: { AXIS_REGISTRY_URL: "http://env/r" }, config: { registry: "HTTPS://axis.minu.best:443/r//" } })
    ).toEqual({ url: "http://env/r", source: "env" });
    expect(LEGACY_REGISTRY_NOTICE).toContain(LEGACY_DEFAULT_REGISTRY_URL);
  });
});

describe("레지스트리 URL 의 쿼리 · 해시 가림 (p1)", () => {
  it("redactRegistryUrl: 파서가 userinfo 를 못 읽는 형태(숫자 비밀번호 + ? · #)도 @ 앞까지 가림", () => {
    expect(redactRegistryUrl("https://admin:12345?x@host/r")).toBe("https://***@host/r");
    expect(redactRegistryUrl("https://user:123#ss@host/r")).toBe("https://***@host/r");
    // 경로의 @ 는 authority 가 아니라 가리지 않습니다
    expect(redactRegistryUrl("https://host/r/@scope/x")).toBe("https://host/r/@scope/x");
  });

  it("redactRegistryUrl: 쿼리 · 해시 값을 ?*** · #*** 로", () => {
    expect(redactRegistryUrl("https://mirror.example/r?token=s3cret")).toBe("https://mirror.example/r?***");
    expect(redactRegistryUrl("https://mirror.example/r#s3cret")).toBe("https://mirror.example/r#***");
    expect(redactRegistryUrl("https://mirror.example/r?token=a&b=c#frag")).toBe("https://mirror.example/r?***#***");
    expect(redactRegistryUrl("https://mirror.example/r?")).toBe("https://mirror.example/r?***");
    // 해시 안의 ? 는 해시 값입니다
    expect(redactRegistryUrl("https://h/r#a?b")).toBe("https://h/r#***");
    // userinfo 와 함께
    expect(redactRegistryUrl("https://u:s3cret@h/r?token=t0ken")).toBe("https://***@h/r?***");
    // 비밀번호에 ? 가 있어도 비밀번호 앞부분이 남지 않음(userinfo 를 먼저 가림)
    const tricky = redactRegistryUrl("https://user:s3?cret@host.example/r");
    expect(tricky).not.toContain("s3");
    // 파싱 실패 · 다른 스킴도 가림
    expect(redactRegistryUrl("not a url?token=s3cret")).toBe("not a url?***");
    expect(redactRegistryUrl("ftp://h/r?token=s3cret#x")).toBe("ftp://h/r?***#***");
  });

  it("음성 대조: 쿼리 · 해시가 없으면 그대로", () => {
    expect(redactRegistryUrl("https://mirror.example:8443/a/r")).toBe("https://mirror.example:8443/a/r");
    expect(redactRegistryUrl("https://h/r/@scope")).toBe("https://h/r/@scope");
  });

  it("normalizeRegistryBaseUrl 오류 문구에 쿼리 · 해시 값이 찍히지 않음", () => {
    for (const raw of [
      "https://mirror.example/r?token=s3cret",
      "https://mirror.example/r#s3cret",
      "https://mirror.example/a b/r?token=s3cret",
      "ftp://mirror.example/r?token=s3cret",
      "nope?token=s3cret",
    ]) {
      let message = "";
      try {
        normalizeRegistryBaseUrl(raw);
      } catch (e) {
        message = (e as Error).message;
      }
      expect(message, raw).not.toBe("");
      expect(message, raw).not.toContain("s3cret");
    }
  });

  it("RegistryClient 폴백 안내에 쿼리 값이 찍히지 않음", async () => {
    const c = collector();
    const client = new RegistryClient({ url: "http://127.0.0.1:9/r?token=s3cret", bundledDir: writeBundled("1.0.0"), notify: c.notify });
    await client.getIndex();
    const all = c.messages.join("\n");
    expect(all).toContain("?***");
    expect(all).not.toContain("s3cret");
  });

  it("fetchRegistryJson 오류 문구의 URL 도 쿼리 · 해시를 가림", async () => {
    const fetchImpl = async () => ({ ok: false, status: 403, text: async () => "" });
    await expect(fetchRegistryJson("https://h/r/index.json?token=s3cret#x", { fetchImpl })).rejects.toThrow(
      "https://h/r/index.json?***#***: HTTP 403"
    );
    const okHtml = async () => ({ ok: true, status: 200, text: async () => "<html>" });
    let message = "";
    try {
      await fetchRegistryJson("https://h/r/index.json?token=s3cret", { fetchImpl: okHtml });
    } catch (e) {
      message = (e as Error).message;
    }
    expect(message).not.toBe("");
    expect(message).not.toContain("s3cret");
  });

  it("의존 URL 검증 오류 문구의 쿼리 값도 가림", () => {
    let message = "";
    try {
      validateRegistryItem(
        {
          name: "button",
          type: "registry:ui",
          registryDependencies: ["https://axis-design-system.pages.dev/r/utils.json?token=s3cret"],
          files: [{ path: "components/ui/button.tsx", content: "x" }],
        },
        "button"
      );
    } catch (e) {
      message = (e as Error).message;
    }
    expect(message).toContain("registryDependencies");
    expect(message).toContain("?***");
    expect(message).not.toContain("s3cret");
  });
});

describe("normalizeRegistryBaseUrl: G1 과 같은 거부 기준 (n4)", () => {
  it.each([
    ["userinfo(사용자:비밀번호)", "https://u:secret@mirror.example/r", /userinfo/],
    ["userinfo(사용자만)", "https://u@mirror.example/r", /userinfo/],
    ["공백", "https://mirror.example/a b/r", /공백/],
    ["쿼리", "https://mirror.example/r?token=1", /쿼리/],
    ["빈 쿼리", "https://mirror.example/r?", /쿼리/],
    ["해시", "https://mirror.example/r#x", /해시/],
    ["스킴", "ftp://mirror.example/r", /http · https/],
  ])("%s 는 거부", (_label, raw, pattern) => {
    expect(() => normalizeRegistryBaseUrl(raw)).toThrow(pattern);
  });

  it("오류 문구의 URL 은 userinfo 를 가린다", () => {
    let message = "";
    try {
      normalizeRegistryBaseUrl("https://u:secret@mirror.example/r");
    } catch (e) {
      message = (e as Error).message;
    }
    expect(message).toContain("https://***@mirror.example/r");
    expect(message).not.toContain("secret");
    expect(message).not.toContain("u:");
    // 쿼리 · 공백 사유로 먼저 거부돼도 userinfo 는 가린다
    let message2 = "";
    try {
      normalizeRegistryBaseUrl("https://u:secret@mirror.example/r?x=1");
    } catch (e) {
      message2 = (e as Error).message;
    }
    expect(message2).toContain("***@");
    expect(message2).not.toContain("secret");
  });

  it("양성 대조: 포트 · 하위 경로가 있는 정상 URL 은 받고 끝 / 를 뗀다", () => {
    expect(normalizeRegistryBaseUrl("https://mirror.example:8443/a/r/")).toBe("https://mirror.example:8443/a/r");
    expect(normalizeRegistryBaseUrl("http://127.0.0.1:8080/r")).toBe("http://127.0.0.1:8080/r");
  });

  it("redactRegistryUrl: userinfo 만 가리고 나머지는 그대로", () => {
    expect(redactRegistryUrl("https://a:b@h/r")).toBe("https://***@h/r");
    expect(redactRegistryUrl("https://a:p@ss@h/r")).toBe("https://***@h/r");
    expect(redactRegistryUrl("https://h/r/@scope")).toBe("https://h/r/@scope");
    expect(redactRegistryUrl("not a url")).toBe("not a url");
  });

  it("redactRegistryUrl: `스킴://` 가 아닌 userinfo 형태와 슬래시 비밀번호도 가린다(n4 보강)", () => {
    const leaky = [
      "https:/user:s3cret@host.example/r",
      "https:\\\\user:s3cret@host.example/r",
      "https:user:s3cret@host.example/r",
      "HTTPS://user:s3cret@host.example/r",
      " https://user:s3cret@host.example/r",
      "https://user:pa/ss3cret@host.example/r",
      "https://user:s3cret@ho st/r",
    ];
    for (const raw of leaky) {
      const shown = redactRegistryUrl(raw);
      expect(shown, raw).not.toContain("s3cret");
      expect(shown, raw).toContain("***@");
      // 오류 문구(형식 · userinfo · 공백)에도 원문 비밀번호가 찍히지 않는다
      let message = "";
      try {
        normalizeRegistryBaseUrl(raw);
      } catch (e) {
        message = (e as Error).message;
      }
      expect(message, raw).not.toBe("");
      expect(message, raw).not.toContain("s3cret");
    }
    // 정규화 결과 확인(파서가 읽은 주소로 찍는다)
    expect(redactRegistryUrl("https:/user:s3cret@host.example/r")).toBe("https://***@host.example/r");
    expect(redactRegistryUrl("https://user:pa/ss3cret@host.example/r")).toBe("https://***@host.example/r");
  });

  it("RegistryClient 폴백 안내에도 비 표준 userinfo 형태의 비밀번호가 찍히지 않는다(n4 보강)", async () => {
    for (const raw of ["https:/user:s3cret@127.0.0.1:9/r", "https:user:s3cret@127.0.0.1:9/r"]) {
      const c = collector();
      const client = new RegistryClient({ url: raw, bundledDir: writeBundled("1.0.0"), notify: c.notify });
      const index = await client.getIndex();
      expect(index.items.length).toBeGreaterThan(0);
      const all = c.messages.join("\n");
      expect(all, raw).toContain("***@");
      expect(all, raw).not.toContain("s3cret");
    }
  });
});

// ── 원격 정상 ───────────────────────────────────────────

describe("원격 정상", () => {
  it("원격 index · 항목을 쓰고, version 이 같으면 안내가 없다", async () => {
    const remote = await startServer(registryHandler(makeRegistry("1.0.0", "remote")));
    const c = collector();
    const client = new RegistryClient({ url: remote.url, bundledDir: writeBundled("1.0.0"), notify: c.notify });

    const index = await client.getIndex();
    const item = await client.getItem("button");

    expect(client.origin).toBe("remote");
    expect(index.items.map((i) => i.name)).toEqual(["utils", "button"]);
    expect(item.files[0].content).toBe("// button remote\n");
    expect(item.registryDependencies).toEqual(["utils"]);
    expect(remote.requests).toEqual(["/r/index.json", "/r/button.json"]);
    expect(c.messages).toEqual([]);
  });

  it("URL 끝 / 를 떼고 요청한다", async () => {
    const remote = await startServer(registryHandler(makeRegistry("1.0.0", "remote")));
    const client = new RegistryClient({ url: `${remote.url}/`, bundledDir: null, notify: () => undefined });
    await client.getItem("button");
    expect(remote.requests).toEqual(["/r/index.json", "/r/button.json"]);
  });

  it("원격과 동봉본 version 이 다르면 한 번 알리고 원격을 쓴다", async () => {
    const remote = await startServer(registryHandler(makeRegistry("2.0.0", "remote")));
    const c = collector();
    const client = new RegistryClient({ url: remote.url, bundledDir: writeBundled("1.0.0"), notify: c.notify });

    await client.getItem("button");
    const utils = await client.getItem("utils");

    expect(client.origin).toBe("remote");
    expect(utils.files[0].content).toBe("// utils remote\n");
    expect(c.messages).toHaveLength(1);
    expect(c.messages[0]).toContain("version 2.0.0");
    expect(c.messages[0]).toContain("version 1.0.0");
    // 항목 조회가 뒤에 실패하면 동봉본으로 바뀔 수 있으므로 「원격을 사용합니다」로 단정하지 않습니다
    expect(c.messages[0]).toContain("원격 레지스트리를 우선 사용합니다");
  });

  it("Content-Type 이 text/html 이어도 본문이 올바른 JSON 이면 원격을 쓴다(판정은 본문으로)", async () => {
    const files = makeRegistry("1.0.0", "remote");
    const remote = await startServer((req, res) => {
      const name = (req.url ?? "").replace(/^\/r\//, "");
      res.writeHead(200, { "content-type": "text/html" });
      res.end(JSON.stringify(files[name]));
    });
    const c = collector();
    const client = new RegistryClient({ url: remote.url, bundledDir: writeBundled("1.0.0"), notify: c.notify });
    const item = await client.getItem("button");
    expect(client.origin).toBe("remote");
    expect(item.files[0].content).toBe("// button remote\n");
    expect(c.messages).toEqual([]);
  });
});

// ── 폴백 ────────────────────────────────────────────────

describe("동봉본 폴백", () => {
  const ACCESS_LEAD = "원격 레지스트리에 접근하지 못해 CLI 에 포함된 레지스트리(version 1.0.0)를 사용합니다";
  const INVALID_LEAD = "원격 레지스트리 응답이 형식 검증을 통과하지 못해 CLI 에 포함된 레지스트리(version 1.0.0)를 사용합니다";

  /** kind: 안내 문구 종류(m1). access 는 원격에 닿지 못한 실패, invalid 는 응답 내용이 검증을 통과하지 못한 실패 */
  async function expectBundledFallback(
    url: string,
    options: { timeoutMs?: number; kind?: "access" | "invalid" } = {}
  ) {
    const { kind = "access", ...clientOptions } = options;
    const c = collector();
    const client = new RegistryClient({ url, bundledDir: writeBundled("1.0.0"), notify: c.notify, ...clientOptions });

    const button = await client.getItem("button");
    const utils = await client.getItem("utils");

    expect(client.origin).toBe("bundled");
    expect(button.files[0].content).toBe("// button bundled\n");
    expect(utils.files[0].content).toBe("// utils bundled\n");
    // 안내는 실행마다 한 번이고, 접근 실패와 형식 검증 실패를 문구로 가른다(m1)
    expect(c.messages).toHaveLength(1);
    expect(c.messages[0]).toContain(kind === "invalid" ? INVALID_LEAD : ACCESS_LEAD);
    expect(c.messages[0]).not.toContain(kind === "invalid" ? ACCESS_LEAD : INVALID_LEAD);
    return c.messages[0];
  }

  it("접속 거부", async () => {
    const msg = await expectBundledFallback(await refusedUrl());
    expect(msg).toContain("ECONNREFUSED");
  });

  it("404 에 HTML 을 주면 동봉본", async () => {
    const remote = await startServer(registryHandler({}));
    const msg = await expectBundledFallback(remote.url);
    expect(msg).toContain("HTTP 404");
    expect(remote.requests).toEqual(["/r/index.json"]);
  });

  it("200 인데 본문이 HTML 이면(Content-Type 이 json 이어도) 파싱 단계에서 실패해 동봉본", async () => {
    const remote = await startServer((_req, res) => {
      res.writeHead(200, { "content-type": "application/json" });
      res.end("<!DOCTYPE html><title>Attention Required! | Cloudflare</title>");
    });
    const msg = await expectBundledFallback(remote.url, { kind: "invalid" });
    expect(msg).toContain("JSON 이 아닙니다");
  });

  it("403 이면 동봉본", async () => {
    const remote = await startServer((_req, res) => {
      res.writeHead(403, { "content-type": "text/html" });
      res.end("<html>Attention Required</html>");
    });
    const msg = await expectBundledFallback(remote.url);
    expect(msg).toContain("HTTP 403");
  });

  it("타임아웃(응답하지 않는 서버)이면 짧은 시간 안에 동봉본", async () => {
    const remote = await startServer(() => undefined);
    const started = Date.now();
    const msg = await expectBundledFallback(remote.url, { timeoutMs: 200 });
    expect(Date.now() - started).toBeLessThan(3000);
    expect(msg).toContain("200ms 안에 응답이 없습니다");
  });

  it("index 스키마 불일치(type 없음)면 동봉본", async () => {
    const remote = await startServer(
      registryHandler({ "index.json": { version: "1.0.0", items: [{ name: "button" }] } })
    );
    const msg = await expectBundledFallback(remote.url, { kind: "invalid" });
    expect(msg).toContain("type 이 registry:* 형식이 아닙니다");
  });

  it("index 의 version 누락이면 동봉본", async () => {
    const remote = await startServer(registryHandler({ "index.json": { items: [] } }));
    const msg = await expectBundledFallback(remote.url, { kind: "invalid" });
    expect(msg).toContain("version 이 없습니다");
  });

  it("항목 스키마 불일치(files[].content 없음)면 그 뒤로 동봉본만 쓴다", async () => {
    const files = makeRegistry("1.0.0", "remote");
    const broken = { ...(files["button.json"] as object), files: [{ path: "components/ui/button.tsx" }] };
    const remote = await startServer(registryHandler({ ...files, "button.json": broken }));
    const msg = await expectBundledFallback(remote.url, { kind: "invalid" });
    expect(msg).toContain("content 가 문자열이 아닙니다");
    // utils 는 원격에서 정상이지만, 한 번 폴백한 뒤로는 원격을 다시 부르지 않는다
    expect(remote.requests).toEqual(["/r/index.json", "/r/button.json"]);
  });

  it("동시에 조회한 항목이 함께 실패해도 안내는 한 번", async () => {
    const files = makeRegistry("1.0.0", "remote");
    const fail500: Handler = (_req, res) => {
      res.writeHead(500);
      res.end("error");
    };
    const remote = await startServer(registryHandler(files, { "button.json": fail500, "utils.json": fail500 }));
    const c = collector();
    const client = new RegistryClient({ url: remote.url, bundledDir: writeBundled("1.0.0"), notify: c.notify });
    await client.getIndex();
    const [button, utils] = await Promise.all([client.getItem("button"), client.getItem("utils")]);
    expect(button.files[0].content).toBe("// button bundled\n");
    expect(utils.files[0].content).toBe("// utils bundled\n");
    expect(c.messages).toHaveLength(1);
    expect(c.messages[0]).toContain("HTTP 500");
  });

  it.each([
    ["셸 구분자", "evil; echo pwned"],
    ["범위 안의 셸 연산자", "a@^1 && x"],
    ["명령 치환", "a@$(id)"],
    ["백틱", "a@`id`"],
    ["따옴표", 'a@"1"'],
  ])("dependencies 에 패키지 이름 규칙 밖 값(%s)이 있으면 동봉본", async (_label, bad) => {
    const files = makeRegistry("1.0.0", "remote");
    const evil = { ...(files["button.json"] as object), dependencies: ["clsx", bad] };
    const remote = await startServer(registryHandler({ ...files, "button.json": evil }));
    const msg = await expectBundledFallback(remote.url, { kind: "invalid" });
    expect(msg).toContain("패키지 이름 규칙에 맞지 않는 값");
  });

  it("양성 대조: 범위가 붙은 정상 dependencies 는 원격을 쓴다", async () => {
    const files = makeRegistry("1.0.0", "remote");
    const deps = ["clsx", "@radix-ui/react-slot", "tailwind-merge@^3.4.0", "react-day-picker@>=8.10 <10", "x@1.x || 2.x"];
    const ok = { ...(files["button.json"] as object), dependencies: deps };
    const remote = await startServer(registryHandler({ ...files, "button.json": ok }));
    const c = collector();
    const client = new RegistryClient({ url: remote.url, bundledDir: writeBundled("1.0.0"), notify: c.notify });
    const button = await client.getItem("button");
    expect(client.origin).toBe("remote");
    expect(button.dependencies).toEqual(deps);
    expect(c.messages).toEqual([]);
  });

  it("항목 name 이 요청과 다르면 동봉본", async () => {
    const files = makeRegistry("1.0.0", "remote");
    const remote = await startServer(registryHandler({ ...files, "button.json": files["utils.json"] }));
    const msg = await expectBundledFallback(remote.url, { kind: "invalid" });
    expect(msg).toContain("name 이 'button' 가 아닙니다");
  });

  it("content 가 index 의 sha256 과 다르면 동봉본", async () => {
    const files = makeRegistry("1.0.0", "remote");
    const tampered = makeItem("button", "// 바뀐 내용\n", { registryDependencies: ["utils"] });
    const remote = await startServer(registryHandler({ ...files, "button.json": tampered }));
    const msg = await expectBundledFallback(remote.url, { kind: "invalid" });
    expect(msg).toContain("sha256");
  });

  it("index 에 sha256 이 있는데 files 가 2개 이상이면(대조 우회) 동봉본", async () => {
    const files = makeRegistry("1.0.0", "remote");
    const base = makeItem("button", "// button remote\n", { registryDependencies: ["utils"] });
    const tampered = {
      ...base,
      files: [
        { path: "components/ui/button.tsx", type: "registry:ui", content: "// TAMPERED\n// button remote\n" },
        { path: "components/ui/extra.tsx", type: "registry:ui", content: "export {};\n" },
      ],
    };
    const remote = await startServer(registryHandler({ ...files, "button.json": tampered }));
    const msg = await expectBundledFallback(remote.url, { kind: "invalid" });
    expect(msg).toContain("sha256");
  });

  it("URL 형식이 아니면 네트워크 없이 동봉본", async () => {
    const msg = await expectBundledFallback("not-a-url");
    expect(msg).toContain("레지스트리 URL 형식이 아닙니다");
  });

  it("userinfo 가 든 URL 은 요청하지 않고 접근 실패 문구로 동봉본, 안내에 비밀번호가 찍히지 않는다(n4)", async () => {
    const remote = await startServer(registryHandler(makeRegistry("1.0.0", "remote")));
    const withUserinfo = remote.url.replace("http://", "http://user:secret@");
    const msg = await expectBundledFallback(withUserinfo);
    expect(msg).toContain("userinfo");
    expect(msg).toContain("http://***@127.0.0.1");
    expect(msg).not.toContain("secret");
    expect(remote.requests).toEqual([]);
  });

  it.each([
    ["공백", (u: string) => `${u} x`, "공백"],
    ["쿼리", (u: string) => `${u}?token=1`, "쿼리"],
    ["해시", (u: string) => `${u}#a`, "해시"],
  ])("%s 가 든 URL 은 요청하지 않고 접근 실패 문구로 동봉본(n4)", async (_label, make, reason) => {
    const remote = await startServer(registryHandler(makeRegistry("1.0.0", "remote")));
    const msg = await expectBundledFallback(make(remote.url));
    expect(msg).toContain(reason);
    expect(remote.requests).toEqual([]);
  });

  it("양성 대조: 같은 서버를 정상 URL 로 주면 원격을 쓴다", async () => {
    const remote = await startServer(registryHandler(makeRegistry("1.0.0", "remote")));
    const client = new RegistryClient({ url: remote.url, bundledDir: writeBundled("1.0.0"), notify: () => undefined });
    expect((await client.getItem("button")).files[0].content).toBe("// button remote\n");
    expect(client.origin).toBe("remote");
    expect(remote.requests.length).toBeGreaterThan(0);
  });

  it("원격 · 동봉본 둘 다 실패하면 unavailable", async () => {
    const client = new RegistryClient({ url: await refusedUrl(), bundledDir: null, notify: () => undefined });
    const err = await client.getItem("button").catch((e: unknown) => e);
    expect(err).toBeInstanceOf(RegistryError);
    expect((err as RegistryError).code).toBe("unavailable");
  });
});

// ── 이름 검사 · 없는 항목 ────────────────────────────────

describe("slug 검사와 없는 항목", () => {
  it.each(["../etc/passwd", "Button", "a/b", "", "button.json", "-button", "button-", "a--b", "x".repeat(65)])(
    "'%s' 는 네트워크 · 파일 접근 없이 invalid-name",
    async (name) => {
      const remote = await startServer(registryHandler(makeRegistry("1.0.0", "remote")));
      const client = new RegistryClient({ url: remote.url, bundledDir: writeBundled("1.0.0"), notify: () => undefined });
      const err = await client.getItem(name).catch((e: unknown) => e);
      expect(err).toBeInstanceOf(RegistryError);
      expect((err as RegistryError).code).toBe("invalid-name");
      expect(remote.requests).toEqual([]);
    }
  );

  it("양성 대조: 규칙에 맞는 이름은 통과한다", () => {
    for (const name of ["button", "agentic-run-progress", "agentic-a11y-labels", "utils"]) {
      expect(isValidRegistryName(name)).toBe(true);
    }
  });

  it("index 에 없는 이름은 not-found 이고 폴백하지 않는다", async () => {
    const remote = await startServer(registryHandler(makeRegistry("1.0.0", "remote")));
    const c = collector();
    const client = new RegistryClient({ url: remote.url, bundledDir: writeBundled("1.0.0"), notify: c.notify });
    const err = await client.getItem("no-such-item").catch((e: unknown) => e);
    expect((err as RegistryError).code).toBe("not-found");
    expect(client.origin).toBe("remote");
    expect(c.messages).toEqual([]);
    expect(remote.requests).toEqual(["/r/index.json"]);
  });
});

// ── 실제 레지스트리(동봉본 원본) ──────────────────────────

describe("실제 레지스트리 apps/web/public/r", () => {
  const realDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../apps/web/public/r");

  it("index 의 모든 항목이 스키마 · sha256 검증을 통과한다", async () => {
    const c = collector();
    const client = new RegistryClient({ url: null, bundledDir: realDir, notify: c.notify });
    const index = await client.getIndex();
    // 측정 대조: 항목이 0개면 아래 루프가 아무것도 검사하지 않으므로 먼저 막는다
    expect(index.items.length).toBeGreaterThanOrEqual(28);
    const names = new Set(index.items.map((i) => i.name));
    let depCount = 0;
    for (const entry of index.items) {
      const item = await client.getItem(entry.name);
      expect(item.name).toBe(entry.name);
      expect(entry.sha256).toBe(sha256Hex(item.files[0].content));
      // D5: 파일의 URL 형태 registryDependencies 가 같은 레지스트리의 이름으로 풀린다
      for (const dep of item.registryDependencies) {
        depCount++;
        expect(names.has(dep), `${entry.name} -> ${dep}`).toBe(true);
      }
    }
    // 측정 대조: 의존이 하나도 없으면 위 검사는 비어 있다
    expect(depCount).toBeGreaterThan(0);
    expect(client.origin).toBe("bundled");
    expect(c.messages).toEqual([bundledFallbackMessage(index.version, "원격 레지스트리 URL 이 지정되지 않았습니다")]);
  });
});

// ── registryDependencies 형태(D5) ─────────────────────────

describe("registryDependencies URL 형태 (WI-0045 D5 · D11)", () => {
  const PUBLIC = "https://axis-design-system.pages.dev/r";
  const item = (deps: unknown[]) => ({
    name: "button",
    type: "registry:ui",
    registryDependencies: deps,
    files: [{ path: "components/ui/button.tsx", content: "x" }],
  });

  it("공개 기본 base 의 <base>/<이름>.json 은 이름으로, 접두 없는 이름은 그대로(하위 호환)", () => {
    const v = validateRegistryItem(item([`${PUBLIC}/utils.json`, `${PUBLIC}/agentic-a11y-labels.json`, "card"]), "button");
    expect(v.registryDependencies).toEqual(["utils", "agentic-a11y-labels", "card"]);
  });

  it("받는 base 를 넘기면 그 base(지금 조회 중인 원격)도 받고, 같은 이름은 한 번만", () => {
    const local = "http://127.0.0.1:4000/r";
    const v = validateRegistryItem(
      item([`${local}/utils.json`, `${PUBLIC}/utils.json`, "utils", `${local}/agentic-a11y-labels.json`]),
      "button",
      "button.json",
      [local, PUBLIC]
    );
    expect(v.registryDependencies).toEqual(["utils", "agentic-a11y-labels"]);
    // base 끝의 / 는 같은 base 로 본다
    expect(registryDependencyName(`${local}/utils.json`, [`${local}/`])).toBe("utils");
  });

  it("기본(공개 base 만)에서는 다른 원격 base 의 URL 을 받지 않는다", () => {
    expect(registryDependencyName("http://127.0.0.1:4000/r/utils.json")).toBeNull();
  });

  it.each([
    ["@ns 형태", "@axis/utils"],
    ["상대 경로", "./utils.json"],
    ["상위 상대 경로", "../r/utils.json"],
    ["다른 확장자", `${PUBLIC}/utils.js`],
    ["확장자 없는 URL", `${PUBLIC}/utils`],
    ["slug 위반 이름", `${PUBLIC}/Utils.json`],
    ["밑줄 이름", `${PUBLIC}/my_utils.json`],
    ["쿼리 붙은 URL", `${PUBLIC}/utils.json?v=1`],
    ["해시 붙은 URL", `${PUBLIC}/utils.json#x`],
    ["http 가 아닌 스킴", "file:///tmp/r/utils.json"],
    ["슬래시 포함 이름", "a/b"],
    ["다른 호스트(종전 기본 원격)", "https://axis.minu.best/r/utils.json"],
    ["다른 호스트", "https://elsewhere.example/r/utils.json"],
    ["같은 호스트 다른 경로", "https://axis-design-system.pages.dev/other/utils.json"],
    ["base 아래 하위 경로", `${PUBLIC}/sub/utils.json`],
    ["base 를 접두로 가진 다른 경로", "https://axis-design-system.pages.dev/rr/utils.json"],
    ["호스트 접미 위장", "https://axis-design-system.pages.dev.evil.example/r/utils.json"],
    ["userinfo", "https://user@axis-design-system.pages.dev/r/utils.json"],
    ["userinfo(비밀번호)", "https://u:p@axis-design-system.pages.dev/r/utils.json"],
    ["앞 공백", ` ${PUBLIC}/utils.json`],
    ["뒤 공백", `${PUBLIC}/utils.json `],
    ["중간 공백", `${PUBLIC}/ut ils.json`],
    ["탭", `${PUBLIC}/utils.json\t`],
    ["대문자 호스트(문자열 접두 비교)", "https://AXIS-design-system.pages.dev/r/utils.json"],
  ])("%s(%s)는 항목 검증 실패", (_label, dep) => {
    expect(() => validateRegistryItem(item([dep]), "button")).toThrow(/registryDependencies/);
    expect(registryDependencyName(dep)).toBeNull();
  });

  it("원격 항목: 지금 조회 중인 원격 base 의 URL 의존을 그 원격에서 이름으로 따라간다", async () => {
    const files = makeRegistry("1.0.0", "remote");
    const remote = await startServer(registryHandler(files));
    (files["button.json"] as { registryDependencies: string[] }).registryDependencies = [`${remote.url}/utils.json`];
    const c = collector();
    const client = new RegistryClient({ url: remote.url, bundledDir: writeBundled("1.0.0"), notify: c.notify });
    const button = await client.getItem("button");
    expect(button.registryDependencies).toEqual(["utils"]);
    const utils = await client.getItem(button.registryDependencies[0]);
    expect(utils.files[0].content).toBe("// utils remote\n");
    expect(remote.requests).toEqual(["/r/index.json", "/r/button.json", "/r/utils.json"]);
    expect(client.origin).toBe("remote");
    expect(c.messages).toEqual([]);
  });

  it("원격 항목: 공개 기본 base 의 URL 의존도 받아 지금 읽는 원격에서 찾는다(다른 호스트로 요청하지 않음)", async () => {
    const files = makeRegistry("1.0.0", "remote");
    (files["button.json"] as { registryDependencies: string[] }).registryDependencies = [`${PUBLIC}/utils.json`];
    const remote = await startServer(registryHandler(files));
    const c = collector();
    const client = new RegistryClient({ url: remote.url, bundledDir: writeBundled("1.0.0"), notify: c.notify });
    const button = await client.getItem("button");
    expect(button.registryDependencies).toEqual(["utils"]);
    expect(client.origin).toBe("remote");
    expect(c.messages).toEqual([]);
  });

  it("원격 항목: 다른 호스트의 URL 의존은 형식 검증 실패로 동봉본에 폴백하고 그 호스트에 요청하지 않는다", async () => {
    const files = makeRegistry("1.0.0", "remote");
    (files["button.json"] as { registryDependencies: string[] }).registryDependencies = [
      "https://elsewhere.example/r/utils.json",
    ];
    const remote = await startServer(registryHandler(files));
    const c = collector();
    const client = new RegistryClient({ url: remote.url, bundledDir: writeBundled("1.0.0"), notify: c.notify });
    const button = await client.getItem("button");
    expect(client.origin).toBe("bundled");
    expect(button.files[0].content).toBe("// button bundled\n");
    expect(remote.requests).toEqual(["/r/index.json", "/r/button.json"]);
    expect(c.messages).toHaveLength(1);
    expect(c.messages[0]).toContain("형식 검증을 통과하지 못해");
    expect(c.messages[0]).toContain("elsewhere.example");
  });

  it("동봉본: 공개 기본 base 는 받고, 다른 base(조회하려던 원격 포함)의 URL 은 거부한다", async () => {
    // 조회하려던 원격은 접속 거부(닫은 포트)라 동봉본으로 넘어갑니다
    const remoteBase = await refusedUrl();
    const ok = writeBundled("1.0.0");
    const okButton = JSON.parse(readFileSync(path.join(ok, "button.json"), "utf8"));
    okButton.registryDependencies = [`${PUBLIC}/utils.json`];
    writeFileSync(path.join(ok, "button.json"), JSON.stringify(okButton));
    const good = new RegistryClient({ url: null, bundledDir: ok, notify: () => undefined });
    expect((await good.getItem("button")).registryDependencies).toEqual(["utils"]);

    const bad = writeBundled("1.0.0");
    const badButton = JSON.parse(readFileSync(path.join(bad, "button.json"), "utf8"));
    badButton.registryDependencies = [`${remoteBase}/utils.json`];
    writeFileSync(path.join(bad, "button.json"), JSON.stringify(badButton));
    const client = new RegistryClient({ url: remoteBase, bundledDir: bad, notify: () => undefined, timeoutMs: 200 });
    const err = await client.getItem("button").catch((e: unknown) => e);
    expect(err).toBeInstanceOf(RegistryError);
    expect((err as RegistryError).message).toContain("registryDependencies");
  });
});

// ── index.json 이름 중복(M3) ─────────────────────────────

describe("index.json 검증", () => {
  const entry = (name: string) => ({ name, type: "registry:ui" });

  it("양성 대조: 이름이 모두 다르면 통과", () => {
    expect(validateRegistryIndex({ version: "1.0.0", items: [entry("a"), entry("b")] }).items).toHaveLength(2);
  });

  it("이름이 중복이면 거부", () => {
    expect(() => validateRegistryIndex({ version: "1.0.0", items: [entry("a"), entry("b"), entry("a")] })).toThrow(
      /'a' 가 중복/
    );
  });

  it("원격 index 에 이름 중복이 있으면 동봉본으로 폴백", async () => {
    const files = makeRegistry("1.0.0", "remote");
    const index = files["index.json"] as { items: unknown[] };
    index.items = [...index.items, index.items[1]];
    const remote = await startServer(registryHandler(files));
    const c = collector();
    const client = new RegistryClient({ url: remote.url, bundledDir: writeBundled("1.0.0"), notify: c.notify });
    await client.getIndex();
    expect(client.origin).toBe("bundled");
    expect(c.messages).toHaveLength(1);
    expect(c.messages[0]).toContain("중복");
  });
});
