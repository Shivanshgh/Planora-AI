import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { eventInputSchema } from './event';

const validEvent = {
  name: 'Riya Birthday',
  eventType: 'birthday',
  date: '2026-12-01',
  city: 'Pune',
  guestCount: 20,
  totalBudget: 50000,
} as const;

test('accepts a valid event request', () => {
  assert.equal(eventInputSchema.safeParse(validEvent).success, true);
});

test('rejects impossible calendar dates', () => {
  assert.equal(eventInputSchema.safeParse({ ...validEvent, date: '2026-02-30' }).success, false);
});

test('rejects invalid guest counts and budgets', () => {
  assert.equal(eventInputSchema.safeParse({ ...validEvent, guestCount: 0 }).success, false);
  assert.equal(eventInputSchema.safeParse({ ...validEvent, totalBudget: 4999 }).success, false);
});

test('rejects blank required fields and accepts omitted optional details', () => {
  assert.equal(eventInputSchema.safeParse({ ...validEvent, name: '  ' }).success, false);
  assert.equal(eventInputSchema.safeParse({ ...validEvent, city: '' }).success, false);
  assert.equal(eventInputSchema.safeParse(validEvent).success, true);
});

test('accepts the maximum supported budget and rejects values above it', () => {
  assert.equal(eventInputSchema.safeParse({ ...validEvent, totalBudget: 1_000_000_000 }).success, true);
  assert.equal(eventInputSchema.safeParse({ ...validEvent, totalBudget: 1_000_000_001 }).success, false);
});

test('bounds free-text values before they are sent to Gemini', () => {
  assert.equal(eventInputSchema.safeParse({ ...validEvent, specialRequirements: 'x'.repeat(2001) }).success, false);
});
