import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** 로그인 세션 확인용 클라이언트(anon 키 + 쿠키). 데이터 접근은 store를 쓴다. */
export async function createSupabaseAuthClient() {
  const cookieStore = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // 서버 컴포넌트에서는 쿠키를 쓸 수 없다. 세션 갱신은 middleware가 맡는다.
        }
      },
    },
  });
}
