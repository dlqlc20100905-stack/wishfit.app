import Link from "next/link";
import { notFound } from "next/navigation";
import { AddItemForm } from "@/components/AddItemForm";
import { ItemFields } from "@/components/ItemFields";
import { ItemImage } from "@/components/ItemImage";
import { ShareButton } from "@/components/ShareButton";
import { requireUser } from "@/lib/auth";
import { canMakeOutfit } from "@/lib/outfit";
import { won } from "@/lib/format";
import { store } from "@/lib/store";
import { CATEGORY_LABEL } from "@/lib/types";
import { addItem, deleteItem, deleteWishlist, updateItem } from "../actions";

export default async function WishlistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const wishlist = await store.getWishlist(user.id, id);
  if (!wishlist) notFound();
  const [items, allItems] = await Promise.all([store.listItems(user.id, id), store.listItems(user.id)]);
  const total = items.reduce((s, i) => s + (i.price ?? 0), 0);

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-end gap-3">
        <div className="mr-auto">
          <h1 className="text-2xl font-bold">{wishlist.title}</h1>
          <p className="mt-1 text-sm text-muted">
            {wishlist.occasionDate && `${wishlist.occasionDate} · `}상품 {items.length}개 · 합계 {won(total)}
          </p>
        </div>
        {canMakeOutfit(allItems) && (
          <Link href="/outfits/new" className="btn-secondary">코디 만들기</Link>
        )}
        <ShareButton
          path={`/s/${wishlist.shareToken}`}
          title={`${user.nickname}님의 ${wishlist.title}`}
          description="갖고 싶은 것들을 모아뒀어요. 선물할 상품을 '내가 살게'로 예약해 주세요."
          imageUrl={items.find((i) => i.imageUrl)?.imageUrl}
          refId={wishlist.id}
        />
      </div>
      <p className="text-xs text-muted">
        친구가 어떤 상품을 예약했는지는 깜짝 선물을 위해 리스트 주인에게 보이지 않아요.
      </p>

      <AddItemForm action={addItem.bind(null, wishlist.id)} />

      {items.length === 0 ? (
        <p className="py-10 text-center text-muted">아직 담은 상품이 없어요. 쇼핑몰에서 링크를 복사해 붙여넣어 보세요.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((item) => (
            <li key={item.id} className="card overflow-hidden">
              <a href={item.url} target="_blank" rel="noopener noreferrer">
                <ItemImage src={item.imageUrl} alt={item.name} />
              </a>
              <div className="space-y-1 p-3">
                <p className="text-xs text-muted">{item.mall} · {CATEGORY_LABEL[item.category]}</p>
                <p className="line-clamp-2 text-sm font-medium">{item.name}</p>
                <p className="text-sm font-semibold">{won(item.price)}</p>
                <details className="pt-1 text-sm">
                  <summary className="cursor-pointer text-muted">수정</summary>
                  <form action={updateItem.bind(null, item.id, wishlist.id)} className="mt-2 space-y-2">
                    <ItemFields item={item} />
                    <button className="btn-secondary w-full py-2">저장</button>
                  </form>
                  <form action={deleteItem.bind(null, item.id, wishlist.id)} className="mt-2">
                    <button className="w-full py-1 text-danger">삭제</button>
                  </form>
                </details>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form action={deleteWishlist.bind(null, wishlist.id)} className="pt-6 text-right">
        <button className="text-sm text-muted hover:text-danger">이 리스트 삭제</button>
      </form>
    </main>
  );
}
