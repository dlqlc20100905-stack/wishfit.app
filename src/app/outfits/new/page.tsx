import Link from "next/link";
import { OutfitBoard } from "@/components/OutfitBoard";
import { requireUser } from "@/lib/auth";
import { canMakeOutfit, MIN_SLOT_CATEGORIES, slotCategoryCount } from "@/lib/outfit";
import { store } from "@/lib/store";
import { saveOutfit } from "../actions";

export default async function NewOutfitPage() {
  const user = await requireUser();
  const items = await store.listItems(user.id);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">코디 만들기</h1>
      <p className="mt-1 text-sm text-muted">
        찜한 상품이 카테고리별로 자동 분류돼 있어요. 분류가 틀리면 위시리스트에서 고칠 수 있어요.
      </p>
      <div className="mt-6">
        {canMakeOutfit(items) ? (
          <OutfitBoard items={items} monthlyBudget={user.monthlyBudget} action={saveOutfit} />
        ) : (
          <div className="card p-6 text-center">
            <p className="font-semibold">
              서로 다른 종류의 옷을 {MIN_SLOT_CATEGORIES}가지 이상 담으면 코디를 만들 수 있어요
            </p>
            <p className="mt-1 text-sm text-muted">
              지금 {slotCategoryCount(items)}가지 · 아우터, 상의, 하의, 신발, 가방 중에서 골라 담아 보세요.
            </p>
            <Link href="/wishlists" className="btn-primary mt-4">위시리스트로 가기</Link>
          </div>
        )}
      </div>
    </main>
  );
}
