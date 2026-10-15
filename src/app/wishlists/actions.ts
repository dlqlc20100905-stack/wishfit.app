"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { mallFromUrl } from "@/lib/malls";
import { parsePrice } from "@/lib/format";
import { store } from "@/lib/store";
import { SLOTS, type Category, type ItemInput } from "@/lib/types";

const CATEGORIES: Category[] = [...SLOTS, "etc"];

function readItemForm(formData: FormData): ItemInput {
  const url = String(formData.get("url") ?? "").trim();
  if (!/^https?:\/\//.test(url)) throw new Error("올바른 링크가 아니에요");
  const category = String(formData.get("category")) as Category;
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  return {
    url,
    mall: mallFromUrl(url),
    name: String(formData.get("name") ?? "").trim().slice(0, 200) || "이름 없는 상품",
    price: parsePrice(String(formData.get("price") ?? "")),
    imageUrl: /^https?:\/\//.test(imageUrl) ? imageUrl : null,
    category: CATEGORIES.includes(category) ? category : "etc",
  };
}

export async function createWishlist(formData: FormData) {
  const user = await requireUser();
  const title = String(formData.get("title") ?? "").trim().slice(0, 60) || "내 위시리스트";
  const occasionDate = String(formData.get("occasionDate") ?? "") || null;
  const w = await store.createWishlist(user.id, { title, occasionDate });
  redirect(`/wishlists/${w.id}`);
}

export async function deleteWishlist(id: string) {
  const user = await requireUser();
  await store.deleteWishlist(user.id, id);
  redirect("/wishlists");
}

export async function addItem(wishlistId: string, formData: FormData) {
  const user = await requireUser();
  await store.addItem(user.id, wishlistId, readItemForm(formData));
  revalidatePath(`/wishlists/${wishlistId}`);
}

export async function updateItem(itemId: string, wishlistId: string, formData: FormData) {
  const user = await requireUser();
  await store.updateItem(user.id, itemId, readItemForm(formData));
  revalidatePath(`/wishlists/${wishlistId}`);
}

export async function deleteItem(itemId: string, wishlistId: string) {
  const user = await requireUser();
  await store.deleteItem(user.id, itemId);
  revalidatePath(`/wishlists/${wishlistId}`);
}
