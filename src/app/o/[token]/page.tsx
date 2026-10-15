import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ItemImage } from "@/components/ItemImage";
import { getCurrentUser } from "@/lib/auth";
import { won } from "@/lib/format";
import { store } from "@/lib/store";
import { CATEGORY_LABEL } from "@/lib/types";

type Props = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const shared = await store.getSharedOutfit((await params).token);
  if (!shared) return {};
  const title = `${shared.ownerNickname}님의 코디: ${shared.outfit.title}`;
  const image = shared.outfit.items.find((i) => i.imageUrl)?.imageUrl;
  return { title, openGraph: { title, images: image ? [image] : [] } };
}

export default async function SharedOutfitPage({ params }: Props) {
  const { token } = await params;
  const [shared, viewer] = await Promise.all([store.getSharedOutfit(token), getCurrentUser()]);
  if (!shared) notFound();
  const { outfit, ownerNickname } = shared;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <p className="text-sm text-muted">{ownerNickname}님의 코디</p>
      <h1 className="mt-1 text-2xl font-bold">{outfit.title}</h1>
      <p className="mt-1 font-semibold">총 {won(outfit.total)}</p>

      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {outfit.items.map((item) => (
          <li key={item.id} className="card overflow-hidden">
            <ItemImage src={item.imageUrl} alt={item.name} />
            <div className="space-y-1 p-3">
              <p className="text-xs text-muted">{CATEGORY_LABEL[item.slot]} · {item.mall}</p>
              <p className="line-clamp-2 text-sm font-medium">{item.name}</p>
              <p className="text-sm font-semibold">{won(item.price)}</p>
              <a href={`/go/${item.id}`} target="_blank" rel="noopener noreferrer sponsored" className="text-xs text-accent">
                출처: {item.mall}에서 보기
              </a>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-8 text-xs text-muted">
        상품 이미지와 정보의 권리는 각 쇼핑몰에 있습니다. 상품 링크에는 제휴 링크가 포함될 수 있으며, 이 경우 구매 시 운영자가 수수료를 받을 수 있습니다.
      </p>
      {!viewer && (
        <div className="card mt-6 p-5 text-center">
          <p className="font-semibold">여러 쇼핑몰 옷을 한 번에 맞춰 보세요</p>
          <Link href="/login" className="btn-primary mt-4">나도 코디 만들기</Link>
        </div>
      )}
    </main>
  );
}
