import "server-only";
import { localStore } from "./local";
import { supabaseStore } from "./supabase";
import type { Store } from "./types";

export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// Vercel 같은 서버리스 환경은 파일에 저장할 수 없어 데모 저장소를 쓸 수 없다.
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

const misconfiguredStore = new Proxy({} as Store, {
  get() {
    return () => {
      throw new Error(
        "Supabase 환경 변수(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY)가 없습니다. 호스팅 환경에서는 데모 저장소를 쓸 수 없습니다.",
      );
    };
  },
});

export const store: Store = isSupabaseConfigured ? supabaseStore : isServerless ? misconfiguredStore : localStore;
