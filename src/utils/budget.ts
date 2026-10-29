import type { BudgetItem } from '../types/event';

export interface BudgetTotals {
  allocated: number;
  spent: number;
  remaining: number;
}

/** Calculate plan totals in one pass so every budget view uses the same rules. */
export function calculateBudgetTotals(items: BudgetItem[], totalBudget: number): BudgetTotals {
  const totals = items.reduce(
    (result, item) => {
      result.allocated += Number.isFinite(item.allocatedAmount) ? item.allocatedAmount : 0;
      result.spent += Number.isFinite(item.actualSpent) ? item.actualSpent ?? 0 : 0;
      return result;
    },
    { allocated: 0, spent: 0 }
  );

  return {
    ...totals,
    remaining: totalBudget - totals.allocated,
  };
}
