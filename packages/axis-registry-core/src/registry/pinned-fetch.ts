/**
 * 연결 단계 재판정 fetch (WI-0055 D13 보강, DNS 리바인딩 대비)
 *
 * config 의 registry 는 요청 전에 host-guard 로 판정하지만, 판정할 때의 DNS 조회와 실제 연결 때의 조회가 따로라 그 사이에
 * 이름이 내부 주소로 바뀌면(DNS 리바인딩) 막지 못합니다. 그래서 가드가 켜진 경로(mcp 의 config registry)의 요청은 전역 fetch 대신
 * node:https 의 request 로 보내고, 연결에 쓰는 lookup 이 dns.lookup(all) 결과 **전부**를 같은 차단 판정에 넣습니다. 하나라도
 * 막히면 연결하지 않고, 아니면 그 결과로 연결합니다. 요청 URL 의 이름은 그대로라 SNI · Host · 인증서 검사는 원래 이름으로 합니다.
 *
 * - 리다이렉트는 따라가지 않습니다(request 는 원래 따라가지 않고, 3xx 는 fetchRegistryJson 의 rejectRedirects 가 거부)
 * - timeout 은 fetchRegistryJson 의 AbortSignal 을 그대로 씁니다
 * - 응답 크기 상한(기본 4 MiB)을 넘으면 연결을 끊고 실패합니다. 레지스트리 JSON 은 항목당 수십 KB 입니다
 * - 오류 문구의 URL 가림은 fetchRegistryJson 이 합니다(이 함수는 URL 을 문구에 넣지 않음)
 *
 * env · 기본값 경로와 cli 는 종전 전역 fetch 를 씁니다.
 */

import { request as httpsRequest, type RequestOptions } from "node:https";
import type { IncomingMessage } from "node:http";
import type { LookupAddress, LookupOptions } from "node:dns";
import type { FetchLike } from "./remote.js";
import { blockedAddressReason, defaultLookupAll, type LookupAll } from "./host-guard.js";

/** 응답 본문 상한(바이트) */
export const PINNED_FETCH_MAX_BYTES = 4 * 1024 * 1024;

/** 연결 단계 판정에 걸려 연결하지 않았을 때의 오류 코드 */
export const BLOCKED_CONNECT_CODE = "EAXISBLOCKEDADDR";

export interface PinnedFetchOptions {
  /** DNS 조회(테스트에서 주입). 기본 dns.lookup(all) */
  lookupAll?: LookupAll;
  /** 주소 판정(테스트 전용 대체). 기본 host-guard 의 blockedAddressReason */
  judge?: (address: string) => string | null;
  /** 요청 함수(테스트 전용, http.request 로 바꿔 로컬 서버를 씀). 기본 https.request */
  request?: (options: RequestOptions, callback: (res: IncomingMessage) => void) => ReturnType<typeof httpsRequest>;
  /** 연결 포트(테스트 전용) */
  port?: number;
  maxBytes?: number;
}

type LookupCallback = (err: NodeJS.ErrnoException | null, address: string | LookupAddress[], family?: number) => void;

/** request 의 lookup 옵션. 결과 전부를 판정하고 하나라도 막히면 연결하지 않습니다 */
export function guardedLookup(lookupAll: LookupAll, judge: (address: string) => string | null) {
  return (hostname: string, options: LookupOptions, callback: LookupCallback): void => {
    lookupAll(hostname).then(
      (addresses) => {
        if (addresses.length === 0) {
          callback(Object.assign(new Error(`${hostname} 의 주소를 찾지 못했습니다`), { code: "ENOTFOUND" }), "", 0);
          return;
        }
        for (const { address } of addresses) {
          const reason = judge(address);
          if (reason) {
            const err = Object.assign(
              new Error(`연결 단계에서 ${hostname} 가 ${address}(${reason})로 풀려 연결하지 않습니다`),
              { code: BLOCKED_CONNECT_CODE }
            );
            callback(err, "", 0);
            return;
          }
        }
        const family = options?.family === 4 || options?.family === 6 ? options.family : 0;
        const usable = family ? addresses.filter((a) => a.family === family) : addresses;
        if (usable.length === 0) {
          callback(Object.assign(new Error(`${hostname} 에 IPv${family} 주소가 없습니다`), { code: "ENOTFOUND" }), "", 0);
          return;
        }
        if (options?.all) callback(null, usable.map((a) => ({ address: a.address, family: a.family })));
        else callback(null, usable[0].address, usable[0].family);
      },
      (error: NodeJS.ErrnoException) => callback(error, "", 0)
    );
  };
}

/** 연결 단계 재판정 fetch. fetchRegistryJson 의 fetchImpl 로 넘깁니다 */
export function createPinnedFetch(options: PinnedFetchOptions = {}): FetchLike {
  const lookupAll = options.lookupAll ?? defaultLookupAll;
  const judge = options.judge ?? blockedAddressReason;
  const send = options.request ?? httpsRequest;
  const maxBytes = options.maxBytes ?? PINNED_FETCH_MAX_BYTES;
  return (input, init) =>
    new Promise((resolve, reject) => {
      let url: URL;
      try {
        url = new URL(input);
      } catch (error) {
        reject(error);
        return;
      }
      const host = url.hostname.startsWith("[") ? url.hostname.slice(1, -1) : url.hostname;
      const req = send(
        {
          hostname: host,
          port: options.port ?? (url.port ? Number(url.port) : undefined),
          path: `${url.pathname}${url.search}`,
          method: "GET",
          headers: init?.headers ?? {},
          servername: host,
          lookup: guardedLookup(lookupAll, judge) as RequestOptions["lookup"],
          ...(init?.signal ? { signal: init.signal } : {}),
        },
        (res) => {
          const chunks: Buffer[] = [];
          let size = 0;
          let failed = false;
          res.on("data", (chunk: Buffer) => {
            size += chunk.length;
            if (size > maxBytes && !failed) {
              failed = true;
              res.destroy();
              reject(new Error(`응답이 ${maxBytes} 바이트를 넘어 읽지 않습니다`));
              return;
            }
            chunks.push(chunk);
          });
          res.on("error", (error) => {
            if (!failed) reject(error);
          });
          res.on("end", () => {
            if (failed) return;
            const body = Buffer.concat(chunks).toString("utf8");
            const status = res.statusCode ?? 0;
            resolve({ ok: status >= 200 && status < 300, status, text: async () => body });
          });
        }
      );
      req.on("error", reject);
      req.end();
    });
}
