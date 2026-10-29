import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import type { BudgetItem } from '../types/event';
import { calculateBudgetTotals } from './budget';

const items: BudgetItem[] = [
  { id: 'venue', category: 'Venue', allocatedAmount: 12000, percentage: 60, explanation: '', costSavingAlternative: '', actualSpent: 10000 },
  { id: 'food', category: 'Food', allocatedAmount: 8000, percentage: 40, explanation: '', costSavingAlternative: '', actualSpent: 2500 },
];

test('calculates allocated, spent, and remaining budget together', () => {
  assert.deepEqual(calculateBudgetTotals(items, 25000), {
    allocated: 20000,
    spent: 12500,
    remaining: 5000,
  });
});

test('handles empty budgets and missing actual spend', () => {
  assert.deepEqual(calculateBudgetTotals([], 10000), { allocated: 0, spent: 0, remaining: 10000 });
  assert.equal(calculateBudgetTotals([{ ...items[0], actualSpent: undefined }], 15000).spent, 0);
});
