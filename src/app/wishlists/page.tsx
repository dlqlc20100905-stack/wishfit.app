import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { store } from "@/lib/store";
import { createWishlist } from "./actions";

export default async function WishlistsPage() {
  const user = await requireUser();
  const lists = await store.listWishlists(user.id);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">내 위시리스트</h1>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {lists.map((w) => (
          <li key={w.id}>
            <Link href={`/wishlists/${w.id}`} className="card block p-4 hover:border-accent">
              <p className="font-semibold">{w.title}</p>
              <p className="mt-1 text-sm text-muted">
                상품 {w.itemCount}개{w.occasionDate && ` · ${w.occasionDate}`}
              </p>
            </Link>
          </li>
        ))}
      </ul>

      <form action={createWishlist} className="card mt-6 space-y-3 p-4">
        <h2 className="font-semibold">새 리스트 만들기</h2>
        <input name="title" required maxLength={60} placeholder="예: 내 생일 위시리스트" className="input" />
        <label className="block text-sm text-muted">
          기념일(선택)
          <input name="occasionDate" type="date" className="input mt-1" />
        </label>
        <button className="btn-primary w-full sm:w-auto">만들기</button>
      </form>
    </main>
  );
}
