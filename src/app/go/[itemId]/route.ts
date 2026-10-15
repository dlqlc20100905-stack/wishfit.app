import { NextResponse, type NextRequest } from "next/server";
import { store } from "@/lib/store";

// 구매 클릭을 기록하고 상품 페이지로 보낸다(성공 지표: 예약 후 구매 클릭률).
// 제휴 링크 변환을 붙일 때는 여기서 item.url을 바꾼다.
export async function GET(request: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await params;
  const item = await store.getItem(itemId);
  if (!item || !/^https?:\/\//.test(item.url)) return NextResponse.redirect(new URL("/", request.url));
  await store.logEvent("buy_click", itemId);
  return NextResponse.redirect(item.url, { status: 302 });
}
