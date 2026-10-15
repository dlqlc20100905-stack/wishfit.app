import "server-only";
import { cookies } from "next/headers";
import { hashSecret, newSecret } from "./tokens";

// 로그인 없이 예약한 친구를 알아보는 쿠키. 이 브라우저에서만 예약 취소가 가능하다.
const COOKIE = "gift_secret";

export async function viewerSecretHash(): Promise<string | null> {
  const secret = (await cookies()).get(COOKIE)?.value;
  return secret ? hashSecret(secret) : null;
}

export async function ensureViewerSecretHash(): Promise<string> {
  const jar = await cookies();
  let secret = jar.get(COOKIE)?.value;
  if (!secret) {
    secret = newSecret();
    jar.set(COOKIE, secret, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
  }
  return hashSecret(secret);
}
