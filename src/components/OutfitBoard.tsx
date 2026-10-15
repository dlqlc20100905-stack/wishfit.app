"use client";

import { useMemo, useState } from "react";
import { outfitTotal } from "@/lib/outfit";
import { won } from "@/lib/format";
import { CATEGORY_LABEL, SLOTS, type Item, type Slot } from "@/lib/types";
import { BudgetLine } from "./BudgetLine";
import { ItemImage } from "./ItemImage";

type Props = {
  items: Item[];
  monthlyBudget: number | null;
  action: (formData: FormData) => Promise<void>;
};

export function OutfitBoard({ items, monthlyBudget, action }: Props) {
  const bySlot = useMemo(
    () => Object.fromEntries(SLOTS.map((s) => [s, items.filter((i) => i.category === s)])) as Record<Slot, Item[]>,
    [items],
  );
  // 슬롯마다 현재 보고 있는 상품 위치. -1이면 비워 둔 슬롯.
  const [index, setIndex] = useState<Record<Slot, number>>(
    () => Object.fromEntries(SLOTS.map((s) => [s, bySlot[s].length ? 0 : -1])) as Record<Slot, number>,
  );

  const picked = SLOTS.flatMap((s) => (index[s] >= 0 ? [{ slot: s, item: bySlot[s][index[s]] }] : []));
  const total = outfitTotal(picked.map((p) => p.item));

  function step(slot: Slot, delta: number) {
    const n = bySlot[slot].length;
    if (!n) return;
    setIndex((prev) => ({ ...prev, [slot]: ((prev[slot] < 0 ? 0 : prev[slot] + delta) + n) % n }));
  }

  return (
    <form action={action} className="space-y-5 pb-4">
      {/* 고정 슬롯 배치. 배경 제거는 라이선스 확인 전이라 썸네일 격자로 보여준다. */}
      <div className="grid grid-cols-6 gap-3">
        {SLOTS.map((slot) => {
          const list = bySlot[slot];
          const current = index[slot] >= 0 ? list[index[slot]] : null;
          return (
            <div key={slot} className={`card overflow-hidden ${slot === "outer" || slot === "top" ? "col-span-3" : "col-span-2"}`}>
              <input type="hidden" name={slot} value={current?.id ?? ""} />
              <div className="flex items-center justify-between px-3 py-2 text-sm">
                <span className="font-semibold">{CATEGORY_LABEL[slot]}</span>
                <span className="text-xs text-muted">{list.length ? `${index[slot] + 1}/${list.length}` : "없음"}</span>
              </div>
              {current ? (
                <ItemImage src={current.imageUrl} alt={current.name} />
              ) : (
                <div className="flex aspect-square items-center justify-center bg-surface-2 p-2 text-center text-xs text-muted">
                  {list.length ? "비워 둠" : `찜한 ${CATEGORY_LABEL[slot]} 없음`}
                </div>
              )}
              <div className="space-y-1 p-2">
                <p className="line-clamp-1 text-xs">{current?.name ?? " "}</p>
                <p className="text-xs font-semibold">{current ? won(current.price) : " "}</p>
                <div className="flex gap-1">
                  <button type="button" aria-label="이전 상품" onClick={() => step(slot, -1)} disabled={list.length < 2} className="btn-secondary flex-1 px-0 py-1 text-sm">‹</button>
                  <button type="button" aria-label="다음 상품" onClick={() => step(slot, 1)} disabled={list.length < 2} className="btn-secondary flex-1 px-0 py-1 text-sm">›</button>
                </div>
                {list.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIndex((p) => ({ ...p, [slot]: p[slot] < 0 ? 0 : -1 }))}
                    className="w-full py-1 text-xs text-muted"
                  >
                    {current ? "빼기" : "다시 넣기"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="card sticky bottom-3 space-y-3 p-4 shadow-lg">
        <BudgetLine total={total} monthlyBudget={monthlyBudget} />
        <div className="flex gap-2">
          <input name="title" maxLength={60} placeholder="코디 이름(예: 주말 데이트룩)" className="input" />
          <button className="btn-primary shrink-0" disabled={picked.length === 0}>저장</button>
        </div>
      </div>
    </form>
  );
}
