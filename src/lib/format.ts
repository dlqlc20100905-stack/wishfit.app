export function won(n: number | null | undefined): string {
  if (n == null) return "가격 미정";
  return n.toLocaleString("ko-KR") + "원";
}

export function parsePrice(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const digits = raw.replace(/[^\d.]/g, "");
  if (!digits) return null;
  const n = Math.round(Number(digits));
  return Number.isFinite(n) && n > 0 ? n : null;
}
