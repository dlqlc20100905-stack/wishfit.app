import { createHash, randomBytes } from "node:crypto";

/** 추측할 수 없는 공유 토큰(URL에 들어감). */
export function newShareToken(): string {
  return randomBytes(12).toString("base64url");
}

export function newSecret(): string {
  return randomBytes(24).toString("base64url");
}

export function hashSecret(secret: string): string {
  return createHash("sha256").update(secret).digest("hex");
}
