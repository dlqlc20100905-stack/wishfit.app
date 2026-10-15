import { budgetGap } from "@/lib/outfit";
import { won } from "@/lib/format";

export function BudgetLine({ total, monthlyBudget }: { total: number; monthlyBudget: number | null }) {
  const gap = budgetGap(total, monthlyBudget);
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <span className="text-lg font-bold">코디 총액 {won(total)}</span>
      {gap == null ? (
        <a href="/settings" className="text-sm text-muted underline">이번 달 예산 설정하기</a>
      ) : gap >= 0 ? (
        <span className="text-sm font-medium text-ok">예산 {won(monthlyBudget)} 중 {won(gap)} 남아요</span>
      ) : (
        <span className="text-sm font-medium text-danger">예산 {won(monthlyBudget)}보다 {won(-gap)} 초과</span>
      )}
    </div>
  );
}
