import { lookup } from "node:dns/promises";
import net from "node:net";

const MAX_BYTES = 2_000_000;
const MAX_REDIRECTS = 3;
const TIMEOUT_MS = 8000;

function isPrivateAddress(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168)
    );
  }
  const v6 = ip.toLowerCase();
  if (v6.startsWith("::ffff:")) return isPrivateAddress(v6.slice(7));
  return v6 === "::" || v6 === "::1" || v6.startsWith("fc") || v6.startsWith("fd") || v6.startsWith("fe80");
}

async function assertPublicUrl(url: URL) {
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("http(s) 링크만 담을 수 있어요");
  const addrs = await lookup(url.hostname, { all: true });
  if (addrs.length === 0 || addrs.some((a) => isPrivateAddress(a.address))) {
    throw new Error("접근할 수 없는 주소예요");
  }
}

/** 사용자가 준 링크를 서버에서 읽는다. 내부망 주소와 큰 응답은 막는다. */
export async function fetchPublicHtml(rawUrl: string): Promise<{ html: string; finalUrl: string }> {
  let url = new URL(rawUrl);
  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    await assertPublicUrl(url);
    const res = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        "user-agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        accept: "text/html,application/xhtml+xml",
        "accept-language": "ko-KR,ko;q=0.9",
      },
    });
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) throw new Error("이동할 주소가 없어요");
      url = new URL(loc, url);
      continue;
    }
    if (!res.ok) throw new Error(`페이지를 열 수 없어요 (${res.status})`);
    const reader = res.body?.getReader();
    if (!reader) return { html: "", finalUrl: url.toString() };
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (size < MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      size += value.byteLength;
    }
    await reader.cancel().catch(() => {});
    return { html: new TextDecoder().decode(Buffer.concat(chunks)), finalUrl: url.toString() };
  }
  throw new Error("리다이렉트가 너무 많아요");
}
