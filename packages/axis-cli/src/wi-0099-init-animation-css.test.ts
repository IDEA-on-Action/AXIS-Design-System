/**
 * WI-0099: init 의 Tailwind 4 애니메이션 안내가 axis check 와 같은 전역 CSS 줄 판정을 씀(S9 · 사용자 결정 Q140 ~ Q144, 권장안으로 진행).
 *
 * 착수 측정(main b1912a5): 줄이 가리키는 패키지와 설치본이 다르면(S9) init 은 침묵하고 check 는 WARN 이었어요. 줄은 없는데 패키지가
 * 설치돼 있어도 init 은 침묵 · check 는 WARN, 줄이 tailwindcss-animate 인데 아무것도 없으면 init 은 tw-animate-css 를 안내해 따라 해도
 * check 가 WARN 으로 남았어요. 이 파일은 측정 표의 대표 칸마다 「init 안내 = check 판정」(init 침묵 ⇔ check PASS)과 문구를 고정해요.
 * registry-core 에는 테스트 러너가 없어서 공용 판정(`inspectTailwind4Animation`)도 여기서 봐요.
 */
import { describe, it, expect, afterEach } from "vitest";
import fs from "fs-extra";
import os from "os";
import path from "path";
import { checkAnimationPlugin, inspectTailwind4Animation } from "@axis-ds/registry-core/tailwind-core";
import { animationGuideLine, resolveInitAnswers, runInit } from "./init/init.js";

const TWA = "tw-animate-css";
const TCA = "tailwindcss-animate";
const REGISTRY = "https://axis-design-system.pages.dev/r";
const VERSION: Record<string, string> = { [TWA]: "1.4.0", [TCA]: "1.0.7" };
const LINE: Record<string, string> = { [TWA]: `@import "${TWA}";`, [TCA]: `@plugin "${TCA}";` };

const created: string[] = [];
afterEach(async () => {
  process.exitCode = undefined;
  for (const dir of created.splice(0)) await fs.remove(dir);
});

interface Fx {
  /** 애니메이션 패키지 선언 위치 */
  decl?: "app" | "root";
  /** 전역 CSS 의 애니메이션 줄(없으면 줄 없음). `css: false` 면 CSS 파일 자체가 없음 */
  lines?: string[];
  css?: boolean;
  /** 선언 + 설치 */
  installed?: string[];
  /** 선언만(설치본 없음) */
  declaredOnly?: string[];
  pnp?: boolean;
  /** 줄을 상대 @import 하위 파일(app/anim.css)에 둠(WI-0100b) */
  viaImport?: boolean;
}

/**
 * Tailwind 4 앱(`@axis-ds/ui-react` 선언 · 설치, tailwindcss 4.1.14 설치본)을 만들고 앱 경로를 돌려줘요. `.git` 으로 상위 탐색을 막아요.
 * npm(`package-lock.json`)이고, `pnp` 면 yarn.lock + `.pnp.cjs`. `decl: "root"` 면 workspaces 루트 아래 apps/web 이에요.
 */
async function fx(f: Fx): Promise<string> {
  const root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), "axis-wi0099-")));
  created.push(root);
  await fs.ensureDir(path.join(root, ".git"));
  if (f.pnp) {
    await fs.writeFile(path.join(root, "yarn.lock"), "");
    await fs.writeFile(path.join(root, ".pnp.cjs"), "");
  } else {
    await fs.writeFile(path.join(root, "package-lock.json"), "{}");
  }
  const anim = Object.fromEntries([...(f.installed ?? []), ...(f.declaredOnly ?? [])].map((n) => [n, `^${VERSION[n]}`]));
  const base = {
    "@axis-ds/tokens": "^1.8.0",
    "@axis-ds/ui-react": "^1.8.0",
    tailwindcss: "^4.1.0",
    clsx: "^2.1.1",
    "tailwind-merge": "^3.3.1",
  };
  let app = root;
  if (f.decl === "root") {
    app = path.join(root, "apps", "web");
    await fs.writeJSON(path.join(root, "package.json"), { name: "root", private: true, workspaces: ["apps/*"], dependencies: anim });
    await fs.outputJSON(path.join(app, "package.json"), { name: "web", private: true, dependencies: base });
  } else {
    await fs.writeJSON(path.join(root, "package.json"), { name: "app", private: true, dependencies: { ...base, ...anim } });
  }
  const installed: [string, string][] = [
    ["tailwindcss", "4.1.14"],
    ["clsx", "2.1.1"],
    ["tailwind-merge", "3.3.1"],
    ["@axis-ds/tokens", "1.8.2"],
    ["@axis-ds/ui-react", "1.8.2"],
    ...(f.installed ?? []).map((n): [string, string] => [n, VERSION[n]]),
  ];
  for (const [name, version] of installed) await fs.outputJSON(path.join(root, "node_modules", name, "package.json"), { name, version });
  if (f.css !== false) {
    const anim = (f.lines ?? []).map((n) => LINE[n]);
    const head = ['@import "tailwindcss";', '@import "@axis-ds/tokens/css/tailwind4";', '@import "@axis-ds/ui-react/tailwind.css";'];
    if (f.viaImport) {
      await fs.outputFile(path.join(app, "app", "anim.css"), `${anim.join("\n")}\n`);
      await fs.outputFile(path.join(app, "app", "globals.css"), `${[...head, '@import "./anim.css";'].join("\n")}\n`);
    } else {
      await fs.outputFile(path.join(app, "app", "globals.css"), `${[...head, ...anim].join("\n")}\n`);
    }
  }
  return app;
}

/** `axis init -y` 와 같은 경로(경로 탐색 → 설정 · utils 쓰기 → 안내)로 돌리고 애니메이션 줄만 돌려줘요(없으면 `undefined`) */
async function initAnimation(app: string): Promise<string | undefined> {
  const { answers } = await resolveInitAnswers(app);
  const out: string[] = [];
  await runInit(app, answers, REGISTRY, (...args: unknown[]) => out.push(args.map(String).join(" ")));
  const lines = out.filter((l) => l.includes("애니메이션:"));
  expect(lines.length).toBeLessThanOrEqual(1);
  return lines[0]?.trim();
}

const FILE = "app/globals.css";
const cannot = (why: string, action: string) => `애니메이션: ${FILE}의 애니메이션 줄을 쓸 수 없습니다(${why}). ${action}`;
const swap = (from: string, to: string) => `이미 설치된 ${to} 를 쓰려면 ${LINE[from]} 줄을 ${LINE[to]} 로 바꾸고, 아니면 설치하세요: `;
const noLine = (name: string, state = "설치") =>
  `애니메이션: ${name} 는 ${state}돼 있지만 ${FILE}에 애니메이션 줄이 없습니다. 전역 CSS 에 ${LINE[name]} 를 넣으세요.`;
const LEGACY = (cmd: string) =>
  `애니메이션: Dialog · Select 등의 열고 닫는 애니메이션(animate-in 류)은 플러그인이 필요합니다. ${cmd} ${TWA} 뒤 전역 CSS 에 @import "${TWA}"; 를 넣으세요.`;

// 착수 측정 표의 대표 칸. before 는 main(b1912a5) 의 init 출력(testplan 2절), check 는 수정 전후 같음
const rows: { cell: string; f: Fx; init: string | undefined; check: "pass" | "warn"; before: string }[] = [
  { cell: "A1 줄 twa · twa 설치", f: { lines: [TWA], installed: [TWA] }, init: undefined, check: "pass", before: "침묵" },
  {
    cell: "A2 S9 줄 twa · tca 만 설치",
    f: { lines: [TWA], installed: [TCA] },
    init: cannot(`${TWA} 선언 없음`, `${swap(TWA, TCA)}npm install ${TWA}`),
    check: "warn",
    before: "침묵",
  },
  {
    cell: "A3 S9 거울 줄 tca · twa 만 설치",
    f: { lines: [TCA], installed: [TWA] },
    init: cannot(`${TCA} 선언 없음`, `${swap(TCA, TWA)}npm install ${TCA}`),
    check: "warn",
    before: "침묵",
  },
  { cell: "A4 줄 tca · tca 설치", f: { lines: [TCA], installed: [TCA] }, init: undefined, check: "pass", before: "침묵" },
  {
    cell: "A5 줄 twa · 아무것도 없음",
    f: { lines: [TWA] },
    init: cannot(`${TWA} 선언 없음`, `설치하세요: npm install ${TWA}`),
    check: "warn",
    before: "종전 ① 줄",
  },
  {
    cell: "A6 줄 tca · 아무것도 없음(종전 안내는 tw-animate-css)",
    f: { lines: [TCA] },
    init: cannot(`${TCA} 선언 없음`, `설치하세요: npm install ${TCA}`),
    check: "warn",
    before: "종전 ① 줄",
  },
  { cell: "A7 줄 없음 · twa 설치", f: { installed: [TWA] }, init: noLine(TWA), check: "warn", before: "침묵" },
  { cell: "A8 줄 없음 · tca 설치", f: { installed: [TCA] }, init: noLine(TCA), check: "warn", before: "침묵" },
  { cell: "A9 줄 없음 · 아무것도 없음(종전 ① 그대로)", f: {}, init: LEGACY("npm install"), check: "warn", before: "종전 ① 줄" },
  {
    cell: "A10 두 줄 · twa 만 설치",
    f: { lines: [TWA, TCA], installed: [TWA] },
    init: cannot(`${TCA} 선언 없음`, `이미 설치된 ${TWA} 만 쓰려면 ${LINE[TCA]} 줄을 지우고, 아니면 설치하세요: npm install ${TCA}`),
    check: "warn",
    before: "침묵",
  },
  { cell: "A11 두 줄 · 둘 다 설치", f: { lines: [TWA, TCA], installed: [TWA, TCA] }, init: undefined, check: "pass", before: "침묵" },
  {
    cell: "A12 줄 twa · twa 선언 · 미설치",
    f: { lines: [TWA], declaredOnly: [TWA] },
    init: cannot(`${TWA} 미설치(선언만 있음)`, "설치하세요: npm install"),
    check: "warn",
    before: "종전 ③ 줄",
  },
  {
    cell: "A13 줄 twa · tca 선언 · 미설치(종전 안내는 tailwindcss-animate 설치)",
    f: { lines: [TWA], declaredOnly: [TCA] },
    init: cannot(`${TWA} 선언 없음`, `설치하세요: npm install ${TWA}`),
    check: "warn",
    before: "종전 ③ 줄(tca)",
  },
  {
    cell: "R1 루트 선언 S9",
    f: { decl: "root", lines: [TWA], installed: [TCA] },
    init: cannot(`${TWA} 선언 없음`, `${swap(TWA, TCA)}npm install ${TWA}`),
    check: "warn",
    before: "침묵",
  },
  {
    cell: "R2 루트 선언 · 미설치(줄 있음): 워크스페이스 루트 문구(WI-0096)",
    f: { decl: "root", lines: [TWA], declaredOnly: [TWA] },
    init: cannot(`${TWA} 미설치(선언만 있음)`, "설치하세요: 워크스페이스 루트에서 npm install"),
    check: "warn",
    before: "종전 ③ 줄(루트)",
  },
  { cell: "R3 루트 선언 · 줄 없음 · twa 설치", f: { decl: "root", installed: [TWA] }, init: noLine(TWA), check: "warn", before: "침묵" },
  { cell: "R4 루트 선언 · 줄 twa · twa 설치", f: { decl: "root", lines: [TWA], installed: [TWA] }, init: undefined, check: "pass", before: "침묵" },
  {
    cell: "P1 PnP 앱 선언 S9(yarn add)",
    f: { pnp: true, lines: [TWA], installed: [TCA] },
    init: cannot(`${TWA} 선언 없음`, `${swap(TWA, TCA)}yarn add ${TWA}`),
    check: "warn",
    before: "침묵",
  },
  { cell: "P2 PnP 앱 선언 · 줄 없음(선언으로 판정)", f: { pnp: true, installed: [TWA] }, init: noLine(TWA, "선언"), check: "warn", before: "침묵" },
  { cell: "P3 PnP 앱 선언 · 줄 twa", f: { pnp: true, lines: [TWA], installed: [TWA] }, init: undefined, check: "pass", before: "침묵" },
  {
    cell: "V1 줄이 상대 @import 하위 파일에 있음(WI-0100b 출처 표기)",
    f: { lines: [TWA], installed: [TCA], viaImport: true },
    init: `애니메이션: ${FILE} (app/anim.css 의 import)의 애니메이션 줄을 쓸 수 없습니다(${TWA} 선언 없음). ${swap(TWA, TCA)}npm install ${TWA}`,
    check: "warn",
    before: "침묵",
  },
];

describe("WI-0099: init 애니메이션 안내 = check 판정(측정 표 대표 칸)", () => {
  for (const r of rows) {
    it(`${r.cell} (종전 init: ${r.before})`, async () => {
      const app = await fx(r.f);
      const init = await initAnimation(app);
      const check = checkAnimationPlugin(app)?.severity;
      expect({ init, check }).toEqual({ init: r.init, check: r.check });
      // 불변식: init 침묵 ⇔ check PASS
      expect(init === undefined).toBe(check === "pass");
    });
  }
});

describe("WI-0099: 종전 동작을 지키는 칸(음성 대조)", () => {
  it("Q143: 전역 CSS 파일이 없으면 종전 판정(선언 + 설치 → 침묵, 미선언 → 종전 ① 줄). check 는 WARN 이라 어긋남이 남음(범위 밖)", async () => {
    expect(await initAnimation(await fx({ css: false, installed: [TCA] }))).toBeUndefined();
    expect(await initAnimation(await fx({ css: false }))).toBe(LEGACY("npm install"));
  });

  it("PnP 루트에만 선언 · 줄 twa: WI-0095 부터 check 와 같은 루트 전용 사유(WI-0099 에서는 종전 ① 줄로 남겼던 칸)", async () => {
    const app = await fx({ pnp: true, decl: "root", lines: [TWA], installed: [TWA] });
    const why = `${TWA} 가 워크스페이스 루트에만 선언돼 Plug'n'Play 에서 앱이 해석하지 못합니다`;
    expect(await initAnimation(app)).toBe(cannot(why, `설치하세요: yarn add ${TWA}`));
    expect(checkAnimationPlugin(app)?.message).toContain(why);
  });

  it("CSS 를 고르지 못하는 직접 호출(설정 · CSS 없음)은 WI-0087 판정 그대로: 두 이름이 선언되면 tw-animate-css 우선(DEC-6)", async () => {
    const app = await fx({ css: false, installed: [TCA], declaredOnly: [TWA] });
    const pkg = (await fs.readJSON(path.join(app, "package.json"))) as Record<string, unknown>;
    expect(animationGuideLine(pkg, true, "npm install", app)).toBe(
      `애니메이션: ${TWA} 는 선언돼 있지만 설치되지 않았습니다. npm install 뒤 전역 CSS 에 @import "${TWA}"; 를 넣으세요.`
    );
  });

  it("Tailwind 3 은 CSS 를 읽지 않음(Q146 범위 밖): 선언 + 설치면 침묵", async () => {
    const app = await fx({ installed: [TCA] });
    const pkg = (await fs.readJSON(path.join(app, "package.json"))) as Record<string, unknown>;
    expect(animationGuideLine(pkg, false, "npm install", app)).toBeUndefined();
  });
});

describe("WI-0099: inspectTailwind4Animation(registry-core 공용 판정)", () => {
  it("줄마다 패키지와 사유 · 선언 위치를 돌려주고, check 문구의 사유와 같은 문자열", async () => {
    const app = await fx({ decl: "root", lines: [TWA, TCA], installed: [TCA], declaredOnly: [TWA] });
    const r = inspectTailwind4Animation(app);
    expect({ file: r.file, lines: r.lines, problems: r.problems }).toEqual({
      file: FILE,
      lines: [TWA, TCA],
      problems: [{ name: TWA, kind: "notInstalled", why: `${TWA} 미설치(선언만 있음)`, root: true }],
    });
    expect(checkAnimationPlugin(app)?.message).toContain(`(@axis-ds/ui-react 선언, ${TWA} 미설치(선언만 있음))`);
  });

  it("CSS 가 없으면 file 이 없고 줄도 없음", async () => {
    const r = inspectTailwind4Animation(await fx({ css: false }));
    expect({ file: r.file, lines: r.lines, problems: r.problems }).toEqual({ file: undefined, lines: [], problems: [] });
  });
});

describe("WI-0099: init 의 종료 코드 · 쓰기는 바뀌지 않음", () => {
  it("S9 에서 안내가 더해져도 종료 코드는 그대로이고 package.json 은 utils 의존성 외에 바뀌지 않음", async () => {
    const app = await fx({ lines: [TWA], installed: [TCA] });
    const before = (await fs.readJSON(path.join(app, "package.json"))) as { dependencies: Record<string, string> };
    await initAnimation(app);
    expect(process.exitCode ?? 0).toBe(0);
    const after = (await fs.readJSON(path.join(app, "package.json"))) as { dependencies: Record<string, string> };
    expect(after.dependencies).toEqual(before.dependencies);
    expect(await fs.readFile(path.join(app, "app", "globals.css"), "utf8")).toContain(LINE[TWA]);
  });
});
