/**
 * G2 하네스 로더 (WI-0050): "use client" 로 시작하는 모듈을 RSC 번들러처럼 클라이언트 참조로 바꿉니다.
 * Next 의 RSC 레이어가 하는 일(경계 모듈 본문을 서버에서 평가하지 않음)을 흉내 냅니다.
 * 출처: WI-0050 inventory 하네스(client-loader.mjs). 판정 대상은 ESM import 경로입니다.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// 지시문 프롤로그 안의 "use client"(앞에 다른 지시문 · 주석이 있어도 됨)
function hasUseClient(code) {
  let s = code;
  for (;;) {
    s = s.replace(/^(?:\s+|\/\/[^\n]*\n|\/\*[\s\S]*?\*\/)*/, '');
    const m = /^(["'])([^"'\n]*)\1\s*;?/.exec(s);
    if (!m) return false;
    if (m[2] === 'use client') return true;
    s = s.slice(m[0].length);
  }
}

function exportNames(src) {
  const names = new Set();
  for (const m of src.matchAll(/export\s*\{([^}]*)\}/g)) {
    for (const part of m[1].split(',')) {
      const p = part.trim();
      if (!p) continue;
      const as = p.split(/\s+as\s+/);
      names.add((as[1] || as[0]).trim());
    }
  }
  for (const m of src.matchAll(/export\s+(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/g)) names.add(m[1]);
  if (/export\s+default\b/.test(src)) names.add('default');
  return [...names];
}

const SKIP = ['react-server-dom-webpack', '/node_modules/react/', '/node_modules/react-dom/'];

export async function load(url, context, next) {
  if (url.startsWith('file:') && /\.(mjs|js)$/.test(url) && !SKIP.some((s) => url.includes(s))) {
    let src;
    try { src = readFileSync(fileURLToPath(url), 'utf8'); } catch { return next(url, context); }
    if (hasUseClient(src) && (context.format === 'module' || url.endsWith('.mjs') || /\bexport\b/.test(src))) {
      const names = exportNames(src);
      const lines = [
        `import { createClientModuleProxy } from "react-server-dom-webpack/server";`,
        `globalThis.__clientModules ??= new Set(); globalThis.__clientModules.add(${JSON.stringify(url)});`,
        `const __p = createClientModuleProxy(${JSON.stringify(url)});`,
      ];
      for (const n of names) {
        if (n === 'default') lines.push('export default __p.default;');
        else lines.push(`export const ${n} = __p[${JSON.stringify(n)}];`);
      }
      return { format: 'module', source: lines.join('\n'), shortCircuit: true };
    }
  }
  return next(url, context);
}
