import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { parsePrice } from "@/lib/format";
import { store } from "@/lib/store";

async function saveSettings(formData: FormData) {
  "use server";
  const user = await requireUser();
  await store.updateUser(user.id, {
    nickname: String(formData.get("nickname") ?? "").trim().slice(0, 20) || user.nickname,
    monthlyBudget: parsePrice(String(formData.get("monthlyBudget") ?? "")),
  });
  revalidatePath("/", "layout");
}

export default async function SettingsPage() {
  const user = await requireUser();
  return (
    <main className="mx-auto max-w-sm px-4 py-8">
      <h1 className="text-2xl font-bold">설정</h1>
      <form action={saveSettings} className="mt-6 space-y-4">
        <label className="block text-sm text-muted">
          닉네임
          <input name="nickname" defaultValue={user.nickname} maxLength={20} className="input mt-1" />
        </label>
        <label className="block text-sm text-muted">
          이번 달 옷 예산(원)
          <input
            name="monthlyBudget"
            inputMode="numeric"
            defaultValue={user.monthlyBudget ?? ""}
            placeholder="예: 300000"
            className="input mt-1"
          />
          <span className="mt-1 block text-xs">코디 총액과 비교해서 보여드려요. 비워 두면 비교하지 않아요.</span>
        </label>
        <button className="btn-primary w-full">저장</button>
      </form>
      <form action="/logout" method="post" className="mt-10">
        <button className="text-sm text-muted">로그아웃</button>
      </form>
    </main>
  );
}
