import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/store";
import { safeNext } from "@/lib/site";
import { loginDemo, loginWithKakao } from "./actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  if (await getCurrentUser()) redirect(safeNext(next));

  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-bold">시작하기</h1>
      <p className="mt-2 text-sm text-muted">어느 쇼핑몰 상품이든 링크로 담고, 코디로 맞춰 보고, 친구에게 선물받으세요.</p>
      {error && <p className="mt-4 text-sm text-danger">로그인에 실패했어요. 다시 시도해 주세요.</p>}

      {isSupabaseConfigured ? (
        <form action={loginWithKakao} className="mt-8">
          <input type="hidden" name="next" value={next ?? ""} />
          <button className="w-full rounded-xl bg-[#FEE500] py-3 font-semibold text-black/85">카카오로 시작하기</button>
        </form>
      ) : (
        <form action={loginDemo} className="mt-8 space-y-3">
          <input type="hidden" name="next" value={next ?? ""} />
          <p className="rounded-lg bg-surface-2 p-3 text-xs text-muted">
            데모 모드입니다. Supabase 키를 설정하면 카카오 로그인으로 바뀝니다.
          </p>
          <input name="nickname" required maxLength={20} placeholder="닉네임" className="input" />
          <button className="btn-primary w-full">시작하기</button>
        </form>
      )}
    </main>
  );
}
