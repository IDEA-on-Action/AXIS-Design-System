/**
 * G2 하네스 실행기 (WI-0050): react-server 조건에서 각 내보내기를 렌더하거나 호출합니다.
 *
 * 실행(소비자 디렉터리에서):
 *   node --conditions=react-server --import <scripts/rsc-smoke/register.mjs> <scripts/rsc-smoke/run.mjs> <소비자 디렉터리> <spec>...
 * 소비자 디렉터리에 probe-entry.mjs(`export const imp = (s) => import(s)`)가 있어야 합니다.
 * 패키지 해석이 그 디렉터리의 node_modules 기준이 되게 하려는 것입니다.
 *
 * 출력: 한 줄에 JSON 하나.
 *   { type: 'env', reactServer, rsdw }                       조건 적용 자기 확인
 *   { type: 'row', spec, name, kind, clientRef, ok, detail }  kind: import · call · hook · render
 * 판정(무엇이 실패인가)은 호출한 쪽(pack-install-smoke.mjs)이 합니다.
 */
import path from 'node:path';
import { Writable } from 'node:stream';
import { pathToFileURL } from 'node:url';

const ROOT = path.resolve(process.argv[2]);
const specs = process.argv.slice(3);
const { imp } = await import(pathToFileURL(path.join(ROOT, 'probe-entry.mjs')).href);
const out = (o) => console.log(JSON.stringify(o));

const React = await imp('react');
const rsdw = await imp('react-server-dom-webpack/server');
// react-server 조건이 실제로 적용됐는지: react-server 빌드의 React 에는 useState 가 없다
out({ type: 'env', reactServer: typeof React.useState !== 'function', rsdw: typeof rsdw.renderToPipeableStream === 'function' });
const { renderToPipeableStream } = rsdw;

const manifest = new Proxy({}, {
  get: (_, k) => (typeof k === 'string' ? { id: k.split('#')[0], chunks: [], name: k.split('#')[1] || '*' } : undefined),
});

function renderFlight(el) {
  return new Promise((resolve) => {
    const errors = [];
    let buf = '';
    const sink = new Writable({ write(c, _e, cb) { buf += c.toString(); cb(); } });
    sink.on('finish', () => resolve({ errors, buf }));
    try {
      const s = renderToPipeableStream(el, manifest, {
        onError(e) { errors.push(String((e && e.message) || e).split('\n')[0]); },
      });
      s.pipe(sink);
    } catch (e) {
      errors.push('sync: ' + String(e.message).split('\n')[0]);
      resolve({ errors, buf });
    }
  });
}

function refsOf(buf) {
  return [...new Set([...buf.matchAll(/:I\["([^"]+)",\[[^\]]*\],"([^"]+)"/g)].map((m) => {
    const short = m[1].includes('/node_modules/') ? m[1].split('/node_modules/').pop() : m[1];
    return short.replace(/\/dist\/.*$/, '') + '#' + m[2];
  }))];
}

const h = React.createElement;
const now = new Date(0);
// agentic-ui 컴포넌트는 필수 props 가 있어 최소값을 준다(없는 컴포넌트는 children 'txt')
const PROPS = {
  AgentAvatar: { name: 'A' },
  ApprovalCard: { title: 't', actions: [] },
  AttachmentCard: { type: 'file', name: 'a.txt' },
  CodeBlock: { code: 'x' },
  ContextPanel: {},
  DiffViewer: { before: 'a', after: 'b' },
  FeedbackButtons: { messageId: 'm' },
  MessageBubble: { role: 'assistant', content: 'hi' },
  PlanCard: { title: 'p', steps: [{ id: '1', label: 's', status: 'pending' }] },
  RecoveryBanner: { message: 'm' },
  RunProgress: { status: 'running', steps: [{ id: '1', label: 's', status: 'pending' }] },
  SourcePanel: { sources: [{ id: '1', type: 'web', title: 't' }] },
  StepTimeline: { steps: [{ id: '1', label: 's', status: 'pending', timestamp: now }] },
  StreamingText: { text: 'abc' },
  SurfaceRenderer: { surface: { id: '1', type: 'text', content: 'x' } },
  ThinkingIndicator: {},
  TokenUsageIndicator: { current: 1, max: 10 },
  ToolCallCard: { toolName: 't', status: 'success' },
};
const FN_ARGS = { cn: ['a', 'b'] };

for (const spec of specs) {
  let mod;
  try {
    mod = await imp(spec);
  } catch (e) {
    out({ type: 'row', spec, name: '(import)', kind: 'import', clientRef: false, ok: false, detail: String(e.message).split('\n')[0].slice(0, 200) });
    continue;
  }
  const names = Object.keys(mod).filter((n) => n !== 'default' && n !== '__esModule');
  if (names.length === 0) {
    out({ type: 'row', spec, name: '(import)', kind: 'import', clientRef: false, ok: false, detail: '내보내기 0개' });
    continue;
  }
  for (const name of names) {
    const val = mod[name];
    const clientRef = !!val && val.$$typeof === Symbol.for('react.client.reference');
    if (/^use[A-Z]/.test(name)) {
      // 훅은 서버에서 부를 수 없다. 클라이언트 참조인지만 기록한다
      out({ type: 'row', spec, name, kind: 'hook', clientRef, ok: clientRef, detail: clientRef ? '클라이언트 참조' : '서버 모듈의 훅' });
      continue;
    }
    if (/^[a-z]/.test(name)) {
      // 컴포넌트가 아닌 런타임 내보내기(cn · *Variants): 서버에서 직접 호출
      try {
        const r = val(...(FN_ARGS[name] || [{}]));
        out({ type: 'row', spec, name, kind: 'call', clientRef, ok: typeof r === 'string', detail: JSON.stringify(r).slice(0, 80) });
      } catch (e) {
        out({ type: 'row', spec, name, kind: 'call', clientRef, ok: false, detail: String(e.message).split('\n')[0].slice(0, 200) });
      }
      continue;
    }
    const props = PROPS[name] || {};
    const children = PROPS[name] ? undefined : 'txt';
    const r = await renderFlight(h(val, props, children));
    const refs = refsOf(r.buf);
    out({
      type: 'row', spec, name, kind: 'render', clientRef,
      ok: r.errors.length === 0,
      detail: r.errors.length ? r.errors[0].slice(0, 200) : (refs.length ? '경계: ' + refs.join(', ').slice(0, 160) : '서버 렌더'),
    });
  }
}
