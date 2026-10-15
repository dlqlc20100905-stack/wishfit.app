"use server";

import { store } from "@/lib/store";

/** 공유 버튼을 누른 횟수(성공 지표: 공유된 리스트 수). */
export async function recordShare(refId: string) {
  await store.logEvent("share", refId);
}
