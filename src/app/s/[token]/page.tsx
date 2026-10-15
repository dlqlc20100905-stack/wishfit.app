import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ItemImage } from "@/components/ItemImage";
import { getCurrentUser } from "@/lib/auth";
import { won } from "@/lib/format";
import { viewerSecretHash } from "@/lib/giftSecret";
import { store } from "@/lib/store";
import { cancelReservation, reserveItem } from "./actions";

type Props = { params: Promise<{ token: string }>; searchParams: Promise<{ taken?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const shared = await store.getSharedWishlist((await params).token, null);
  if (!shared) return {};
  const image = shared.items.find((i) => i.imageUrl)?.imageUrl;
  const title = `${shared.ownerNickname}님의 ${shared.wishlist.title}`;
  return { title, openGraph: { title, description: "선물할 상품을 '내가 살게'로 예약해 주세요", images: image ? [image] : [] } };
}

export default async function SharedWishlistPage({ params, searchParams }: Props) {
  const { token } = await params;
  const { taken } = await searchParams;
  const [shared, viewer] = await Promise.all([
    viewerSecretHash().then((hash) => store.getSharedWishlist(token, hash)),
    getCurrentUser(),
  ]);
  if (!shared) notFound();
  const { wishlist, ownerNickname, items } = shared;
  const isOwner = viewer?.id === wishlist.userId;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <p className="text-sm text-muted">{ownerNickname}님의 위시리스트</p>
      <h1 className="mt-1 text-2xl font-bold">{wishlist.title}</h1>
      {wishlist.occasionDate && <p className="mt-1 text-sm text-muted">기념일 {wishlist.occasionDate}</p>}

      {isOwner ? (
        <p className="mt-4 rounded-xl bg-surface-2 p-3 text-sm">
          내 리스트예요. 친구들이 보는 화면이지만, 깜짝 선물을 위해 예약 상태는 보이지 않아요.
        </p>
      ) : (
        <p className="mt-4 text-sm text-muted">
          선물할 상품에 &lsquo;내가 살게&rsquo;를 누르면 다른 친구와 겹치지 않아요. {ownerNickname}님에게는 누가 무엇을 골랐는지 보이지 않아요.
        </p>
      )}
      {taken && <p className="mt-3 text-sm text-danger">방금 다른 친구가 먼저 예약했어요. 다른 상품을 골라 주세요.</p>}

      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((item) => (
          <li key={item.id} className="card flex flex-col overflow-hidden">
            <ItemImage src={item.imageUrl} alt={item.name} />
            <div className="flex flex-1 flex-col gap-1 p-3">
              <p className="text-xs text-muted">{item.mall}</p>
              <p className="line-clamp-2 text-sm font-medium">{item.name}</p>
              <p className="text-sm font-semibold">{won(item.price)}</p>
              <div className="mt-auto pt-2">
                {isOwner ? (
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="btn-secondary w-full py-2 text-sm">상품 보기</a>
                ) : item.reservedByViewer ? (
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-ok">내가 예약했어요</p>
                    <a href={`/go/${item.id}`} target="_blank" rel="noopener noreferrer sponsored" className="btn-primary w-full py-2 text-sm">
                      구매하러 가기
                    </a>
                    <form action={cancelReservation.bind(null, token, item.id)}>
                      <button className="w-full py-1 text-xs text-muted">예약 취소</button>
                    </form>
                  </div>
                ) : item.reserved ? (
                  <p className="rounded-xl bg-surface-2 py-2 text-center text-sm text-muted">다른 친구가 예약했어요</p>
                ) : (
                  <form action={reserveItem.bind(null, token, item.id)} className="space-y-1.5">
                    <input name="name" maxLength={20} placeholder="내 이름(선택)" className="input py-2 text-sm" />
                    <button className="btn-primary w-full py-2 text-sm">내가 살게</button>
                  </form>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
      {items.length === 0 && <p className="py-10 text-center text-muted">아직 담긴 상품이 없어요.</p>}

      <p className="mt-8 text-xs text-muted">
        &lsquo;구매하러 가기&rsquo; 링크에는 제휴 링크가 포함될 수 있으며, 이 경우 구매 시 운영자가 수수료를 받을 수 있습니다.
      </p>
      {!viewer && (
        <div className="card mt-6 p-5 text-center">
          <p className="font-semibold">나도 위시리스트를 만들어 볼까요?</p>
          <p className="mt-1 text-sm text-muted">어느 쇼핑몰 상품이든 링크 하나로 담을 수 있어요.</p>
          <Link href="/login" className="btn-primary mt-4">무료로 만들기</Link>
        </div>
      )}
    </main>
  );
}
