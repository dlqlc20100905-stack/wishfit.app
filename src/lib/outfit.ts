import { SLOTS, type Item, type Slot } from "./types";

/** 서로 다른 슬롯 카테고리 3개 이상을 찜했을 때만 코디 보드를 연다(기획서: 찜이 적으면 무용). */
export const MIN_SLOT_CATEGORIES = 3;

export function slotCategoryCount(items: Pick<Item, "category">[]): number {
  return new Set(items.map((i) => i.category).filter((c): c is Slot => (SLOTS as readonly string[]).includes(c))).size;
}

export function canMakeOutfit(items: Pick<Item, "category">[]): boolean {
  return slotCategoryCount(items) >= MIN_SLOT_CATEGORIES;
}

export function outfitTotal(items: Pick<Item, "price">[]): number {
  return items.reduce((s, i) => s + (i.price ?? 0), 0);
}

/** 예산 대비 금액. 예산이 없으면 null. 양수면 남은 금액, 음수면 초과 금액. */
export function budgetGap(total: number, monthlyBudget: number | null): number | null {
  return monthlyBudget == null ? null : monthlyBudget - total;
}
