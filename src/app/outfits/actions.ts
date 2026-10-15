"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { store } from "@/lib/store";
import { SLOTS, type Slot } from "@/lib/types";

export async function saveOutfit(formData: FormData) {
  const user = await requireUser();
  const title = String(formData.get("title") ?? "").trim().slice(0, 60) || "새 코디";
  const picks = SLOTS.flatMap((slot: Slot) => {
    const itemId = String(formData.get(slot) ?? "");
    return itemId ? [{ slot, itemId }] : [];
  });
  if (picks.length === 0) redirect("/outfits/new");
  await store.createOutfit(user.id, title, picks);
  redirect("/outfits");
}

export async function deleteOutfit(id: string) {
  const user = await requireUser();
  await store.deleteOutfit(user.id, id);
  revalidatePath("/outfits");
}
