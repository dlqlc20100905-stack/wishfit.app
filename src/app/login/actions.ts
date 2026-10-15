"use server";

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEMO_COOKIE } from "@/lib/auth";
import { createSupabaseAuthClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, store } from "@/lib/store";
import { safeNext, siteUrl } from "@/lib/site";

export async function loginWithKakao(formData: FormData) {
  const next = safeNext(String(formData.get("next") ?? ""));
  const supabase = await createSupabaseAuthClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "kakao",
    options: { redirectTo: `${await siteUrl()}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error || !data.url) redirect("/login?error=1");
  redirect(data.url);
}

export async function loginDemo(formData: FormData) {
  if (isSupabaseConfigured) redirect("/login");
  const nickname = String(formData.get("nickname") ?? "").trim().slice(0, 20) || "나";
  const id = randomUUID();
  await store.ensureUser(id, nickname);
  await store.logEvent("signup", id);
  (await cookies()).set(DEMO_COOKIE, id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
  redirect(safeNext(String(formData.get("next") ?? "")));
}
