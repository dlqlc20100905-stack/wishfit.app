"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ensureViewerSecretHash, viewerSecretHash } from "@/lib/giftSecret";
import { store } from "@/lib/store";

export async function reserveItem(token: string, itemId: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim().slice(0, 20) || "익명의 친구";
  const result = await store.reserve(token, itemId, name, await ensureViewerSecretHash());
  if (result === "ok") await store.logEvent("reserve", itemId);
  revalidatePath(`/s/${token}`);
  if (result === "already_reserved") redirect(`/s/${token}?taken=1`);
}

export async function cancelReservation(token: string, itemId: string) {
  const hash = await viewerSecretHash();
  if (hash) await store.cancelReservation(token, itemId, hash);
  revalidatePath(`/s/${token}`);
}
