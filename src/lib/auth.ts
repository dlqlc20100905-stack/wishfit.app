import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseAuthClient } from "./supabase/server";
import { isSupabaseConfigured, store } from "./store";
import type { User } from "./types";

export const DEMO_COOKIE = "demo_uid";

export async function getCurrentUser(): Promise<User | null> {
  if (isSupabaseConfigured) {
    const supabase = await createSupabaseAuthClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) return null;
    const meta = data.user.user_metadata ?? {};
    return store.ensureUser(
      data.user.id,
      meta.nickname ?? meta.name ?? meta.full_name ?? "나",
      meta.provider_id ?? meta.sub ?? null,
    );
  }
  const id = (await cookies()).get(DEMO_COOKIE)?.value;
  return id ? store.getUser(id) : null;
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
