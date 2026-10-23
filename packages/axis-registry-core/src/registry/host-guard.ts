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
 * - 막힌 주소는 아래 표입니다. 기준은 IANA 특수 목적 주소 레지스트리(IPv4 · IPv6, 2026-10-24 대조)에서 「공인 인터넷에서
 *   도달 가능(Globally Reachable)」이 아닌 범위 전부와, 다른 IPv4 를 품은 IPv6(품은 IPv4 로 다시 판정)입니다.
 *
 *   IPv4                    이름                              판정
 *   0.0.0.0/8               This network · 미지정             거부
 *   10.0.0.0/8              사설                              거부
 *   100.64.0.0/10           공유(CGN)                         거부
 *   127.0.0.0/8             루프백                            거부
 *   169.254.0.0/16          링크로컬                          거부
 *   172.16.0.0/12           사설                              거부
 *   192.0.0.0/24            IETF 프로토콜 할당                거부
 *   192.0.2.0/24            문서용 TEST-NET-1                 거부
 *   192.88.99.0/24          6to4 릴레이 애니캐스트(폐지)      거부
 *   192.168.0.0/16          사설                              거부
 *   198.18.0.0/15           벤치마크                          거부
 *   198.51.100.0/24         문서용 TEST-NET-2                 거부
 *   203.0.113.0/24          문서용 TEST-NET-3                 거부
 *   224.0.0.0/4             멀티캐스트                        거부
 *   240.0.0.0/4             예약(255.255.255.255 브로드캐스트 포함) 거부
 *   192.31.196.0/24 · 192.52.193.0/24 · 192.175.48.0/24   AS112 · AMT(공인 도달 가능)   허용
 *
 *   IPv6                    이름                              판정
 *   ::/128 · ::1/128        미지정 · 루프백                   거부
 *   ::ffff:0:0/96           IPv4 매핑                         품은 IPv4 로 판정
 *   ::/96(그 밖의 ::x.x.x.x) IPv4 호환(폐지)                  품은 IPv4 로 판정
 *   64:ff9b::/96            NAT64 공용                        품은 IPv4 로 판정
 *   64:ff9b:1::/48          NAT64 로컬                        거부
 *   100::/64 · 100:0:0:1::/64  폐기 전용 · 더미 접두          거부
 *   2001::/32               Teredo                            서버 IPv4 와 비트 반전된 클라이언트 IPv4 를 복원해 둘 다 판정
 *   2001::/23 의 나머지     IETF 프로토콜 할당(벤치마크 2001:2::/48 · ORCHID 등) 거부
 *   2001:db8::/32 · 3fff::/20  문서용                        거부
 *   2002::/16               6to4                              품은 IPv4 로 판정
 *   5f00::/16               SRv6 SID                          거부
 *   fc00::/7                고유 로컬(사설)                   거부
 *   fe80::/10 · fec0::/10   링크로컬 · 사이트로컬(폐지)       거부
 *   ff00::/8                멀티캐스트                        거부
 *
 * DNS 리바인딩(판정 뒤 실제 연결 때 다른 주소)은 연결 단계에서 다시 판정해 막습니다(pinned-fetch.ts, 연결에 쓰는 lookup 이 같은
 * 판정을 거침). 리다이렉트는 따라가지 않습니다(RegistryClient rejectRedirects).
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

/** 막힌 IPv4 범위(위 표). [첫 주소, 접두 길이, 이름] */
const BLOCKED_V4: [string, number, string][] = [
  ["0.0.0.0", 8, "미지정 주소(0.0.0.0/8)"],
  ["10.0.0.0", 8, "사설 주소(10.0.0.0/8)"],
  ["100.64.0.0", 10, "공유 주소(100.64.0.0/10)"],
  ["127.0.0.0", 8, "루프백 주소(127.0.0.0/8)"],
  ["169.254.0.0", 16, "링크로컬 주소(169.254.0.0/16)"],
  ["172.16.0.0", 12, "사설 주소(172.16.0.0/12)"],
  ["192.0.0.0", 24, "IETF 프로토콜 할당 주소(192.0.0.0/24)"],
  ["192.0.2.0", 24, "문서용 주소(192.0.2.0/24)"],
  ["192.88.99.0", 24, "6to4 릴레이 주소(192.88.99.0/24)"],
  ["192.168.0.0", 16, "사설 주소(192.168.0.0/16)"],
  ["198.18.0.0", 15, "벤치마크 주소(198.18.0.0/15)"],
  ["198.51.100.0", 24, "문서용 주소(198.51.100.0/24)"],
  ["203.0.113.0", 24, "문서용 주소(203.0.113.0/24)"],
  ["224.0.0.0", 4, "멀티캐스트 주소(224.0.0.0/4)"],
  ["240.0.0.0", 4, "예약 주소(240.0.0.0/4)"],
];

function ipv4ToInt(o: number[]): number {
  return ((o[0] << 24) | (o[1] << 16) | (o[2] << 8) | o[3]) >>> 0;
}

/** 막힌 IPv4 면 이유, 아니면 null */
export function blockedIpv4Reason(ip: string): string | null {
  const o = ipv4Octets(ip);
  if (!o) return "IPv4 주소 형식이 아님";
  const n = ipv4ToInt(o);
  for (const [base, len, name] of BLOCKED_V4) {
    const mask = len === 0 ? 0 : (0xffffffff << (32 - len)) >>> 0;
    if ((n & mask) >>> 0 === (ipv4ToInt(ipv4Octets(base)!) & mask) >>> 0) return name;
  }
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

/** 16비트 두 그룹을 IPv4 점 표기로 */
function groupsToIpv4(hi: number, lo: number): string {
  return `${hi >> 8}.${hi & 0xff}.${lo >> 8}.${lo & 0xff}`;
}

/** 막힌 IPv6 면 이유, 아니면 null(위 표) */
export function blockedIpv6Reason(ip: string): string | null {
  const g = parseIpv6(ip);
  if (!g) return "IPv6 주소 형식이 아님";
  const zeros = (from: number, to: number) => g.slice(from, to).every((x) => x === 0);
  const embeddedTail = () => groupsToIpv4(g[6], g[7]);
  const viaEmbedded = (v4: string, what: string) => {
    const r = blockedIpv4Reason(v4);
    return r ? `${what}이 품은 ${v4}: ${r}` : null;
  };
  if (zeros(0, 8)) return "미지정 주소(::)";
  if (zeros(0, 7) && g[7] === 1) return "루프백 주소(::1)";
  if (zeros(0, 5) && g[5] === 0xffff) return viaEmbedded(embeddedTail(), "IPv4 매핑 주소(::ffff:0:0/96)");
  if (zeros(0, 6)) return viaEmbedded(embeddedTail(), "IPv4 호환 주소(::/96)");
  if (g[0] === 0x64 && g[1] === 0xff9b && zeros(2, 6)) return viaEmbedded(embeddedTail(), "NAT64 주소(64:ff9b::/96)");
  if (g[0] === 0x64 && g[1] === 0xff9b && g[2] === 0x1) return "로컬 NAT64 주소(64:ff9b:1::/48)";
  if (g[0] === 0x100 && zeros(1, 4)) return "폐기 전용 주소(100::/64)";
  if (g[0] === 0x100 && zeros(1, 3) && g[3] === 1) return "더미 접두 주소(100:0:0:1::/64)";
  if (g[0] === 0x2001 && g[1] === 0) {
    // Teredo: 서버 IPv4 는 32~63비트, 클라이언트 IPv4 는 마지막 32비트를 비트 반전해 둡니다
    const server = groupsToIpv4(g[2], g[3]);
    const client = groupsToIpv4(~g[6] & 0xffff, ~g[7] & 0xffff);
    return viaEmbedded(server, "Teredo 주소(2001::/32) 서버") ?? viaEmbedded(client, "Teredo 주소(2001::/32) 클라이언트");
  }
  if (g[0] === 0x2001 && g[1] < 0x200) return "IETF 프로토콜 할당 주소(2001::/23)";
  if (g[0] === 0x2001 && g[1] === 0xdb8) return "문서용 주소(2001:db8::/32)";
  if ((g[0] & 0xfff0) === 0x3ff0) return "문서용 주소(3fff::/20)";
  if (g[0] === 0x2002) return viaEmbedded(groupsToIpv4(g[1], g[2]), "6to4 주소(2002::/16)");
  if (g[0] === 0x5f00) return "SRv6 SID 주소(5f00::/16)";
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
