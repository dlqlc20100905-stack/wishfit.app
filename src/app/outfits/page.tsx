import Link from "next/link";
import { BudgetLine } from "@/components/BudgetLine";
import { ItemImage } from "@/components/ItemImage";
import { ShareButton } from "@/components/ShareButton";
import { requireUser } from "@/lib/auth";
import { canMakeOutfit } from "@/lib/outfit";
import { store } from "@/lib/store";
import { deleteOutfit } from "./actions";

export default async function OutfitsPage() {
  const user = await requireUser();
  const [outfits, items] = await Promise.all([store.listOutfits(user.id), store.listItems(user.id)]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">내 코디</h1>
        <Link href="/outfits/new" className={canMakeOutfit(items) ? "btn-primary" : "btn-secondary"}>새 코디</Link>
      </div>

      {outfits.length === 0 && <p className="py-10 text-center text-muted">저장한 코디가 없어요.</p>}
      <ul className="mt-6 space-y-4">
        {outfits.map((o) => (
          <li key={o.id} className="card p-4">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="mr-auto font-semibold">{o.title}</h2>
              <ShareButton
                path={`/o/${o.shareToken}`}
                title={`${user.nickname}님의 코디: ${o.title}`}
                description="이 코디 어때? 의견을 들려줘"
                imageUrl={o.items.find((i) => i.imageUrl)?.imageUrl}
                refId={o.id}
              />
            </div>
            <div className="mt-3 grid grid-cols-5 gap-2">
              {o.items.map((i) => (
                <div key={i.id} className="overflow-hidden rounded-lg">
                  <ItemImage src={i.imageUrl} alt={i.name} />
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-end justify-between gap-3">
              <BudgetLine total={o.total} monthlyBudget={user.monthlyBudget} />
              <form action={deleteOutfit.bind(null, o.id)}>
                <button className="text-sm text-muted hover:text-danger">삭제</button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
