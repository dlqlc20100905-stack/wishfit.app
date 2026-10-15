import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { categorize } from "@/lib/categorize";
import { mallFromUrl } from "@/lib/malls";
import { parseProductHtml } from "@/lib/parse";
import { fetchPublicHtml } from "@/lib/safeFetch";

export async function POST(request: NextRequest) {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "로그인이 필요해요" }, { status: 401 });

  const { url } = (await request.json().catch(() => ({}))) as { url?: string };
  const match = url?.match(/https?:\/\/\S+/);
  if (!match) return NextResponse.json({ error: "상품 링크를 붙여넣어 주세요" }, { status: 400 });
  const link = match[0];

  try {
    const { html, finalUrl } = await fetchPublicHtml(link);
    return NextResponse.json({ ok: true, item: parseProductHtml(html, finalUrl) });
  } catch (e) {
    // 파싱이 막혀도 링크는 담을 수 있게, 빈 칸을 채우는 화면으로 넘긴다.
    return NextResponse.json({
      ok: false,
      error: e instanceof Error ? e.message : "정보를 불러오지 못했어요",
      item: { url: link, mall: mallFromUrl(link), name: "", imageUrl: null, price: null, category: categorize("") },
    });
  }
}
