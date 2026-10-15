import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAuthClient } from "@/lib/supabase/server";
import { store } from "@/lib/store";
import { safeNext } from "@/lib/site";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = safeNext(request.nextUrl.searchParams.get("next"));
  if (!code) return NextResponse.redirect(new URL("/login?error=1", request.url));

  const supabase = await createSupabaseAuthClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) return NextResponse.redirect(new URL("/login?error=1", request.url));

  if (!(await store.getUser(data.user.id))) {
    const meta = data.user.user_metadata ?? {};
    await store.ensureUser(data.user.id, meta.nickname ?? meta.name ?? "나", meta.provider_id ?? null);
    await store.logEvent("signup", data.user.id);
  }
  return NextResponse.redirect(new URL(next, request.url));
}
