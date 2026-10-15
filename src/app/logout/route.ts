import { NextResponse, type NextRequest } from "next/server";
import { DEMO_COOKIE } from "@/lib/auth";
import { createSupabaseAuthClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/store";

export async function POST(request: NextRequest) {
  if (isSupabaseConfigured) await (await createSupabaseAuthClient()).auth.signOut();
  const res = NextResponse.redirect(new URL("/", request.url), { status: 303 });
  res.cookies.delete(DEMO_COOKIE);
  return res;
}
