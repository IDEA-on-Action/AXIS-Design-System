/**
 * 레지스트리 주소 공개성 판정 (WI-0055 D13)
 *
 * MCP 는 AI 가 고른 프로젝트(신뢰할 수 없을 수 있음)의 axis.config.json registry 를 읽습니다. 그 값이 내부 주소를 가리키면
 * 서버가 내부망으로 GET 을 보내고(SSRF), 그 저장소가 고른 코드가 프로젝트에 써집니다. 그래서 MCP 는 config 의 registry 를
 * https 이고 루프백 · 사설 · 링크로컬 · 미지정 주소가 아닐 때만 씁니다. 환경변수(서버를 띄운 사람이 정한 값)와 cli 는 제한하지
 * 않습니다(이 판정은 호출한 쪽이 켤 때만 돕니다, add.ts createClientFor 의 guardConfigRegistry).
 *
 * 판정
 * - 스킴이 https 가 아니면 거부
 * - 호스트가 리터럴 IP 면 그 주소를, 이름이면 `localhost` · `*.localhost` · `*.local` 을 거부하고 dns.lookup(all) 결과가
 *   하나라도 막힌 주소면 거부합니다. 조회에 실패해도 확인할 수 없으므로 거부합니다
 * - 막힌 주소: IPv4 0/8 · 10/8 · 100.64/10 · 127/8 · 169.254/16 · 172.16/12 · 192.168/16 · 224/4 이상(멀티캐스트 · 예약 · 브로드캐스트),
 *   IPv6 미지정(::) · 루프백(::1) · fc00::/7 · fe80::/10 · fec0::/10 · ff00::/8, 그리고 IPv4 를 품은 IPv6
 *   (::ffff:0:0/96 매핑 · ::/96 호환 · 64:ff9b::/96 NAT64)는 품은 IPv4 로 봅니다
 *
 * 남는 위험: 판정한 뒤 실제 요청 때 DNS 가 다른 주소를 돌려주는 경우(DNS 리바인딩)는 막지 못합니다. 리다이렉트는 호출한 쪽이
 * 따라가지 않게 합니다(RegistryClient rejectRedirects).
 */

import { lookup as dnsLookup } from "node:dns/promises";
import { isIP } from "node:net";

/** dns.lookup(host, { all: true }) 와 같은 모양(테스트에서 주입) */
export type LookupAll = (hostname: string) => Promise<{ address: string; family: number }[]>;

export const defaultLookupAll: LookupAll = (hostname) => dnsLookup(hostname, { all: true, verbatim: true });

function ipv4Octets(ip: string): number[] | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  const nums = parts.map((p) => (/^\d{1,3}$/.test(p) ? Number(p) : NaN));
  return nums.every((n) => n >= 0 && n <= 255) ? nums : null;
}

/** 막힌 IPv4 면 이유, 아니면 null */
export function blockedIpv4Reason(ip: string): string | null {
  const o = ipv4Octets(ip);
  if (!o) return "IPv4 주소 형식이 아님";
  const [a, b] = o;
  if (a === 0) return "미지정 주소(0.0.0.0/8)";
  if (a === 127) return "루프백 주소(127.0.0.0/8)";
  if (a === 10) return "사설 주소(10.0.0.0/8)";
  if (a === 172 && b >= 16 && b <= 31) return "사설 주소(172.16.0.0/12)";
  if (a === 192 && b === 168) return "사설 주소(192.168.0.0/16)";
  if (a === 100 && b >= 64 && b <= 127) return "공유 주소(100.64.0.0/10)";
  if (a === 169 && b === 254) return "링크로컬 주소(169.254.0.0/16)";
  if (a >= 224) return "멀티캐스트 · 예약 주소(224.0.0.0/4 이상)";
  return null;
}

/** IPv6 문자열을 16비트 8개로. 끝에 IPv4 점 표기가 붙은 형태도 받습니다. 형식이 아니면 null */
export function parseIpv6(ip: string): number[] | null {
  let s = ip.toLowerCase();
  const zone = s.indexOf("%");
  if (zone >= 0) s = s.slice(0, zone);
  // 끝의 IPv4 점 표기(::ffff:10.0.0.1)는 16비트 두 그룹으로 바꿔 적습니다
  const lastColon = s.lastIndexOf(":");
  if (lastColon >= 0 && s.slice(lastColon + 1).includes(".")) {
    const o = ipv4Octets(s.slice(lastColon + 1));
    if (!o) return null;
    s = `${s.slice(0, lastColon + 1)}${((o[0] << 8) | o[1]).toString(16)}:${((o[2] << 8) | o[3]).toString(16)}`;
  }
  const halves = s.split("::");
  if (halves.length > 2) return null;
  const toGroups = (part: string) => (part === "" ? [] : part.split(":"));
  const parseGroup = (g: string) => (/^[0-9a-f]{1,4}$/.test(g) ? parseInt(g, 16) : NaN);
  let groups = toGroups(halves[0]).map(parseGroup);
  const restNums = halves.length === 2 ? toGroups(halves[1]).map(parseGroup) : [];
  const total = groups.length + restNums.length;
  if (halves.length === 2) {
    if (total > 7) return null;
    groups = [...groups, ...new Array(8 - total).fill(0), ...restNums];
  } else if (total !== 8) {
    return null;
  }
  return groups.every((g) => Number.isInteger(g) && g >= 0 && g <= 0xffff) ? groups : null;
}

/** 막힌 IPv6 면 이유, 아니면 null */
export function blockedIpv6Reason(ip: string): string | null {
  const g = parseIpv6(ip);
  if (!g) return "IPv6 주소 형식이 아님";
  const embedded = () => `${g[6] >> 8}.${g[6] & 0xff}.${g[7] >> 8}.${g[7] & 0xff}`;
  const zeros = (n: number) => g.slice(0, n).every((x) => x === 0);
  if (g.every((x) => x === 0)) return "미지정 주소(::)";
  if (zeros(7) && g[7] === 1) return "루프백 주소(::1)";
  // IPv4 를 품은 형태는 품은 주소로 판정합니다
  if (zeros(5) && g[5] === 0xffff) return blockedIpv4Reason(embedded());
  if (zeros(6)) return blockedIpv4Reason(embedded());
  if (g[0] === 0x64 && g[1] === 0xff9b && g.slice(2, 6).every((x) => x === 0)) return blockedIpv4Reason(embedded());
  if ((g[0] & 0xfe00) === 0xfc00) return "사설 주소(fc00::/7)";
  if ((g[0] & 0xffc0) === 0xfe80) return "링크로컬 주소(fe80::/10)";
  if ((g[0] & 0xffc0) === 0xfec0) return "사이트로컬 주소(fec0::/10)";
  if ((g[0] & 0xff00) === 0xff00) return "멀티캐스트 주소(ff00::/8)";
  return null;
}

/** 리터럴 IP 하나의 판정 */
export function blockedAddressReason(address: string): string | null {
  const v = isIP(address.split("%")[0]);
  if (v === 4) return blockedIpv4Reason(address);
  if (v === 6) return blockedIpv6Reason(address);
  return "IP 주소 형식이 아님";
}

/**
 * 레지스트리 주소가 공개 https 주소인지 봅니다. 쓰면 안 되면 이유, 써도 되면 null 입니다.
 */
export async function publicRegistryUrlProblem(raw: string, lookupAll: LookupAll = defaultLookupAll): Promise<string | null> {
  let parsed: URL;
  try {
    parsed = new URL(raw.trim());
  } catch {
    return "URL 형식이 아님";
  }
  if (parsed.protocol !== "https:") return `https 가 아님(${parsed.protocol.replace(/:$/, "")})`;
  // URL 파서가 IPv4 변형(0x7f.1 · 2130706433 등)을 점 표기로 바꾸고, IPv6 는 [ ] 로 감쌉니다
  let host = parsed.hostname.toLowerCase();
  if (host.startsWith("[") && host.endsWith("]")) host = host.slice(1, -1);
  host = host.replace(/\.+$/, "");
  if (host === "") return "호스트가 없음";
  if (isIP(host)) {
    const r = blockedAddressReason(host);
    return r ? `${r}를 가리킴` : null;
  }
  if (host === "localhost" || host.endsWith(".localhost")) return "localhost 이름";
  if (host.endsWith(".local")) return "로컬 네트워크 이름(.local)";
  let addresses: { address: string }[];
  try {
    addresses = await lookupAll(host);
  } catch (error) {
    const code = (error as { code?: string }).code;
    return `호스트 주소를 확인하지 못함(${code ?? (error as Error).message})`;
  }
  if (addresses.length === 0) return "호스트 주소를 확인하지 못함(결과 없음)";
  for (const { address } of addresses) {
    const r = blockedAddressReason(address);
    if (r) return `${host} 가 ${address}(${r})로 풀림`;
  }
  return null;
}
